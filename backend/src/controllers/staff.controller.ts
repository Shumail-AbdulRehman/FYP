import { Request, Response } from "express";
import { createStaffSchema, editStaffSchema, staffLoginSchema } from "../validations/staff.validation.js";
import { prisma } from "../prisma/prisma.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { generateAccessToken, generateRefreshToken, isPasswordCorrect } from "../utils/auth.js";


export const loginStaff = async (req: Request, res: Response) => {
  const result = staffLoginSchema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map((e: any) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    throw new ApiError(400, "Validation failed", errors);
  }
  const { email, password } = result.data;

  const staff = await prisma.staff.findUnique({
    where: { email },
  });

  if (!staff) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!staff.isActive) {
    throw new ApiError(403, "Your account has been deactivated");
  }

  const isValid = await isPasswordCorrect(password, staff.password);
  if (!isValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const accessToken = generateAccessToken(staff, staff.role);
  const refreshToken = generateRefreshToken(staff, staff.role);

  await prisma.staff.update({
    where: { id: staff.id },
    data: { refreshToken },
  });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  res.status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(200, {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        companyId: staff.companyId,
      }, "Login successful")
    );
};

export const createStaff = async (req: Request, res: Response) => {
  const result = createStaffSchema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map(e => ({
      field: e.path.join("."),
      message: e.message
    }));
    throw new ApiError(400, "Validation failed", errors);
  }

  const { name, email, password, locationId, shiftStart, shiftEnd } = result.data;

  const existingStaff = await prisma.staff.findUnique({ where: { email } });
  if (existingStaff) throw new ApiError(409, "Staff with this email already exists");

  if (locationId) {
    const location = await prisma.location.findUnique({ where: { id: locationId } });
    if (!location || location.companyId !== req.user!.companyId || !location.isActive) {
      throw new ApiError(404, "Location not found in your company");
    }
  }



  const staff = await prisma.staff.create({
    data: {
      name,
      email,
      password,
      companyId: req.user!.companyId,
      locationId: locationId || null,
      shiftStart: shiftStart || null,
      shiftEnd: shiftEnd || null,
    }
  });

  const { password: _, ...safeStaff } = staff;

  res.status(201).json(
    new ApiResponse(201, safeStaff, "Staff created successfully")
  );
};

export const getStaff = async (req: Request, res: Response) => {
  const staff = await prisma.staff.findMany({
    where: { companyId: req.user!.companyId, isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      companyId: true,
      locationId: true,
      createdAt: true,
      updatedAt: true,
      shiftStart: true,
      shiftEnd: true
    }
  });

  res.status(200).json(new ApiResponse(200, staff, "Staff fetched successfully"));
};

export const softDeleteStaff = async (req: Request, res: Response) => {
  const staffId = Number(req.params.id);
  if (isNaN(staffId)) throw new ApiError(400, "Invalid staff id");

  const staff = await prisma.staff.findUnique({ where: { id: staffId } });

  if (!staff || staff.companyId !== req.user!.companyId) {
    throw new ApiError(404, "Staff not found in your company");
  }

  if (!staff.isActive) {
    throw new ApiError(400, "Staff is already deactivated");
  }

  await prisma.$transaction([
    prisma.staff.update({
      where: { id: staffId },
      data: { isActive: false, refreshToken: null },
    }),
    prisma.taskTemplate.updateMany({
      where: { staffId, isActive: true },
      data: { staffId: null },
    }),
    prisma.taskInstance.updateMany({
      where: {
        staffId,
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
      data: { status: "CANCELLED" },
    }),
  ]);

  res.status(200).json(new ApiResponse(200, {}, "Staff deactivated successfully"));
};

export const getStaffById = async (req: Request, res: Response) => {
  const staffId = Number(req.params.id);
  if (isNaN(staffId)) throw new ApiError(400, "Invalid staff id");

  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      companyId: true,
      locationId: true,
      createdAt: true,
      updatedAt: true,
      shiftStart: true,
      shiftEnd: true
    }
  });

  if (!staff || staff.companyId !== req.user!.companyId) {
    throw new ApiError(404, "Staff not found in your company");
  }

  res.status(200).json(new ApiResponse(200, staff, "Staff fetched successfully"));
};

