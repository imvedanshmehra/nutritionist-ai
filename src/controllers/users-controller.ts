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
