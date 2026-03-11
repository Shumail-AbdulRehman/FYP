import { Router } from "express";
import { signupManager, loginManager, logoutManager } from "../controllers/manager.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/signup", signupManager);
router.post("/manager-login", loginManager);
router.post("/manager-logout", verifyJwt, logoutManager);

export default router;
