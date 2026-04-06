import { Request, Response } from "express";
import { prisma } from "../prisma/prisma.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { checkInSchema, checkOutSchema, assignShiftSchema } from "../validations/attendance.validation.js";
import { isWithinRadius } from "../utils/geofencing.js";
import { addUtcDays, getKarachiDayRange } from "../utils/karachiTime.js";

const LATE_GRACE_MINUTES = 15;
const EARLY_CHECKIN_MINUTES = 30;
const MIN_CHECKOUT_MINUTES = 30;

export const assignShiftToStaff = async (req: Request, res: Response) => {
    const staffId = Number(req.params.id);
    if (isNaN(staffId)) throw new ApiError(400, "Invalid staff id");

    const result = assignShiftSchema.safeParse(req.body);

    if (!result.success) {
        const errors = result.error.issues.map(e => ({
            field: e.path.join("."),
            message: e.message,
        }));
        throw new ApiError(400, "Validation failed", errors);
    }

    const staff = await prisma.staff.findUnique({ where: { id: staffId } });

    if (!staff || staff.companyId !== req.user!.companyId) {
        throw new ApiError(404, "Staff not found in your company");
    }

    if (!staff.isActive) {
        throw new ApiError(400, "Staff is deactivated");
    }

    const newShiftStartMin =
        result.data.shiftStart.getUTCHours() * 60 + result.data.shiftStart.getUTCMinutes();

    const newShiftEndMin =
        result.data.shiftEnd.getUTCHours() * 60 + result.data.shiftEnd.getUTCMinutes();

    const activeTemplates = await prisma.taskTemplate.findMany({
        where: { staffId, isActive: true },
        select: { id: true, title: true, shiftStart: true, shiftEnd: true },
    });

    const isWithinRange = (
        innerStart: number,
        innerEnd: number,
        outerStart: number,
        outerEnd: number
    ) => {
        if (outerEnd <= outerStart) outerEnd += 1440;
        if (innerEnd <= innerStart) innerEnd += 1440;

        if (innerStart < outerStart) {
            innerStart += 1440;
            innerEnd += 1440;
        }

        return innerStart >= outerStart && innerEnd <= outerEnd;
    };

    const conflicts = activeTemplates.filter(t => {
        const taskStart =
            t.shiftStart.getUTCHours() * 60 + t.shiftStart.getUTCMinutes();

        const taskEnd =
            t.shiftEnd.getUTCHours() * 60 + t.shiftEnd.getUTCMinutes();

        return !isWithinRange(taskStart, taskEnd, newShiftStartMin, newShiftEndMin);
    });

    if (conflicts.length > 0) {
        const formatTime = (d: Date) =>
            `${d.getUTCHours().toString().padStart(2, "0")}:${d
                .getUTCMinutes()
                .toString()
                .padStart(2, "0")}`;

        const details = conflicts.map(
            t => `"${t.title}" (${formatTime(t.shiftStart)} - ${formatTime(t.shiftEnd)})`
        );

        throw new ApiError(
            400,
            `Cannot update shift: ${conflicts.length} task(s) would fall outside the new shift window: ${details.join(
                ", "
            )}. Please reassign or update those tasks first.`
        );
    }

    const updated = await prisma.staff.update({
        where: { id: staffId },
        data: {
            shiftStart: result.data.shiftStart,
            shiftEnd: result.data.shiftEnd,
        },
        select: {
            id: true,
            name: true,
            email: true,
            shiftStart: true,
            shiftEnd: true,
            locationId: true,
        },
    });

    res
        .status(200)
        .json(new ApiResponse(200, updated, "Shift assigned to staff successfully"));
};

export const checkIn = async (req: Request, res: Response) => {
    
    if (req.user!.role !== "STAFF") {
        throw new ApiError(403, "Only staff can check in");
    }

    const result = checkInSchema.safeParse(req.body);

    if (!result.success) {
        const errors = result.error.issues.map(e => ({
            field: e.path.join("."),
            message: e.message,
        }));
        throw new ApiError(400, "Validation failed", errors);
    }

    const staffId = req.user!.id;
    const locationId = req.user!.locationId;

    if (!locationId) {
        throw new ApiError(400, "You are not assigned to any location");
    }

    const location = await prisma.location.findUnique({ where: { id: locationId } });

    if (!location || !location.isActive) {
        throw new ApiError(404, "Your assigned location is not active");
    }

    const { latitude, longitude } = result.data;

    if (
  !isWithinRadius(
    Number(latitude),
    Number(longitude),
    Number(location.latitude),
    Number(location.longitude),
    location.radiusMeters
  )
) {
  throw new ApiError(400, "You are not within the allowed radius of your location");
}

    const { start: today, end: tomorrow } = getKarachiDayRange();

    const now = new Date();

const attendance = await prisma.attendance.findFirst({
  where: {
    staffId,
    expectedStart: { lte: new Date(now.getTime() + EARLY_CHECKIN_MINUTES * 60 * 1000) },
    expectedEnd: { gte: now },
  },
});

    if (!attendance) {
        const alreadyCheckedIn = await prisma.attendance.findFirst({
            where: {
                staffId,
                date: { gte: today, lt: tomorrow },
                status: { in: ["CHECKED_IN", "LATE", "CHECKED_OUT"] },
            },
        });

        if (alreadyCheckedIn) {
            throw new ApiError(400, "You have already checked in today");
        }

        throw new ApiError(404, "No attendance record found for today");
    }

    const graceDeadline = new Date(attendance.expectedStart.getTime() + LATE_GRACE_MINUTES * 60 * 1000);

    let status: "CHECKED_IN" | "LATE";
    let isLateCheckIn = false;
    let lateMinutes: number | null = null;

    if (now > graceDeadline) {
        status = "LATE";
        isLateCheckIn = true;
        lateMinutes = Math.floor((now.getTime() - attendance.expectedStart.getTime()) / (1000 * 60));
    } else {
        status = "CHECKED_IN";
    }

    const { count } = await prisma.attendance.updateMany({
        where: { id: attendance.id, status: "ABSENT" },
        data: {
            checkInTime: now,
            status,
            isLateCheckIn,
            lateMinutes,
        },
    });

    if (count === 0) {
        throw new ApiError(400, "You have already checked in for this shift");
    }

    const updated = await prisma.attendance.findUnique({ where: { id: attendance.id } });

    res.status(200).json(new ApiResponse(200, updated, `Checked in successfully${isLateCheckIn ? ` (late by ${lateMinutes} minutes)` : ""}`));
};

