import userModel from "../models/users";
import { UserType } from "../types/users.type";

export const getUser = async (userId: number) => {
  try {
    const user = await userModel?.findOne({ tgId: userId });
    return user;
  } catch (err) {
    throw err;
  }
};

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

// Update user subscription status
export const updateUserSubStatus = async (
  tgId: number | string,
  subscriptionId: string,
  status: string
) => {
  try {
    const response = await userModel.findOneAndUpdate(
      { tgId },
      {
        subscriptionId,
        subscriptionStatus: status,
      }
    );

    return response;
  } catch (err) {
    throw err;
  }
};
