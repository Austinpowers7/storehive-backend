import { FastifyInstance } from "fastify";
import { CheckoutController } from "../controllers/checkout.controller";

export default async function checkoutRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["Checkout"],
        summary: "Create a checkout order",
        description:
          "Allows a customer to create an order after self-scanning products.",
        body: {
          type: "object",
          required: ["storeId", "items", "paidOnline"],
          properties: {
            storeId: { type: "string" },
            items: {
              type: "array",
              items: {
                type: "object",
                required: ["productId", "quantity"],
                properties: {
                  productId: { type: "string" },
                  quantity: { type: "number" },
                },
              },
            },
            paidOnline: { type: "boolean" },
          },
        },

        response: {
          201: {
            description: "Order created",
            type: "object",
            properties: {
              id: { type: "string" },
              total: { type: "number" },
              paidOnline: { type: "boolean" },
              cashierConfirmed: { type: "boolean" },
              createdAt: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
    CheckoutController.createOrder
  );

  fastify.post(
    "/confirm/:orderId",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["Checkout"],
        summary: "Confirm an order at cashier",
        description:
          "Allows a cashier to confirm a previously created self-checkout order.",
        params: {
          type: "object",
          required: ["orderId"],
          properties: {
            orderId: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Order confirmed",
            type: "object",
            properties: {
              id: { type: "string" },
              cashierConfirmed: { type: "boolean" },
            },
          },
        },
      },
    },
    CheckoutController.confirmOrder
  );

  // List orders by store (Manager or Owner only)
  fastify.get(
    "/store/:storeId",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["Checkout"],
        summary: "List all orders for a store",
        description: "Only MANAGER and OWNER can view store orders.",
        params: {
          type: "object",
          required: ["storeId"],
          properties: {
            storeId: { type: "string" },
          },
        },
      },
    },
    CheckoutController.listOrdersByStore
  );

  // List orders by cashier (Manager or Owner only)
  fastify.get(
    "/cashier/:cashierId",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["Checkout"],
        summary: "List all orders confirmed by a specific cashier",
        description: "Only MANAGER and OWNER can view cashier orders.",
        params: {
          type: "object",
          required: ["cashierId"],
          properties: {
            cashierId: { type: "string" },
          },
        },
      },
    },
    CheckoutController.listOrdersByCashier
  );
}
