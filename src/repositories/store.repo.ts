import prisma from "@src/lib/prisma";

export class StoreRepository {
  async findByBusinessId(businessId: string) {
    return prisma.store.findMany({
      where: { businessId },
      // fields expose
      select: {
        id: true,
        name: true,
        businessId: true,
      },
    });
  }
}
