import { prisma } from "../prisma/prisma.js";


export async function runStartupCron(): Promise<void> {
    try {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

       

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

        let attendanceCreated = 0;

        for (const staff of eligibleStaff) {
            const existing = await prisma.attendance.findFirst({
                where: {
                    staffId: staff.id,
                    date: { gte: today, lt: tomorrow },
                },
            });

            if (existing) continue;

            const expectedStart = new Date(today);
            expectedStart.setUTCHours(
                staff.shiftStart!.getUTCHours(),
                staff.shiftStart!.getUTCMinutes(),
                staff.shiftStart!.getUTCSeconds(),
                0
            );

            const expectedEnd = new Date(today);
            expectedEnd.setUTCHours(
                staff.shiftEnd!.getUTCHours(),
                staff.shiftEnd!.getUTCMinutes(),
                staff.shiftEnd!.getUTCSeconds(),
                0
            );

            if (expectedEnd <= expectedStart) {
                expectedEnd.setUTCDate(expectedEnd.getUTCDate() + 1);
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

            attendanceCreated++;
        }

       

        const dailyTemplates = await prisma.taskTemplate.findMany({
            where: {
                isActive: true,
                recurringType: "DAILY",
                effectiveDate: { lte: tomorrow },
                OR: [
                    { recurringEndDate: null },
                    { recurringEndDate: { gte: today } },
                ],
            },
        });

        const onceTemplates = await prisma.taskTemplate.findMany({
            where: {
                isActive: true,
                recurringType: "ONCE",
                effectiveDate: { gte: today, lt: tomorrow },
            },
        });

        let tasksCreated = 0;

        for (const template of [...dailyTemplates, ...onceTemplates]) {
            const existing = await prisma.taskInstance.findFirst({
                where: {
                    templateId: template.id,
                    date: { gte: today, lt: tomorrow },
                },
            });

            if (existing) continue;

            const shiftStart = new Date(today);
            shiftStart.setUTCHours(
                template.shiftStart.getUTCHours(),
                template.shiftStart.getUTCMinutes(),
                template.shiftStart.getUTCSeconds(),
                0
            );

            const shiftEnd = new Date(today);
            shiftEnd.setUTCHours(
                template.shiftEnd.getUTCHours(),
                template.shiftEnd.getUTCMinutes(),
                template.shiftEnd.getUTCSeconds(),
                0
            );

            if (shiftEnd <= shiftStart) {
                shiftEnd.setUTCDate(shiftEnd.getUTCDate() + 1);
            }

            await prisma.taskInstance.create({
                data: {
                    templateId: template.id,
                    title: template.title,
                    date: today,
                    shiftStart,
                    shiftEnd,
                    staffId: template.staffId,
                    locationId: template.locationId,
                },
            });

            tasksCreated++;
        }

        if (attendanceCreated > 0 || tasksCreated > 0) {
            console.log(
                `Startup cron: created ${attendanceCreated} attendance record(s) and ${tasksCreated} task instance(s) for today.`
            );
        } else {
            console.log("Startup cron: all today's records already exist.");
        }
    } catch (error) {
        console.error("Startup cron error:", error);
    }
}
