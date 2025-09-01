import Fastify from "fastify";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import jwt from "@fastify/jwt";
import authRoutes from "@src/routes/auth.routes";
import prisma from "./plugins/prisma";
import checkoutRoutes from "@src/routes/checkout.routes";
import productRoutes from "@src/routes/product.routes";
import authPlugin from "@src/plugins/auth.plugin";
import storeRoutes from "@src/routes/store.routes";

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(jwt, { secret: process.env.JWT_SECRET || "supersecret" });
  app.register(authPlugin);

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
    },
  });

  app.register(prisma);

  app.register(authRoutes, { prefix: "/api/auth" });
  app.register(checkoutRoutes, { prefix: "/api/checkout" });
  app.register(productRoutes, { prefix: "/api/products" });
  app.register(storeRoutes, { prefix: "/api/stores" });

  return app;
}
