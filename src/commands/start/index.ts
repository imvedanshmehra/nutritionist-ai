import { createOrUpdateUser } from "../../controllers/users-controller";
import {
  ERROR_MESSAGE,
  SUPPORT_MESSAGE,
  WELCOME_MESSAGE,
} from "../../globals/messages";
import { bot } from "../../config/bot-config";

const startCommand = () => {
  return bot?.start(async (ctx) => {
    const fromUser = ctx?.update?.message?.from;
    const { id, first_name, last_name = "", is_bot, username = "" } = fromUser;

    // Check if the user is a bot
    if (fromUser?.is_bot) {
      ctx?.reply("Sorry! Bots are not allowed 🤖");
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
        chatId: ctx?.update?.message?.chat?.id,
      });

      const message = await ctx?.reply(WELCOME_MESSAGE(fromUser?.first_name));

      // Pin welcome message
      bot?.telegram?.unpinAllChatMessages(ctx?.message?.chat?.id);
      bot?.telegram?.pinChatMessage(
        ctx?.message?.chat?.id,
        message?.message_id
      );
    } catch (err) {
      console.log(err);
      await ctx?.reply(ERROR_MESSAGE);
      ctx?.reply(SUPPORT_MESSAGE);
    }
  });
};

export default startCommand;
