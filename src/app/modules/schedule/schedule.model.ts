import { Schema, model } from "mongoose";
import {
  ISchedule,
  ScheduleModel,
  ITimeSlot,
  IDaySchedule,
} from "./schedule.type";

// Time slot schema
const timeSlotSchema = new Schema<ITimeSlot>({
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
  isAvailable: {
    type: Boolean,
    default: true,
  },
  maxAppointments: {
    type: Number,
    default: 1,
    min: [1, "Maximum appointments must be at least 1"],
  },
  currentAppointments: {
    type: Number,
    default: 0,
    min: [0, "Current appointments cannot be negative"],
  },
});

// Day schedule schema
const dayScheduleSchema = new Schema<IDaySchedule>({
  dayOfWeek: {
    type: String,
    enum: [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ],
    required: [true, "Day of week is required"],
  },
  isWorkingDay: {
    type: Boolean,
    default: true,
  },
  timeSlots: [timeSlotSchema],
});

// mongoose schedule schema
const scheduleSchema = new Schema<ISchedule, ScheduleModel>(
  {
    doctor: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      required: [true, "Doctor reference is required"],
    },
    weekStartDate: {
      type: Date,
      required: [true, "Week start date is required"],
    },
    weekEndDate: {
      type: Date,
      required: [true, "Week end date is required"],
    },
    monday: {
      type: dayScheduleSchema,
      required: [true, "Monday schedule is required"],
    },
    tuesday: {
      type: dayScheduleSchema,
      required: [true, "Tuesday schedule is required"],
    },
    wednesday: {
      type: dayScheduleSchema,
      required: [true, "Wednesday schedule is required"],
    },
    thursday: {
      type: dayScheduleSchema,
      required: [true, "Thursday schedule is required"],
    },
    friday: {
      type: dayScheduleSchema,
      required: [true, "Friday schedule is required"],
    },
    saturday: {
      type: dayScheduleSchema,
      required: [true, "Saturday schedule is required"],
    },
    sunday: {
      type: dayScheduleSchema,
      required: [true, "Sunday schedule is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"],
      trim: true,
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
scheduleSchema.index({ doctor: 1 });
scheduleSchema.index({ weekStartDate: 1, weekEndDate: 1 });
scheduleSchema.index({ isActive: 1 });
scheduleSchema.index({ doctor: 1, weekStartDate: 1, weekEndDate: 1 });

// Virtual for week duration
scheduleSchema.virtual("weekDuration").get(function () {
  const start = new Date(this.weekStartDate);
  const end = new Date(this.weekEndDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for total working hours in the week
scheduleSchema.virtual("totalWorkingHours").get(function () {
  let totalHours = 0;
  const days = [
    this.monday,
    this.tuesday,
    this.wednesday,
    this.thursday,
    this.friday,
    this.saturday,
    this.sunday,
  ];

  days.forEach((day) => {
    if (day.isWorkingDay) {
      day.timeSlots.forEach((slot) => {
        if (slot.isAvailable) {
          const startTime = new Date(`2000-01-01T${slot.startTime}:00`);
          const endTime = new Date(`2000-01-01T${slot.endTime}:00`);
          const diffMs = endTime.getTime() - startTime.getTime();
          const diffHours = diffMs / (1000 * 60 * 60);
          totalHours += diffHours;
        }
      });
    }
  });

  return totalHours;
});

// Virtual for available slots count
scheduleSchema.virtual("availableSlotsCount").get(function () {
  let count = 0;
  const days = [
    this.monday,
    this.tuesday,
    this.wednesday,
    this.thursday,
    this.friday,
    this.saturday,
    this.sunday,
  ];

  days.forEach((day) => {
    if (day.isWorkingDay) {
      day.timeSlots.forEach((slot) => {
        if (slot.isAvailable) {
          const availableSpots =
            (slot.maxAppointments || 1) - (slot.currentAppointments || 0);
          count += Math.max(0, availableSpots);
        }
      });
    }
  });

  return count;
});

// Pre-save middleware to validate week dates and time slots
scheduleSchema.pre("save", function (next) {
  // Validate week start and end dates
  const startDate = new Date(this.weekStartDate);
  const endDate = new Date(this.weekEndDate);

  if (startDate >= endDate) {
    return next(new Error("Week start date must be before week end date"));
  }

  // Validate that it's a 7-day week
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays !== 6) {
    // 6 days difference means 7 days total
    return next(new Error("Schedule must cover exactly 7 days"));
  }

  // Validate time slots for each day
  const days = [
    this.monday,
    this.tuesday,
    this.wednesday,
    this.thursday,
    this.friday,
    this.saturday,
    this.sunday,
  ];

  for (const day of days) {
    if (day.isWorkingDay && day.timeSlots.length > 0) {
      for (const slot of day.timeSlots) {
        const startTime = new Date(`2000-01-01T${slot.startTime}:00`);
        const endTime = new Date(`2000-01-01T${slot.endTime}:00`);

        if (startTime >= endTime) {
          return next(
            new Error(`Start time must be before end time for ${day.dayOfWeek}`)
          );
        }

        if (
          slot.maxAppointments &&
          slot.currentAppointments &&
          slot.currentAppointments > slot.maxAppointments
        ) {
          return next(
            new Error(
              `Current appointments cannot exceed maximum appointments for ${day.dayOfWeek}`
            )
          );
        }
      }
    }
  }

  next();
});

// Static method to find schedule by doctor and date
scheduleSchema.statics.findByDoctorAndDate = async function (
  doctorId: string,
  date: Date
) {
  const targetDate = new Date(date);
  return await this.findOne({
    doctor: doctorId,
    weekStartDate: { $lte: targetDate },
    weekEndDate: { $gte: targetDate },
    isActive: true,
  });
};

// Static method to get available slots for a specific date
scheduleSchema.statics.getAvailableSlots = async function (
  doctorId: string,
  date: string
) {
  const targetDate = new Date(date);
  const schedule = await this.findByDoctorAndDate(doctorId, targetDate);

  if (!schedule) {
    return [];
  }

  const dayOfWeek = targetDate
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();
  const daySchedule = schedule[dayOfWeek as keyof ISchedule] as IDaySchedule;

  if (!daySchedule || !daySchedule.isWorkingDay) {
    return [];
  }

  return daySchedule.timeSlots.filter((slot) => {
    if (!slot.isAvailable) return false;
    const availableSpots =
      (slot.maxAppointments || 1) - (slot.currentAppointments || 0);
    return availableSpots > 0;
  });
};

export const Schedule = model<ISchedule, ScheduleModel>(
  "Schedule",
  scheduleSchema
);
