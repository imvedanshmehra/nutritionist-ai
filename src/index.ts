import { message } from "telegraf/filters";
import "dotenv/config";
import dbConnect from "./config/db";
import { welcomeMessage } from "./utils/globals";
import { bot } from "./config/bot";
import { createOrUpdateUser } from "./controllers/users-controller";
import {
  createEvent,
  deleteAllEventsOfUser,
  getAllEventsOfUser,
} from "./controllers/events-controller";
import { UserRole } from "./types/events.type";
import { defaultModelChat, visionChat } from "./controllers/model-controller";

try {
  dbConnect();
  console.log("Successfully connected to the database!");
} catch (err) {
  console.log("DB Connection Failed!", err);
  process?.kill(process?.pid, "SIGTERM");
}

bot?.start(async (ctx) => {
  const fromUser = ctx?.update?.message?.from;
  const { id, first_name, last_name = "", is_bot, username = "" } = fromUser;

  // Check if the user is a bot
  if (fromUser?.is_bot) {
    ctx?.reply("Sorry! Bots are not allowed.");
    return;
  }

  // Send typing action
  bot?.telegram?.sendChatAction(ctx?.message?.chat?.id, "typing");

  try {
    // Create a new user in DB for new users
    await createOrUpdateUser({
      tgId: id,
      firstName: first_name,
      lastName: last_name,
      isBot: is_bot,
      username,
    });

    const message = await ctx?.reply(welcomeMessage(fromUser?.first_name));

    // Pin welcome message
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
    await deleteAllEventsOfUser(fromUser?.id);
    // Send the welcome message
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
    ctx?.reply("Cannot fetch our previous chat history.");
  }

  try {
    const response = await defaultModelChat(chatHistory);

    const modelText =
      response?.choices[0]?.message?.content || "Please try again!";

    // Save assistant event
    try {
      await createEvent(fromUser?.id, "assistant", modelText);
    } catch (err) {
      ctx?.reply("Something went wrong!");
    }

    // Reply to the user
    ctx?.reply(modelText);
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

  let chatHistory: { text: string; role: UserRole }[] = [];

  // Fetch previous chat history
  try {
    chatHistory = await getAllEventsOfUser(fromUser?.id);
  } catch (err) {
    console.log("err", err);
    ctx?.reply("Cannot fetch our previous chat history.");
  }

  // Extract image info
  try {
    const imageInfo = await visionChat(file.file_path || "", chatHistory);
    const visionModelResp = imageInfo?.choices[0]?.message?.content;

    // Store user event
    try {
      await createEvent(fromUser?.id, "user", `${visionModelResp} ${caption}`);
    } catch (err) {
      console.log("err", err);
    }
  } catch (err) {
    console.log("err", err);
    ctx?.reply("Cannot parse image");
  }

  // Parse extracted image info with model
  try {
    // Fetch latest chat history
    try {
      chatHistory = await getAllEventsOfUser(fromUser?.id);
    } catch (err) {
      console.log("err", err);
      ctx?.reply("Cannot fetch our previous chat history.");
    }

    const response = await defaultModelChat(chatHistory);
    const modelResponse =
      response?.choices[0]?.message?.content || "Something went wrong!";

    // Store assistant event
    try {
      await createEvent(fromUser?.id, "assistant", modelResponse);
    } catch (err) {
      console.log("err", err);
    }

    // Reply to the user
    ctx?.reply(modelResponse);
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
