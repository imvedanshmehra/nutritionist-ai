import nodeCron from "node-cron";
import { getAllUsers } from "../controllers/users-controller";
import { bot } from "../config/bot";
import { pushNotificationMessage } from "./globals";

export const sendPushNotifications = async () => {
  try {
    const allUsers = await getAllUsers();

    nodeCron.schedule("35 18 */2 * *", async () => {
      // Run this job on every 2nd day-of-month at 1:30pm.
      for (const user of allUsers) {
        if (user && user.tgId) {
          try {
            await bot.telegram.sendMessage(
              user.tgId,
              pushNotificationMessage(user?.firstName)
            );
          } catch (error) {
            console.error(
              `Failed to send message to user ${user.tgId}:`,
              error
            );
          }
        }
      }
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);
  }
};
