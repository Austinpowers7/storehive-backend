import "fastify";
import { MultipartFile } from "fastify-multipart";

declare module "fastify" {
  interface FastifyRequest {
    file: () => Promise<MultipartFile>;
    files: () => AsyncIterableIterator<MultipartFile>;
  }
}
