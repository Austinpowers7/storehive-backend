import { UserPayload } from "@src/types/generic-types";
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";

const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const decoded = await request.jwtVerify<UserPayload>();
        request.user = decoded; // now `decoded` has userId, role, etc.
      } catch (err) {
        reply
          .code(401)
          .send({ message: "Unauthorized", error: (err as Error).message });
      }
    }
  );
};

export default fp(authPlugin);
