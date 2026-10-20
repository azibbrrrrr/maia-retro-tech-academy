import { createPublicServer } from "./app";

const app = await createPublicServer();
await app.listen({ host: "127.0.0.1", port: 3000 });
console.info("Public academy: http://127.0.0.1:3000");
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    void app.close();
  });
