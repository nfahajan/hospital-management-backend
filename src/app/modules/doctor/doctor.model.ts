import { Schema, model } from "mongoose";
import { IDoctor, DoctorModel } from "./doctor.type";

// mongoose doctor schema
const doctorSchema = new Schema<IDoctor, DoctorModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
      validate: {
        validator: function (value: Date) {
          return value < new Date();
        },
        message: "Date of birth cannot be in the future",
      },
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: [true, "Gender is required"],
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^\+?[\d\s\-\(\)]+$/, "Please enter a valid phone number"],
    },
    address: {
      street: {
        type: String,
        required: [true, "Street address is required"],
        trim: true,
      },
      city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
      },
      state: {
        type: String,
        required: [true, "State is required"],
        trim: true,
      },
      zipCode: {
        type: String,
        required: [true, "Zip code is required"],
        trim: true,
      },
      country: {
        type: String,
        required: [true, "Country is required"],
        trim: true,
      },
    },
    specialization: {
      type: String,
      enum: [
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
      ],
      required: [true, "Specialization is required"],
    },
    licenseNumber: {
      type: String,
      required: [true, "License number is required"],
      unique: true,
      trim: true,
    },
    licenseExpiryDate: {
      type: Date,
      required: [true, "License expiry date is required"],
      validate: {
        validator: function (value: Date) {
          return value > new Date();
        },
        message: "License expiry date must be in the future",
      },
    },
    yearsOfExperience: {
      type: Number,
      required: [true, "Years of experience is required"],
      min: [0, "Years of experience cannot be negative"],
      max: [50, "Years of experience cannot exceed 50"],
    },
    education: [
      {
        degree: {
          type: String,
          required: [true, "Degree is required"],
          trim: true,
        },
        institution: {
          type: String,
          required: [true, "Institution is required"],
          trim: true,
        },
        graduationYear: {
          type: Number,
          required: [true, "Graduation year is required"],
          min: [1950, "Graduation year must be after 1950"],
          max: [
            new Date().getFullYear(),
            "Graduation year cannot be in the future",
          ],
        },
      },
    ],
    bio: {
      type: String,
      maxlength: [1000, "Bio cannot exceed 1000 characters"],
      trim: true,
    },
    consultationFee: {
      type: Number,
      required: [true, "Consultation fee is required"],
      min: [0, "Consultation fee cannot be negative"],
    },
    availableSlots: [
      {
        dayOfWeek: {
          type: Number,
          required: [true, "Day of week is required"],
          min: [0, "Day of week must be between 0-6"],
          max: [6, "Day of week must be between 0-6"],
        },
        startTime: {
          type: String,
          required: [true, "Start time is required"],
          match: [
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            "Please enter a valid time in HH:MM format",
          ],
        },
        endTime: {
          type: String,
          required: [true, "End time is required"],
          match: [
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            "Please enter a valid time in HH:MM format",
          ],
        },
      },
    ],
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

// Index for better query performance

doctorSchema.index({ firstName: 1, lastName: 1 });
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ isAvailable: 1 });

// Virtual for full name
doctorSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age
doctorSchema.virtual("age").get(function () {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
});

// Virtual for license status
doctorSchema.virtual("licenseStatus").get(function () {
  const today = new Date();
  const expiryDate = new Date(this.licenseExpiryDate);
  const daysUntilExpiry = Math.ceil(
    (expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24)
  );

  if (daysUntilExpiry < 0) {
    return "expired";
  } else if (daysUntilExpiry <= 30) {
    return "expiring_soon";
  } else {
    return "valid";
  }
});

// Pre-save middleware to validate time slots
doctorSchema.pre("save", function (next) {
  if (this.availableSlots && this.availableSlots.length > 0) {
    for (const slot of this.availableSlots) {
      const startTime = new Date(`2000-01-01T${slot.startTime}:00`);
      const endTime = new Date(`2000-01-01T${slot.endTime}:00`);

      if (startTime >= endTime) {
        return next(new Error("Start time must be before end time"));
      }
    }
  }
  next();
});

export const Doctor = model<IDoctor, DoctorModel>("Doctor", doctorSchema);
