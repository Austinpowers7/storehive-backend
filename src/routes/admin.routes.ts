import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import bcrypt from "bcrypt";
import { createAdmin } from "@src/controllers/auth.controller";
import { ROLE_TYPES } from "@src/constants/roleTypes";
import prisma from "@src/lib/prisma";
import { UserRepository } from "@src/repositories/user.repo";
import { Role } from "@prisma/client";

const userRepo = new UserRepository();

// Middleware to verify user is admin
async function verifyAdmin(req: FastifyRequest, reply: FastifyReply) {
  const user = (req as any).user;
  if (!user || user.role !== "ADMIN") {
    return reply.code(403).send({ error: "Admin access required" });
  }
}

export default async function adminRoutes(fastify: FastifyInstance) {
  // ----- Admin Management Routes -----

  fastify.post(
    "/admin",
    {
      preHandler: [fastify.authenticate, verifyAdmin],
      schema: {
        tags: ["Admin"],
        summary: "Create a new admin user",
        body: {
          type: "object",
          required: [
            "email",
            "password",
            "firstName",
            "lastName",
            "phoneNumber",
          ],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 6 },
            firstName: { type: "string" },
            lastName: { type: "string" },
            phoneNumber: { type: "string" },
          },
        },
        response: {
          201: {
            description: "Admin created",
            type: "object",
            properties: {
              id: { type: "string" },
              email: { type: "string" },
              role: { type: "string" },
              firstName: { type: "string" },
              lastName: { type: "string" },
              phoneNumber: { type: "string" },
            },
          },
          403: { description: "Forbidden" },
          409: { description: "Email already in use" },
        },
      },
    },
    async (req, reply) => {
      const { email, password, firstName, lastName, phoneNumber } =
        req.body as {
          email: string;
          password: string;
          firstName: string;
          lastName: string;
          phoneNumber: string;
        };

      // Check if user exists
      const existing = await userRepo.findByEmail(email);
      if (existing) {
        return reply.code(409).send({ error: "Email already in use" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newAdmin = await userRepo.createUser({
        email,
        password: hashedPassword,
        role: Role.ADMIN,
        firstName,
        lastName,
        phoneNumber,
      });

      return reply.code(201).send({
        id: newAdmin.id,
        email: newAdmin.email,
        role: newAdmin.role,
        firstName: newAdmin.firstName,
        lastName: newAdmin.lastName,
        phoneNumber: newAdmin.phoneNumber,
      });
    }
  );

  // Get all active admins (non soft-deleted)
  fastify.get(
    "/active-admins",
    {
      preHandler: [fastify.authenticate, verifyAdmin],
      schema: {
        tags: ["Admin"],
        summary: "Get list of all active admin users",
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                email: { type: "string" },
                role: { type: "string" },
                firstName: { type: "string" },
                lastName: { type: "string" },
                phoneNumber: { type: "string" },
                // deletedAt: { type: ["string", "null"], format: "date-time" },
              },
            },
          },
        },
      },
    },
    async (req, reply) => {
      const admins = await userRepo.findActiveAdmins();
      reply.send(admins);
    }
  );

  // Soft delete admin by id
  fastify.delete(
    "/admin/:id",
    {
      preHandler: [fastify.authenticate, verifyAdmin],
      schema: {
        tags: ["Admin"],
        summary: "Soft delete an admin user",
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
          },
        },
        response: {
          204: { description: "Admin soft deleted" },
          404: { description: "Admin not found" },
          403: { description: "Forbidden" },
        },
      },
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };

      // Check if admin exists and is active
      const admin = await userRepo.findById(id);
      if (!admin || admin.role !== Role.ADMIN) {
        return reply.code(404).send({ error: "Admin not found" });
      }

      await userRepo.softDeleteUser(id);

      return reply.code(204).send();
    }
  );

  // Update admin info (email, password)
  fastify.put(
    "/admin/:id",
    {
      preHandler: [fastify.authenticate, verifyAdmin],
      schema: {
        tags: ["Admin"],
        summary: "Update admin user information",
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
          },
        },
        body: {
          type: "object",
          properties: {
            // email: { type: "string", format: "email" },
            password: { type: "string", minLength: 6 },
          },
        },
        response: {
          200: {
            description: "Admin updated",
            type: "object",
            properties: {
              id: { type: "string" },
              email: { type: "string" },
              role: { type: "string" },
            },
          },
          404: { description: "Admin not found" },
          403: { description: "Forbidden" },
        },
      },
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const { email, password } = req.body as {
        email?: string;
        password?: string;
      };

      const admin = await userRepo.findById(id);
      if (!admin || admin.role !== Role.ADMIN) {
        return reply.code(404).send({ error: "Admin not found" });
      }

      const updateData: Partial<{ email: string; password: string }> = {};

      if (email) {
        updateData.email = email;
      }
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateData.password = hashedPassword;
      }

      const updatedAdmin = await userRepo.updateUser(id, updateData);

      return reply.send({
        id: updatedAdmin.id,
        email: updatedAdmin.email,
        role: updatedAdmin.role,
      });
    }
  );
}
