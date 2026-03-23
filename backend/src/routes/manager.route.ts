import { Router } from "express";
import { signupManager, loginManager, getManagerProfile } from "../controllers/manager.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/manager-signup", signupManager);
router.post("/manager-login", loginManager);
router.get("/profile/me", verifyJwt, getManagerProfile);

export default router;
