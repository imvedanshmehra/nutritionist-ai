import { createCheckout } from "@lemonsqueezy/lemonsqueezy.js";

export async function getCheckoutURL(
  userName: string,
  userId: string,
  chatId: string
) {
  const defaultVariantId = Number(process.env.PRODUCT_VARIANT_ID!);

  const checkout = await createCheckout(
    process.env.LEMONSQUEEZY_STORE_ID!,
    defaultVariantId,
    {
      checkoutOptions: {
        embed: false,
        media: false,
        logo: true,
        discount: true,
      },
      checkoutData: {
        name: userName,
        custom: {
          user_id: userId,
          chat_id: chatId,
        },
        discountCode: process?.env?.DISCOUNT_CODE,
      },
      productOptions: {
        enabledVariants: [defaultVariantId],
        redirectUrl: `http://www.nutritionistai.pro`,
        receiptThankYouNote: "Thank you for signing up to Nutritionist-AI ✨",
      },
    }
  );

  return checkout.data?.data.attributes.url;
}
