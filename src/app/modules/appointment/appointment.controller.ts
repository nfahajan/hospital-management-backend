import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Appointment } from "./appointment.model";
import { Patient } from "../patient/patient.model";
import { Doctor } from "../doctor/doctor.model";
import { Schedule } from "../schedule/schedule.model";
import sendResponse from "../../shared/sendResponse";
import CustomAPIError from "../../errors/custom-api";
import NotFoundError from "../../errors/not-found";
import ForbiddenError from "../../errors/forbidden";
import {
  ICreateAppointment,
  IUpdateAppointment,
  ICancelAppointment,
} from "./appointment.type";

// Create a new appointment
const createAppointment = async (req: Request, res: Response) => {
  const appointmentData: ICreateAppointment = req.body;
  const currentUser = req.user;

  if (!currentUser) {
    throw new ForbiddenError("Access denied");
  }

  // Check if patient exists
  const patient = await Patient.findById(appointmentData.patientId);
  if (!patient) {
    throw new NotFoundError("Patient not found");
  }

  // Check if doctor exists
  const doctor = await Doctor.findById(appointmentData.doctorId);
  if (!doctor) {
    throw new NotFoundError("Doctor not found");
  }

  // Check if user can create appointment for this patient
  const isAdmin =
    currentUser.roles.includes("admin") ||
    currentUser.roles.includes("superadmin");
  const isOwnPatient = patient.user.toString() === currentUser._id.toString();

  if (!isAdmin && !isOwnPatient) {
    throw new ForbiddenError(
      "You can only create appointments for your own profile"
    );
  }

  // Check slot availability
  const slotAvailability = await Appointment.checkSlotAvailability(
    appointmentData.doctorId,
    appointmentData.appointmentDate,
    appointmentData.startTime,
    appointmentData.endTime
  );

  if (!slotAvailability.available) {
    throw new CustomAPIError(
      slotAvailability.reason || "Slot not available",
      StatusCodes.CONFLICT
    );
  }

  // Find the schedule for this appointment
  const appointmentDate = new Date(appointmentData.appointmentDate);
  const schedule = await Schedule.findByDoctorAndDate(
    appointmentData.doctorId,
    appointmentDate
  );

  if (!schedule) {
    throw new CustomAPIError(
      "No schedule found for this date",
      StatusCodes.BAD_REQUEST
    );
  }

  // Create appointment record
  const newAppointment = new Appointment({
    patient: appointmentData.patientId,
    doctor: appointmentData.doctorId,
    schedule: schedule._id,
    appointmentDate: appointmentDate,
    startTime: appointmentData.startTime,
    endTime: appointmentData.endTime,
    type: appointmentData.type,
    reason: appointmentData.reason,
    symptoms: appointmentData.symptoms,
    notes: appointmentData.notes,
    isUrgent: appointmentData.isUrgent ?? false,
    estimatedDuration: appointmentData.estimatedDuration ?? 30,
    consultationFee: doctor.consultationFee,
  });

  const savedAppointment = await newAppointment.save();

  // Populate related data for response
  await savedAppointment.populate([
    { path: "patient", select: "firstName lastName phoneNumber" },
    {
      path: "doctor",
      select: "firstName lastName specialization consultationFee",
    },
    { path: "schedule", select: "weekStartDate weekEndDate" },
  ]);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Appointment created successfully",
    data: savedAppointment,
  });
};

// Get all appointments (admin only)
const getAllAppointments = async (req: Request, res: Response) => {
  const {
    patientId,
    doctorId,
    status,
    type,
    dateFrom,
    dateTo,
    isUrgent,
    page = 1,
    limit = 10,
  } = req.query as any;

  // Build filter object
  const filter: any = {};

  if (patientId) filter.patient = patientId;
  if (doctorId) filter.doctor = doctorId;
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (isUrgent !== undefined) filter.isUrgent = isUrgent === "true";

  if (dateFrom || dateTo) {
    filter.appointmentDate = {};
    if (dateFrom) filter.appointmentDate.$gte = new Date(dateFrom);
    if (dateTo) filter.appointmentDate.$lte = new Date(dateTo);
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Get appointments with pagination
  const appointments = await Appointment.find(filter)
    .populate("patient", "firstName lastName phoneNumber")
    .populate("doctor", "firstName lastName specialization")
    .sort({ appointmentDate: -1, startTime: -1 })
    .skip(skip)
    .limit(limit);

  // Get total count for pagination
  const totalAppointments = await Appointment.countDocuments(filter);
  const totalPages = Math.ceil(totalAppointments / limit);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Appointments retrieved successfully",
    data: {
      appointments,
      pagination: {
        currentPage: page,
        totalPages,
        totalAppointments,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    },
  });
};

