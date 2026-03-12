import cron from "node-cron";
import { prisma } from "../prisma/prisma.js";

cron.schedule("0 0 * * *", async () => {
    try {
        console.log("Creating daily attendance records...");

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const eligibleStaff = await prisma.staff.findMany({
            where: {
                isActive: true,
                locationId: { not: null },
                shiftStart: { not: null },
                shiftEnd: { not: null },
            },
            select: {
                id: true,
                locationId: true,
                shiftStart: true,
                shiftEnd: true,
            },
        });

        let created = 0;

        for (const staff of eligibleStaff) {
            const existingAttendance = await prisma.attendance.findFirst({
                where: {
                    staffId: staff.id,
                    date: { gte: today, lt: tomorrow },
                },
            });

            if (existingAttendance) continue;

            const expectedStart = new Date(today);
            expectedStart.setHours(
                staff.shiftStart!.getHours(),
                staff.shiftStart!.getMinutes(),
                staff.shiftStart!.getSeconds(),
                0
            );

            const expectedEnd = new Date(today);
            expectedEnd.setHours(
                staff.shiftEnd!.getHours(),
                staff.shiftEnd!.getMinutes(),
                staff.shiftEnd!.getSeconds(),
                0
            );

            if (expectedEnd <= expectedStart) {
                expectedEnd.setDate(expectedEnd.getDate() + 1);
            }

            await prisma.attendance.create({
                data: {
                    staffId: staff.id,
                    locationId: staff.locationId!,
                    date: today,
                    expectedStart,
                    expectedEnd,
                    status: "ABSENT",
                },
            });

            created++;
        }

        console.log(`Attendance records created: ${created}`);
    } catch (error) {
        console.error("Attendance cron error:", error);
    }
});
