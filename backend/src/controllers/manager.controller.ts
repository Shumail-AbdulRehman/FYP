import { Request, Response } from "express";
import { managerSignupSchema, managerLoginSchema } from "../validations/manager.validation.js";
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
