import prisma from "@src/lib/prisma";

export class StoreRepository {
  async findByBusinessId(businessId: string) {
    return prisma.store.findMany({
      where: { businessId },
      // Select fields you want to expose or all by default
      select: {
        id: true,
        name: true,
        businessId: true,
        // add more fields if needed
      },
    });
  }
}
