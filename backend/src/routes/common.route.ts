import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { getCurrentUser,refreshToken } from "../controllers/common.controller.js";





const router = Router();



router.post("/refresh-token",refreshToken);
router.get("/get-current-user",verifyJwt,getCurrentUser);

export default router;
