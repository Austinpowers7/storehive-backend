// services/authorization.service.ts
import { Role } from "@prisma/client";
import prisma from "@src/lib/prisma";

export async function canAccessStore(
  user: any,
  storeId: string
): Promise<boolean> {
  if (user.role === Role.ADMIN) return true;

  if (user.role === Role.MANAGER) {
    return user.storeId === storeId;
  }

  if (user.role === Role.OWNER) {
    const owner = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        business: {
          include: { stores: true },
        },
      },
    });

    const ownedStoreIds = owner?.business?.stores.map((s) => s.id) || [];
    return ownedStoreIds.includes(storeId);
  }

  return false;
}
