import { bot } from "../../config/bot-config";
import { deleteAllEventsOfUser } from "../../controllers/events-controller";
import {
  ERROR_MESSAGE,
  SUPPORT_MESSAGE,
  WELCOME_MESSAGE,
} from "../../globals/messages";

const resetCommand = () =>
  bot.command("reset", async (ctx) => {
    const fromUser = ctx?.update?.message?.from;

    try {
      await deleteAllEventsOfUser(fromUser?.id);
      // Send the welcome message
      ctx?.reply(
        "All your previous chat history are wiped off from our server."
      );
      ctx?.reply(WELCOME_MESSAGE(fromUser?.first_name));
    } catch (err) {
      console.log("err", err);
      await ctx?.reply(ERROR_MESSAGE);
      ctx?.reply(SUPPORT_MESSAGE);
    }
  });

export default resetCommand;
