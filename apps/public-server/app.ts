import Fastify from "fastify";
import staticFiles from "@fastify/static";
import rateLimit from "@fastify/rate-limit";
import { resolve } from "node:path";
import { demoBoard } from "../../packages/contracts/board";

export async function createPublicServer() {
  const app = Fastify({ logger: false, bodyLimit: 4096, trustProxy: false });
  await app.register(rateLimit, {
    global: false,
    max: 180,
    timeWindow: "1 minute",
  });
  app.addHook("onRequest", app.rateLimit());
  app.addHook("onRequest", async (request, reply) => {
    reply.headers({
      "content-security-policy":
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "cross-origin-resource-policy": "same-origin",
      "permissions-policy": "camera=(), microphone=(), geolocation=()",
    });
    if (!["GET", "HEAD"].includes(request.method))
      return reply.code(405).send({ error: "Read-only service" });
  });
  const root = resolve("dist/public");
  app.register(staticFiles, { root, serve: false });
  app.get("/", (_request, reply) => reply.sendFile("index.html"));
  app.register(staticFiles, {
    root: resolve(root, "assets"),
    prefix: "/assets/",
    decorateReply: false,
  });
  app.register(staticFiles, {
    root: resolve(root, "maps"),
    prefix: "/maps/",
    decorateReply: false,
  });
  app.get("/dependency-notices.txt", (_request, reply) =>
    reply.sendFile("dependency-notices.txt"),
  );
  app.get("/healthz", () => ({ status: "ok" }));
  app.get("/api/public/board", (_request, reply) => {
    reply.header("cache-control", "no-store");
    return demoBoard;
  });
  app.setNotFoundHandler((_request, reply) =>
    reply.code(404).send({ error: "Not found" }),
  );
  app.setErrorHandler((error, _request, reply) =>
    reply
      .code((error as { statusCode?: number }).statusCode === 429 ? 429 : 400)
      .send({ error: "Request unavailable" }),
  );
  return app;
}
