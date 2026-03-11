import { Request, Response } from "express";
import { prisma } from "../prisma/prisma.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";


interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    companyId: number;
    role: "MANAGER" | "STAFF";
  };
}



export const assignStaffToLocation = async (req: AuthenticatedRequest, res: Response) => {
  const staffId = Number(req.params.staffId);
  const locationId = Number(req.params.locationId);

  if (isNaN(staffId) || isNaN(locationId)) {
    throw new ApiError(400, "Invalid staff or location id");
  }

  const staff = await prisma.staff.findUnique({ where: { id: staffId } });

  if (!staff || staff.companyId !== req.user.companyId) {
    throw new ApiError(404, "Staff not found in your company");
  }

  const location = await prisma.location.findUnique({ where: { id: locationId } });

  if (!location || location.companyId !== req.user.companyId || !location.isActive) {
    throw new ApiError(404, "Location not found in your company");
  }

  const updated = await prisma.staff.update({
    where: { id: staffId },
    data: { locationId }
  });

  res.status(200).json(new ApiResponse(200, updated, "Staff assigned to location successfully"));
};

export const assignStaffToTaskTemplate = async (req: AuthenticatedRequest, res: Response) => {
  const templateId = Number(req.params.templateId);
  const staffId = Number(req.params.staffId);

  if (isNaN(templateId) || isNaN(staffId)) {
    throw new ApiError(400, "Invalid template or staff id");
  }

  const template = await prisma.taskTemplate.findUnique({
    where: { id: templateId },
    include: { location: true }
  });

  if (!template || template.location.companyId !== req.user.companyId) {
    throw new ApiError(404, "Task template not found in your company");
  }

  if (!template.isActive) {
  throw new ApiError(400, "Task template is inactive");
}

  const staff = await prisma.staff.findUnique({ where: { id: staffId } });

  if (!staff || staff.companyId !== req.user.companyId) {
    throw new ApiError(404, "Staff not found in your company");
  }

  if (staff.locationId !== template.locationId) {
    throw new ApiError(400, "Staff must belong to the same location");
  }

  const updated = await prisma.taskTemplate.update({
    where: { id: templateId },
    data: { staffId }
  });

  res.status(200).json(new ApiResponse(200, updated, "Staff assigned to task template successfully"));
};