export const getStaffByLocation = async (req: Request, res: Response) => {
  const locationId = Number(req.params.locationId);
  if (isNaN(locationId)) throw new ApiError(400, "Invalid location id");

  const location = await prisma.location.findUnique({ where: { id: locationId } });

  if (!location || location.companyId !== req.user!.companyId) {
    throw new ApiError(404, "Location not found in your company");
  }

  const staff = await prisma.staff.findMany({
    where: { companyId: req.user!.companyId, locationId, isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      companyId: true,
      locationId: true,
      createdAt: true,
      updatedAt: true,
      shiftStart: true,
      shiftEnd: true
    }
  });

  res.status(200).json(new ApiResponse(200, staff, "Staff fetched successfully"));
};

export const getInactiveStaff = async (req: Request, res: Response) => {
  const staff = await prisma.staff.findMany({
    where: { companyId: req.user!.companyId, isActive: false },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      companyId: true,
      locationId: true,
      createdAt: true,
      updatedAt: true,
      shiftStart: true,
      shiftEnd: true
    }
  });

  res.status(200).json(new ApiResponse(200, staff, "Inactive staff fetched successfully"));
};

export const getProfile = async (req: Request, res: Response) => {
  const staff = await prisma.staff.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      companyId: true,
      locationId: true,
      createdAt: true,
      updatedAt: true,
      shiftStart: true,
      shiftEnd: true
    }
  });

  if (!staff) {
    throw new ApiError(404, "Staff not found");
  }

  res.status(200).json(new ApiResponse(200, staff, "Profile fetched successfully"));
};

export const editStaff = async (req: Request, res: Response) => {
  const staffId = Number(req.params.id);
  if (isNaN(staffId)) throw new ApiError(400, "Invalid staff id");

  const result = editStaffSchema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map(e => ({
      field: e.path.join("."),
      message: e.message
    }));
    throw new ApiError(400, "Validation failed", errors);
  }

  const staff = await prisma.staff.findUnique({ where: { id: staffId } });

  if (!staff || staff.companyId !== req.user!.companyId) {
    throw new ApiError(404, "Staff not found in your company");
  }

  if (!staff.isActive) {
    throw new ApiError(400, "Cannot edit deactivated staff");
  }

  if (result.data.email && result.data.email !== staff.email) {
    const existing = await prisma.staff.findUnique({ where: { email: result.data.email } });
    if (existing) {
      throw new ApiError(409, "A staff member with this email already exists");
    }
  }

  console.log("staff data::",result.data);

 if (result.data.shiftStart || result.data.shiftEnd) {
  
  const newStart = result.data.shiftStart ?? staff.shiftStart;
  const newEnd = result.data.shiftEnd ?? staff.shiftEnd;

  if (newStart && newEnd) {
   
    const staffTemplates = await prisma.taskTemplate.findMany({
      where: {
        staffId,
        isActive: true,
      },
    });

    const newStartMin = newStart.getUTCHours() * 60 + newStart.getUTCMinutes();
    const newEndMin = newEnd.getUTCHours() * 60 + newEnd.getUTCMinutes();
    const isOvernightShift = newEndMin < newStartMin;

    const conflicts = staffTemplates.filter((t) => {
      const tStartMin = t.shiftStart.getUTCHours() * 60 + t.shiftStart.getUTCMinutes();
      const tEndMin = t.shiftEnd.getUTCHours() * 60 + t.shiftEnd.getUTCMinutes();

      if (isOvernightShift) {
        return !(tStartMin >= newStartMin || tEndMin <= newEndMin);
      }
      return !(tStartMin >= newStartMin && tEndMin <= newEndMin);
    });

    if (conflicts.length > 0) {
      const names = conflicts.map((c) => `"${c.title}"`).join(", ");
      throw new ApiError(
        400,
        `Cannot update shift: ${names} task template(s) fall outside the new shift window. Remove or reassign them first.`
      );
    }
  }
}


  const updated = await prisma.staff.update({
    where: { id: staffId },
    data: result.data,
    select: {
      id: true, name: true, email: true, role: true, isActive: true,
      companyId: true, locationId: true, shiftStart: true, shiftEnd: true,
      createdAt: true, updatedAt: true,
    }
  });

  res.status(200).json(new ApiResponse(200, updated, "Staff updated successfully"));
};

