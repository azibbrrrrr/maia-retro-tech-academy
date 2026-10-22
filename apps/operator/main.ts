import { createOperatorServer } from "./app";

const app = await createOperatorServer(process.env.OPERATOR_PASSWORD ?? "");
await app.listen({ host: "127.0.0.1", port: 3100 });
console.info("Authenticated local operator: http://127.0.0.1:3100");
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    void app.close();
  });
