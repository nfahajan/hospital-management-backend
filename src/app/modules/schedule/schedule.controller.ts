import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Schedule } from "./schedule.model";
import { Doctor } from "../doctor/doctor.model";
import sendResponse from "../../shared/sendResponse";
import CustomAPIError from "../../errors/custom-api";
import NotFoundError from "../../errors/not-found";
import ForbiddenError from "../../errors/forbidden";
import {
  ICreateSchedule,
  IUpdateSchedule,
  IUpdateDaySchedule,
} from "./schedule.type";

// Create a new schedule (admin and doctor can create)
const createSchedule = async (req: Request, res: Response) => {
  const scheduleData: ICreateSchedule = req.body;
  const currentUser = req.user;

  if (!currentUser) {
    throw new ForbiddenError("Access denied");
  }

  // Check if doctor exists
  const doctor = await Doctor.findById(scheduleData.doctorId);
  if (!doctor) {
    throw new NotFoundError("Doctor not found");
  }

  // Check if user can create schedule for this doctor
  const isAdmin =
    currentUser.roles.includes("admin") ||
    currentUser.roles.includes("superadmin");
  const isOwnDoctor = doctor.user.toString() === currentUser._id.toString();

  if (!isAdmin && !isOwnDoctor) {
    throw new ForbiddenError(
      "You can only create schedules for your own profile"
    );
  }

  // Check for overlapping schedules
  const existingSchedule = await Schedule.findOne({
    doctor: scheduleData.doctorId,
    weekStartDate: { $lte: new Date(scheduleData.weekEndDate) },
    weekEndDate: { $gte: new Date(scheduleData.weekStartDate) },
    isActive: true,
  });

  if (existingSchedule) {
    throw new CustomAPIError(
      "A schedule already exists for this week",
      StatusCodes.CONFLICT
    );
  }

  // Create schedule record
  const newSchedule = new Schedule({
    doctor: scheduleData.doctorId,
    weekStartDate: new Date(scheduleData.weekStartDate),
    weekEndDate: new Date(scheduleData.weekEndDate),
    monday: scheduleData.monday,
    tuesday: scheduleData.tuesday,
    wednesday: scheduleData.wednesday,
    thursday: scheduleData.thursday,
    friday: scheduleData.friday,
    saturday: scheduleData.saturday,
    sunday: scheduleData.sunday,
    isActive: scheduleData.isActive ?? true,
    notes: scheduleData.notes,
  });

  const savedSchedule = await newSchedule.save();

  // Populate doctor data for response
  await savedSchedule.populate("doctor", "firstName lastName specialization");

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Schedule created successfully",
    data: savedSchedule,
  });
};

// Get all schedules (admin only)
const getAllSchedules = async (req: Request, res: Response) => {
  const { page = 1, limit = 10, doctorId, isActive } = req.query as any;

  // Build filter object
  const filter: any = {};

  if (doctorId) {
    filter.doctor = doctorId;
  }

  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Get schedules with pagination
  const schedules = await Schedule.find(filter)
    .populate("doctor", "firstName lastName specialization")
    .sort({ weekStartDate: -1 })
    .skip(skip)
    .limit(limit);

  // Get total count for pagination
  const totalSchedules = await Schedule.countDocuments(filter);
  const totalPages = Math.ceil(totalSchedules / limit);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Schedules retrieved successfully",
    data: {
      schedules,
      pagination: {
        currentPage: page,
        totalPages,
        totalSchedules,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    },
  });
};

// Get schedule by ID
const getScheduleById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const schedule = await Schedule.findById(id).populate(
    "doctor",
    "firstName lastName specialization"
  );

  if (!schedule) {
    throw new NotFoundError("Schedule not found");
  }

  // Check if user can access this schedule
  const currentUser = req.user;
  if (!currentUser) {
    throw new ForbiddenError("Access denied");
  }

  // Allow access if user is admin or the doctor themselves
  const isAdmin =
    currentUser.roles.includes("admin") ||
    currentUser.roles.includes("superadmin");
  const isOwnDoctor =
    schedule.doctor.user.toString() === currentUser._id.toString();

  if (!isAdmin && !isOwnDoctor) {
    throw new ForbiddenError("Access denied");
  }

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Schedule retrieved successfully",
    data: schedule,
  });
};

// Get current doctor's schedules
const getMySchedules = async (req: Request, res: Response) => {
  const currentUser = req.user;
  if (!currentUser) {
    throw new ForbiddenError("Access denied");
  }

  // Find doctor profile
  const doctor = await Doctor.findOne({ user: currentUser._id });
  if (!doctor) {
    throw new NotFoundError("Doctor profile not found");
  }

  const { page = 1, limit = 10, isActive } = req.query as any;

  // Build filter object
  const filter: any = { doctor: doctor._id };

  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Get schedules with pagination
  const schedules = await Schedule.find(filter)
    .populate("doctor", "firstName lastName specialization")
    .sort({ weekStartDate: -1 })
    .skip(skip)
    .limit(limit);

  // Get total count for pagination
  const totalSchedules = await Schedule.countDocuments(filter);
  const totalPages = Math.ceil(totalSchedules / limit);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Schedules retrieved successfully",
    data: {
      schedules,
      pagination: {
        currentPage: page,
        totalPages,
        totalSchedules,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    },
  });
};

