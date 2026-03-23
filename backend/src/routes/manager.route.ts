import { Router } from "express";
import { signupManager, loginManager, logoutManager, getManagerProfile, refreshManagerToken } from "../controllers/manager.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/manager-signup", signupManager);
router.post("/manager-login", loginManager);
router.post("/manager-logout", verifyJwt, logoutManager);
router.get("/profile/me", verifyJwt, getManagerProfile);
router.post("/refresh-token", verifyJwt, refreshManagerToken);

export default router;
