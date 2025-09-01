import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import sharp from "sharp";
import Tesseract from "tesseract.js";

export async function ocrRoute(fastify: FastifyInstance) {
  fastify.route({
    method: "POST",
    url: "/ocr",
    schema: {
      tags: ["OCR"],
      summary: "Perform OCR on uploaded image",
      consumes: ["multipart/form-data"],
      body: {
        type: "object",
        required: ["file"],
        properties: {
          file: {
            type: "string",
            format: "binary",
            description: "Image file to upload",
          },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            text: { type: "string" },
          },
        },
        400: {
          type: "object",
          properties: {
            error: { type: "string" },
          },
        },
        500: {
          type: "object",
          properties: {
            error: { type: "string" },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        // Parse the multipart form data first
        await request.parseMultipart();

        // Now you can safely call request.file()
        const file = await request.file();

        if (!file || !file.mimetype.startsWith("image/")) {
          return reply
            .status(400)
            .send({ error: "Please upload a valid image file." });
        }

        const buffer = await file.toBuffer();

        const processedImage = await sharp(buffer)
          .resize({ width: 1000 })
          .grayscale()
          .gamma()
          .toBuffer();

        const result = await Tesseract.recognize(processedImage, "eng");

        return { text: result.data.text.trim() };
      } catch (err) {
        request.log.error(err);
        return reply.status(500).send({ error: "Failed to process image." });
      }
    },
  });
}
