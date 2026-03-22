import {getTodaysTasksForStaff, startTask, completeTask, getTaskInstanceById, getTasknstancesOfLocation} from "../controllers/taskInstance.controller.js";
import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";

const router = Router();

router.get("/staff/:staffId/today", verifyJwt, authorize, getTodaysTasksForStaff);
router.post("/:taskId/start", verifyJwt, authorize, startTask);
router.post("/:taskId/complete", verifyJwt, authorize, completeTask);
router.get("/:taskId", verifyJwt, authorize, getTaskInstanceById);
router.get("/location/:locationId", verifyJwt, authorize, getTasknstancesOfLocation);


export default router;