export const checkOut = async (req: Request, res: Response) => {
    
    if (req.user!.role !== "STAFF") {
        throw new ApiError(403, "Only staff can check out");
    }

    const result = checkOutSchema.safeParse(req.body);

    if (!result.success) {
        const errors = result.error.issues.map(e => ({
            field: e.path.join("."),
            message: e.message,
        }));
        throw new ApiError(400, "Validation failed", errors);
    }

    const staffId = req.user!.id;
    const locationId = req.user!.locationId;

    if (!locationId) {
        throw new ApiError(400, "You are not assigned to any location");
    }

    const location = await prisma.location.findUnique({ where: { id: locationId } });

    if (!location || !location.isActive) {
        throw new ApiError(404, "Your assigned location is not active");
    }

    const { latitude, longitude } = result.data;

    if (
  !isWithinRadius(
    Number(latitude),
    Number(longitude),
    Number(location.latitude),
    Number(location.longitude),
    location.radiusMeters
  )
) {
  throw new ApiError(400, "You are not within the allowed radius of your location");
}

    const { start: today, end: tomorrow } = getKarachiDayRange();

    let attendance = await prisma.attendance.findFirst({
        where: {
            staffId,
            date: { gte: today, lt: tomorrow },
            status: { in: ["CHECKED_IN", "LATE", "MISSED_CHECKOUT"] },
        },  
    });

    if (!attendance) {
        const yesterday = addUtcDays(today, -1);

        attendance = await prisma.attendance.findFirst({
            where: {
                staffId,
                date: { gte: yesterday, lt: today },
                status: { in: ["CHECKED_IN", "LATE", "MISSED_CHECKOUT"] },
            },
        });
    }

    if (!attendance) {
        throw new ApiError(400, "You have not checked in today or already checked out");
    }

    const now = new Date();

    if (attendance.checkInTime) {
        const minutesSinceCheckIn = Math.floor((now.getTime() - attendance.checkInTime.getTime()) / (1000 * 60));
        if (minutesSinceCheckIn < MIN_CHECKOUT_MINUTES) {
            throw new ApiError(400, `Cannot check out within ${MIN_CHECKOUT_MINUTES} minutes of check-in. Please wait ${MIN_CHECKOUT_MINUTES - minutesSinceCheckIn} more minute(s).`);
        }
    }

    const updated = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
            checkOutTime: now,
            status: attendance.status === "MISSED_CHECKOUT" ? "MISSED_CHECKOUT" : "CHECKED_OUT",
        },
    });

    res.status(200).json(new ApiResponse(200, updated, "Checked out successfully"));
};

export const getMyAttendance = async (req: Request, res: Response) => {

    if (req.user?.role === "MANAGER") throw new ApiError(401,"only staff can get their attendance");
    const staffId = req.user!.id;

    const attendance = await prisma.attendance.findMany({
        where: { staffId },
        orderBy: { date: "desc" },
        include: {
            location: {
                select: { id: true, name: true },
            },
        },
    });

    res.status(200).json(new ApiResponse(200, attendance, "Attendance fetched successfully"));
};

export const getStaffAttendance = async (req: Request, res: Response) => {
    const companyId = req.user!.companyId;

    const filters: any = {};

    if (req.query.staffId) {
        const staffId = Number(req.query.staffId);
        if (isNaN(staffId)) throw new ApiError(400, "Invalid staffId");
        filters.staffId = staffId;
    }

    if (req.query.from || req.query.to) {
        filters.date = {};
        if (req.query.from) {
            filters.date.gte = new Date(req.query.from as string);
        }
        if (req.query.to) {
            const toDate = new Date(req.query.to as string);
            toDate.setHours(23, 59, 59, 999);
            filters.date.lte = toDate;
        }
    }

    const attendance = await prisma.attendance.findMany({
        where: {
            ...filters,
            staff: {
                companyId,
                isActive: true,
            },
        },
        orderBy: { date: "desc" },
        include: {
            staff: {
                select: { id: true, name: true, email: true },
            },
            location: {
                select: { id: true, name: true },
            },
        },
    });

    res.status(200).json(new ApiResponse(200, attendance, "Staff attendance fetched successfully"));
};
