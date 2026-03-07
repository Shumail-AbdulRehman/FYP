import { Response, Request } from "express"
import { prisma } from "../prisma/prisma.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { generateAccessToken, generateRefreshToken, isPasswordCorrect } from "../utils/auth.js";
import { staffLoginSchema } from "../validations/staff.validation.js";

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
}

export const logoutStaff = async (req: Request, res: Response) => {
    await prisma.staff.update({
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
            new ApiResponse(200, {}, "staff logout sucessfully")
        );
}