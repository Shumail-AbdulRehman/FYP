import { Request, Response } from "express";
import { createTaskSchema } from "../validations/manager.validation.js";
import { prisma } from "../prisma/prisma.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

export const createTaskTemplate = async (req: Request, res: Response) => {
  const result = createTaskSchema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map(e => ({
      field: e.path.join("."),
      message: e.message
    }));
    throw new ApiError(400, "Validation failed", errors);
  }

  const { locationId } = result.data;

  const location = await prisma.location.findUnique({ where: { id: locationId } });

  if (!location || location.companyId !== req.user!.companyId || !location.isActive) {
    throw new ApiError(404, "Location not found in your company");
  }

  const taskTemplate = await prisma.taskTemplate.create({
    data: result.data
  });

  res.status(201).json(new ApiResponse(201, taskTemplate, "Task template created successfully"));
};

export const editTaskTemplate = async (req: Request, res: Response) => {
  const taskTemplateId = Number(req.params.id);
  if (isNaN(taskTemplateId)) throw new ApiError(400, "Invalid task template id");

  const result = createTaskSchema.partial().safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map(e => ({
      field: e.path.join("."),
      message: e.message
    }));
    throw new ApiError(400, "Validation failed", errors);
  }

  const template = await prisma.taskTemplate.findUnique({
    where: { id: taskTemplateId },
    include: { location: true }
  });

  if (!template || template.location.companyId !== req.user!.companyId) {
    throw new ApiError(404, "Task template not found in your company");
  }

  if (!template.isActive) {
    throw new ApiError(400, "Task template is inactive");
  }

  if (result.data.locationId) {
    const location = await prisma.location.findUnique({
      where: { id: result.data.locationId }
    });

    if (!location || location.companyId !== req.user!.companyId || !location.isActive) {
      throw new ApiError(404, "New location not found in your company");
    }
  }

  const updated = await prisma.taskTemplate.update({
    where: { id: taskTemplateId },
    data: result.data
  });

  res.status(200).json(new ApiResponse(200, updated, "Task template updated successfully"));
};

export const deleteTaskTemplate = async (req: Request, res: Response) => {
  const taskTemplateId = Number(req.params.id);
  if (isNaN(taskTemplateId)) throw new ApiError(400, "Invalid task template id");

  const template = await prisma.taskTemplate.findUnique({
    where: { id: taskTemplateId },
    include: { location: true }
  });

  if (!template || template.location.companyId !== req.user!.companyId) {
    throw new ApiError(404, "Task template not found in your company");
  }

  await prisma.$transaction([
    prisma.taskTemplate.update({ where: { id: taskTemplateId }, data: { isActive: false } }),
    prisma.taskInstance.updateMany({
        where: { templateId: taskTemplateId, status: { in: ["PENDING", "IN_PROGRESS"] } },
        data: { status: "MISSED", isActive: false }
    })
]);

  res.status(200).json(new ApiResponse(200, {}, "Task template deleted successfully"));
};