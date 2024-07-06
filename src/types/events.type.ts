export type UserRole = "user" | "assistant" | "system";

export interface Event {
  text: string;
  role: UserRole;
}
