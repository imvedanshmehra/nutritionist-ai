import { createOrUpdateUser } from "../controllers/users-controller";
import { errorMsg, supportMsg, welcomeMessage } from "../utils/globals";
import { bot } from "../config/bot";

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

      const message = await ctx?.reply(welcomeMessage(fromUser?.first_name));

      // Pin welcome message
      bot?.telegram?.unpinAllChatMessages(ctx?.message?.chat?.id);
      bot?.telegram?.pinChatMessage(
        ctx?.message?.chat?.id,
        message?.message_id
      );
    } catch (err) {
      console.log(err);
      await ctx?.reply(errorMsg);
      ctx?.reply(supportMsg);
    }
  });
};

export default startCommand;
