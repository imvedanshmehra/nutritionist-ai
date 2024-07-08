import { Telegraf } from "telegraf";
import { errorMsg, supportMsg } from "../utils/globals";

const bot = new Telegraf(process.env.BOT_TOKEN || "");

bot.catch(async (err, ctx) => {
  console.log("An error occurred", err);
  await ctx?.reply(errorMsg);
  ctx?.reply(supportMsg);
});

export { bot };
