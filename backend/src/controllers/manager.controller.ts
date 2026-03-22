import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import {
    managerSignupSchema,
    managerLoginSchema,
} from "../validations/manager.validation.js";
import { prisma } from "../prisma/prisma.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { generateAccessToken, generateRefreshToken, isPasswordCorrect } from "../utils/auth.js";
import { TokenPayload } from "../types/jwt.js";



export const signupManager = async (req: Request, res: Response) => {

    const result = managerSignupSchema.safeParse(req.body);

    if (!result.success) {
        const errors = result.error.issues.map(e => ({
            field: e.path.join("."),
            message: e.message
        }));
        throw new ApiError(400, "Validation failed", errors);
    }

    const { name, email, password, companyName } = result.data;

    const existingManager = await prisma.manager.findUnique({
        where: { email }
    });

    if (existingManager) {
        throw new ApiError(409, "Manager with this email already exists");
    }



    const company = await prisma.company.create({
        data: { name: companyName }
    });

    const manager = await prisma.manager.create({
        data: {
            name,
            email,
            password,
            companyId: company.id
        }
    });

    const accessToken = generateAccessToken(manager, manager.role);
    const refreshToken = generateRefreshToken(manager);

    await prisma.manager.update({
        where: { id: manager.id },
        data: { refreshToken }
    });

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };

    res
        .status(201)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                201,
                {
                    id: manager.id,
                    name: manager.name,
                    email: manager.email,
                    role: manager.role,
                    companyId: manager.companyId
                },
                "Manager registered successfully"
            )
        );
};

export const loginManager = async (req: Request, res: Response) => {

    const result = managerLoginSchema.safeParse(req.body);

    if (!result.success) {
        const errors = result.error.issues.map(e => ({
            field: e.path.join("."),
            message: e.message
        }));
        throw new ApiError(400, "Validation failed", errors);
    }

    const { email, password } = result.data;

    const manager = await prisma.manager.findUnique({
        where: { email }
    });

    if (!manager) {
        throw new ApiError(401, "Invalid email or password");
    }

    const validPassword = await isPasswordCorrect(password, manager.password);

    if (!validPassword) {
        throw new ApiError(401, "Invalid email or password");
    }

    const accessToken = generateAccessToken(manager, manager.role);
    const refreshToken = generateRefreshToken(manager);

    await prisma.manager.update({
        where: { id: manager.id },
        data: { refreshToken }
    });

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };

    res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                {
                    id: manager.id,
                    name: manager.name,
                    email: manager.email,
                    role: manager.role,
                    companyId: manager.companyId
                },
                "Login successful"
            )
        );
};

export const logoutManager = async (req: Request, res: Response) => {

    if (req.user!.role !== "MANAGER") throw new ApiError(403, "Only managers can use this endpoint");
    
    await prisma.manager.update({
        where: { id: req.user!.id },
        data: { refreshToken: null }
    });

    const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production" };

    res.clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .status(200)
        .json(new ApiResponse(200, {}, "Manager logged out successfully"));
};

export const getManagerProfile = async (req: Request, res: Response) => {

    if (req.user!.role !== "MANAGER") throw new ApiError(403, "Only managers can use this endpoint");

    const manager = await prisma.manager.findUnique({
        where: { id: req.user!.id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            companyId: true
        }
    });

    if (!manager) {
        throw new ApiError(404, "Manager not found");
    }

    res.status(200).json(new ApiResponse(200, manager, "Manager profile fetched successfully"));
};

export const refreshManagerToken = async (req: Request, res: Response) => {
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

    const manager = await prisma.manager.findUnique({
        where: { id: req.user!.id, refreshToken }
    });

   
    if (!manager || manager.role !== "MANAGER") {
        throw new ApiError(401, "Unauthorized");
    }

    const accessToken = generateAccessToken(manager, manager.role);
    const newRefreshToken = generateRefreshToken(manager);

    await prisma.manager.update({
        where: { id: manager.id },
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


