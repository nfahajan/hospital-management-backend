import { Document, Model } from "mongoose";

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface ITimeSlot {
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  isAvailable: boolean;
  maxAppointments?: number; // Optional limit for appointments in this slot
  currentAppointments?: number; // Current number of appointments booked
}

export interface IDaySchedule {
  dayOfWeek: DayOfWeek;
  isWorkingDay: boolean;
  timeSlots: ITimeSlot[];
}

export interface ISchedule extends Document {
  _id: any;
  doctor: any; // Reference to Doctor model
  weekStartDate: Date;
  weekEndDate: Date;
  monday: IDaySchedule;
  tuesday: IDaySchedule;
  wednesday: IDaySchedule;
  thursday: IDaySchedule;
  friday: IDaySchedule;
  saturday: IDaySchedule;
  sunday: IDaySchedule;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ScheduleModel = Model<ISchedule> & {
  findByDoctorAndDate(doctorId: string, date: Date): Promise<ISchedule | null>;
  getAvailableSlots(doctorId: string, date: string): Promise<any[]>;
};

export interface ICreateSchedule {
  doctorId: string;
  weekStartDate: string;
  weekEndDate: string;
  monday: IDaySchedule;
  tuesday: IDaySchedule;
  wednesday: IDaySchedule;
  thursday: IDaySchedule;
  friday: IDaySchedule;
  saturday: IDaySchedule;
  sunday: IDaySchedule;
  isActive?: boolean;
  notes?: string;
}

export interface IUpdateSchedule {
  weekStartDate?: string;
  weekEndDate?: string;
  monday?: Partial<IDaySchedule>;
  tuesday?: Partial<IDaySchedule>;
  wednesday?: Partial<IDaySchedule>;
  thursday?: Partial<IDaySchedule>;
  friday?: Partial<IDaySchedule>;
  saturday?: Partial<IDaySchedule>;
  sunday?: Partial<IDaySchedule>;
  isActive?: boolean;
  notes?: string;
}

export interface IUpdateDaySchedule {
  dayOfWeek: DayOfWeek;
  isWorkingDay?: boolean;
  timeSlots?: ITimeSlot[];
}

export interface IGetAvailableSlots {
  doctorId: string;
  date: string; // YYYY-MM-DD format
}

export interface IAvailableSlot {
  date: string;
  dayOfWeek: DayOfWeek;
  timeSlot: ITimeSlot;
  availableSpots: number;
}
