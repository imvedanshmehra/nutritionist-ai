import { getSubscription } from "@lemonsqueezy/lemonsqueezy.js";
import { bot } from "../../config/bot-config";
import { getUser } from "../../controllers/users-controller";
import { Markup } from "telegraf";
import { ERROR_MESSAGE, SUPPORT_MESSAGE } from "../../globals/messages";

const manageSubCommand = () =>
  bot.command("manage", async (ctx) => {
    const fromUser = ctx?.update?.message?.from;
    const user = await getUser(fromUser?.id);

    if (!!user?.subscriptionId) {
      try {
        const response = await getSubscription(user?.subscriptionId!);
        ctx.replyWithHTML(
          `Please click on the <b>Manage Subscription</b> button below to manage your subscription.`,
          Markup.inlineKeyboard([
            [
              Markup.button.url(
                "Manage Subscription",
                response?.data?.data?.attributes?.urls?.customer_portal!
              ),
            ],
          ])
        );
      } catch (err) {
        console.log("err", err);
        await ctx?.reply(ERROR_MESSAGE);
        ctx?.reply(SUPPORT_MESSAGE);
      }
    } else {
      ctx?.reply("You don't have any active subscription");
    }
  });

export default manageSubCommand;
