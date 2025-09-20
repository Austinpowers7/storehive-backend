import { PrismaClient, CashierSession } from "@prisma/client";

const prisma = new PrismaClient();

export class SessionRepository {
  async createSession(data: {
    sessionCode: string;
    qrCode: string;
    cashierId: string;
    storeId: string;
  }): Promise<CashierSession> {
    return prisma.cashierSession.create({ data });
  }

  async findActiveSessionByCashier(
    cashierId: string
  ): Promise<CashierSession | null> {
    return prisma.cashierSession.findFirst({
      where: { cashierId, active: true },
    });
  }

  async deactivateSession(sessionId: string): Promise<CashierSession> {
    return prisma.cashierSession.update({
      where: { id: sessionId },
      data: { active: false },
    });
  }
}
