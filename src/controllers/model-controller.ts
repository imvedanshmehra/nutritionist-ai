import {
  openai,
  systemPrompt,
  modelConfig,
  groq,
} from "../config/model-config";
import { aiModels } from "../globals/model-globals";
import { UserRole } from "../types/events.type";

// Default model for chat
export const defaultChatModel = async (
  chatHistory: { text: string; role: UserRole }[]
) => {
  try {
    const response = groq.chat.completions.create({
      model: aiModels.LLAMA3_70B,
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
export const visionChatModel = async (
  imagePath: string,
  chatHistory: { role: UserRole; text: string }[],
  caption?: string
) => {
  try {
    const response = await openai.chat.completions.create({
      model: aiModels.GPT_4O,
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
