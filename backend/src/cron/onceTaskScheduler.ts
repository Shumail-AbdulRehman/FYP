import cron from "node-cron";
import { prisma } from "../prisma/prisma.js";


cron.schedule("*/5 * * * *",async()=>
{
    try {

    console.log("Generating Once task instances...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

        const onceTemplates = await prisma.taskTemplate.findMany({
      where: {
        isActive: true,
        recurringType: "ONCE",
        effectiveDate: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    let created = 0;

    for (const template of onceTemplates) {
      const existingInstance = await prisma.taskInstance.findFirst({
        where: {
          templateId: template.id
        }
      });

      if (existingInstance) continue;

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
          locationId: template.locationId
        }
      });

      created++;
    }

    console.log(`Once Task instances created: ${created}`);
        
    } catch (error) {
         console.error("Once Task scheduler cron error:", error);
    }
})