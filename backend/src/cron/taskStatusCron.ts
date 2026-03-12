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

    const missedTasks = await prisma.taskInstance.updateMany({
      where: {
        shiftEnd: { lt: now },
        status: {
          in: ["PENDING"]
        },
        isActive: true
      },
      data: {
        status: "MISSED",
        isLate: true
      }
    });

    const staleTasks = await prisma.taskInstance.findMany({
      where: {
        shiftEnd: { lt: now },
        status: "IN_PROGRESS",
        isActive: true
      },
      select: {
        id: true,
        shiftEnd: true
      }
    });

    for (const task of staleTasks) {
      const lateMinutes = Math.floor(
        (now.getTime() - task.shiftEnd.getTime()) / (1000 * 60)
      );

      await prisma.taskInstance.update({
        where: { id: task.id },
        data: {
          status: "LATE",
          isLate: true,
          lateMinutes
        }
      });
    }

    if (pendingLateTasks.length || missedTasks.count || staleTasks.length) {
      console.log(
        `Cron: ${pendingLateTasks.length} late, ${missedTasks.count} missed, ${staleTasks.length} stale IN_PROGRESS`
      );
    }

  } catch (error) {
    console.error("Task status cron error:", error);
  }
});