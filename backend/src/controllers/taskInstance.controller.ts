import { Request, Response } from "express";
import { prisma } from "../prisma/prisma.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";


export const getTodaysTasksForStaff = async (req: Request, res: Response) => {
  const staffId = Number(req.params.staffId);

  if (isNaN(staffId)) {
    throw new ApiError(400, "Invalid staff id");
  }

  const staff = await prisma.staff.findUnique({ where: { id: staffId, isActive:true } });

  if (!staff || staff.companyId !== req.user!.companyId) {
    throw new ApiError(404, "Staff not found in your company");
  }

 const today = new Date();
today.setUTCHours(0, 0, 0, 0);

const tomorrow = new Date(today);
tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

const tasks = await prisma.taskInstance.findMany({
  where: {
    staffId,
    date: {
      gte: today,    
      lt: tomorrow   
    },
    isActive: true
  },
  include: {
    template: {
      include: {
        location: true
      }
    }
  }
});

  res.status(200).json(new ApiResponse(200, tasks, "Today's tasks fetched successfully"));
};

