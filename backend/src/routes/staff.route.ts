import { Router } from "express";
import { loginStaff, logoutStaff, createStaff, getStaff, softDeleteStaff } from "../controllers/staff.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";

const router = Router();

router.post("/staff-login", loginStaff);
router.post("/staff-logout", verifyJwt, logoutStaff);

router.post("/create-staff", verifyJwt, authorize, createStaff);
router.get("/", verifyJwt, authorize, getStaff);
router.patch("/:id/deactivate", verifyJwt, authorize, softDeleteStaff);

export default router;