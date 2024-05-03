import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import "dotenv/config";
import userModel from "./src/models/users";
import eventsModel from "./src/models/events";
import dbConnect from "./src/config/db";
import { openai, config, model } from "./src/helpers/open-ai";

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

    ctx?.reply(
      `Hello ${fromUser?.first_name}! Welcome to Nutritionist AI 🚀 Just tell me the ingredients of a food item or upload an image of the food ingredients label found (mostly) at the back of the packaged food. Let's start making healthier choices everyday ✨`
    );
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

    ctx?.reply(
      `Hello ${fromUser?.first_name}! Welcome to Nutritionist AI 🚀 Just tell me the ingredients of a food item or upload an image of the food ingredients label found (mostly) at the back of the packaged food. Let's start making healthier choices everyday ✨`
    );
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
      model,
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

// TODO: Extract text from the image and send it to OpenAI.
bot?.on(message("photo"), async (ctx) => {
  const photo = ctx?.update?.message?.photo;
  console.log("photo===> ", photo);
  ctx.reply("Photo received");
});

bot?.launch();

// Enable graceful stop
process?.once("SIGINT", () => bot.stop("SIGINT"));
process?.once("SIGTERM", () => bot.stop("SIGTERM"));
