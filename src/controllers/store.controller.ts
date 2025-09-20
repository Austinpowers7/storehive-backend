import { FastifyRequest, FastifyReply } from "fastify";
import prisma from "@src/lib/prisma";
import { StoreRepository } from "@src/repositories/store.repo";

const storeRepo = new StoreRepository();

export class StoreController {
  static async createStore(request: FastifyRequest, reply: FastifyReply) {
    const { name, businessId } = request.body as {
      name: string;
      businessId?: string;
    };

    const user = request.user;

    if (user.role !== "ADMIN" && user.role !== "OWNER") {
      return reply.code(403).send({ message: "Forbidden" });
    }

    let finalBusinessId: string | undefined;

    if (user.role === "OWNER") {
      // OWNER can only create store under their own business
      const business = await prisma.business.findUnique({
        where: { ownerId: user.id },
      });

      if (!business) {
        return reply
          .code(400)
          .send({ message: "Owner does not have a registered business" });
      }

      finalBusinessId = business.id;
    } else if (user.role === "ADMIN") {
      // ADMIN must provide a businessId explicitly
      if (!businessId) {
        return reply
          .code(400)
          .send({ message: "Business ID is required for ADMIN" });
      }

      // Validate business exists
      const business = await prisma.business.findUnique({
        where: { id: businessId },
      });

      if (!business) {
        return reply.code(404).send({ message: "Business not found" });
      }

      finalBusinessId = business.id;
    }

    const store = await prisma.store.create({
      data: {
        name,
        businessId: finalBusinessId!,
      },
    });

    return reply.code(201).send(store);
  }

  static async listStores(_request: FastifyRequest, reply: FastifyReply) {
    const stores = await prisma.store.findMany({
      include: {
        business: true, // Optional: show business info with stores
      },
    });
    return reply.send(stores);
  }

  static async getStoreById(request: FastifyRequest, reply: FastifyReply) {
    const { storeId } = request.params as { storeId: string };

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        business: true, // Optional: show business info
      },
    });

    if (!store) {
      return reply.code(404).send({ message: "Store not found" });
    }

    return reply.send(store);
  }

  static async getStoresByBusinessId(req: FastifyRequest, reply: FastifyReply) {
    const businessId = (req.params as { businessId: string }).businessId;

    if (!businessId) {
      return reply.code(400).send({ error: "businessId is required" });
    }

    try {
      const stores = await storeRepo.findByBusinessId(businessId);
      return reply.send(stores);
    } catch (err) {
      return reply.code(500).send({ error: "Internal server error" });
    }
  }
}
