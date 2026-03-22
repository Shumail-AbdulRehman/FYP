import { Router } from "express";
import { signupManager, loginManager, logoutManager, getManagerProfile, refreshManagerToken } from "../controllers/manager.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/signup", signupManager);
router.post("/login", loginManager);
router.post("/logout", verifyJwt, logoutManager);
router.get("/me", verifyJwt, getManagerProfile);
router.post("/refresh-token", verifyJwt, refreshManagerToken);

export default router;