// Update schedule
const updateSchedule = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData: IUpdateSchedule = req.body;
  const currentUser = req.user;

  if (!currentUser) {
    throw new ForbiddenError("Access denied");
  }

  const schedule = await Schedule.findById(id).populate("doctor");
  if (!schedule) {
    throw new NotFoundError("Schedule not found");
  }

  // Check if user can update this schedule
  const isAdmin =
    currentUser.roles.includes("admin") ||
    currentUser.roles.includes("superadmin");
  const isOwnDoctor =
    schedule.doctor.user.toString() === currentUser._id.toString();

  if (!isAdmin && !isOwnDoctor) {
    throw new ForbiddenError("You can only update your own schedules");
  }

  // Prepare update object
  const updateObject: any = {};

  if (updateData.weekStartDate)
    updateObject.weekStartDate = new Date(updateData.weekStartDate);
  if (updateData.weekEndDate)
    updateObject.weekEndDate = new Date(updateData.weekEndDate);
  if (updateData.isActive !== undefined)
    updateObject.isActive = updateData.isActive;
  if (updateData.notes !== undefined) updateObject.notes = updateData.notes;

  // Handle day schedules
  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  days.forEach((day) => {
    const dayUpdate = updateData[day as keyof IUpdateSchedule];
    if (dayUpdate && typeof dayUpdate === "object") {
      updateObject[day] = {
        ...schedule[day as keyof typeof schedule],
        ...dayUpdate,
      };
    }
  });

  const updatedSchedule = await Schedule.findByIdAndUpdate(id, updateObject, {
    new: true,
    runValidators: true,
  }).populate("doctor", "firstName lastName specialization");

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Schedule updated successfully",
    data: updatedSchedule,
  });
};

// Update specific day schedule
const updateDaySchedule = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { dayOfWeek } = req.params;
  const updateData: IUpdateDaySchedule = req.body;
  const currentUser = req.user;

  if (!currentUser) {
    throw new ForbiddenError("Access denied");
  }

  const schedule = await Schedule.findById(id).populate("doctor");
  if (!schedule) {
    throw new NotFoundError("Schedule not found");
  }

  // Check if user can update this schedule
  const isAdmin =
    currentUser.roles.includes("admin") ||
    currentUser.roles.includes("superadmin");
  const isOwnDoctor =
    schedule.doctor.user.toString() === currentUser._id.toString();

  if (!isAdmin && !isOwnDoctor) {
    throw new ForbiddenError("You can only update your own schedules");
  }

  // Validate day of week
  const validDays = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  if (!validDays.includes(dayOfWeek)) {
    throw new CustomAPIError("Invalid day of week", StatusCodes.BAD_REQUEST);
  }

  // Prepare update object for the specific day
  const updateObject: any = {};
  updateObject[dayOfWeek] = {
    ...schedule[dayOfWeek as keyof typeof schedule],
    ...updateData,
  };

  const updatedSchedule = await Schedule.findByIdAndUpdate(id, updateObject, {
    new: true,
    runValidators: true,
  }).populate("doctor", "firstName lastName specialization");

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `${dayOfWeek} schedule updated successfully`,
    data: updatedSchedule,
  });
};

// Delete schedule
const deleteSchedule = async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = req.user;

  if (!currentUser) {
    throw new ForbiddenError("Access denied");
  }

  const schedule = await Schedule.findById(id).populate("doctor");
  if (!schedule) {
    throw new NotFoundError("Schedule not found");
  }

  // Check if user can delete this schedule
  const isAdmin =
    currentUser.roles.includes("admin") ||
    currentUser.roles.includes("superadmin");
  const isOwnDoctor =
    schedule.doctor.user.toString() === currentUser._id.toString();

  if (!isAdmin && !isOwnDoctor) {
    throw new ForbiddenError("You can only delete your own schedules");
  }

  await Schedule.findByIdAndDelete(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Schedule deleted successfully",
    data: null,
  });
};

// Get available slots for a doctor on a specific date
const getAvailableSlots = async (req: Request, res: Response) => {
  const { doctorId, date } = req.params;

  // Validate date format
  const targetDate = new Date(date);
  if (isNaN(targetDate.getTime())) {
    throw new CustomAPIError("Invalid date format", StatusCodes.BAD_REQUEST);
  }

  // Check if doctor exists
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw new NotFoundError("Doctor not found");
  }

  // Get available slots using the static method
  const availableSlots = await Schedule.getAvailableSlots(doctorId, date);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Available slots retrieved successfully",
    data: {
      doctor: {
        id: doctor._id,
        name: `${doctor.firstName} ${doctor.lastName}`,
        specialization: doctor.specialization,
      },
      date,
      availableSlots,
    },
  });
};

// Get current doctor's available slots
const getMyAvailableSlots = async (req: Request, res: Response) => {
  const { date } = req.params;
  const currentUser = req.user;

  if (!currentUser) {
    throw new ForbiddenError("Access denied");
  }

  // Find doctor profile
  const doctor = await Doctor.findOne({ user: currentUser._id });
  if (!doctor) {
    throw new NotFoundError("Doctor profile not found");
  }

  // Validate date format
  const targetDate = new Date(date);
  if (isNaN(targetDate.getTime())) {
    throw new CustomAPIError("Invalid date format", StatusCodes.BAD_REQUEST);
  }

  // Get available slots using the static method
  const availableSlots = await Schedule.getAvailableSlots(
    doctor._id.toString(),
    date
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Available slots retrieved successfully",
    data: {
      doctor: {
        id: doctor._id,
        name: `${doctor.firstName} ${doctor.lastName}`,
        specialization: doctor.specialization,
      },
      date,
      availableSlots,
    },
  });
};

export const ScheduleController = {
  createSchedule,
  getAllSchedules,
  getScheduleById,
  getMySchedules,
  updateSchedule,
  updateDaySchedule,
  deleteSchedule,
  getAvailableSlots,
  getMyAvailableSlots,
};
