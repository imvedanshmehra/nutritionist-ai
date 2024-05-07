import userModel from "../models/users";
import { UserType } from "../types/users.type";

export const createOrUpdateUser = async (user: UserType) => {
  const { tgId, firstName, lastName, isBot, username } = user;

  try {
    const user = await userModel.findOneAndUpdate(
      { tgId },
      {
        $setOnInsert: {
          firstName,
          lastName,
          isBot,
          username,
        },
      },
      { upsert: true, new: true }
    );

    return user;
  } catch (err) {
    throw err;
  }
};

export const updateUserTokens = async (
  tgId: number,
  promptTokens: number,
  completionTokens: number,
  totalTokens: number
) => {
  try {
    const response = await userModel.findOneAndUpdate(
      { tgId },
      {
        $inc: {
          promptTokens,
          completionTokens,
          totalTokens,
        },
      }
    );

    return response;
  } catch (err) {
    throw err;
  }
};
