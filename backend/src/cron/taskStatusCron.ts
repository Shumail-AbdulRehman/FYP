import cron from "node-cron";
import { prisma } from "../prisma/prisma.js";

cron.schedule("*/5 * * * *", async () => {
  try {
    const now = new Date();

    const pendingLateTasks = await prisma.taskInstance.findMany({
      where: {
        shiftStart: { lt: now },
        shiftEnd: { gt: now },
        status: "PENDING",
        isActive: true
      },
      select: {
        id: true,
        shiftStart: true
      }
    });

    for (const task of pendingLateTasks) {
      const lateMinutes = Math.floor(
        (now.getTime() - task.shiftStart.getTime()) / (1000 * 60)
      );

      await prisma.taskInstance.update({
        where: { id: task.id },
        data: {
          isLate: true,
          lateMinutes
        }
      });
    }

    const graceHours = 2;

    const missedThreshold = new Date(
      now.getTime() - graceHours * 60 * 60 * 1000
    );

    const missedTasks = await prisma.taskInstance.updateMany({
      where: {
        shiftEnd: { lt: missedThreshold },
        status: {
          in: ["PENDING", "IN_PROGRESS"]
        },
        isActive: true
      },
      data: {
        status: "MISSED"
      }
    });

    console.log(`Late tasks updated: ${pendingLateTasks.length}`);
    console.log(`Missed tasks updated: ${missedTasks.count}`);

  } catch (error) {
    console.error("Cron job error:", error);
  }
});