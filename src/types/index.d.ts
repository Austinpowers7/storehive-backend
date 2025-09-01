import "@fastify/jwt";
import { Role } from "@prisma/client";

// Define environment variables type for gemini
interface GeminiEnvSchema {
  JWT_SECRET: string;
  GEMINI_API_KEY: string;
}

declare module "fastify" {
  interface FastifyInstance {
    // JWT plugin instance with sign, verify, etc.
    jwt: import("@fastify/jwt").FastifyJWT;

    // Your custom authenticate function
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }

  // Define the user payload shape from JWT
  interface UserPayload {
    id: string;
    email: string;
    role: Role;
    storeId?: string | null;
    iat?: number;
    exp?: number;
  }

  interface FastifyRequest {
    // The decoded JWT payload after jwtVerify()
    user: UserPayload;

    // JWT plugin method to verify token
    jwtVerify(): Promise<void>;
  }

  interface FastifyReply {
    // Usually no jwt property here unless explicitly added in your plugin
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    // This is the payload type you sign and verify
    payload: import("fastify").UserPayload;
    user: import("fastify").UserPayload;
  }
}
