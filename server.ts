import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import "dotenv/config";
import userModel from "./src/models/users";
import eventsModel from "./src/models/events";
import dbConnect from "./src/config/db";
import {
  openai,
  config,
  defaultModel,
  systemPrompt,
} from "./src/helpers/open-ai";
import { welcomeMessage } from "./src/utils/globals";

const bot = new Telegraf(process.env.BOT_TOKEN || "");

try {
  dbConnect();
  console.log("Successfully connected to the database!");
} catch (err) {
  console.log("DB Connection Failed!", err);
  process?.kill(process?.pid, "SIGTERM");
}

bot?.start(async (ctx) => {
  const fromUser = ctx?.update?.message?.from;
  if (fromUser?.is_bot) {
    ctx?.reply("Sorry! Bots are not allowed.");
    return;
  }

  try {
    await userModel.findOneAndUpdate(
      { tgId: fromUser?.id },
      {
        $setOnInsert: {
          firstName: fromUser?.first_name,
          lastName: fromUser?.last_name,
          isBot: fromUser?.is_bot,
          username: fromUser?.username,
        },
      },
      { upsert: true, new: true }
    );

    const message = await ctx?.reply(welcomeMessage(fromUser?.first_name));
    bot?.telegram?.unpinAllChatMessages(ctx?.message?.chat?.id);
    bot?.telegram?.pinChatMessage(ctx?.message?.chat?.id, message?.message_id);
  } catch (err) {
    console.log(err);
    ctx?.reply(
      "Oops! This was unexpected but something went wrong! Please try again in sometime 😭"
    );
  }
});

bot.command("reset", async (ctx) => {
  const fromUser = ctx?.update?.message?.from;
  try {
    await eventsModel?.deleteMany({
      tgId: fromUser?.id,
    });

    ctx?.reply(welcomeMessage(fromUser?.first_name));
  } catch (err) {
    console.log("err", err);
    ctx?.reply(
      "Oops! This was unexpected but something went wrong! Please try again in sometime 😭"
    );
  }
});

bot?.on(message("text"), async (ctx) => {
  const fromUser = ctx?.update?.message?.from;
  const messageText = ctx?.message?.text;
  let chatHistory: { text: string; role: "user" | "assistant" }[] = [];

  // Store user message in the DB
  await eventsModel?.create({
    tgId: fromUser?.id,
    role: "user",
    text: messageText,
  });

  // Fetch previous chat history
  try {
    chatHistory = await eventsModel?.find({
      tgId: fromUser?.id,
    });
  } catch (err) {
    console.log("err", err);
    ctx?.reply("Cannot fetch our previous chat history.");
  }

  try {
    const response = await openai.chat.completions.create({
      model: defaultModel,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...chatHistory?.map((chat) => ({
          role: chat?.role,
          content: chat?.text,
        })),
      ],
      ...config,
    });

    // Store assistant message in DB
    try {
      await eventsModel?.create({
        tgId: fromUser?.id,
        role: "assistant",
        text: response?.choices[0]?.message?.content,
      });
    } catch (err) {
      console.log("err", err);
    }

    // Reply to the user
    ctx?.reply(
      response?.choices[0]?.message?.content || "Something went wrong"
    );
  } catch (err) {
    console.log("error", err);
    ctx?.reply(
      "Oops! This was unexpected but something went wrong! Please try again in sometime 😭"
    );
  }
});

bot?.on(message("photo"), async (ctx) => {
  const fromUser = ctx?.update?.message?.from;
  const photos = ctx?.update?.message?.photo;
  const caption = ctx?.update?.message?.caption;
  const file = await bot?.telegram?.getFile(
    photos[photos?.length - 1]?.file_id
  );
  let chatHistory: { text: string; role: "user" | "assistant" }[] = [];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content:
            "Extract the ingredients of the food item or tell which food item is it if the ingredients in not shown",
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `https://api.telegram.org/file/bot${process?.env?.BOT_TOKEN}/${file.file_path}`,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    const textResp = response?.choices[0]?.message?.content;

    // Store user message in the DB
    await eventsModel?.create({
      tgId: fromUser?.id,
      role: "user",
      text: `${textResp} ${caption}`,
    });

    // Fetch previous chat history
    try {
      chatHistory = await eventsModel?.find({
        tgId: fromUser?.id,
      });
    } catch (err) {
      console.log("err", err);
      ctx?.reply("Cannot fetch our previous chat history.");
    }
  } catch (err) {
    console.log("err", err);
    ctx?.reply("Cannot parse image");
  }

  try {
    const response = await openai.chat.completions.create({
      model: defaultModel,
      messages: [
        {
          role: "system",
          content:
            "Act as a AI nutritionist, you are developed to help people choose healthier habits by telling them what is healthy for them and what is not. You will be provided a list of ingredients used in a food product or an image of the ingredients label on the packaged food and you have to tell, how good/bad it is and what's it's impact on the health as a certified nutritionist would tell. Please respond in a friendly and professional manner and use emojis in your response",
        },
        ...chatHistory?.map((chat) => ({
          role: chat?.role,
          content: chat?.text,
        })),
      ],
      ...config,
    });

    // Store assistant message in DB
    try {
      await eventsModel?.create({
        tgId: fromUser?.id,
        role: "assistant",
        text: response?.choices[0]?.message?.content,
      });
    } catch (err) {
      console.log("err", err);
    }

    // Reply to the user
    ctx?.reply(
      response?.choices[0]?.message?.content || "Something went wrong"
    );
  } catch (err) {
    console.log("error", err);
    ctx?.reply(
      "Oops! This was unexpected but something went wrong! Please try again in sometime 😭"
    );
  }
});

bot?.launch();

// Enable graceful stop
process?.once("SIGINT", () => bot.stop("SIGINT"));
process?.once("SIGTERM", () => bot.stop("SIGTERM"));
