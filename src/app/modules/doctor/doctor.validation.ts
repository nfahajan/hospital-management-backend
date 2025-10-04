// Simple validation functions for doctor module

// Basic validation for creating a doctor
export const validateCreateDoctor = (data: any) => {
  const errors: string[] = [];

  // Email validation
  if (!data.email || typeof data.email !== "string") {
    errors.push("Email is required and must be a string");
  } else if (!/\S+@\S+\.\S+/.test(data.email)) {
    errors.push("Please provide a valid email address");
  }

  // Password validation
  if (
    !data.password ||
    typeof data.password !== "string" ||
    data.password.length < 8
  ) {
    errors.push("Password must be at least 8 characters long");
  }

  // Name validation
  if (!data.firstName || typeof data.firstName !== "string") {
    errors.push("First name is required");
  }
  if (!data.lastName || typeof data.lastName !== "string") {
    errors.push("Last name is required");
  }

  // Date of birth validation
  if (!data.dateOfBirth) {
    errors.push("Date of birth is required");
  } else {
    const birthDate = new Date(data.dateOfBirth);
    const today = new Date();
    if (birthDate >= today) {
      errors.push("Date of birth cannot be in the future");
    }
  }

  // Gender validation
  if (!data.gender || !["male", "female", "other"].includes(data.gender)) {
    errors.push("Gender must be male, female, or other");
  }

  // Phone validation
  if (!data.phoneNumber || typeof data.phoneNumber !== "string") {
    errors.push("Phone number is required");
  }

  // Address validation
  if (!data.address || typeof data.address !== "object") {
    errors.push("Address is required");
  } else {
    const { street, city, state, zipCode, country } = data.address;
    if (!street || !city || !state || !zipCode || !country) {
      errors.push("All address fields are required");
    }
  }

  // Specialization validation
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
  if (
    !data.specialization ||
    !validSpecializations.includes(data.specialization)
  ) {
    errors.push("Valid specialization is required");
  }

  // License validation
  if (!data.licenseNumber || typeof data.licenseNumber !== "string") {
    errors.push("License number is required");
  }

  if (!data.licenseExpiryDate) {
    errors.push("License expiry date is required");
  } else {
    const expiryDate = new Date(data.licenseExpiryDate);
    const today = new Date();
    if (expiryDate <= today) {
      errors.push("License expiry date must be in the future");
    }
  }

  // Experience validation
  if (
    !data.yearsOfExperience ||
    typeof data.yearsOfExperience !== "number" ||
    data.yearsOfExperience < 0 ||
    data.yearsOfExperience > 50
  ) {
    errors.push("Years of experience must be a number between 0 and 50");
  }

  // Education validation
  if (
    !data.education ||
    !Array.isArray(data.education) ||
    data.education.length === 0
  ) {
    errors.push("At least one education record is required");
  } else {
    data.education.forEach((edu: any, index: number) => {
      if (!edu.degree || !edu.institution || !edu.graduationYear) {
        errors.push(
          `Education record ${
            index + 1
          }: degree, institution, and graduation year are required`
        );
      } else if (
        typeof edu.graduationYear !== "number" ||
        edu.graduationYear < 1950 ||
        edu.graduationYear > new Date().getFullYear()
      ) {
        errors.push(
          `Education record ${
            index + 1
          }: graduation year must be between 1950 and current year`
        );
      }
    });
  }

  // Consultation fee validation
  if (
    !data.consultationFee ||
    typeof data.consultationFee !== "number" ||
    data.consultationFee < 0
  ) {
    errors.push("Consultation fee must be a positive number");
  }

  // Available slots validation
  if (data.availableSlots && Array.isArray(data.availableSlots)) {
    data.availableSlots.forEach((slot: any, index: number) => {
      if (
        typeof slot.dayOfWeek !== "number" ||
        slot.dayOfWeek < 0 ||
        slot.dayOfWeek > 6
      ) {
        errors.push(`Slot ${index + 1}: day of week must be between 0-6`);
      }
      if (!slot.startTime || !slot.endTime) {
        errors.push(`Slot ${index + 1}: start time and end time are required`);
      } else {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
          errors.push(`Slot ${index + 1}: times must be in HH:MM format`);
        } else {
          const startTime = new Date(`2000-01-01T${slot.startTime}:00`);
          const endTime = new Date(`2000-01-01T${slot.endTime}:00`);
          if (startTime >= endTime) {
            errors.push(
              `Slot ${index + 1}: start time must be before end time`
            );
          }
        }
      }
    });
  }

  return errors;
};

// Basic validation for updating a doctor
export const validateUpdateDoctor = (data: any) => {
  const errors: string[] = [];

  // Date of birth validation
  if (data.dateOfBirth) {
    const birthDate = new Date(data.dateOfBirth);
    const today = new Date();
    if (birthDate >= today) {
      errors.push("Date of birth cannot be in the future");
    }
  }

  // Gender validation
  if (data.gender && !["male", "female", "other"].includes(data.gender)) {
    errors.push("Gender must be male, female, or other");
  }

  // Specialization validation
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
  if (
    data.specialization &&
    !validSpecializations.includes(data.specialization)
  ) {
    errors.push("Invalid specialization");
  }

  // License expiry date validation
  if (data.licenseExpiryDate) {
    const expiryDate = new Date(data.licenseExpiryDate);
    const today = new Date();
    if (expiryDate <= today) {
      errors.push("License expiry date must be in the future");
    }
  }

  // Experience validation
  if (
    data.yearsOfExperience !== undefined &&
    (typeof data.yearsOfExperience !== "number" ||
      data.yearsOfExperience < 0 ||
      data.yearsOfExperience > 50)
  ) {
    errors.push("Years of experience must be a number between 0 and 50");
  }

  // Education validation
  if (data.education && Array.isArray(data.education)) {
    data.education.forEach((edu: any, index: number) => {
      if (edu.graduationYear !== undefined) {
        if (
          typeof edu.graduationYear !== "number" ||
          edu.graduationYear < 1950 ||
          edu.graduationYear > new Date().getFullYear()
        ) {
          errors.push(
            `Education record ${
              index + 1
            }: graduation year must be between 1950 and current year`
          );
        }
      }
    });
  }

  // Consultation fee validation
  if (
    data.consultationFee !== undefined &&
    (typeof data.consultationFee !== "number" || data.consultationFee < 0)
  ) {
    errors.push("Consultation fee must be a positive number");
  }

  // Available slots validation
  if (data.availableSlots && Array.isArray(data.availableSlots)) {
    data.availableSlots.forEach((slot: any, index: number) => {
      if (
        slot.dayOfWeek !== undefined &&
        (typeof slot.dayOfWeek !== "number" ||
          slot.dayOfWeek < 0 ||
          slot.dayOfWeek > 6)
      ) {
        errors.push(`Slot ${index + 1}: day of week must be between 0-6`);
      }
      if (slot.startTime && slot.endTime) {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
          errors.push(`Slot ${index + 1}: times must be in HH:MM format`);
        } else {
          const startTime = new Date(`2000-01-01T${slot.startTime}:00`);
          const endTime = new Date(`2000-01-01T${slot.endTime}:00`);
          if (startTime >= endTime) {
            errors.push(
              `Slot ${index + 1}: start time must be before end time`
            );
          }
        }
      }
    });
  }

  return errors;
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

// Placeholder validation objects for compatibility
export const createDoctorValidation = { validate: validateCreateDoctor };
export const updateDoctorValidation = { validate: validateUpdateDoctor };
export const doctorIdValidation = { validate: validateDoctorId };
export const listDoctorsValidation = { validate: () => [] };
