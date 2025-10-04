// Simple validation functions for schedule module

// Basic validation for creating a schedule
export const validateCreateSchedule = (data: any) => {
  const errors: string[] = [];

  // Doctor ID validation
  if (!data.doctorId || typeof data.doctorId !== "string") {
    errors.push("Doctor ID is required");
  } else if (!/^[0-9a-fA-F]{24}$/.test(data.doctorId)) {
    errors.push("Invalid doctor ID format");
  }

  // Week dates validation
  if (!data.weekStartDate) {
    errors.push("Week start date is required");
  } else {
    const startDate = new Date(data.weekStartDate);
    if (isNaN(startDate.getTime())) {
      errors.push("Invalid week start date format");
    }
  }

  if (!data.weekEndDate) {
    errors.push("Week end date is required");
  } else {
    const endDate = new Date(data.weekEndDate);
    if (isNaN(endDate.getTime())) {
      errors.push("Invalid week end date format");
    }
  }

  // Validate week duration
  if (data.weekStartDate && data.weekEndDate) {
    const startDate = new Date(data.weekStartDate);
    const endDate = new Date(data.weekEndDate);

    if (startDate >= endDate) {
      errors.push("Week start date must be before week end date");
    } else {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays !== 6) {
        errors.push("Schedule must cover exactly 7 days");
      }
    }
  }

  // Validate each day schedule
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
    if (!data[day] || typeof data[day] !== "object") {
      errors.push(`${day} schedule is required`);
    } else {
      const daySchedule = data[day];

      // Validate day of week
      if (!daySchedule.dayOfWeek || daySchedule.dayOfWeek !== day) {
        errors.push(`${day} schedule must have correct dayOfWeek: ${day}`);
      }

      // Validate isWorkingDay
      if (
        daySchedule.isWorkingDay !== undefined &&
        typeof daySchedule.isWorkingDay !== "boolean"
      ) {
        errors.push(`${day} isWorkingDay must be a boolean`);
      }

      // Validate time slots
      if (daySchedule.timeSlots && Array.isArray(daySchedule.timeSlots)) {
        daySchedule.timeSlots.forEach((slot: any, index: number) => {
          // Validate start time
          if (!slot.startTime || typeof slot.startTime !== "string") {
            errors.push(`${day} slot ${index + 1}: start time is required`);
          } else {
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(slot.startTime)) {
              errors.push(
                `${day} slot ${index + 1}: start time must be in HH:MM format`
              );
            }
          }

          // Validate end time
          if (!slot.endTime || typeof slot.endTime !== "string") {
            errors.push(`${day} slot ${index + 1}: end time is required`);
          } else {
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(slot.endTime)) {
              errors.push(
                `${day} slot ${index + 1}: end time must be in HH:MM format`
              );
            }
          }

          // Validate time order
          if (slot.startTime && slot.endTime) {
            const startTime = new Date(`2000-01-01T${slot.startTime}:00`);
            const endTime = new Date(`2000-01-01T${slot.endTime}:00`);

            if (startTime >= endTime) {
              errors.push(
                `${day} slot ${index + 1}: start time must be before end time`
              );
            }
          }

          // Validate isAvailable
          if (
            slot.isAvailable !== undefined &&
            typeof slot.isAvailable !== "boolean"
          ) {
            errors.push(
              `${day} slot ${index + 1}: isAvailable must be a boolean`
            );
          }

          // Validate maxAppointments
          if (slot.maxAppointments !== undefined) {
            if (
              typeof slot.maxAppointments !== "number" ||
              slot.maxAppointments < 1
            ) {
              errors.push(
                `${day} slot ${
                  index + 1
                }: maxAppointments must be a number >= 1`
              );
            }
          }

          // Validate currentAppointments
          if (slot.currentAppointments !== undefined) {
            if (
              typeof slot.currentAppointments !== "number" ||
              slot.currentAppointments < 0
            ) {
              errors.push(
                `${day} slot ${
                  index + 1
                }: currentAppointments must be a number >= 0`
              );
            }
          }

          // Validate appointment limits
          if (
            slot.maxAppointments &&
            slot.currentAppointments &&
            slot.currentAppointments > slot.maxAppointments
          ) {
            errors.push(
              `${day} slot ${
                index + 1
              }: currentAppointments cannot exceed maxAppointments`
            );
          }
        });
      }
    }
  });

  // Validate notes
  if (data.notes && typeof data.notes !== "string") {
    errors.push("Notes must be a string");
  } else if (data.notes && data.notes.length > 500) {
    errors.push("Notes cannot exceed 500 characters");
  }

  return errors;
};

