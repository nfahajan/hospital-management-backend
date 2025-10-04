import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Doctor } from "./doctor.model";
import { User } from "../user/user.model";
import sendResponse from "../../shared/sendResponse";
import CustomAPIError from "../../errors/custom-api";
import NotFoundError from "../../errors/not-found";
import ForbiddenError from "../../errors/forbidden";
import { ICreateDoctor, IUpdateDoctor } from "./doctor.type";

// Create a new doctor (admin only)
const createDoctor = async (req: Request, res: Response) => {
  const doctorData: ICreateDoctor = req.body;

  // Check if user with email already exists
  const existingUser = await User.getUser(doctorData.email);
  if (existingUser) {
    throw new CustomAPIError(
      "Email address already taken",
      StatusCodes.CONFLICT
    );
  }

  // Check if license number already exists
  const existingDoctor = await Doctor.findOne({
    licenseNumber: doctorData.licenseNumber,
  });
  if (existingDoctor) {
    throw new CustomAPIError(
      "License number already exists",
      StatusCodes.CONFLICT
    );
  }

  // Create user account with approved status by default
  const newUser = new User({
    email: doctorData.email,
    password: doctorData.password,
    roles: ["doctor"],
    status: "approved", // Auto-approved for doctors
    auth_type: "standard",
  });

  const savedUser = await newUser.save();

  // Create doctor record
  const newDoctor = new Doctor({
    user: savedUser._id,
    firstName: doctorData.firstName,
    lastName: doctorData.lastName,
    dateOfBirth: new Date(doctorData.dateOfBirth),
    gender: doctorData.gender,
    phoneNumber: doctorData.phoneNumber,
    address: doctorData.address,
    specialization: doctorData.specialization,
    licenseNumber: doctorData.licenseNumber,
    licenseExpiryDate: new Date(doctorData.licenseExpiryDate),
    yearsOfExperience: doctorData.yearsOfExperience,
    education: doctorData.education,
    bio: doctorData.bio,
    consultationFee: doctorData.consultationFee,
    availableSlots: doctorData.availableSlots || [],
    isAvailable:
      doctorData.isAvailable !== undefined ? doctorData.isAvailable : true,
  });

  const savedDoctor = await newDoctor.save();

  // Populate user data for response
  await savedDoctor.populate("user", "email roles status createdAt");

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Doctor created successfully",
    data: savedDoctor,
  });
};

// Get all doctors (admin only)
const getAllDoctors = async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    search,
    specialization,
    isAvailable,
  } = req.query as any;

  // Build filter object
  const filter: any = {};

  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { phoneNumber: { $regex: search, $options: "i" } },
      { licenseNumber: { $regex: search, $options: "i" } },
    ];
  }

  if (specialization) {
    filter.specialization = specialization;
  }

  if (isAvailable !== undefined) {
    filter.isAvailable = isAvailable === "true";
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Get doctors with pagination
  const doctors = await Doctor.find(filter)
    .populate("user", "email roles status createdAt")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Get total count for pagination
  const totalDoctors = await Doctor.countDocuments(filter);
  const totalPages = Math.ceil(totalDoctors / limit);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Doctors retrieved successfully",
    data: {
      doctors,
      pagination: {
        currentPage: page,
        totalPages,
        totalDoctors,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    },
  });
};

// Get doctor by ID
const getDoctorById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const doctor = await Doctor.findById(id).populate(
    "user",
    "email roles status createdAt"
  );

  if (!doctor) {
    throw new NotFoundError("Doctor not found");
  }

  // Check if user can access this doctor's data
  const currentUser = req.user;
  if (!currentUser) {
    throw new ForbiddenError("Access denied");
  }

  // Allow access if user is admin or the doctor themselves
  const isAdmin =
    currentUser.roles.includes("admin") ||
    currentUser.roles.includes("superadmin");
  const isOwnProfile =
    doctor.user._id.toString() === currentUser._id.toString();

  if (!isAdmin && !isOwnProfile) {
    throw new ForbiddenError("Access denied");
  }

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Doctor retrieved successfully",
    data: doctor,
  });
};

// Get current doctor's profile
const getMyProfile = async (req: Request, res: Response) => {
  const currentUser = req.user;
  if (!currentUser) {
    throw new ForbiddenError("Access denied");
  }

  const doctor = await Doctor.findOne({ user: currentUser._id }).populate(
    "user",
    "email roles status createdAt"
  );

  if (!doctor) {
    throw new NotFoundError("Doctor profile not found");
  }

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Profile retrieved successfully",
    data: doctor,
  });
};

