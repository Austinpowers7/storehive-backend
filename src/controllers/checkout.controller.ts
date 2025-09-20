import { FastifyRequest, FastifyReply } from "fastify";
import { Role } from "@prisma/client";
import { OrderRepository } from "../repositories/order.repo";
import { ProductRepository } from "../repositories/product.repo";
import { requireRole } from "@src/lib/auth";

const orderRepo = new OrderRepository();
const productRepo = new ProductRepository();

export const CheckoutController = {
  async createOrder(req: FastifyRequest, reply: FastifyReply) {
    const { storeId, items, paidOnline } = req.body as {
      storeId: string;
      items: { productId: string; quantity: number }[];
      paidOnline: boolean;
    };

    const user = (req as any).user as { userId: string };

    if (!storeId || !items?.length) {
      return reply.code(400).send({ error: "Invalid order data" });
    }

    let total = 0;

    for (const item of items) {
      const inventory = await productRepo.findInventoryByProductAndStore(
        item.productId,
        storeId
      );

      if (!inventory) {
        return reply
          .code(404)
          .send({ error: `Product ${item.productId} not found in this store` });
      }

      if (inventory.stock < item.quantity) {
        return reply.code(400).send({
          error: `Insufficient stock for product: ${inventory.product.name}`,
        });
      }

      total += inventory.price * item.quantity;
    }

    const order = await orderRepo.createOrder({
      customerId: user.userId,
      storeId,
      items,
      total,
      paidOnline,
    });

    return reply.code(201).send(order);
  },

  async confirmOrder(req: FastifyRequest, reply: FastifyReply) {
    const { orderId } = req.params as { orderId: string };
    const user = (req as any).user as {
      userId: string;
      role: Role;
      storeId: string;
    };

    if (user.role !== "CASHIER") {
      return reply
        .code(403)
        .send({ error: "Only cashiers can confirm orders" });
    }

    const order = await orderRepo.findById(orderId);
    if (!order || order.storeId !== user.storeId) {
      return reply.code(404).send({ error: "Order not found" });
    }

    const updated = await orderRepo.confirmOrder(orderId, user.userId);

    return reply.send({ message: "Order confirmed", order: updated });
  },

  async listOrdersByStore(req: FastifyRequest, reply: FastifyReply) {
    const { storeId } = req.params as { storeId: string };
    const user = (req as any).user as { role: Role };

    if (!requireRole(user.role, [Role.MANAGER, Role.OWNER], reply)) return;

    const orders = await orderRepo.getOrdersByStore(storeId);
    return reply.send({ orders });
  },

  async listOrdersByCashier(req: FastifyRequest, reply: FastifyReply) {
    const { cashierId } = req.params as { cashierId: string };
    const user = (req as any).user as { role: Role };

    if (!requireRole(user.role, [Role.MANAGER, Role.OWNER], reply)) return;

    const orders = await orderRepo.getOrdersByCashier(cashierId);
    return reply.send({ orders });
  },
};