export const getStaffDetails = async (req: Request, res: Response) => {
  const staffId = Number(req.params.id);
  if (isNaN(staffId)) throw new ApiError(400, "Invalid staff id");

  const monthParam = req.query.month as string | undefined;
  const dateFromParam = req.query.dateFrom as string | undefined;
  const dateToParam = req.query.dateTo as string | undefined;

  let dateFilter: { gte?: Date; lte?: Date } | undefined;
  let periodLabel = "All time";

  if (monthParam) {
    const match = /^(\d{4})-(\d{2})$/.exec(monthParam);
    if (!match) {
      throw new ApiError(400, "Invalid month format. Use YYYY-MM");
    }

    const year = Number(match[1]);
    const monthIndex = Number(match[2]) - 1;

    if (monthIndex < 0 || monthIndex > 11) {
      throw new ApiError(400, "Invalid month value");
    }

    const startDate = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999));
    dateFilter = { gte: startDate, lte: endDate };
    periodLabel = startDate.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  } else if (dateFromParam || dateToParam) {
    if (!dateFromParam || !dateToParam) {
      throw new ApiError(400, "Both dateFrom and dateTo are required together");
    }

    const startDate = new Date(dateFromParam);
    const endDate = new Date(dateToParam);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new ApiError(400, "Invalid dateFrom or dateTo format. Use YYYY-MM-DD");
    }

    if (startDate > endDate) {
      throw new ApiError(400, "dateFrom must be before dateTo");
    }

    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(23, 59, 59, 999);
    dateFilter = { gte: startDate, lte: endDate };
    periodLabel = `${dateFromParam} to ${dateToParam}`;
  }

  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      companyId: true,
      locationId: true,
      shiftStart: true,
      shiftEnd: true,
      createdAt: true,
      updatedAt: true,
      location: { select: { id: true, name: true, address: true } },
      taskTemplates: {
        where: { isActive: true },
        include: { location: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
      taskInstances: {
        where: {
          isActive: true,
          ...(dateFilter ? { date: dateFilter } : {}),
        },
        orderBy: { date: "desc" },
        take: 50,
        include: { location: { select: { id: true, name: true } } },
      },
      attendances: {
        where: dateFilter ? { date: dateFilter } : undefined,
        orderBy: { date: "desc" },
        take: 50,
        include: { location: { select: { id: true, name: true } } },
      },
    },
  });

  if (!staff || staff.companyId !== req.user!.companyId) {
    throw new ApiError(404, "Staff not found in your company");
  }

  const taskStats = {
    totalTemplates: staff.taskTemplates.length,
    totalInstances: staff.taskInstances.length,
    completed: staff.taskInstances.filter((i) => i.status === "COMPLETED").length,
    pending: staff.taskInstances.filter((i) => i.status === "PENDING").length,
    inProgress: staff.taskInstances.filter((i) => i.status === "IN_PROGRESS").length,
    missed: staff.taskInstances.filter((i) => i.status === "MISSED").length,
    late: staff.taskInstances.filter((i) => i.isLate).length,
  };

  const attendanceStats = {
    totalRecords: staff.attendances.length,
    present: staff.attendances.filter((a) => a.status === "CHECKED_IN" || a.status === "CHECKED_OUT").length,
    absent: staff.attendances.filter((a) => a.status === "ABSENT").length,
    late: staff.attendances.filter((a) => a.status === "LATE" || a.isLateCheckIn).length,
    missedCheckout: staff.attendances.filter((a) => a.status === "MISSED_CHECKOUT").length,
  };

  res.status(200).json(
    new ApiResponse(200, {
      ...staff,
      taskStats,
      attendanceStats,
      periodLabel,
    }, "Staff details fetched successfully")
  );
};
