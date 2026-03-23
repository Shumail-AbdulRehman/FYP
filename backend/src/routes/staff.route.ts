import { Router } from "express";
import { loginStaff, createStaff, getStaff, softDeleteStaff , getInactiveStaff, getStaffById, getStaffByLocation, getProfile   } from "../controllers/staff.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";

const router = Router();

router.post("/staff-login", loginStaff);

router.post("/create-staff", verifyJwt, authorize, createStaff);
router.get("/", verifyJwt, authorize, getStaff);
router.patch("/:id/deactivate", verifyJwt, authorize, softDeleteStaff);
router.get("/inactive", verifyJwt, authorize, getInactiveStaff);
router.get("/:id", verifyJwt, authorize, getStaffById);
router.get("/location/:locationId", verifyJwt, authorize, getStaffByLocation);
router.get("/profile/me", verifyJwt, getProfile);




export default router;