import { Request, Response } from "express";
import { managerSignupSchema } from "../validations/manager.validation.js";
import { prisma } from "../prisma/prisma.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { generateAccessToken, generateRefreshToken } from "../utils/auth.js";

export const signupManager = async (req: Request, res: Response) => {
    // STEP 1: Validate input with Zod
    // safeParse doesn't throw — it returns { success, data, error }
    const result = managerSignupSchema.safeParse(req.body);

    if (!result.success) {
        // Zod gives us detailed error messages for each field
        const errors = result.error.issues.map((e: any) => ({
            field: e.path.join("."),
            message: e.message,
        }));
        throw new ApiError(400, "Validation failed", errors);
    }

    // STEP 2: result.data is now fully typed as ManagerSignupInput
    const { name, email, password, companyId } = result.data;

    // STEP 3: Check if email already exists
    const existingManager = await prisma.manager.findUnique({
        where: { email },
    });

    if (existingManager) {
        throw new ApiError(409, "Manager with this email already exists");
    }

    // STEP 4: Check if company exists
    const company = await prisma.company.findUnique({
        where: { id: companyId },
    });

    if (!company) {
        throw new ApiError(404, "Company not found");
    }

    // STEP 5: Create manager (password is auto-hashed by $extends in prisma.ts)
    const manager = await prisma.manager.create({
        data: { name, email, password, companyId },
    });

    // STEP 6: Generate tokens
    const accessToken = generateAccessToken(manager, manager.role);
    const refreshToken = generateRefreshToken(manager);

    // STEP 7: Save refresh token to DB
    await prisma.manager.update({
        where: { id: manager.id },
        data: { refreshToken },
    });

    // STEP 8: Set cookies and respond
    const cookieOptions = {
        httpOnly: true,
        secure: true,
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
