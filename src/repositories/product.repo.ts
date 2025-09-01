import { PrismaClient, Product, ProductInventory } from "@prisma/client";
import { CreateProductDto } from "@src/types/dto/product.dto";

const prisma = new PrismaClient();

export class ProductRepository {
  // List products with inventory info for a specific store
  async findProductsByStore(
    storeId: string
  ): Promise<(ProductInventory & { product: Product })[]> {
    return prisma.productInventory.findMany({
      where: { storeId, product: { deletedAt: null, isActive: true } },
      include: { product: true },
    });
  }

  async findById(
    id: string
  ): Promise<(Product & { inventories: ProductInventory[] }) | null> {
    return prisma.product.findUnique({
      where: { id },
      include: { inventories: true },
    });
  }

  async create(
    data: CreateProductDto
  ): Promise<Product & { inventories: ProductInventory[] }> {
    const { storeId, stock, price, sku, ...productData } = data;

    return prisma.product.create({
      data: {
        ...productData,
        price, // Provide price here as required
        inventories: {
          create: {
            storeId,
            stock,
            price, // and also in inventory if needed
            sku,
          },
        },
      },
      include: {
        inventories: true,
      },
    });
  }

  // Add product to another store’s inventory with guard
  async addProductToStoreInventory(data: {
    productId: string;
    storeId: string;
    price: number;
    stock: number;
    sku?: string;
  }): Promise<ProductInventory> {
    const { productId, storeId, price, stock, sku } = data;

    const existingInventory = await prisma.productInventory.findUnique({
      where: {
        productId_storeId: {
          productId,
          storeId,
        },
      },
    });

    if (existingInventory) {
      throw new Error("This product already exists in this store's inventory.");
    }

    return prisma.productInventory.create({
      data: {
        productId,
        storeId,
        price,
        stock,
        sku,
      },
    });
  }

  // Update product by ID
  async update(
    id: string,
    data: Partial<{
      name: string;
      description?: string;
      price: number;
      costPrice: number;
      unit?: string;
      category: string;
      barcode: string;
      sku?: string;
      isActive?: boolean;
      updatedBy?: string | null;
    }>
  ): Promise<Product | null> {
    try {
      return await prisma.product.update({ where: { id }, data });
    } catch (error: unknown) {
      if (this.isPrismaNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  // Soft delete product by ID
  async softDelete(
    id: string,
    updatedBy: string | null
  ): Promise<Product | null> {
    try {
      return await prisma.product.update({
        where: { id },
        data: {
          isActive: false,
          deletedAt: new Date(),
          updatedBy,
        },
      });
    } catch (error: unknown) {
      if (this.isPrismaNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  // Update stock for product in a store inventory
  async updateStock(
    productId: string,
    storeId: string,
    quantity: number
  ): Promise<ProductInventory> {
    return prisma.productInventory.update({
      where: { productId_storeId: { productId, storeId } },
      data: { stock: { decrement: quantity } },
    });
  }

  // Add to ProductRepository
  async findInventoryByProductAndStore(productId: string, storeId: string) {
    return prisma.productInventory.findUnique({
      where: {
        productId_storeId: {
          productId,
          storeId,
        },
      },
      include: {
        product: true,
      },
    });
  }

  // Helper to narrow and check for Prisma "not found" error
  private isPrismaNotFoundError(error: unknown): error is { code: string } {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as any).code === "P2025"
    );
  }
}
