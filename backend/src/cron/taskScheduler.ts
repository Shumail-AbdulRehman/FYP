import cron from "node-cron";
import { prisma } from "../prisma/prisma.js";

cron.schedule("0 0 * * *", async () => {
  console.log("Generating daily task instances");

  const templates = await prisma.taskTemplate.findMany({
    where: {
      isActive: true,
      recurringType: "DAILY"
    }
  });   

  for (const template of templates) {
    await prisma.taskInstance.create({
      data: {
        templateId: template.id,
        title: template.title,
        date: new Date(),
        shiftStart: template.shiftStart,
        shiftEnd: template.shiftEnd,
        staffId: template.staffId,
        locationId: template.locationId
      }
    });
  }
});