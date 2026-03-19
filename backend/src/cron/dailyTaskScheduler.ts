import cron from "node-cron";
import { prisma } from "../prisma/prisma.js";

cron.schedule("0 0 * * *", async () => {
  try {
    console.log("Generating daily task instances...");

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const dailyTemplates = await prisma.taskTemplate.findMany({
      where: {
        isActive: true,
        recurringType: "DAILY",
        effectiveDate: { lte: tomorrow },
        OR: [
          { recurringEndDate: null },
          { recurringEndDate: { gte: today } }
        ]
      }
    });

    let created = 0;

    for (const template of dailyTemplates) {
      const existingInstance = await prisma.taskInstance.findFirst({
        where: {
          templateId: template.id,
          date: {
            gte: today,
            lt: tomorrow
          }
        }
      });

      if (existingInstance) continue;

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
          locationId: template.locationId
        }
      });

      created++;
    }

    console.log(`Task instances created: ${created}`);
  } catch (error) {
    console.error("Task scheduler cron error:", error);
  }
});