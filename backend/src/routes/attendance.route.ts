import { Router } from "express";
import { checkIn, checkOut, getMyAttendance, getStaffAttendance, assignShiftToStaff } from "../controllers/attendance.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";

const router = Router();

router.patch("/staff/:id/shift", verifyJwt, authorize, assignShiftToStaff);
router.post("/check-in", verifyJwt, checkIn);
router.post("/check-out", verifyJwt, checkOut);
router.get("/my", verifyJwt, getMyAttendance);
router.get("/", verifyJwt, authorize, getStaffAttendance);

export default router;
