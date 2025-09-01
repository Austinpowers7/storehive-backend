// import { PrismaClient, Order } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
type Order = NonNullable<Awaited<ReturnType<typeof prisma.order.findUnique>>>;

export class OrderRepository {
  async createOrder(data: {
    customerId: string;
    storeId: string;
    items: { productId: string; quantity: number }[];
    total: number;
    paidOnline: boolean;
  }): Promise<Order> {
    return prisma.order.create({ data });
  }

  async findById(orderId: string): Promise<Order | null> {
    return prisma.order.findUnique({ where: { id: orderId } });
  }

  async confirmOrder(orderId: string): Promise<Order> {
    return prisma.order.update({
      where: { id: orderId },
      data: { cashierConfirmed: true },
    });
  }
}
