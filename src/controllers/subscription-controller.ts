import { Response } from "express";
import crypto from "node:crypto";
import { webhookHasMeta } from "../lib/typeguards";
import { updateUserSubStatus } from "./users-controller";
import { bot } from "../config/bot";
import { supportMsg, userPaidMessage } from "../utils/globals";

export const getSubscriptionEvent = (req: any, res: Response) => {
  if (!process.env.LEMONSQUEEZY_WEBHOOK_SECRET) {
    return new Response("Lemon Squeezy Webhook Secret not set in .env", {
      status: 500,
    });
  }

  // First, make sure the request is from Lemon Squeezy.
  const rawBody = req?.rawBody;
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  const hmac = crypto.createHmac("sha256", secret);
  const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
  const signature = Buffer.from(req.get("X-Signature") || "", "utf8");

  if (!crypto.timingSafeEqual(digest, signature)) {
    throw new Error("Invalid signature.");
  }

  const data = req?.body as any;

  // Type guard to check if the object has a 'meta' property.
  if (webhookHasMeta(data)) {
    // Send thank you message after subscribing
    if (data?.meta?.event_name === "subscription_created") {
      bot?.telegram
        ?.sendMessage(data?.meta?.custom_data?.chat_id, userPaidMessage)
        ?.then(() => {
          bot?.telegram
            ?.sendMessage(
              data?.meta?.custom_data?.chat_id,
              "It might take us a few seconds to activate your subscription ⏳"
            )
            ?.then(() => {
              bot?.telegram?.sendMessage(
                data?.meta?.custom_data?.chat_id,
                supportMsg
              );
            });
        });
    }

    updateUserSubStatus(
      data?.meta?.custom_data?.user_id,
      data?.data?.id,
      data?.data?.attributes?.status
    );
    return res.status(200).send("Ok");
  }
  return res.status(400).send("Data Invalid");
};
