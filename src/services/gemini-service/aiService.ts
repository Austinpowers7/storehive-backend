import { GeminiEnvSchema } from "../../types";
import {
  aiRecommend as aiRecommendFn,
  aiChat as aiChatFn,
} from "@src/services/gemini-service/gemini-ai";

export const aiConfig: GeminiEnvSchema = {
  JWT_SECRET: process.env.JWT_SECRET!,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
};

export type Message = {
  text?: string;
  image?: string; // base64-encoded
  audio?: string;
  video?: string;
  pdf?: string;
  mimeType?: string;
};

export async function aiRecommend(context: string, config: GeminiEnvSchema) {
  return aiRecommendFn(context, config);
}

export async function aiChat(messages: Message[], config: GeminiEnvSchema) {
  return aiChatFn(messages, config);
}
