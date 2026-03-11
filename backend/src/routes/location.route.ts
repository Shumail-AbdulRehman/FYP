import { Router } from "express";
import { createLocation, editLocation, getLocations, softDeleteLocation } from "../controllers/location.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";

const router = Router();

router.post("/", verifyJwt, authorize, createLocation);
router.get("/", verifyJwt, authorize, getLocations);
router.patch("/:id", verifyJwt, authorize, editLocation);
router.patch("/:id/deactivate", verifyJwt, authorize, softDeleteLocation);

export default router;
