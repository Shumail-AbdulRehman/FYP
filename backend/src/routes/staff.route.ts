import { Router } from "express";
import { staffLogin } from "../controllers/staff.controller.js";

const router=Router();

router.post("/staff-login",staffLogin);




export default router;