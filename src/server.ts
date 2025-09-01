import { buildApp } from "./app";
import "dotenv/config";

const PORT = process.env.PORT || 7500;

const app = buildApp();

app.listen({ port: Number(PORT), host: "0.0.0.0" }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`🚀 Server listening at ${address}`);
});
