import { Document, Model } from "mongoose";

export type Gender = "male" | "female" | "other";
export type Specialization =
  | "cardiology"
  | "dermatology"
  | "endocrinology"
  | "gastroenterology"
  | "general_medicine"
  | "neurology"
  | "oncology"
  | "orthopedics"
  | "pediatrics"
  | "psychiatry"
  | "radiology"
  | "surgery"
  | "urology"
  | "other";

export interface IDoctor extends Document {
  _id: any;
  user: any; // Reference to User model
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: Gender;
  phoneNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  specialization: Specialization;
  licenseNumber: string;
  licenseExpiryDate: Date;
  yearsOfExperience: number;
  education: {
    degree: string;
    institution: string;
    graduationYear: number;
  }[];
  bio?: string;
  consultationFee: number;
  availableSlots: {
    dayOfWeek: number; // 0-6 (Sunday-Saturday)
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
  }[];
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type DoctorModel = Model<IDoctor>;

export interface ICreateDoctor {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  phoneNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  specialization: Specialization;
  licenseNumber: string;
  licenseExpiryDate: string;
  yearsOfExperience: number;
  education: {
    degree: string;
    institution: string;
    graduationYear: number;
  }[];
  bio?: string;
  consultationFee: number;
  availableSlots: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  isAvailable?: boolean;
}

export interface IUpdateDoctor {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: Gender;
  phoneNumber?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  specialization?: Specialization;
  licenseNumber?: string;
  licenseExpiryDate?: string;
  yearsOfExperience?: number;
  education?: {
    degree: string;
    institution: string;
    graduationYear: number;
  }[];
  bio?: string;
  consultationFee?: number;
  availableSlots?: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  isAvailable?: boolean;
}