// Get appointment by ID
const getAppointmentById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const appointment = await Appointment.findById(id)
    .populate("patient", "firstName lastName phoneNumber address")
    .populate("doctor", "firstName lastName specialization consultationFee")
    .populate("schedule", "weekStartDate weekEndDate");

  if (!appointment) {
    throw new NotFoundError("Appointment not found");
  }

  // Check if user can access this appointment
  const currentUser = req.user;
  if (!currentUser) {
    throw new ForbiddenError("Access denied");
  }

  // Allow access if user is admin, the patient, or the doctor
  const isAdmin =
    currentUser.roles.includes("admin") ||
    currentUser.roles.includes("superadmin");
  const isOwnPatient =
    appointment.patient.user.toString() === currentUser._id.toString();
  const isOwnDoctor =
    appointment.doctor.user.toString() === currentUser._id.toString();

  if (!isAdmin && !isOwnPatient && !isOwnDoctor) {
    throw new ForbiddenError("Access denied");
  }

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Appointment retrieved successfully",
    data: appointment,
  });
};

// Get current patient's appointments
const getMyAppointments = async (req: Request, res: Response) => {
  const currentUser = req.user;
  if (!currentUser) {
    throw new ForbiddenError("Access denied");
  }

  // Find patient profile
  const patient = await Patient.findOne({ user: currentUser._id });
  if (!patient) {
    throw new NotFoundError("Patient profile not found");
  }

  const {
    status,
    type,
    dateFrom,
    dateTo,
    page = 1,
    limit = 10,
  } = req.query as any;

  // Build filter object
  const filter: any = { patient: patient._id };

  if (status) filter.status = status;
  if (type) filter.type = type;

  if (dateFrom || dateTo) {
    filter.appointmentDate = {};
    if (dateFrom) filter.appointmentDate.$gte = new Date(dateFrom);
    if (dateTo) filter.appointmentDate.$lte = new Date(dateTo);
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Get appointments with pagination
  const appointments = await Appointment.find(filter)
    .populate("doctor", "firstName lastName specialization consultationFee")
    .sort({ appointmentDate: -1, startTime: -1 })
    .skip(skip)
    .limit(limit);

  // Get total count for pagination
  const totalAppointments = await Appointment.countDocuments(filter);
  const totalPages = Math.ceil(totalAppointments / limit);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Appointments retrieved successfully",
    data: {
      appointments,
      pagination: {
        currentPage: page,
        totalPages,
        totalAppointments,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    },
  });
};

// Get current doctor's appointments
const getDoctorAppointments = async (req: Request, res: Response) => {
  const currentUser = req.user;
  if (!currentUser) {
    throw new ForbiddenError("Access denied");
  }

  // Find doctor profile
  const doctor = await Doctor.findOne({ user: currentUser._id });
  if (!doctor) {
    throw new NotFoundError("Doctor profile not found");
  }

  const {
    status,
    type,
    dateFrom,
    dateTo,
    page = 1,
    limit = 10,
  } = req.query as any;

  // Build filter object
  const filter: any = { doctor: doctor._id };

  if (status) filter.status = status;
  if (type) filter.type = type;

  if (dateFrom || dateTo) {
    filter.appointmentDate = {};
    if (dateFrom) filter.appointmentDate.$gte = new Date(dateFrom);
    if (dateTo) filter.appointmentDate.$lte = new Date(dateTo);
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Get appointments with pagination
  const appointments = await Appointment.find(filter)
    .populate("patient", "firstName lastName phoneNumber")
    .sort({ appointmentDate: -1, startTime: -1 })
    .skip(skip)
    .limit(limit);

  // Get total count for pagination
  const totalAppointments = await Appointment.countDocuments(filter);
  const totalPages = Math.ceil(totalAppointments / limit);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Appointments retrieved successfully",
    data: {
      appointments,
      pagination: {
        currentPage: page,
        totalPages,
        totalAppointments,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    },
  });
};

