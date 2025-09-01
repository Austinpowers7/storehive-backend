import { FastifyRequest, FastifyReply } from "fastify";
import { ProductRepository } from "../repositories/product.repo";

const productRepo = new ProductRepository();

export const ProductController = {
  // List products with inventory info for a store
  async listProducts(req: FastifyRequest, reply: FastifyReply) {
    const { storeId } = req.params as { storeId: string };

    const productsWithInventory = await productRepo.findProductsByStore(
      storeId
    );

    const response = productsWithInventory.map(
      ({ id, price, stock, sku, product }) => ({
        inventoryId: id,
        price,
        stock,
        sku,
        productId: product.id,
        name: product.name,
        description: product.description,
        costPrice: product.costPrice,
        category: product.category,
        barcode: product.barcode,
        isActive: product.isActive,
        createdBy: product.createdBy,
        updatedBy: product.updatedBy,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      })
    );

    return reply.send(response);
  },

  // Get single product by ID
  async getProductById(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };

    const product = await productRepo.findById(id);
    if (!product) {
      return reply.code(404).send({ error: "Product not found" });
    }

    return reply.send(product);
  },

  // Create a new product with inventory
  async createProduct(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as {
      name: string;
      description?: string;
      price: number;
      costPrice: number;
      unit?: string;
      category: string;
      barcode: string;
      sku?: string;
      isActive?: boolean;
      storeId: string;
      stock: number;
    };

    const createdBy = (req.user as any)?.id || null;

    const product = await productRepo.create({
      ...body,
      createdBy,
      updatedBy: createdBy,
      isActive: body.isActive ?? true,
    });

    return reply.code(201).send({
      ...product,
      inventory: product.inventories?.[0] ?? null,
    });
  },

  // Update product by ID
  async updateProduct(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const body = req.body as Partial<{
      name: string;
      description?: string;
      price: number;
      costPrice?: number;
      unit?: string;
      category: string;
      barcode: string;
      sku?: string;
      isActive?: boolean;
    }>;

    const updatedBy = (req.user as any)?.id || null;

    const product = await productRepo.update(id, { ...body, updatedBy });

    if (!product) {
      return reply.code(404).send({ error: "Product not found" });
    }

    return reply.send(product);
  },

  // Soft delete product by ID
  async deleteProduct(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const updatedBy = (req.user as any)?.id || null;

    const product = await productRepo.softDelete(id, updatedBy);

    if (!product) {
      return reply.code(404).send({ error: "Product not found" });
    }

    return reply.code(204).send();
  },

  // Add existing product to another store’s inventory
  async addProductToStoreInventory(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as {
      productId: string;
      storeId: string;
      price: number;
      stock: number;
      sku?: string;
    };

    try {
      const inventory = await productRepo.addProductToStoreInventory(body);
      return reply.code(201).send(inventory);
    } catch (error: any) {
      if (error.message.includes("already exists")) {
        return reply.code(409).send({ error: error.message });
      }

      // Log and rethrow unexpected errors
      console.error("Failed to add product to store inventory:", error);
      return reply.code(500).send({ error: "Internal server error" });
    }
  },

  // Update stock for a product in a store
  async updateProductStock(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as {
      productId: string;
      storeId: string;
      quantity: number; // quantity to decrement (could also be incremented if logic adjusted)
    };

    try {
      const updatedInventory = await productRepo.updateStock(
        body.productId,
        body.storeId,
        body.quantity
      );

      return reply.send(updatedInventory);
    } catch (error: any) {
      if (error.code === "P2025") {
        return reply.code(404).send({ error: "Inventory record not found" });
      }

      console.error("Failed to update product stock:", error);
      return reply.code(500).send({ error: "Internal server error" });
    }
  },
};
