import { FastifyRequest, FastifyReply } from "fastify";
import { aiRecommend, aiChat } from "../services/gemini-service/aiService";

interface ChatRequestBody {
  messages: { text: string }[];
}

export async function aiRecommendController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { context } = request.body as { context: string };
  if (!context) return reply.code(400).send({ error: "Missing context" });

  const result = await aiRecommend(context, request.server.config);
  return reply.send(result);
}

export async function aiChatController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { messages } = request.body as ChatRequestBody;

  if (!Array.isArray(messages)) {
    return reply.code(400).send({ error: "Invalid message format" });
  }

  try {
    const result = await aiChat(messages, request.server.config);
    return reply.send(result);
  } catch (err: any) {
    return reply.code(500).send({ error: err.message });
  }
}
