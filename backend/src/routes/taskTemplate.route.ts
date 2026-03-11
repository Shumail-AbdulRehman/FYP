import { Router } from "express";
import { createTaskTemplate, editTaskTemplate, deleteTaskTemplate } from "../controllers/taskTemplate.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";

const router = Router();

router.post("/", verifyJwt, authorize, createTaskTemplate);
router.patch("/:id", verifyJwt, authorize, editTaskTemplate);
router.delete("/:id", verifyJwt, authorize, deleteTaskTemplate);

export default router;
