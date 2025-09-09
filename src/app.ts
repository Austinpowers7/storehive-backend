import "module-alias/register";
import Fastify from "fastify";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import jwt from "@fastify/jwt";
import cors from "@fastify/cors";
import path from "path";
import fs from "fs";
import fastifyStatic from "@fastify/static";
import authRoutes from "@src/routes/auth.routes";
import prisma from "./plugins/prisma";
import checkoutRoutes from "@src/routes/checkout.routes";
import productRoutes from "@src/routes/product.routes";
import authPlugin from "@src/plugins/auth.plugin";
import storeRoutes from "@src/routes/store.routes";
import userRoutes from "@src/routes/user.routes";
import adminRoutes from "@src/routes/admin.routes";

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(cors, {
    origin: true,
  });

  app.register(jwt, { secret: process.env.JWT_SECRET || "supersecret" });
  app.register(authPlugin);

  // Serve static files (including favicon)
  app.register(fastifyStatic, {
    root: path.join(__dirname, "../public"),
    prefix: "/", // Optional: serve from root
  });

  // Read your favicon file (PNG, ICO, etc.)
  const faviconBuffer = fs.readFileSync(
    path.join(__dirname, "../public/favicon.ico")
  );

  app.register(swagger, {
    openapi: {
      info: {
        title: "Shophive API",
        version: "1.0.0",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description:
              "Enter your JWT token **without** the 'Bearer' prefix.",
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
  });

  app.register(swaggerUI, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list", // options 'none', 'list' or 'full'
      deepLinking: false,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header, // optional
    theme: {
      title: "Shophive API", // browser tab title
      favicon: [
        {
          filename: "favicon.ico",
          rel: "icon",
          sizes: "32x32",
          type: "image/x-icon", // or "image/png" if using PNG
          content: faviconBuffer,
        },
      ],
    },
  });

  app.register(prisma);

  app.register(authRoutes, { prefix: "/api/auth" });
  app.register(checkoutRoutes, { prefix: "/api/checkout" });
  app.register(productRoutes, { prefix: "/api/products" });
  app.register(userRoutes, { prefix: "/api/users" });
  app.register(storeRoutes, { prefix: "/api/stores" });
  app.register(adminRoutes, { prefix: "/api/admins" });

  return app;
}
