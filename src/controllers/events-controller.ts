import eventsModel from "../models/events";
import { UserRole } from "../types/events.type";

export const getAllEventsOfUser = async (tgId: number) => {
  try {
    const response = await eventsModel?.find({
      tgId,
    });

    return response;
  } catch (err) {
    throw err;
  }
};

export const getLastNEventsOfUser = async (
  tgId: number,
  limit: number = 20
) => {
  const count = await eventsModel.countDocuments();
  const skipCount = Math.max(count - limit, 0);
  console.log("count==> ", count);
  console.log("skipCount==> ", skipCount);
  try {
    const response = await eventsModel
      ?.find({
        tgId,
      })
      .sort({ _id: 1 })
      .skip(skipCount)
      .limit(limit);

    return response;
  } catch (err) {
    throw err;
  }
};

// Create single event
export const createEvent = async (
  tgId: number,
  role: UserRole,
  text: string
) => {
  try {
    const response = await eventsModel?.create({
      tgId,
      role,
      text,
    });

    return response;
  } catch (err) {
    throw err;
  }
};

// Create multiple events
export const createEvents = async (
  events: { tgId: number; role: UserRole; text: string }[]
) => {
  try {
    const response = await eventsModel?.insertMany(events);
    return response;
  } catch (err) {
    throw err;
  }
};

export const deleteAllEventsOfUser = async (tgId: number) => {
  try {
    const response = await eventsModel?.deleteMany({
      tgId: tgId,
    });

    return response;
  } catch (err) {
    throw err;
  }
};
