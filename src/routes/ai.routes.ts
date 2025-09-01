import { FastifyInstance } from "fastify";
import {
  aiRecommendController,
  aiChatController,
} from "../controllers/ai.controller";

export default async function aiRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/recommend",
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ["AI"],
        description: "Get personalized AI lesson recommendations",
        body: {
          type: "object",
          required: ["context"],
          properties: {
            context: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    subject: { type: "string" },
                    duration: { type: "string" },
                    difficulty: { type: "string" },
                    rating: { type: "number" },
                    isAIRecommended: { type: "boolean" },
                    thumbnail: { type: "string" },
                    progress: { type: "number" },
                  },
                },
              },
            },
          },
          400: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    aiRecommendController
  );

  fastify.post(
    "/chat",
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ["AI"],
        description: "Chat with AI assistant",
        body: {
          type: "object",
          required: ["messages"],
          properties: {
            messages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  image: { type: "string", format: "binary" },
                  audio: { type: "string", format: "binary" },
                  video: { type: "string", format: "binary" },
                  pdf: { type: "string", format: "binary" },
                  mimeType: { type: "string" }, // e.g., "image/png", "application/pdf"
                },
                additionalProperties: false,
              },
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              answer: { type: "string" },
            },
          },
          400: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    aiChatController
  );
}