// Update doctor profile (doctors can update their own info)
const updateDoctor = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData: IUpdateDoctor = req.body;
  const currentUser = req.user;

  if (!currentUser) {
    throw new ForbiddenError("Access denied");
  }

  const doctor = await Doctor.findById(id);
  if (!doctor) {
    throw new NotFoundError("Doctor not found");
  }

  // Check if user can update this doctor's data
  const isAdmin =
    currentUser.roles.includes("admin") ||
    currentUser.roles.includes("superadmin");
  const isOwnProfile = doctor.user.toString() === currentUser._id.toString();

  if (!isAdmin && !isOwnProfile) {
    throw new ForbiddenError("You can only update your own profile");
  }

  // Prepare update object
  const updateObject: any = {};

  if (updateData.firstName) updateObject.firstName = updateData.firstName;
  if (updateData.lastName) updateObject.lastName = updateData.lastName;
  if (updateData.dateOfBirth)
    updateObject.dateOfBirth = new Date(updateData.dateOfBirth);
  if (updateData.gender) updateObject.gender = updateData.gender;
  if (updateData.phoneNumber) updateObject.phoneNumber = updateData.phoneNumber;
  if (updateData.specialization)
    updateObject.specialization = updateData.specialization;
  if (updateData.licenseNumber)
    updateObject.licenseNumber = updateData.licenseNumber;
  if (updateData.licenseExpiryDate)
    updateObject.licenseExpiryDate = new Date(updateData.licenseExpiryDate);
  if (updateData.yearsOfExperience !== undefined)
    updateObject.yearsOfExperience = updateData.yearsOfExperience;
  if (updateData.education) updateObject.education = updateData.education;
  if (updateData.bio !== undefined) updateObject.bio = updateData.bio;
  if (updateData.consultationFee !== undefined)
    updateObject.consultationFee = updateData.consultationFee;
  if (updateData.availableSlots)
    updateObject.availableSlots = updateData.availableSlots;
  if (updateData.isAvailable !== undefined)
    updateObject.isAvailable = updateData.isAvailable;

  // Handle nested objects
  if (updateData.address) {
    updateObject.address = { ...doctor.address, ...updateData.address };
  }

  const updatedDoctor = await Doctor.findByIdAndUpdate(id, updateObject, {
    new: true,
    runValidators: true,
  }).populate("user", "email roles status createdAt");

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Doctor updated successfully",
    data: updatedDoctor,
  });
};

// Delete doctor (admin only)
const deleteDoctor = async (req: Request, res: Response) => {
  const { id } = req.params;

  const doctor = await Doctor.findById(id);
  if (!doctor) {
    throw new NotFoundError("Doctor not found");
  }

  // Delete doctor record
  await Doctor.findByIdAndDelete(id);

  // Delete associated user account
  await User.findByIdAndDelete(doctor.user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Doctor deleted successfully",
    data: null,
  });
};

// Get doctors by specialization (public endpoint for booking)
const getDoctorsBySpecialization = async (req: Request, res: Response) => {
  const { specialization } = req.params;
  const { page = 1, limit = 10 } = req.query as any;

  const validSpecializations = [
    "cardiology",
    "dermatology",
    "endocrinology",
    "gastroenterology",
    "general_medicine",
    "neurology",
    "oncology",
    "orthopedics",
    "pediatrics",
    "psychiatry",
    "radiology",
    "surgery",
    "urology",
    "other",
  ];

  if (!validSpecializations.includes(specialization)) {
    throw new CustomAPIError("Invalid specialization", StatusCodes.BAD_REQUEST);
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Get available doctors by specialization
  const doctors = await Doctor.find({
    specialization,
    isAvailable: true,
  })
    .populate("user", "email roles status createdAt")
    .select("-availableSlots") // Don't expose detailed schedule
    .sort({ yearsOfExperience: -1 })
    .skip(skip)
    .limit(limit);

  // Get total count for pagination
  const totalDoctors = await Doctor.countDocuments({
    specialization,
    isAvailable: true,
  });
  const totalPages = Math.ceil(totalDoctors / limit);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Doctors retrieved successfully",
    data: {
      doctors,
      pagination: {
        currentPage: page,
        totalPages,
        totalDoctors,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    },
  });
};

export const DoctorController = {
  createDoctor,
  getAllDoctors,
  getDoctorById,
  getMyProfile,
  updateDoctor,
  deleteDoctor,
  getDoctorsBySpecialization,
};
