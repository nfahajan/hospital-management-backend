import expressPromiseRouter from "express-promise-router";
import { ScheduleController } from "./schedule.controller";
import auth from "../../middlewares/authentication";
import hasRole from "../../middlewares/has-role";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../shared/sendResponse";
import {
  validateCreateSchedule,
  validateUpdateSchedule,
  validateScheduleId,
  validateDoctorId,
  validateDate,
} from "./schedule.validation";

const router = expressPromiseRouter();

// Simple validation middleware
const validateCreateScheduleMiddleware = (req: any, res: any, next: any) => {
  const errors = validateCreateSchedule(req.body);
  if (errors.length > 0) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Validation failed",
      data: { errors },
    });
  }
  next();
};

const validateUpdateScheduleMiddleware = (req: any, res: any, next: any) => {
  const errors = validateUpdateSchedule(req.body);
  if (errors.length > 0) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Validation failed",
      data: { errors },
    });
  }
  next();
};

const validateScheduleIdMiddleware = (req: any, res: any, next: any) => {
  const error = validateScheduleId(req.params.id);
  if (error) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error,
      data: null,
    });
  }
  next();
};

const validateDoctorIdMiddleware = (req: any, res: any, next: any) => {
  const error = validateDoctorId(req.params.doctorId);
  if (error) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error,
      data: null,
    });
  }
  next();
};

const validateDateMiddleware = (req: any, res: any, next: any) => {
  const error = validateDate(req.params.date);
  if (error) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error,
      data: null,
    });
  }
  next();
};

// Public route - Get available slots for a doctor on a specific date
router.get(
  "/doctor/:doctorId/available-slots/:date",
  validateDoctorIdMiddleware,
  validateDateMiddleware,
  ScheduleController.getAvailableSlots
);

// Protected routes - Authentication required
router.use(auth);

// Get current doctor's schedules
router.get("/my-schedules", ScheduleController.getMySchedules);

// Get current doctor's available slots
router.get(
  "/my-available-slots/:date",
  validateDateMiddleware,
  ScheduleController.getMyAvailableSlots
);

// Create a new schedule
router.post(
  "/",
  validateCreateScheduleMiddleware,
  ScheduleController.createSchedule
);

// Update specific day schedule
router.put(
  "/:id/day/:dayOfWeek",
  validateScheduleIdMiddleware,
  validateUpdateScheduleMiddleware,
  ScheduleController.updateDaySchedule
);

// Update schedule
router.put(
  "/:id",
  validateScheduleIdMiddleware,
  validateUpdateScheduleMiddleware,
  ScheduleController.updateSchedule
);

// Get schedule by ID
router.get(
  "/:id",
  validateScheduleIdMiddleware,
  ScheduleController.getScheduleById
);

// Delete schedule
router.delete(
  "/:id",
  validateScheduleIdMiddleware,
  ScheduleController.deleteSchedule
);

// Admin only routes
router.use(hasRole("admin", "superadmin"));

// Get all schedules
router.get("/", ScheduleController.getAllSchedules);

export const ScheduleRoute = router;