// Basic validation for updating a schedule
export const validateUpdateSchedule = (data: any) => {
  const errors: string[] = [];

  // Week dates validation
  if (data.weekStartDate) {
    const startDate = new Date(data.weekStartDate);
    if (isNaN(startDate.getTime())) {
      errors.push("Invalid week start date format");
    }
  }

  if (data.weekEndDate) {
    const endDate = new Date(data.weekEndDate);
    if (isNaN(endDate.getTime())) {
      errors.push("Invalid week end date format");
    }
  }

  // Validate week duration if both dates are provided
  if (data.weekStartDate && data.weekEndDate) {
    const startDate = new Date(data.weekStartDate);
    const endDate = new Date(data.weekEndDate);

    if (startDate >= endDate) {
      errors.push("Week start date must be before week end date");
    } else {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays !== 6) {
        errors.push("Schedule must cover exactly 7 days");
      }
    }
  }

  // Validate day schedules if provided
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
    if (data[day] && typeof data[day] === "object") {
      const daySchedule = data[day];

      // Validate isWorkingDay
      if (
        daySchedule.isWorkingDay !== undefined &&
        typeof daySchedule.isWorkingDay !== "boolean"
      ) {
        errors.push(`${day} isWorkingDay must be a boolean`);
      }

      // Validate time slots
      if (daySchedule.timeSlots && Array.isArray(daySchedule.timeSlots)) {
        daySchedule.timeSlots.forEach((slot: any, index: number) => {
          // Validate start time
          if (slot.startTime && typeof slot.startTime === "string") {
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(slot.startTime)) {
              errors.push(
                `${day} slot ${index + 1}: start time must be in HH:MM format`
              );
            }
          }

          // Validate end time
          if (slot.endTime && typeof slot.endTime === "string") {
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(slot.endTime)) {
              errors.push(
                `${day} slot ${index + 1}: end time must be in HH:MM format`
              );
            }
          }

          // Validate time order
          if (slot.startTime && slot.endTime) {
            const startTime = new Date(`2000-01-01T${slot.startTime}:00`);
            const endTime = new Date(`2000-01-01T${slot.endTime}:00`);

            if (startTime >= endTime) {
              errors.push(
                `${day} slot ${index + 1}: start time must be before end time`
              );
            }
          }

          // Validate isAvailable
          if (
            slot.isAvailable !== undefined &&
            typeof slot.isAvailable !== "boolean"
          ) {
            errors.push(
              `${day} slot ${index + 1}: isAvailable must be a boolean`
            );
          }

          // Validate maxAppointments
          if (slot.maxAppointments !== undefined) {
            if (
              typeof slot.maxAppointments !== "number" ||
              slot.maxAppointments < 1
            ) {
              errors.push(
                `${day} slot ${
                  index + 1
                }: maxAppointments must be a number >= 1`
              );
            }
          }

          // Validate currentAppointments
          if (slot.currentAppointments !== undefined) {
            if (
              typeof slot.currentAppointments !== "number" ||
              slot.currentAppointments < 0
            ) {
              errors.push(
                `${day} slot ${
                  index + 1
                }: currentAppointments must be a number >= 0`
              );
            }
          }

          // Validate appointment limits
          if (
            slot.maxAppointments &&
            slot.currentAppointments &&
            slot.currentAppointments > slot.maxAppointments
          ) {
            errors.push(
              `${day} slot ${
                index + 1
              }: currentAppointments cannot exceed maxAppointments`
            );
          }
        });
      }
    }
  });

  // Validate notes
  if (data.notes !== undefined) {
    if (typeof data.notes !== "string") {
      errors.push("Notes must be a string");
    } else if (data.notes.length > 500) {
      errors.push("Notes cannot exceed 500 characters");
    }
  }

  return errors;
};

// Validation for schedule ID
export const validateScheduleId = (id: string) => {
  if (!id || typeof id !== "string") {
    return "Schedule ID is required";
  }
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    return "Invalid schedule ID format";
  }
  return null;
};

// Validation for doctor ID
export const validateDoctorId = (id: string) => {
  if (!id || typeof id !== "string") {
    return "Doctor ID is required";
  }
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    return "Invalid doctor ID format";
  }
  return null;
};

// Validation for date
export const validateDate = (date: string) => {
  if (!date || typeof date !== "string") {
    return "Date is required";
  }
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return "Invalid date format";
  }
  return null;
};

// Placeholder validation objects for compatibility
export const createScheduleValidation = { validate: validateCreateSchedule };
export const updateScheduleValidation = { validate: validateUpdateSchedule };
export const scheduleIdValidation = { validate: validateScheduleId };
export const doctorIdValidation = { validate: validateDoctorId };
export const dateValidation = { validate: validateDate };
