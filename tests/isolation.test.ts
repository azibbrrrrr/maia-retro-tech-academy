import { test } from "node:test";
import assert from "node:assert/strict";
import { createPublicServer } from "../apps/public-server/app";
import { createOperatorServer } from "../apps/operator/app";

test("public requests are bounded and rate limiting returns an honest retry status", async () => {
  const app = await createPublicServer();
  try {
    for (let i = 0; i < 180; i++) {
      assert.equal((await app.inject("/healthz")).statusCode, 200);
    }
    const limited = await app.inject("/healthz");
    assert.equal(limited.statusCode, 429);
    assert.ok(limited.headers["retry-after"]);
  } finally {
    await app.close();
  }
});

test("public server serves demo-only data and refuses private routes and mutations", async () => {
  const app = await createPublicServer();
  try {
    const board = await app.inject("/api/public/board");
    assert.equal(board.statusCode, 200);
    assert.equal(board.json().mode, "demo");
    assert.equal(board.json().source, "Curated examples — not live GitHub");
    for (const route of [
      "/api/operator/board",
      "/admin",
      "/gateway",
      "/terminal",
      "/execute",
      "/api/agents/status",
      "/ws/private",
      "/.env",
      "/src/main.tsx",
      "/@fs/etc/passwd",
      "/assets/main.js.map",
    ]) {
      const response = await app.inject(route);
      assert.equal(response.statusCode, 404, route);
      assert.equal(response.body.includes("PRIVATE_FIXTURE_CANARY"), false);
    }
    for (const method of ["POST", "PUT", "PATCH", "DELETE"] as const) {
      assert.equal(
        (
          await app.inject({
            method,
            url: "/api/public/board",
            payload: { command: "execute" },
          })
        ).statusCode,
        405,
      );
    }
  } finally {
    await app.close();
  }
});

test("operator fails closed without a strong local password", async () => {
  await assert.rejects(() => createOperatorServer(""));
  await assert.rejects(() => createOperatorServer("short"));
});

test("operator requires authentication and exact host/origin; public cannot read it", async () => {
  const app = await createOperatorServer("PRIVATE_FIXTURE_CANARY_password");
  const authorization = `Basic ${Buffer.from("azib:PRIVATE_FIXTURE_CANARY_password").toString("base64")}`;
  try {
    assert.equal(
      (
        await app.inject({
          url: "/api/operator/board",
          headers: { host: "127.0.0.1:3100" },
        })
      ).statusCode,
      401,
    );
    const valid = await app.inject({
      url: "/api/operator/board",
      headers: { host: "127.0.0.1:3100", authorization },
    });
    assert.equal(valid.statusCode, 200);
    assert.equal(valid.json().mode, "offline");
    assert.equal(valid.body.includes("PRIVATE_FIXTURE_CANARY"), false);
    for (const headers of [
      { host: "attacker.example:3100", authorization },
      {
        host: "127.0.0.1:3100",
        authorization,
        origin: "http://127.0.0.1:3000",
      },
      { host: "127.0.0.1:3100", authorization, "sec-fetch-site": "cross-site" },
      {
        host: "127.0.0.1:3100",
        authorization,
        "x-forwarded-host": "public.example",
      },
    ]) {
      const denied = await app.inject({ url: "/api/operator/board", headers });
      assert.equal(denied.statusCode, 403);
      assert.equal(denied.headers["access-control-allow-origin"], undefined);
    }
  } finally {
    await app.close();
  }
});
