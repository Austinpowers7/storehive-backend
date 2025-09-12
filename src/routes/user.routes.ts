import { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { UserController } from "../controllers/user.controller";
import { UserRepository } from "@src/repositories/user.repo";
import { Role } from "@prisma/client";
import prisma from "@src/lib/prisma";
import { canAccessStore } from "@src/services/auth.service";

const userRepo = new UserRepository();

export default async function userRoutes(fastify: FastifyInstance) {
  // User Management
  fastify.get(
    "/user/:id",
    {
      schema: {
        tags: ["User Management"],
        summary: "Get user by ID",
        description:
          "Returns user details, including business info if the user is an OWNER.",
        params: {
          type: "object",
          properties: {
            id: { type: "string", description: "User ID" },
          },
          required: ["id"],
        },
        response: {
          200: {
            description: "User found",
            type: "object",
            properties: {
              id: { type: "string" },
              email: { type: "string" },
              role: { type: "string" },
              firstName: { type: "string" },
              lastName: { type: "string" },
              phoneNumber: { type: "string" },
              storeId: { type: "string", nullable: true },
              // business: {
              //   type: ["object", "null"],
              //   nullable: true,
              //   properties: {
              //     id: { type: "string" },
              //     name: { type: "string" },
              //     address: { type: "string", nullable: true },
              //     registrationNumber: { type: "string", nullable: true },
              //     ownerId: { type: "string" },
              //   },
              // },
              business: {
                type: ["object", "null"],
                nullable: true,
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  address: { type: "string", nullable: true },
                  registrationNumber: { type: "string", nullable: true },
                  ownerId: { type: "string" },
                  stores: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        businessId: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          404: {
            description: "User not found",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
      preHandler: [fastify.authenticate], // protected route
    },
    UserController.getUserById
  );

  // Soft delete a user by id
  fastify.delete(
    "/user/:id",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["User Management"],
        summary: "Soft delete a user by id based on role hierarchy",
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
          },
        },
        response: {
          204: { description: "User soft deleted" },
          403: { description: "Forbidden" },
          404: { description: "User not found" },
        },
      },
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const currentUser = req.user;

      const targetUser = await userRepo.findById(id);
      if (!targetUser || targetUser.deletedAt) {
        return reply.code(404).send({ error: "User not found" });
      }

      const canDelete =
        currentUser.role === Role.ADMIN ||
        (currentUser.role === Role.OWNER &&
          targetUser.role === Role.MANAGER &&
          currentUser.storeId === targetUser.storeId) ||
        (currentUser.role === Role.MANAGER &&
          targetUser.role === Role.CASHIER &&
          currentUser.storeId === targetUser.storeId);

      if (!canDelete) {
        return reply.code(403).send({ error: "Forbidden" });
      }

      await userRepo.softDeleteUser(id);
      return reply.code(204).send();
    }
  );

  // Update a user by id
  fastify.put(
    "/user/:id",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["User Management"],
        summary: "Update a user by id based on role hierarchy",
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
            description: "User updated",
            type: "object",
            properties: {
              id: { type: "string" },
              email: { type: "string" },
              role: { type: "string" },
            },
          },
          403: { description: "Forbidden" },
          404: { description: "User not found" },
        },
      },
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const { email, password } = req.body as {
        email?: string;
        password?: string;
      };
      const currentUser = req.user;

      const targetUser = await userRepo.findById(id);
      if (!targetUser || targetUser.deletedAt) {
        return reply.code(404).send({ error: "User not found" });
      }

      const canUpdate =
        currentUser.role === Role.ADMIN ||
        (currentUser.role === Role.OWNER &&
          targetUser.role === Role.MANAGER &&
          currentUser.storeId === targetUser.storeId) ||
        (currentUser.role === Role.MANAGER &&
          targetUser.role === Role.CASHIER &&
          currentUser.storeId === targetUser.storeId);

      if (!canUpdate) {
        return reply.code(403).send({ error: "Forbidden" });
      }

      const updateData: Partial<{ email: string; password: string }> = {};
      if (email) updateData.email = email;
      if (password) updateData.password = await bcrypt.hash(password, 10);

      const updated = await userRepo.updateUser(id, updateData);
      return reply.send({
        id: updated.id,
        email: updated.email,
        role: updated.role,
      });
    }
  );

  // Get all active users (Admins only)
  fastify.get(
    "/active-users",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["User Management"],
        summary: "List all active users (Admins only)",
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                email: { type: "string" },
                role: { type: "string" },
              },
            },
          },
          403: { description: "Forbidden" },
        },
      },
    },
    async (req, reply) => {
      const currentUser = req.user;
      if (currentUser.role !== Role.ADMIN) {
        return reply.code(403).send({ error: "Admin access required" });
      }

      const users = await userRepo.findAllActiveUsers();
      reply.send(users);
    }
  );

  // Get Users by store
  fastify.get(
    "/stores/:storeId/users",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["User Management"],
        summary:
          "List active users in a specific store (Owner, Manager, Admin)",
        params: {
          type: "object",
          required: ["storeId"],
          properties: {
            storeId: { type: "string" },
          },
        },
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
              },
            },
          },
          403: { description: "Forbidden" },
        },
      },
    },
    async (req, reply) => {
      const { storeId } = req.params as { storeId: string };
      const currentUser = req.user;

      const allowed = await canAccessStore(currentUser, storeId);

      if (!allowed) {
        return reply
          .code(403)
          .send({ error: "Access to this store is forbidden" });
      }

      const users = await userRepo.findUsersByStore(storeId);
      reply.send(users);
    }
  );
}
