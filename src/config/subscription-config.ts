import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

export function subscriptionConfig() {
  const requiredVars = [
    "LEMON_SQUEEZY_API_KEY",
    "LEMONSQUEEZY_STORE_ID",
    "LEMONSQUEEZY_WEBHOOK_SECRET",
  ];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  // Throw error if env vars are missing
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required LEMONSQUEEZY env variables: ${missingVars.join(
        ", "
      )}. Please, set them in your .env file.`
    );
  }

  lemonSqueezySetup({
    apiKey: process.env.LEMON_SQUEEZY_API_KEY,
    onError: (error) => {
      console.log("error", error);
      throw new Error(`Lemon Squeezy API error: ${error.message}`);
    },
  });
}
