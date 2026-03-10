import { Request, Response } from "express";
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
    role: string;
  };
}

export const signupManager = async (req: Request, res: Response) => {
  const result = managerSignupSchema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map(e => ({
      field: e.path.join("."),
      message: e.message,
    }));
    throw new ApiError(400, "Validation failed", errors);
  }

  const { name, email, password, companyName } = result.data;

  const existingManager = await prisma.manager.findUnique({ where: { email } });
  if (existingManager) throw new ApiError(409, "Manager with this email already exists");

  const company = await prisma.company.create({ data: { name: companyName } });

  const manager = await prisma.manager.create({
    data: { name, email, password, companyId: company.id },
  });

  const accessToken = generateAccessToken(manager, manager.role);
  const refreshToken = generateRefreshToken(manager);

  await prisma.manager.update({
    where: { id: manager.id },
    data: { refreshToken },
  });

  const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production" };
  res.status(201)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(201, {
      id: manager.id,
      name: manager.name,
      email: manager.email,
      role: manager.role,
      companyId: manager.companyId,
    }, "Manager registered successfully"));
};

export const loginManager = async (req: Request, res: Response) => {
  const result = managerLoginSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.issues.map(e => ({ field: e.path.join("."), message: e.message }));
    throw new ApiError(400, "Validation failed", errors);
  }

  const { email, password } = result.data;

  const manager = await prisma.manager.findUnique({ where: { email } });
  if (!manager) throw new ApiError(401, "Invalid email or password");
  if (!manager.isActive) throw new ApiError(403, "Your account has been deactivated");

  const isValid = await isPasswordCorrect(password, manager.password);
  if (!isValid) throw new ApiError(401, "Invalid email or password");

  const accessToken = generateAccessToken(manager, manager.role);
  const refreshToken = generateRefreshToken(manager);

  await prisma.manager.update({ where: { id: manager.id }, data: { refreshToken } });

  const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production" };
  res.status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(200, {
      id: manager.id,
      name: manager.name,
      email: manager.email,
      role: manager.role,
      companyId: manager.companyId,
    }, "Login successful"));
};

export const logoutManager = async (req: AuthenticatedRequest, res: Response) => {
  await prisma.manager.update({
    where: { id: req.user.id },
    data: { refreshToken: null },
  });

  const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production" };
  res.clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .status(200)
    .json(new ApiResponse(200, {}, "Manager logged out successfully"));
};

export const createStaff = async (req: AuthenticatedRequest, res: Response) => {
  const result = createStaffSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.issues.map(e => ({ field: e.path.join("."), message: e.message }));
    throw new ApiError(400, "Validation failed", errors);
  }

  const { name, email, password, locationId } = result.data;

  const existingStaff = await prisma.staff.findUnique({ where: { email } });
  if (existingStaff) throw new ApiError(409, "Staff with this email already exists");

  if (locationId) {
    const location = await prisma.location.findUnique({ where: { id: locationId } });
    if (!location || location.companyId !== req.user.companyId || !location.isActive) {
      throw new ApiError(404, "Location not found in your company");
    }
  }

  const staff = await prisma.staff.create({
    data: {
      name,
      email,
      password,
      companyId: req.user.companyId,
      locationId: locationId || null,
    }
  });

  res.status(201).json(new ApiResponse(201, staff, "Staff created successfully"));
};

export const createLocation = async (req: AuthenticatedRequest, res: Response) => {
  const result = createLocationSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.issues.map(e => ({ field: e.path.join("."), message: e.message }));
    throw new ApiError(400, "Validation failed", errors);
  }

  const { name, address, latitude, longitude } = result.data;

  const location = await prisma.location.create({
    data: { name, address, latitude, longitude, companyId: req.user.companyId },
  });

  res.status(201).json(new ApiResponse(201, location, "Location created successfully"));
};

export const createTaskTemplate = async (req: AuthenticatedRequest, res: Response) => {
  const result = createTaskSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.issues.map(e => ({ field: e.path.join("."), message: e.message }));
    throw new ApiError(400, "Validation failed", errors);
  }

  const { title, description, locationId, shiftStart, shiftEnd, recurringType, effectiveDate } = result.data;

  const location = await prisma.location.findUnique({ where: { id: locationId } });
  if (!location || location.companyId !== req.user.companyId || !location.isActive) {
    throw new ApiError(404, "Location not found in your company");
  }

  const taskTemplate = await prisma.taskTemplate.create({
    data: { title, description, locationId, shiftStart, shiftEnd, recurringType, effectiveDate },
  });

  res.status(201).json(new ApiResponse(201, taskTemplate, "Task template created successfully"));
};

export const editTaskTemplate = async (req: AuthenticatedRequest, res: Response) => {
  const taskTemplateId = Number(req.params.id);
  if (isNaN(taskTemplateId)) throw new ApiError(400, "Invalid task template id");

  const result = createTaskSchema.partial().safeParse(req.body);
  if (!result.success) {
    const errors = result.error.issues.map(e => ({ field: e.path.join("."), message: e.message }));
    throw new ApiError(400, "Validation failed", errors);
  }

  const { title, description, locationId, shiftStart, shiftEnd, recurringType, effectiveDate } = result.data;

  const template = await prisma.taskTemplate.findUnique({ where: { id: taskTemplateId }, include: { location: true } });
  if (!template || template.location.companyId !== req.user.companyId) {
    throw new ApiError(404, "Task template not found in your company");
  }

  if (locationId) {
    const newLocation = await prisma.location.findUnique({ where: { id: locationId } });
    if (!newLocation || newLocation.companyId !== req.user.companyId || !newLocation.isActive) {
      throw new ApiError(404, "New location not found in your company");
    }
  }

  const updatedTaskTemplate = await prisma.taskTemplate.update({
    where: { id: taskTemplateId },
    data: { title, description, locationId, shiftStart, shiftEnd, recurringType, effectiveDate },
  });

  res.status(200).json(new ApiResponse(200, updatedTaskTemplate, "Task template updated successfully"));
};