import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { 
  managerSignupSchema, 
  managerLoginSchema, 
  createStaffSchema, 
  createLocationSchema, 
  createTaskSchema 
} from "../validations/manager.validation.js";
import { prisma } from "../prisma/prisma.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { generateAccessToken, generateRefreshToken, isPasswordCorrect } from "../utils/auth.js";

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    companyId: number;
    role: "MANAGER" | "STAFF";
  };
}


export const createLocation = async (req: AuthenticatedRequest, res: Response) => {
  const result = createLocationSchema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map(e => ({
      field: e.path.join("."),
      message: e.message
    }));
    throw new ApiError(400, "Validation failed", errors);
  }

  const location = await prisma.location.create({
    data: {
      ...result.data,
      companyId: req.user.companyId
    }
  });

  res.status(201).json(new ApiResponse(201, location, "Location created successfully"));
};

export const editLocation = async (req: AuthenticatedRequest, res: Response) => {
  const locationId = Number(req.params.id);
  if (isNaN(locationId)) throw new ApiError(400, "Invalid location id");

  const result = createLocationSchema.partial().safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map(e => ({
      field: e.path.join("."),
      message: e.message
    }));
    throw new ApiError(400, "Validation failed", errors);
  }

  const location = await prisma.location.findUnique({ where: { id: locationId } });

  if (!location || location.companyId !== req.user.companyId) {
    throw new ApiError(404, "Location not found in your company");
  }

  const updatedLocation = await prisma.location.update({
    where: { id: locationId },
    data: result.data
  });

  res.status(200).json(new ApiResponse(200, updatedLocation, "Location updated successfully"));
};