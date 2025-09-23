import { Role } from "@prisma/client";

export interface Config {
  GEMINI_API_KEY: string;
}

// Create a config object that implements the interface
export const config: Config = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
};

if (!config.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

export type UserPayload = {
  id: string;
  email: string;
  role: Role;
  storeId?: string;
};
