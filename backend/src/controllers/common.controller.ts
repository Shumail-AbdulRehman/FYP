
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

  const { id, role } = decodedToken;

  let user;

  
  if (role === "MANAGER") {
    user = await prisma.manager.findUnique({
      where: { id },
    });
  } else if (role === "STAFF") {
    user = await prisma.staff.findUnique({
      where: { id },
    });
  } else {
    throw new ApiError(401, "Invalid role");
  }

  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  const accessToken = generateAccessToken(user, role);
  const newRefreshToken = generateRefreshToken(user, role);

  
  
  if (role === "MANAGER") {
    await prisma.manager.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });
  } else {
    await prisma.staff.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });
  }

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
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
};
