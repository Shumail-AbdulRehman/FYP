import { Request, Response } from "express";
import { prisma } from "../prisma/prisma.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

export const assignStaffToLocation = async (req: Request, res: Response) => {
  const staffId = Number(req.params.staffId);
  const locationId = Number(req.params.locationId);

  if (isNaN(staffId) || isNaN(locationId)) {
    throw new ApiError(400, "Invalid staff or location id");
  }

  const staff = await prisma.staff.findUnique({ where: { id: staffId } });

  if (!staff || staff.companyId !== req.user!.companyId) {
    throw new ApiError(404, "Staff not found in your company");
  }

  const location = await prisma.location.findUnique({ where: { id: locationId } });

  if (!location || location.companyId !== req.user!.companyId || !location.isActive) {
    throw new ApiError(404, "Location not found in your company");
  }

  const updated = await prisma.staff.update({
    where: { id: staffId },
    data: { locationId }
  });

  res.status(200).json(new ApiResponse(200, updated, "Staff assigned to location successfully"));
};

export const assignStaffToTaskTemplate = async (req: Request, res: Response) => {
  const templateId = Number(req.params.templateId);
  const staffId = Number(req.params.staffId);

  if (isNaN(templateId) || isNaN(staffId)) {
    throw new ApiError(400, "Invalid template or staff id");
  }

  const template = await prisma.taskTemplate.findUnique({
    where: { id: templateId },
    include: { location: true }
  });

  if (!template || template.location.companyId !== req.user!.companyId) {
    throw new ApiError(404, "Task template not found in your company");
  }

  if (!template.isActive) {
    throw new ApiError(400, "Task template is inactive");
  }

  const staff = await prisma.staff.findUnique({ where: { id: staffId } });

  if (!staff || staff.companyId !== req.user!.companyId) {
    throw new ApiError(404, "Staff not found in your company");
  }

  if (staff.locationId !== template.locationId) {
    throw new ApiError(400, "Staff must belong to the same location");
  }

  if (staff.shiftStart && staff.shiftEnd) {
    const staffStartMin = staff.shiftStart.getHours() * 60 + staff.shiftStart.getMinutes();
    const staffEndMin = staff.shiftEnd.getHours() * 60 + staff.shiftEnd.getMinutes();
    const taskStartMin = template.shiftStart.getHours() * 60 + template.shiftStart.getMinutes();
    const taskEndMin = template.shiftEnd.getHours() * 60 + template.shiftEnd.getMinutes();

    // Fix #7: overnight-aware shift containment check.
    // An "overnight" window is one where endMin < startMin (e.g. 22:00–06:00).
    const isOvernightShift = staffEndMin < staffStartMin;
    let taskFitsInShift: boolean;

    if (isOvernightShift) {
      const isOvernightTask = taskEndMin < taskStartMin;
      if (isOvernightTask) {
        // Both shift and task span midnight: task start must be >= shift start, task end must be <= shift end.
        taskFitsInShift = taskStartMin >= staffStartMin && taskEndMin <= staffEndMin;
      } else {
        // Normal task within an overnight shift: the task must sit entirely in the
        // "evening" portion [staffStartMin, 24h) OR entirely in the "morning" portion [0, staffEndMin].
        taskFitsInShift = taskStartMin >= staffStartMin || taskEndMin <= staffEndMin;
      }
    } else {
      // Normal daytime shift: straightforward containment.
      taskFitsInShift = taskStartMin >= staffStartMin && taskEndMin <= staffEndMin;
    }

    if (!taskFitsInShift) {
      throw new ApiError(
        400,
        `Task shift (${template.shiftStart.toISOString()} - ${template.shiftEnd.toISOString()}) falls outside staff's attendance shift. Please update the staff's shift or choose a different time.`
      );
    }
  }

  const updated = await prisma.taskTemplate.update({
    where: { id: templateId },
    data: { staffId }
  });

  res.status(200).json(new ApiResponse(200, updated, "Staff assigned to task template successfully"));
};

