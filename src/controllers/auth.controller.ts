import { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { UserRepository } from "../repositories/user.repo";
import { SessionRepository } from "../repositories/session.repo";
import prisma from "@src/lib/prisma";

const userRepo = new UserRepository();
const sessionRepo = new SessionRepository();

export async function createAdmin(req: FastifyRequest, reply: FastifyReply) {
  const currentUser = (req as any).user;

  if (!currentUser || currentUser.role !== "ADMIN") {
    return reply.code(403).send({ error: "Access denied" });
  }

  // const { email, password } = req.body as { email: string; password: string };
  const { email, password, firstName, lastName, phoneNumber } = req.body as {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };

  // Validate email/password properly here...

  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return reply.code(409).send({ error: "Email already in use" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newAdmin = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: Role.ADMIN,
      firstName,
      lastName,
      phoneNumber,
    },
  });

  return reply
    .code(201)
    .send({ id: newAdmin.id, email: newAdmin.email, role: newAdmin.role });
}

export const AuthController = {
  async register(req: FastifyRequest, reply: FastifyReply) {
    const {
      email,
      password,
      role,
      storeId: rawStoreId, // Alias,
      businessName,
      address,
      registrationNumber,
      firstName,
      lastName,
      phoneNumber,
    } = req.body as {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phoneNumber?: string;
      role: Role;
      storeId?: string;
      businessName?: string;
      address?: string;
      registrationNumber?: string;
    };

    // Validate required fields manually
    if (!firstName || !lastName || !phoneNumber) {
      return reply.code(400).send({
        error: "First name, last name, and phone number are required.",
      });
    }

    // Handle invalid or empty storeId safely
    const normalizedStoreId =
      typeof rawStoreId === "string" && rawStoreId.trim() !== ""
        ? rawStoreId.trim()
        : undefined;

    const existing = await userRepo.findByEmail(email);
    if (existing) {
      return reply.code(409).send({ error: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (role === "ADMIN") {
      return reply.code(403).send({
        error: "You are not authorized to register as an ADMIN.",
      });
    }

    if (role === "OWNER") {
      if (!businessName) {
        return reply.code(400).send({
          error: "Business name is required for owner registration",
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            role,
            firstName,
            lastName,
            phoneNumber,
          },
        });

        const business = await tx.business.create({
          data: {
            name: businessName,
            address,
            registrationNumber,
            ownerId: user.id,
          },
        });

        return { user, business };
      });

      return reply.code(201).send({
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        business: {
          id: result.business.id,
          name: result.business.name,
        },
      });
    }

    // Non-owner flow

    const userData: {
      email: string;
      password: string;
      role: Role;
      firstName: string;
      lastName: string;
      phoneNumber: string;
      storeId?: string;
    } = {
      email,
      password: hashedPassword,
      role,
      firstName,
      lastName,
      phoneNumber,
    };

    // Validate storeId if provided
    if (normalizedStoreId) {
      const storeExists = await prisma.store.findUnique({
        where: { id: normalizedStoreId },
      });

      if (!storeExists) {
        return reply.code(400).send({ error: "Invalid storeId" });
      }

      userData.storeId = normalizedStoreId;
    }

    const user = await userRepo.createUser(userData);

    return reply
      .code(201)
      .send({ id: user.id, email: user.email, role: user.role });
  },

  async login(req: FastifyRequest, reply: FastifyReply) {
    const { email, password } = req.body as { email: string; password: string };

    const user = await userRepo.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return reply.code(401).send({ error: "Invalid credentials" });
    }

    const token = req.server.jwt.sign({
      id: user.id,
      email: user.email,
      role: user.role,
      storeId: user.storeId,
    });

    return reply.send({ token, user });
  },

  async createCashierSession(req: FastifyRequest, reply: FastifyReply) {
    const user = (req as any).user as {
      userId: string;
      role: Role;
      storeId: string;
    };

    if (user.role !== "CASHIER") {
      return reply
        .code(403)
        .send({ error: "Only cashiers can start sessions" });
    }

    const { v4: uuidv4 } = await import("uuid");
    const QRCode = await import("qrcode");

    const sessionCode = uuidv4();
    const qrCode = await QRCode.toDataURL(sessionCode);

    const session = await sessionRepo.createSession({
      sessionCode,
      qrCode,
      cashierId: user.userId,
      storeId: user.storeId,
    });

    return reply.send({
      sessionCode: session.sessionCode,
      qrCode: session.qrCode,
    });
  },
};
