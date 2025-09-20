import { FastifyInstance } from "fastify";
import { AuthController } from "@src/controllers/auth.controller";
import { ROLE_TYPES } from "@src/constants/roleTypes";

export default async function authRoutes(fastify: FastifyInstance) {
  // User registration
  fastify.post(
    "/register",
    {
      schema: {
        tags: ["Auth"],
        summary: "Register a new user",
        body: {
          type: "object",
          required: [
            "email",
            "password",
            "role",
            "firstName",
            "lastName",
            "phoneNumber",
          ],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 6 },
            role: {
              type: "string",
              enum: ROLE_TYPES,
            },
            firstName: { type: "string" },
            lastName: { type: "string" },
            phoneNumber: { type: "string" },
            storeId: { type: "string" },
            businessName: {
              type: "string",
              description: "Required if role is OWNER",
            },
            address: { type: "string" },
            registrationNumber: { type: "string" },
          },
        },

        response: {
          201: {
            description: "User registered successfully",
            type: "object",
            properties: {
              id: { type: "string" },
              email: { type: "string" },
              role: { type: "string" },
              firstName: { type: "string" },
              lastName: { type: "string" },
              phoneNumber: { type: "string" },
              business: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    AuthController.register
  );

  // User login
  fastify.post(
    "/login",
    {
      schema: {
        tags: ["Auth"],
        summary: "Login a user",
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Login successful",
            type: "object",
            properties: {
              token: { type: "string" },
              user: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  email: { type: "string" },
                  role: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    AuthController.login
  );

  // Cashier session creation
  fastify.post(
    "/session",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["Sessions"],
        summary: "Create a cashier session",
        description:
          "Generates a session code and QR code for cashier to start a shift",
        body: {
          type: "object",
          required: ["storeId"],
          properties: {
            storeId: { type: "string" },
          },
        },
        response: {
          201: {
            description: "Session created",
            type: "object",
            properties: {
              id: { type: "string" },
              sessionCode: { type: "string" },
              qrCode: { type: "string" },
              active: { type: "boolean" },
              storeId: { type: "string" },
              cashierId: { type: "string" },
              createdAt: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
    AuthController.createCashierSession
  );
}
