import { bot } from "../config/bot";
import { deleteAllEventsOfUser } from "../controllers/events-controller";
import { errorMsg, supportMsg, welcomeMessage } from "../utils/globals";

const resetCommand = () =>
  bot.command("reset", async (ctx) => {
    const fromUser = ctx?.update?.message?.from;

    try {
      await deleteAllEventsOfUser(fromUser?.id);
      // Send the welcome message
      ctx?.reply(
        "All your previous chat history are wiped off from our server."
      );
      ctx?.reply(welcomeMessage(fromUser?.first_name));
    } catch (err) {
      console.log("err", err);
      await ctx?.reply(errorMsg);
      ctx?.reply(supportMsg);
    }
  });

export default resetCommand;
