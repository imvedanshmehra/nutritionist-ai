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
