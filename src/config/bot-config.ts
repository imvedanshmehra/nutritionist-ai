import { Telegraf } from "telegraf";
import { ERROR_MESSAGE, SUPPORT_MESSAGE } from "../globals/messages";

const bot = new Telegraf(process.env.BOT_TOKEN || "");

bot.catch(async (err, ctx) => {
  console.log("An error occurred", err);
  await ctx?.reply(ERROR_MESSAGE);
  ctx?.reply(SUPPORT_MESSAGE);
});

export { bot };
