
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Request, Response } from "express";
import { TokenPayload } from "../types/jwt.js";
import { prisma } from "../prisma/prisma.js"; 
import jwt from "jsonwebtoken";
import { generateAccessToken,generateRefreshToken } from "../utils/auth.js";

export const getCurrentUser = async (req: Request, res: Response) => {
    const user = req?.user;
    if (!user) {
        throw new ApiError(401, "no user found");
    }

    res.status(200).json(new ApiResponse(200, user, "user found"));
};

export const refreshToken = async (req: Request, res: Response) => {
  const incomingRefreshToken = req.cookies.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token missing");
  }

  let decodedToken: TokenPayload;

  try {
    decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    ) as TokenPayload;
  } catch {
    throw new ApiError(401, "Access Token Expired");
  }

  const { id, role } = decodedToken;

  let user;

  if (role === "MANAGER") {
    user = await prisma.manager.findUnique({
      where: { id },
    });

    if (!user) {
      throw new ApiError(401, "Unauthorized");
    }

    if (user.refreshToken !== incomingRefreshToken) {
      await prisma.manager.update({
        where: { id: user.id },
        data: { refreshToken: null },
      });
      throw new ApiError(403, "Token reuse detected");
    }

    const accessToken = generateAccessToken(user, role);
    const newRefreshToken = generateRefreshToken(user, role);

    await prisma.manager.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
    };

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json(new ApiResponse(200, safeUser, "Token refreshed successfully"));
  }

  if (role === "STAFF") {
    user = await prisma.staff.findUnique({
      where: { id },
    });

    if (!user) {
      throw new ApiError(401, "Unauthorized");
    }

    if (user.refreshToken !== incomingRefreshToken) {
      await prisma.staff.update({
        where: { id: user.id },
        data: { refreshToken: null },
      });
      throw new ApiError(403, "Token reuse detected");
    }

    const accessToken = generateAccessToken(user, role);
    const newRefreshToken = generateRefreshToken(user, role);

    await prisma.staff.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
    };

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json(new ApiResponse(200, safeUser, "Token refreshed successfully"));
  }

  throw new ApiError(401, "Invalid role");
};


export const logOut = async (req: Request, res: Response) => {
    
  const { id, role } = req.user!;

  if (role === "MANAGER") {
    await prisma.manager.update({
      where: { id },
      data: { refreshToken: null },
    });
  } else if (role === "STAFF") {
    await prisma.staff.update({
      where: { id },
      data: { refreshToken: null },
    });
  }

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
  };

  res
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .status(200)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
};