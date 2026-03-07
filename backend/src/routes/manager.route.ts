import { Router } from "express";
import { signupManager, loginManager, createStaff, createLocation, logoutManager, softDeleteStaff, softDeleteLocation, getStaff, getLocations } from "../controllers/manager.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";

const router = Router();

router.post("/signup", signupManager);
router.post("/manager-login", loginManager);
router.post("/manager-logout", verifyJwt, logoutManager);

router.post("/create-staff", verifyJwt, authorize, createStaff);
router.get("/staff", verifyJwt, authorize, getStaff);
router.patch("/staff/:id/deactivate", verifyJwt, authorize, softDeleteStaff);

router.post("/create-location", verifyJwt, authorize, createLocation);
router.get("/locations", verifyJwt, authorize, getLocations);
router.patch("/locations/:id/deactivate", verifyJwt, authorize, softDeleteLocation);

export default router;
