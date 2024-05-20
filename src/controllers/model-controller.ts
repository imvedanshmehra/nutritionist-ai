import {
  defaultModel,
  openai,
  systemPrompt,
  modelConfig,
  visionModel,
  groq,
} from "../helpers/ai-model";
import { UserRole } from "../types/events.type";

// Chat withe default model
export const defaultModelChat = async (
  chatHistory: { text: string; role: UserRole }[]
) => {
  try {
    const response = groq.chat.completions.create({
      model: defaultModel,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...chatHistory?.map((chat) => ({
          role: chat?.role,
          content: chat?.text,
        })),
      ],
      ...modelConfig,
    });

    return response;
  } catch (err) {
    throw err;
  }
};

// Extract info about the image using vision, TODO: Use some other cost effective model for this
export const visionChat = async (
  imagePath: string,
  chatHistory: { role: UserRole; text: string }[],
  caption?: string
) => {
  try {
    const response = await openai.chat.completions.create({
      model: visionModel,
      messages: [
        ...chatHistory?.map((chat) => ({
          role: chat?.role,
          content: chat?.text,
        })),
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: caption || "",
            },
            {
              type: "image_url",
              image_url: {
                url: `https://api.telegram.org/file/bot${process?.env?.BOT_TOKEN}/${imagePath}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1024,
    });

    return response;
  } catch (err) {
    throw err;
  }
};
