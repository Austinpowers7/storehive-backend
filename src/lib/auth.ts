import { Role } from "@prisma/client";
import { FastifyReply } from "fastify";

export function requireRole(
  userRole: Role,
  allowedRoles: Role[],
  reply: FastifyReply
): boolean {
  if (!allowedRoles.includes(userRole)) {
    reply.code(403).send({ error: "Access denied" });
    return false;
  }
  return true;
}
