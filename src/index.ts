import { message } from "telegraf/filters";
import "dotenv/config";
import dbConnect from "./config/db";
import { errorMsg, subscribeMessage, supportMsg } from "./utils/globals";
import { bot } from "./config/bot";
import { getUser, updateUserTokens } from "./controllers/users-controller";
import {
  createEvent,
  getAllEventsOfUser,
} from "./controllers/events-controller";
import { UserRole } from "./types/events.type";
import { defaultModelChat, visionChat } from "./controllers/model-controller";
import { Markup } from "telegraf";
import { getCheckoutURL } from "./helpers/checkout";
import express from "express";
import { billingRouter } from "./routes/webhook/billing.routes";
import startCommand from "./commands/start";
import resetCommand from "./commands/reset";
import manageSubCommand from "./commands/manage-subscription";
import { subscriptionConfig } from "./config/subscription-config";
import { sendPushNotifications } from "./utils/push-notifications";
import { formatMessage } from "./utils/chat-helper";

const app = express();

const main = async () => {
  // Connect to DB
  try {
    dbConnect();
    console.log("Successfully connected to the database!");
  } catch (err) {
    console.log("DB Connection Failed!", err);
    process?.kill(process?.pid, "SIGTERM");
  }

  // Set the bot API endpoint
  app.use(
    await bot.createWebhook({
      domain: process?.env?.DOMAIN!,
    })
  );

  // Initialize subscription config
  subscriptionConfig();

  // Routes
  app.use("/billing/webhook", billingRouter);

  // Commands
  startCommand();
  resetCommand();
  manageSubCommand();

  // TODO: Send push notifications
  // sendPushNotifications();

  bot.use(async (ctx, next) => {
    const fromUser = ctx?.from;
    // If free user and limit exceeded
    try {
      if (!!fromUser?.id) {
        const user = await getUser(fromUser?.id);
        // If user is unpaid and free limit is over
        if (
          user &&
          user?.totalTokens >= Number(process?.env?.FREE_TOKEN_LIMIT) &&
          user?.subscriptionStatus !== ("active" || "paid")
        ) {
          let checkoutUrl: string | undefined = "";

          try {
            checkoutUrl = await getCheckoutURL(
              `${fromUser?.first_name} ${fromUser?.last_name}`,
              String(fromUser?.id),
              String(ctx?.chat?.id)
            );
          } catch (error) {
            console.log("err", error);
            await ctx?.reply(errorMsg);
            ctx?.reply(supportMsg);
          }

          if (!!checkoutUrl) {
            ctx.replyWithHTML(
              `<b>${subscribeMessage}</b>`,
              Markup.inlineKeyboard([
                [Markup.button.url("Subscribe 🚀", checkoutUrl)],
              ])
            );
          }
          return;
        }
      }
    } catch (err) {
      console.log("err", err);
      await ctx?.reply(errorMsg);
      ctx?.reply(supportMsg);
    }

    await next();
  });

  bot?.on(message("text"), async (ctx) => {
    const fromUser = ctx?.update?.message?.from;
    const messageText = ctx?.message?.text;
    let chatHistory: { text: string; role: UserRole }[] = [];

    // Send the typing action
    bot?.telegram?.sendChatAction(ctx?.message?.chat?.id, "typing");

    // Save user event
    try {
      await createEvent(fromUser?.id, "user", messageText);
    } catch (err) {
      ctx?.reply("Something went wrong!");
    }

    try {
      // Fetch and store previous chat history
      chatHistory = await getAllEventsOfUser(fromUser?.id);
    } catch (err) {
      console.log("error", err);
      await ctx?.reply("Cannot fetch our previous chat history.");
      ctx?.reply(supportMsg);
    }

    try {
      const response = await defaultModelChat(chatHistory);

      const modelText =
        response?.choices[0]?.message?.content || "Please try again!";

      const modifiedText = modelText?.split(/\n\n/);
      // Save assistant event
      try {
        await createEvent(fromUser?.id, "assistant", modelText);
        await updateUserTokens(
          fromUser?.id,
          response?.usage?.prompt_tokens || 0,
          response?.usage?.completion_tokens || 0,
          response?.usage?.total_tokens || 0
        );
      } catch (err) {
        await ctx?.reply(errorMsg);
        ctx?.reply(supportMsg);
      }

      // Reply to the user
      for (let chunk of modifiedText) {
        if (!!chunk) {
          const formattedResp = formatMessage(chunk);

          await ctx?.replyWithHTML(formattedResp);
        }
      }
    } catch (err) {
      console.log("error", err);
      await ctx?.reply(errorMsg);
      ctx?.reply(supportMsg);
    }
  });

  bot?.on(message("photo"), async (ctx) => {
    const fromUser = ctx?.update?.message?.from;
    const photos = ctx?.update?.message?.photo;
    const caption = ctx?.update?.message?.caption;
    const file = await bot?.telegram?.getFile(
      photos[photos?.length - 1]?.file_id
    );

    // Send the typing action
    bot?.telegram?.sendChatAction(ctx?.message?.chat?.id, "typing");

    let chatHistory: { text: string; role: UserRole }[] = [];

    // Save user event
    if (!!caption) {
      try {
        await createEvent(fromUser?.id, "user", caption);
      } catch (err) {
        ctx?.reply("Something went wrong!");
      }
    }

    // Fetch previous chat history
    try {
      chatHistory = await getAllEventsOfUser(fromUser?.id);
    } catch (err) {
      console.log("err", err);
      await ctx?.reply("Cannot fetch our previous chat history.");
      ctx?.reply(supportMsg);
    }

    // Extract image info
    try {
      const resp = await visionChat(file.file_path || "", chatHistory, caption);
      const visionModelResp =
        resp?.choices[0]?.message?.content || "Something went wrong!";
      const modifiedText = visionModelResp?.split(/\n\n/);

      // Store assistant event
      try {
        await updateUserTokens(
          fromUser?.id,
          resp?.usage?.prompt_tokens || 0,
          resp?.usage?.completion_tokens || 0,
          resp?.usage?.total_tokens || 0
        );
        await createEvent(fromUser?.id, "assistant", visionModelResp);
      } catch (err) {
        await ctx?.reply(errorMsg);
        ctx?.reply(supportMsg);
      }

      // Reply to the user
      for (const chunk of modifiedText) {
        if (!!chunk) {
          const formattedMessage = formatMessage(chunk);
          await ctx?.replyWithHTML(formattedMessage);
        }
      }

      // Store user event
      try {
        await createEvent(
          fromUser?.id,
          "assistant",
          `${visionModelResp} ${caption}`
        );
      } catch (err) {
        console.log("err", err);
      }
    } catch (err) {
      console.log("err", err);
      await ctx?.reply("Cannot parse image");
      ctx?.reply(supportMsg);
    }
  });

  bot?.launch();

  // Enable graceful stop
  process?.once("SIGINT", () => bot.stop("SIGINT"));
  process?.once("SIGTERM", () => bot.stop("SIGTERM"));

  // Start the express server
  app.listen(process?.env?.PORT, () =>
    console.log("Listening on port", process?.env?.PORT)
  );
};

main();
