import { Request, Response } from "express";
import { createStaffSchema } from "../validations/staff.validation.js";
import { staffLoginSchema } from "../validations/staff.validation.js";
import { prisma } from "../prisma/prisma.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { generateAccessToken, generateRefreshToken, isPasswordCorrect } from "../utils/auth.js";
import jwt from "jsonwebtoken";
import { TokenPayload } from "../types/jwt.js";


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
  const refreshToken = generateRefreshToken(staff);

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

export const logoutStaff = async (req: Request, res: Response) => {

  if (req.user!.role !== "STAFF") throw new ApiError(403, "Only staff can use this endpoint");

  await prisma.staff.update({
    where: { id: req.user!.id },
    data: { refreshToken: null },
  });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production"
  };

  res
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .status(200)
    .json(
      new ApiResponse(200, {}, "Staff logged out successfully")
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
      shiftStart:true,
      shiftEnd:true
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

  // await prisma.staff.update({
  //   where: { id: staffId },
  //   data: { isActive: false, refreshToken: null }
  // });

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
    data: { status:"CANCELLED" }, 
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
      shiftStart:true,
      shiftEnd:true
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
      shiftStart:true,
      shiftEnd:true
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
      shiftStart:true,
      shiftEnd:true
    }
  });

  res.status(200).json(new ApiResponse(200, staff, "Inactive staff fetched successfully"));
};

export const refreshStaffToken = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        throw new ApiError(401, "Refresh token missing");
    }

    let decodedToken: TokenPayload;
try {
    decodedToken = jwt.verify(
        refreshToken, 
        process.env.REFRESH_TOKEN_SECRET!
    ) as TokenPayload;
} catch (error) {
    throw new ApiError(401, "Refresh token expired or invalid");
}

if (decodedToken.id !== req.user!.id) {  
    throw new ApiError(401, "Token mismatch");
}

    const staff = await prisma.staff.findUnique({
        where: { id: req.user!.id, refreshToken }
    });

    if (!staff || staff.role !== "STAFF") {
        throw new ApiError(401, "Unauthorized");
    }

    const accessToken = generateAccessToken(staff, staff.role);
    const newRefreshToken = generateRefreshToken(staff);

    await prisma.staff.update({
        where: { id: staff.id },
        data: { refreshToken: newRefreshToken }
    });

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };

    res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", newRefreshToken, cookieOptions)
        .json(new ApiResponse(200, {}, "Token refreshed successfully"));
};