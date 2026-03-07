import { Router } from "express";
import { loginStaff, logoutStaff } from "../controllers/staff.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/staff-login", loginStaff);
router.post("/staff-logout", verifyJwt, logoutStaff);



export default router;