import Fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
import { createHash, timingSafeEqual } from "node:crypto";

const allowedHosts = new Set(["127.0.0.1:3100", "localhost:3100"]);
const digest = (input: string) => createHash("sha256").update(input).digest();

export async function createOperatorServer(password: string) {
  if (password.length < 24)
    throw new Error("Set a local operator password of at least 24 characters.");
  const expected = digest(
    `Basic ${Buffer.from(`azib:${password}`).toString("base64")}`,
  );
  const app = Fastify({ logger: false, bodyLimit: 4096, trustProxy: false });
  await app.register(rateLimit, {
    global: false,
    max: 30,
    timeWindow: "1 minute",
  });
  app.addHook("onRequest", app.rateLimit());
  app.addHook("onRequest", async (request, reply) => {
    reply.headers({
      "cache-control": "no-store",
      "content-security-policy":
        "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
      "x-content-type-options": "nosniff",
      "cross-origin-resource-policy": "same-origin",
      "referrer-policy": "no-referrer",
    });
    const host = request.headers.host ?? "";
    const origin = request.headers.origin;
    const fetchSite = request.headers["sec-fetch-site"];
    if (
      !allowedHosts.has(host) ||
      (origin !== undefined && origin !== `http://${host}`) ||
      (fetchSite !== undefined &&
        fetchSite !== "none" &&
        fetchSite !== "same-origin") ||
      Object.keys(request.headers).some(
        (key) => key.startsWith("x-forwarded-") || key === "forwarded",
      )
    ) {
      return reply.code(403).send({ error: "Local origin required" });
    }
    if (
      !timingSafeEqual(expected, digest(request.headers.authorization ?? ""))
    ) {
      return reply
        .header("www-authenticate", 'Basic realm="Academy local operator"')
        .code(401)
        .send({ error: "Authentication required" });
    }
    if (!["GET", "HEAD"].includes(request.method))
      return reply.code(405).send({ error: "Read-only service" });
  });
  app.get("/", (_request, reply) =>
    reply.type("text/html").send(`<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Academy · Local operator</title><h1>Private operator</h1>
<p>OFFLINE · GitHub collector is not configured.</p>
<p>Sprint 0 verifies authenticated isolation. No review counts or live results are available.</p>
<p><a href="/api/operator/board">Inspect collector status</a></p></html>`),
  );
  app.get("/api/operator/board", () => ({
    mode: "offline",
    coverage: "not-configured",
    fetchedAt: null,
    message: "GitHub collector is not configured. No counts are available.",
  }));
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
