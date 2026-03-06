import { Router } from "express";
import { signupManager, loginManager, createStaff, createLocation } from "../controllers/manager.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";

const router = Router();

router.post("/signup", signupManager);
router.post("/manager-login", loginManager);
router.post("/staff", verifyJwt, authorize, createStaff);
router.post("/create-location",verifyJwt,authorize,createLocation);

export default router;
