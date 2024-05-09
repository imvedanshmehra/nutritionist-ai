import { bot } from "../config/bot";
import { deleteAllEventsOfUser } from "../controllers/events-controller";
import { welcomeMessage } from "../utils/globals";

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
      ctx?.reply(
        "Oops! This was unexpected but something went wrong! Please try again in sometime 😭"
      );
    }
  });

export default resetCommand;
