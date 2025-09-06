import { FastifyRequest, FastifyReply } from "fastify";
import { UserRepository } from "../repositories/user.repo";

const userRepo = new UserRepository();

export const UserController = {
  async getUserById(req: FastifyRequest, reply: FastifyReply) {
    const userId = (req.params as { id: string }).id;

    const user = await userRepo.findUserWithBusinessAndStoresById(userId);

    if (!user) {
      return reply.code(404).send({ error: "User not found" });
    }

    return reply.send(user);
  },
};
