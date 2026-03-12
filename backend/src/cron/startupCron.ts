import { prisma } from "../prisma/prisma.js";


export async function runStartupCron(): Promise<void> {
    try {
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
            shiftStart.setHours(
                template.shiftStart.getHours(),
                template.shiftStart.getMinutes(),
                template.shiftStart.getSeconds(),
                0
            );

            const shiftEnd = new Date(today);
            shiftEnd.setHours(
                template.shiftEnd.getHours(),
                template.shiftEnd.getMinutes(),
                template.shiftEnd.getSeconds(),
                0
            );

            if (shiftEnd <= shiftStart) {
                shiftEnd.setDate(shiftEnd.getDate() + 1);
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
