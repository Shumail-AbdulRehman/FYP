import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

export const verifyJwt = asyncHandler(async (req, res, next) => {
    const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
        throw new ApiError(401, "unauthorize access");
    }
    let decodedInfo;
    try {
        decodedInfo = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
        throw new ApiError(401, "Invalid or expired access token");
    }
    const user = await User.findById(decodedInfo?._id).select(
        "-password -refreshToken"
    );

    if (!user) {
        throw new ApiError(401, "invalid access token");
    }
    req.user = user;
    next();
});