import { message } from "telegraf/filters";
import "dotenv/config";
import dbConnect from "./config/db-config";
import {
  ERROR_MESSAGE,
  SUBSCRIBE_MESSAGE,
  SUPPORT_MESSAGE,
} from "./globals/messages";
import { bot } from "./config/bot-config";
import { getUser, updateUserTokens } from "./controllers/users-controller";
import {
  createEvent,
  createEvents,
  getAllEventsOfUser,
} from "./controllers/events-controller";
import { Event } from "./types/events.type";
import {
  defaultChatModel,
  visionChatModel,
} from "./controllers/model-controller";
import { Markup } from "telegraf";
import { getCheckoutURL } from "./utils/checkout";
import express from "express";
import { billingRouter } from "./routes/webhook/billing.routes";
import startCommand from "./commands/start";
import resetCommand from "./commands/reset";
import manageSubCommand from "./commands/manage-subscription";
import { subscriptionConfig } from "./config/payment-config";
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
            await ctx?.reply(ERROR_MESSAGE);
            ctx?.reply(SUPPORT_MESSAGE);
          }

          if (!!checkoutUrl) {
            ctx.replyWithHTML(
              `<b>${SUBSCRIBE_MESSAGE}</b>`,
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
      await ctx?.reply(ERROR_MESSAGE);
      ctx?.reply(SUPPORT_MESSAGE);
    }

    await next();
  });

  bot?.on(message("text"), async (ctx) => {
    const fromUser = ctx?.update?.message?.from;
    const messageText = ctx?.message?.text;

    let chatHistory: Event[] = [];

    // Show typing indicator
    bot?.telegram?.sendChatAction(ctx?.message?.chat?.id, "typing");

    try {
      // Fetch only last 20 conversations
      chatHistory = await getAllEventsOfUser(fromUser?.id);
      console.log("Last 20 chat history===> ", chatHistory);
    } catch (err) {
      console.log("error", err);
      await ctx?.reply("Cannot fetch our previous chat history.");
      ctx?.reply(SUPPORT_MESSAGE);
    }

    chatHistory?.push({
      role: "user",
      tgId: fromUser?.id.toString(),
      text: messageText,
    });

    try {
      const response = await defaultChatModel(chatHistory);

      const modelText =
        response?.choices[0]?.message?.content || "Please try again!";

      const modifiedText = modelText?.split(/\n\n/);

      chatHistory.push({
        role: "assistant",
        tgId: fromUser?.id.toString(),
        text: modelText,
      });

      // Send reply
      for (let chunk of modifiedText) {
        if (!!chunk) {
          const formattedResp = formatMessage(chunk);
          await ctx?.replyWithHTML(formattedResp);
        }
      }

      try {
        // Save user and assistant chat events
        await createEvents([
          { role: "user", tgId: fromUser?.id, text: messageText },
          { tgId: fromUser?.id, role: "assistant", text: modelText },
        ]);

        // Update tokens used by the user
        await updateUserTokens(
          fromUser?.id,
          response?.usage?.prompt_tokens || 0,
          response?.usage?.completion_tokens || 0,
          response?.usage?.total_tokens || 0
        );
      } catch (err) {
        console.log("err", err);
        await ctx?.reply(ERROR_MESSAGE);
        ctx?.reply(SUPPORT_MESSAGE);
      }
    } catch (err) {
      console.log("error", err);
      await ctx?.reply(ERROR_MESSAGE);
      ctx?.reply(SUPPORT_MESSAGE);
    }
  });

  bot?.on(message("photo"), async (ctx) => {
    const fromUser = ctx?.update?.message?.from;
    const photos = ctx?.update?.message?.photo;
    const caption = ctx?.update?.message?.caption;
    const file = await bot?.telegram?.getFile(
      photos[photos?.length - 1]?.file_id
    );
    let chatHistory: Event[] = [];

    // Send the typing action
    bot?.telegram?.sendChatAction(ctx?.message?.chat?.id, "typing");

    try {
      // Fetch only last 20 conversations
      chatHistory = await getAllEventsOfUser(fromUser?.id);
      console.log("Last 20 chat history===> ", chatHistory);
    } catch (err) {
      console.log("err", err);
      await ctx?.reply("Cannot fetch our previous chat history.");
      ctx?.reply(SUPPORT_MESSAGE);
    }

    if (!!caption) {
      chatHistory.push({
        tgId: fromUser?.id.toString(),
        role: "user",
        text: caption,
      });
    }

    // Extract image info
    try {
      const resp = await visionChatModel(
        file.file_path || "",
        chatHistory,
        caption
      );
      const visionModelResp =
        resp?.choices[0]?.message?.content || "Something went wrong!";
      const modifiedText = visionModelResp?.split(/\n\n/);

      // Send reply
      for (const chunk of modifiedText) {
        if (!!chunk) {
          const formattedMessage = formatMessage(chunk);
          await ctx?.replyWithHTML(formattedMessage);
        }
      }

      try {
        // Save user and assistant events
        if (!!caption) {
          await createEvent(fromUser?.id, "user", caption);
        }
        await createEvents([
          {
            tgId: fromUser?.id,
            role: "assistant",
            text: `${visionModelResp}`,
          },
          {
            tgId: fromUser?.id,
            role: "assistant",
            text: `${visionModelResp} ${caption}`,
          },
        ]);
        // Update tokens used by the user
        await updateUserTokens(
          fromUser?.id,
          resp?.usage?.prompt_tokens || 0,
          resp?.usage?.completion_tokens || 0,
          resp?.usage?.total_tokens || 0
        );
      } catch (err) {
        await ctx?.reply(ERROR_MESSAGE);
        ctx?.reply(SUPPORT_MESSAGE);
      }
    } catch (err) {
      console.log("err", err);
      await ctx?.reply("Cannot parse image");
      ctx?.reply(SUPPORT_MESSAGE);
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
