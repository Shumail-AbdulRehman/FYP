import { Router } from "express";
import { loginStaff, logoutStaff, createStaff, getStaff, softDeleteStaff , getInactiveStaff, getStaffById, getStaffByLocation, getProfile, refreshStaffToken   } from "../controllers/staff.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";

const router = Router();

router.post("/staff-login", loginStaff);
router.post("/staff-logout", verifyJwt, logoutStaff);

router.post("/create-staff", verifyJwt, authorize, createStaff);
router.get("/", verifyJwt, authorize, getStaff);
router.patch("/:id/deactivate", verifyJwt, authorize, softDeleteStaff);
router.get("/inactive", verifyJwt, authorize, getInactiveStaff);
router.get("/:id", verifyJwt, authorize, getStaffById);
router.get("/location/:locationId", verifyJwt, authorize, getStaffByLocation);
router.get("/profile/me", verifyJwt, getProfile);
router.post("/refresh-token", refreshStaffToken);



export default router;