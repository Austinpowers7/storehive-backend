// import { FastifyInstance } from "fastify";
// import { StoreController } from "../controllers/store.controller";

// export default async function storeRoutes(fastify: FastifyInstance) {
//   // Create a new store
//   fastify.post(
//     "/",
//     {
//       preHandler: [fastify.authenticate],
//       schema: {
//         tags: ["Store"],
//         summary: "Create a new store",
//         body: {
//           type: "object",
//           required: ["name"],
//           properties: {
//             name: { type: "string" },
//           },
//         },
//         response: {
//           201: {
//             description: "Store created",
//             type: "object",
//             properties: {
//               id: { type: "string" },
//               name: { type: "string" },
//             },
//           },
//         },
//       },
//     },
//     StoreController.createStore
//   );

//   // List all stores
//   fastify.get(
//     "/",
//     {
//       schema: {
//         tags: ["Store"],
//         summary: "List all stores",
//         response: {
//           200: {
//             description: "Array of stores",
//             type: "array",
//             items: {
//               type: "object",
//               properties: {
//                 id: { type: "string" },
//                 name: { type: "string" },
//               },
//             },
//           },
//         },
//       },
//     },
//     StoreController.listStores
//   );

//   // Get a specific store by ID
//   fastify.get(
//     "/:storeId",
//     {
//       schema: {
//         tags: ["Store"],
//         summary: "Get store by ID",
//         params: {
//           type: "object",
//           properties: {
//             storeId: { type: "string" },
//           },
//           required: ["storeId"],
//         },
//         response: {
//           200: {
//             description: "Store object",
//             type: "object",
//             properties: {
//               id: { type: "string" },
//               name: { type: "string" },
//             },
//           },
//           404: {
//             description: "Store not found",
//             type: "object",
//             properties: {
//               message: { type: "string" },
//             },
//           },
//         },
//       },
//     },
//     StoreController.getStoreById
//   );
// }

import { FastifyInstance } from "fastify";
import { StoreController } from "../controllers/store.controller";

export default async function storeRoutes(fastify: FastifyInstance) {
  // Create a new store
  fastify.post(
    "/",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["Store"],
        summary: "Create a new store",
        description:
          "Owners can create stores under their own business. Admins must provide a businessId.",
        body: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string" },
            businessId: {
              type: "string",
              nullable: true,
              description: "Required only for Admin role",
            },
          },
        },
        response: {
          201: {
            description: "Store created",
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              businessId: { type: "string" },
            },
          },
        },
        security: [{ bearerAuth: [] }],
      },
    },
    StoreController.createStore
  );

  // List all stores
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Store"],
        summary: "List all stores",
        response: {
          200: {
            description: "Array of stores",
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                businessId: { type: "string" },
              },
            },
          },
        },
      },
    },
    StoreController.listStores
  );

  // Get a specific store by ID
  fastify.get(
    "/:storeId",
    {
      schema: {
        tags: ["Store"],
        summary: "Get store by ID",
        params: {
          type: "object",
          properties: {
            storeId: { type: "string" },
          },
          required: ["storeId"],
        },
        response: {
          200: {
            description: "Store object",
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              businessId: { type: "string" },
            },
          },
          404: {
            description: "Store not found",
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    StoreController.getStoreById
  );

  // Get stores by Business ID
  fastify.get(
    "/business/:businessId/stores",
    {
      schema: {
        tags: ["Store"],
        summary: "Get all stores for a business by businessId",
        params: {
          type: "object",
          properties: {
            businessId: { type: "string" },
          },
          required: ["businessId"],
        },
        response: {
          200: {
            description: "Stores retrieved successfully",
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                businessId: { type: "string" },
              },
            },
          },
          400: { description: "Invalid request" },
          500: { description: "Server error" },
        },
      },
    },
    StoreController.getStoresByBusinessId
  );
}
