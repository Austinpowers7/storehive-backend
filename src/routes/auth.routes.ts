import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import bcrypt from "bcrypt";
import { AuthController, createAdmin } from "@src/controllers/auth.controller";
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

export default async function authRoutes(fastify: FastifyInstance) {
  // User registration
  fastify.post(
    "/register",
    {
      schema: {
        tags: ["Auth"],
        summary: "Register a new user",

        // body: {
        //   type: "object",
        //   required: ["email", "password", "role"],
        //   properties: {
        //     email: { type: "string", format: "email" },
        //     password: { type: "string", minLength: 6 },
        //     role: {
        //       type: "string",
        //       // enum: ["CUSTOMER", "CASHIER", "OWNER", "ADMIN"],
        //       enum: ROLE_TYPES,
        //     },
        //     storeId: { type: "string" },
        //     businessName: {
        //       type: "string",
        //       description: "Required if role is OWNER",
        //     },
        //     address: { type: "string" },
        //     registrationNumber: { type: "string" },
        //   },
        // },
        body: {
          type: "object",
          required: [
            "email",
            "password",
            "role",
            "firstName",
            "lastName",
            "phoneNumber",
          ],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 6 },
            role: {
              type: "string",
              enum: ROLE_TYPES,
            },
            firstName: { type: "string" },
            lastName: { type: "string" },
            phoneNumber: { type: "string" },
            storeId: { type: "string" },
            businessName: {
              type: "string",
              description: "Required if role is OWNER",
            },
            address: { type: "string" },
            registrationNumber: { type: "string" },
          },
        },

        response: {
          201: {
            description: "User registered successfully",
            type: "object",
            properties: {
              id: { type: "string" },
              email: { type: "string" },
              role: { type: "string" },
              firstName: { type: "string" },
              lastName: { type: "string" },
              phoneNumber: { type: "string" },
              business: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    AuthController.register
  );

  // User login
  fastify.post(
    "/login",
    {
      schema: {
        tags: ["Auth"],
        summary: "Login a user",
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Login successful",
            type: "object",
            properties: {
              token: { type: "string" },
              user: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  email: { type: "string" },
                  role: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    AuthController.login
  );

  // Cashier session creation
  fastify.post(
    "/session",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["Sessions"],
        summary: "Create a cashier session",
        description:
          "Generates a session code and QR code for cashier to start a shift",
        body: {
          type: "object",
          required: ["storeId"],
          properties: {
            storeId: { type: "string" },
          },
        },
        response: {
          201: {
            description: "Session created",
            type: "object",
            properties: {
              id: { type: "string" },
              sessionCode: { type: "string" },
              qrCode: { type: "string" },
              active: { type: "boolean" },
              storeId: { type: "string" },
              cashierId: { type: "string" },
              createdAt: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
    AuthController.createCashierSession
  );

  // ----- Admin Management Routes -----

  fastify.post(
    "/admins",
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
    "/admins",
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
    "/admins/:id",
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
    "/admins/:id",
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

  // User Management
  // Soft delete a user by id
  fastify.delete(
    "/users/:id",
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
    "/users/:id",
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
    "/users",
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

      const allowedRoles: Role[] = [Role.ADMIN, Role.OWNER, Role.MANAGER];

      if (!allowedRoles.includes(currentUser.role)) {
        return reply.code(403).send({ error: "Access denied" });
      }

      if (
        (currentUser.role === Role.OWNER ||
          currentUser.role === Role.MANAGER) &&
        currentUser.storeId !== storeId
      ) {
        return reply
          .code(403)
          .send({ error: "Access to this store is forbidden" });
      }

      const users = await userRepo.findUsersByStore(storeId);
      reply.send(users);
    }
  );
}
