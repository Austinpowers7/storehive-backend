import { FastifyInstance } from "fastify";
import { ProductController } from "../controllers/product.controller";

export default async function productRoutes(fastify: FastifyInstance) {
  // List products by store
  fastify.get(
    "/stores/:storeId/products",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["Products"],
        summary: "List products for a store",
        description: "Returns all active products in a given store",
        params: {
          type: "object",
          properties: {
            storeId: { type: "string", description: "Store ID" },
          },
          required: ["storeId"],
        },
        response: {
          200: {
            description: "List of products",
            type: "array",
            items: {
              type: "object",
              properties: {
                inventoryId: { type: "string" },
                productId: { type: "string" },
                name: { type: "string" },
                description: { type: "string", nullable: true },
                price: { type: "number" },
                costPrice: { type: "number" },
                stock: { type: "number" },
                unit: { type: "string", nullable: true },
                category: { type: "string" },
                barcode: { type: "string" },
                sku: { type: "string", nullable: true },
                isActive: { type: "boolean" },
                createdBy: { type: "string", nullable: true },
                updatedBy: { type: "string", nullable: true },
                createdAt: { type: "string", format: "date-time" },
                updatedAt: { type: "string", format: "date-time" },
              },
            },
          },
        },
      },
    },
    ProductController.listProducts
  );

  // Get single product by ID
  fastify.get(
    "/products/:id",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["Products"],
        summary: "Get product by ID",
        params: {
          type: "object",
          properties: {
            id: { type: "string", description: "Product ID" },
          },
          required: ["id"],
        },
        response: {
          200: {
            description: "Product object",
            type: "object",
            properties: {
              inventoryId: { type: "string" },
              productId: { type: "string" },
              name: { type: "string" },
              description: { type: "string", nullable: true },
              price: { type: "number" },
              costPrice: { type: "number" },
              stock: { type: "number" },
              unit: { type: "string", nullable: true },
              category: { type: "string" },
              barcode: { type: "string" },
              sku: { type: "string", nullable: true },
              isActive: { type: "boolean" },
              createdBy: { type: "string", nullable: true },
              updatedBy: { type: "string", nullable: true },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          404: { description: "Product not found" },
        },
      },
    },
    ProductController.getProductById
  );

  // Create product
  fastify.post(
    "/products",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["Products"],
        summary: "Create a new product",
        body: {
          type: "object",
          required: [
            "name",
            "price",
            "costPrice",
            "category",
            "barcode",
            "storeId",
            "stock",
          ],
          properties: {
            name: { type: "string" },
            description: { type: "string", nullable: true },
            price: { type: "number" },
            costPrice: { type: "number" },
            unit: { type: "string", nullable: true },
            category: { type: "string" },
            barcode: { type: "string" },
            sku: { type: "string", nullable: true },
            isActive: { type: "boolean", default: true },

            // Add store inventory properties:
            storeId: { type: "string" },
            stock: { type: "number" },
          },
        },

        response: {
          201: {
            description: "Product created with initial inventory",
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              description: { type: "string", nullable: true },
              price: { type: "number" },
              costPrice: { type: "number" },
              unit: { type: "string", nullable: true },
              category: { type: "string" },
              barcode: { type: "string" },
              sku: { type: "string", nullable: true },
              isActive: { type: "boolean" },
              createdBy: { type: "string", nullable: true },
              updatedBy: { type: "string", nullable: true },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },

              // 🆕 Initial inventory info
              inventory: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  storeId: { type: "string" },
                  productId: { type: "string" },
                  stock: { type: "number" },
                  price: { type: "number" },
                  sku: { type: "string", nullable: true },
                },
              },
            },
          },
        },
      },
    },
    ProductController.createProduct
  );

  // Update product
  fastify.put(
    "/products/:id",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["Products"],
        summary: "Update an existing product",
        params: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"],
        },
        body: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string", nullable: true },
            price: { type: "number" },
            costPrice: { type: "number" },
            unit: { type: "string", nullable: true },
            category: { type: "string" },
            barcode: { type: "string" },
            sku: { type: "string", nullable: true },
            isActive: { type: "boolean" },
          },
          additionalProperties: false,
        },
        response: {
          200: {
            description: "Product updated",
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              description: { type: "string", nullable: true },
              price: { type: "number" },
              costPrice: { type: "number" },
              unit: { type: "string", nullable: true },
              category: { type: "string" },
              barcode: { type: "string" },
              sku: { type: "string", nullable: true },
              isActive: { type: "boolean" },
            },
          },
          404: { description: "Product not found" },
        },
      },
    },
    ProductController.updateProduct
  );

  fastify.post(
    "/products/add-to-store",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["Products"],
        summary: "Add an existing product to a new store",
        body: {
          type: "object",
          required: ["productId", "storeId", "price", "stock"],
          properties: {
            productId: { type: "string" },
            storeId: { type: "string" },
            price: { type: "number" },
            stock: { type: "number" },
            sku: { type: "string", nullable: true },
          },
        },
        response: {
          201: {
            description: "Inventory record created",
            type: "object",
            properties: {
              id: { type: "string" },
              productId: { type: "string" },
              storeId: { type: "string" },
              price: { type: "number" },
              stock: { type: "number" },
              sku: { type: "string", nullable: true },
            },
          },
          409: {
            description: "Conflict - Product already exists in this store",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    ProductController.addProductToStoreInventory
  );

  // Update product stock in store inventory
  fastify.patch(
    "/products/stock",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["Products"],
        summary: "Update stock of a product in store inventory",
        body: {
          type: "object",
          required: ["productId", "storeId", "quantity"],
          properties: {
            productId: { type: "string" },
            storeId: { type: "string" },
            quantity: { type: "number" }, // assumed to be decrementing
          },
        },
      },
    },
    ProductController.updateProductStock
  );

  // Soft-delete product
  fastify.delete(
    "/products/:id",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["Products"],
        summary: "Soft delete a product",
        params: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"],
        },
        response: {
          204: { description: "Product deleted (soft delete)" },
          404: { description: "Product not found" },
        },
      },
    },
    ProductController.deleteProduct
  );
}