// Update appointment
const updateAppointment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData: IUpdateAppointment = req.body;
  const currentUser = req.user;

  if (!currentUser) {
    throw new ForbiddenError("Access denied");
  }

  const appointment = await Appointment.findById(id)
    .populate("patient")
    .populate("doctor");

  if (!appointment) {
    throw new NotFoundError("Appointment not found");
  }

  // Check if user can update this appointment
  const isAdmin =
    currentUser.roles.includes("admin") ||
    currentUser.roles.includes("superadmin");
  const isOwnPatient =
    appointment.patient.user.toString() === currentUser._id.toString();
  const isOwnDoctor =
    appointment.doctor.user.toString() === currentUser._id.toString();

  if (!isAdmin && !isOwnPatient && !isOwnDoctor) {
    throw new ForbiddenError("You can only update your own appointments");
  }

  // If updating time or date, check slot availability
  if (
    updateData.appointmentDate ||
    updateData.startTime ||
    updateData.endTime
  ) {
    const newDate =
      updateData.appointmentDate ||
      appointment.appointmentDate.toISOString().split("T")[0];
    const newStartTime = updateData.startTime || appointment.startTime;
    const newEndTime = updateData.endTime || appointment.endTime;

    const slotAvailability = await Appointment.checkSlotAvailability(
      appointment.doctor._id.toString(),
      newDate,
      newStartTime,
      newEndTime,
      id // Exclude current appointment
    );

    if (!slotAvailability.available) {
      throw new CustomAPIError(
        slotAvailability.reason || "Slot not available",
        StatusCodes.CONFLICT
      );
    }
  }

  // Prepare update object
  const updateObject: any = {};

  if (updateData.appointmentDate)
    updateObject.appointmentDate = new Date(updateData.appointmentDate);
  if (updateData.startTime) updateObject.startTime = updateData.startTime;
  if (updateData.endTime) updateObject.endTime = updateData.endTime;
  if (updateData.status) updateObject.status = updateData.status;
  if (updateData.type) updateObject.type = updateData.type;
  if (updateData.reason !== undefined) updateObject.reason = updateData.reason;
  if (updateData.symptoms !== undefined)
    updateObject.symptoms = updateData.symptoms;
  if (updateData.notes !== undefined) updateObject.notes = updateData.notes;
  if (updateData.isUrgent !== undefined)
    updateObject.isUrgent = updateData.isUrgent;
  if (updateData.estimatedDuration !== undefined)
    updateObject.estimatedDuration = updateData.estimatedDuration;
  if (updateData.actualDuration !== undefined)
    updateObject.actualDuration = updateData.actualDuration;
  if (updateData.paymentStatus !== undefined)
    updateObject.paymentStatus = updateData.paymentStatus;

  const updatedAppointment = await Appointment.findByIdAndUpdate(
    id,
    updateObject,
    {
      new: true,
      runValidators: true,
    }
  ).populate([
    { path: "patient", select: "firstName lastName phoneNumber" },
    { path: "doctor", select: "firstName lastName specialization" },
  ]);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Appointment updated successfully",
    data: updatedAppointment,
  });
};

// Cancel appointment
const cancelAppointment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const cancelData: ICancelAppointment = req.body;
  const currentUser = req.user;

  if (!currentUser) {
    throw new ForbiddenError("Access denied");
  }

  const appointment = await Appointment.findById(id)
    .populate("patient")
    .populate("doctor");

  if (!appointment) {
    throw new NotFoundError("Appointment not found");
  }

  // Check if user can cancel this appointment
  const isAdmin =
    currentUser.roles.includes("admin") ||
    currentUser.roles.includes("superadmin");
  const isOwnPatient =
    appointment.patient.user.toString() === currentUser._id.toString();
  const isOwnDoctor =
    appointment.doctor.user.toString() === currentUser._id.toString();

  if (!isAdmin && !isOwnPatient && !isOwnDoctor) {
    throw new ForbiddenError("You can only cancel your own appointments");
  }

  // Check if appointment can be cancelled
  if (appointment.status === "cancelled") {
    throw new CustomAPIError(
      "Appointment is already cancelled",
      StatusCodes.BAD_REQUEST
    );
  }

  if (appointment.status === "completed") {
    throw new CustomAPIError(
      "Cannot cancel completed appointment",
      StatusCodes.BAD_REQUEST
    );
  }

  // Update appointment status
  const updatedAppointment = await Appointment.findByIdAndUpdate(
    id,
    {
      status: "cancelled",
      cancellationReason: cancelData.cancellationReason,
      cancelledBy: cancelData.cancelledBy,
      cancelledAt: new Date(),
    },
    { new: true }
  ).populate([
    { path: "patient", select: "firstName lastName phoneNumber" },
    { path: "doctor", select: "firstName lastName specialization" },
  ]);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Appointment cancelled successfully",
    data: updatedAppointment,
  });
};

// Delete appointment (admin only)
const deleteAppointment = async (req: Request, res: Response) => {
  const { id } = req.params;

  const appointment = await Appointment.findById(id);
  if (!appointment) {
    throw new NotFoundError("Appointment not found");
  }

  await Appointment.findByIdAndDelete(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Appointment deleted successfully",
    data: null,
  });
};

// Get appointment statistics
const getAppointmentStats = async (req: Request, res: Response) => {
  const { doctorId, patientId, dateFrom, dateTo } = req.query as any;

  const stats = await Appointment.getAppointmentStats(
    doctorId,
    patientId,
    dateFrom ? new Date(dateFrom) : undefined,
    dateTo ? new Date(dateTo) : undefined
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Appointment statistics retrieved successfully",
    data: stats,
  });
};

export const AppointmentController = {
  createAppointment,
  getAllAppointments,
  getAppointmentById,
  getMyAppointments,
  getDoctorAppointments,
  updateAppointment,
  cancelAppointment,
  deleteAppointment,
  getAppointmentStats,
};
