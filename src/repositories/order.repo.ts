// import { PrismaClient, Order } from "@prisma/client";

// const prisma = new PrismaClient();
// // type Order = NonNullable<Awaited<ReturnType<typeof prisma.order.findUnique>>>;

// export class OrderRepository {
//   async createOrder(data: {
//     customerId: string;
//     storeId: string;
//     items: { productId: string; quantity: number }[];
//     total: number;
//     paidOnline: boolean;
//   }): Promise<Order> {
//     return prisma.order.create({ data });
//   }

//   async findById(orderId: string): Promise<Order | null> {
//     return prisma.order.findUnique({ where: { id: orderId } });
//   }

//   async confirmOrder(orderId: string): Promise<Order> {
//     return prisma.order.update({
//       where: { id: orderId },
//       data: { cashierConfirmed: true },
//     });
//   }
// }

import { PrismaClient, Order } from "@prisma/client";

const prisma = new PrismaClient();

export class OrderRepository {
  async createOrder(data: {
    customerId: string;
    storeId: string;
    items: { productId: string; quantity: number }[];
    total: number;
    paidOnline: boolean;
  }): Promise<Order> {
    const { customerId, storeId, items, total, paidOnline } = data;

    return prisma.order.create({
      data: {
        customerId,
        storeId,
        items, // This will be saved as JSON automatically
        total,
        paidOnline,
      },
    });
  }

  async findById(orderId: string): Promise<Order | null> {
    return prisma.order.findUnique({ where: { id: orderId } });
  }

  async confirmOrder(orderId: string): Promise<Order | null> {
    try {
      return await prisma.order.update({
        where: { id: orderId },
        data: { cashierConfirmed: true },
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
}
