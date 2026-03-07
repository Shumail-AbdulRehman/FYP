import { Request, Response } from "express";
import { managerSignupSchema, managerLoginSchema, createStaffSchema, createLocationSchema } from "../validations/manager.validation.js";
import { prisma } from "../prisma/prisma.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { generateAccessToken, generateRefreshToken, isPasswordCorrect } from "../utils/auth.js";

export const signupManager = async (req: Request, res: Response) => {

    const result = managerSignupSchema.safeParse(req.body);

    if (!result.success) {

        const errors = result.error.issues.map((e: any) => ({
            field: e.path.join("."),
            message: e.message,
        }));
        throw new ApiError(400, "Validation failed", errors);
    }


    const { name, email, password, companyName } = result.data;



    const existingManager = await prisma.manager.findUnique({
        where: { email },
    });

    if (existingManager) {
        throw new ApiError(409, "Manager with this email already exists");
    }

    const company = await prisma.company.create({
        data: {
            name: companyName
        }
    });

    const companyId = company.id;

    const manager = await prisma.manager.create({
        data: { name, email, password, companyId },
    });


    const accessToken = generateAccessToken(manager, manager.role);
    const refreshToken = generateRefreshToken(manager);


    await prisma.manager.update({
        where: { id: manager.id },
        data: { refreshToken },
    });


    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };

    res.status(201)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(201, {
                id: manager.id,
                name: manager.name,
                email: manager.email,
                role: manager.role,
                companyId: manager.companyId,
            }, "Manager registered successfully")
        );
};

export const loginManager = async (req: Request, res: Response) => {
    const result = managerLoginSchema.safeParse(req.body);

    if (!result.success) {
        const errors = result.error.issues.map((e: any) => ({
            field: e.path.join("."),
            message: e.message,
        }));
        throw new ApiError(400, "Validation failed", errors);
    }

    const { email, password } = result.data;

    const manager = await prisma.manager.findUnique({
        where: { email },
    });

    if (!manager) {
        throw new ApiError(401, "Invalid email or password");
    }

    if (!manager.isActive) {
        throw new ApiError(403, "Your account has been deactivated");
    }

    const isValid = await isPasswordCorrect(password, manager.password);
    if (!isValid) {
        throw new ApiError(401, "Invalid email or password");
    }

    const accessToken = generateAccessToken(manager, manager.role);
    const refreshToken = generateRefreshToken(manager);

    await prisma.manager.update({
        where: { id: manager.id },
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
                id: manager.id,
                name: manager.name,
                email: manager.email,
                role: manager.role,
                companyId: manager.companyId,
            }, "Login successful")
        );
};

export const logoutManager = async (req: Request, res: Response) => {

    await prisma.manager.update({
        where: { id: (req as any).user.id },
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
            new ApiResponse(200, {}, "Manager logged out successfully")
        );
};

export const createStaff = async (req: Request, res: Response) => {
    const result = createStaffSchema.safeParse(req.body);

    if (!result.success) {
        const errors = result.error.issues.map((e: any) => ({
            field: e.path.join("."),
            message: e.message,
        }));
        throw new ApiError(400, "Validation failed", errors);
    }

    const { name, email, password, locationId } = result.data;
    const manager = (req as any).user;


    const existingStaff = await prisma.staff.findUnique({
        where: { email },
    });

    if (existingStaff) {
        throw new ApiError(409, "Staff with this email already exists");
    }

    if (locationId) {
        const location = await prisma.location.findUnique({
            where: { id: locationId },
        });

        if (!location || location.companyId !== manager.companyId || !location.isActive) {
            throw new ApiError(404, "Location not found in your company");
        }
    }

    const staff = await prisma.staff.create({
        data: {
            name,
            email,
            password,
            companyId: manager.companyId,
            locationId: locationId || null,
        },
    });

    res.status(201).json(
        new ApiResponse(201, {
            id: staff.id,
            name: staff.name,
            email: staff.email,
            role: staff.role,
            companyId: staff.companyId,
            locationId: staff.locationId,
        }, "Staff created successfully")
    );
};

export const createLocation = async (req: Request, res: Response) => {

    const result = createLocationSchema.safeParse(req.body);

    if (!result.success) {
        const errors = result.error.issues.map((e: any) => ({
            field: e.path.join("."),
            message: e.message,
        }));
        throw new ApiError(400, "Validation failed", errors);
    }

    const { name, address } = result.data;

    const companyId = (req as any).user.companyId;

    const company = await prisma.company.findUnique({
        where: { id: companyId },
    });

    if (!company || !company.isActive) {
        throw new ApiError(404, "Company not found");
    }

    const location = await prisma.location.create({
        data: {
            name,
            address,
            companyId,
        },
    });

    res.status(201).json(
        new ApiResponse(201, location, "Location created successfully")
    );
};

export const softDeleteStaff = async (req: Request, res: Response) => {
    const staffId = parseInt((req as any).params.id);
    const manager = (req as any).user;

    const staff = await prisma.staff.findUnique({
        where: { id: staffId },
    });

    if (!staff || staff.companyId !== manager.companyId) {
        throw new ApiError(404, "Staff not found in your company");
    }

    if (!staff.isActive) {
        throw new ApiError(400, "Staff is already deactivated");
    }

    await prisma.staff.update({
        where: { id: staffId },
        data: { isActive: false },
    });

    res.status(200).json(
        new ApiResponse(200, {}, "Staff deactivated successfully")
    );
};

export const softDeleteLocation = async (req: Request, res: Response) => {
    const locationId = parseInt((req as any).params.id);
    const manager = (req as any).user;

    const location = await prisma.location.findUnique({
        where: { id: locationId },
    });

    if (!location || location.companyId !== manager.companyId) {
        throw new ApiError(404, "Location not found in your company");
    }

    if (!location.isActive) {
        throw new ApiError(400, "Location is already deactivated");
    }

    await prisma.location.update({
        where: { id: locationId },
        data: { isActive: false },
    });

    await prisma.task.updateMany({
        where: { locationId, isActive: true },
        data: { isActive: false },
    });

    await prisma.staff.updateMany({
        where: { locationId, isActive: true },
        data: { locationId: null },
    });

    res.status(200).json(
        new ApiResponse(200, {}, "Location and its tasks deactivated successfully")
    );
};

export const getStaff = async (req: Request, res: Response) => {
    const manager = (req as any).user;

    const staff = await prisma.staff.findMany({
        where: { companyId: manager.companyId, isActive: true },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            locationId: true,
            createdAt: true,
        },
    });

    res.status(200).json(
        new ApiResponse(200, staff, "Staff retrieved successfully")
    );
};

export const getLocations = async (req: Request, res: Response) => {
    const manager = (req as any).user;

    const locations = await prisma.location.findMany({
        where: { companyId: manager.companyId, isActive: true },
    });

    res.status(200).json(
        new ApiResponse(200, locations, "Locations retrieved successfully")
    );
};
