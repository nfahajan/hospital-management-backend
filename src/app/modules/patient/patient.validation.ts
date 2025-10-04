// Simple validation functions (Zod validation will be added later)

// Basic validation for creating a patient
export const validateCreatePatient = (data: any) => {
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

  // Emergency contact validation
  if (!data.emergencyContact || typeof data.emergencyContact !== "object") {
    errors.push("Emergency contact is required");
  } else {
    const { name, relationship, phoneNumber } = data.emergencyContact;
    if (!name || !relationship || !phoneNumber) {
      errors.push("All emergency contact fields are required");
    }
  }

  return errors;
};

// Basic validation for updating a patient
export const validateUpdatePatient = (data: any) => {
  const errors: string[] = [];

  if (data.dateOfBirth) {
    const birthDate = new Date(data.dateOfBirth);
    const today = new Date();
    if (birthDate >= today) {
      errors.push("Date of birth cannot be in the future");
    }
  }

  if (data.gender && !["male", "female", "other"].includes(data.gender)) {
    errors.push("Gender must be male, female, or other");
  }

  if (
    data.bloodGroup &&
    !["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].includes(
      data.bloodGroup
    )
  ) {
    errors.push("Invalid blood group");
  }

  return errors;
};

// Validation for patient ID
export const validatePatientId = (id: string) => {
  if (!id || typeof id !== "string") {
    return "Patient ID is required";
  }
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    return "Invalid patient ID format";
  }
  return null;
};

// Placeholder validation objects for compatibility
export const createPatientValidation = { validate: validateCreatePatient };
export const updatePatientValidation = { validate: validateUpdatePatient };
export const patientIdValidation = { validate: validatePatientId };
export const listPatientsValidation = { validate: () => [] };
