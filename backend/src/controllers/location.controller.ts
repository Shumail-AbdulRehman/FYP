import { Request, Response } from "express";
import { createLocationSchema } from "../validations/location.validation.js";
import { prisma } from "../prisma/prisma.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

export const createLocation = async (req: Request, res: Response) => {
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
      companyId: req.user!.companyId
    }
  });

  res.status(201).json(new ApiResponse(201, location, "Location created successfully"));
};

export const editLocation = async (req: Request, res: Response) => {
  const locationId = Number(req.params.id);
  if (isNaN(locationId)) throw new ApiError(400, "Invalid location id");

  const result = createLocationSchema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map(e => ({
      field: e.path.join("."),
      message: e.message
    }));
    throw new ApiError(400, "Validation failed", errors);
  }

  const location = await prisma.location.findUnique({ where: { id: locationId ,isActive:true} });

  if (!location || location.companyId !== req.user!.companyId) {
    throw new ApiError(404, "Location not found in your company");
  }

  const updatedLocation = await prisma.location.update({
    where: { id: locationId },
    data: result.data
  });

  res.status(200).json(new ApiResponse(200, updatedLocation, "Location updated successfully"));
};

export const getLocations = async (req: Request, res: Response) => {
  const locations = await prisma.location.findMany({
    where: { companyId: req.user!.companyId, isActive: true }
  });

  res.status(200).json(new ApiResponse(200, locations, "Locations fetched successfully"));
};

export const softDeleteLocation = async (req: Request, res: Response) => {
  const locationId = Number(req.params.id);
  if (isNaN(locationId)) throw new ApiError(400, "Invalid location id");

  const location = await prisma.location.findUnique({ where: { id: locationId } });

  if (!location || location.companyId !== req.user!.companyId) {
    throw new ApiError(404, "Location not found in your company");
  }

  if (!location.isActive) {
    throw new ApiError(400, "Location is already deactivated");
  }

  await prisma.$transaction([
    prisma.location.update({
      where: { id: locationId },
      data: { isActive: false }
    }),
    prisma.taskTemplate.updateMany({
      where: { locationId, isActive: true },
      data: { isActive: false }
    }),
    prisma.taskInstance.updateMany({
      where: {
        locationId,
        status: { in: ["PENDING", "IN_PROGRESS", "LATE"] }
      },
      data: { status: "CANCELLED", isActive: false }
    }),
    prisma.staff.updateMany({
      where: { locationId },
      data: { locationId: null }
    })
  ]);

  res.status(200).json(new ApiResponse(200, {}, "Location deactivated successfully"));
};

export const getLocation = async (req: Request, res: Response) => {
  const locationId = Number(req.params.id);
  if (isNaN(locationId)) throw new ApiError(400, "Invalid location id");
  const location = await prisma.location.findUnique({
    where: { id: locationId },
  });
  
  if (!location || location.companyId !== req.user!.companyId) {
    throw new ApiError(404, "Location not found in your company");
  }
  res.status(200).json(new ApiResponse(200, location, "Location fetched successfully"));
};