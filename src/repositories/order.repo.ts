import { PrismaClient, Order } from "@prisma/client";

const prisma = new PrismaClient();

export class OrderRepository {
  async createOrder(data: {
    customerId: string;
    storeId: string;
    items: { productId: string; quantity: number }[];
    total: number;
    paidOnline: boolean;
    cashierId?: string;
  }): Promise<Order> {
    const { customerId, storeId, items, total, paidOnline, cashierId } = data;

    return prisma.order.create({
      data: {
        customerId,
        storeId,
        items,
        total,
        paidOnline,
        cashierId: cashierId ?? null,
        cashierConfirmed: !!cashierId, // auto-confirm if placed by cashier
      },
    });
  }

  async findById(orderId: string): Promise<Order | null> {
    return prisma.order.findUnique({ where: { id: orderId } });
  }

  async confirmOrder(
    orderId: string,
    cashierId: string
  ): Promise<Order | null> {
    try {
      return await prisma.order.update({
        where: { id: orderId },
        data: { cashierConfirmed: true, cashierId },
      });
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as any).code === "P2025"
      ) {
        // Record not found
        return null;
      }
      throw error;
    }
  }

  async getOrdersByStore(storeId: string): Promise<Order[]> {
    return prisma.order.findMany({
      where: { storeId },
    });
  }

  async getOrdersByCashier(cashierId: string): Promise<Order[]> {
    return prisma.order.findMany({
      where: { cashierId },
    });
  }
}
