import { test as base, expect } from "@playwright/test";

// Each fresh browser context loads eight room maps plus approved assets. Respect
// the production public service's 180/min budget instead of weakening it for CI.
export const test = base.extend<{ publicBudget: void }>({
  publicBudget: [
    async ({ request }, use) => {
      const response = await request.get("/healthz");
      const headers = response.headers();
      const remaining = Number(headers["x-ratelimit-remaining"] ?? 180);
      if (response.status() === 429 || remaining < 40) {
        // Installed @fastify/rate-limit README and index.js define both
        // headers as seconds remaining (not an epoch timestamp).
        const seconds = Number(
          headers["retry-after"] ?? headers["x-ratelimit-reset"] ?? 1,
        );
        if (!Number.isFinite(seconds) || seconds < 0 || seconds > 60)
          throw Error(`Unexpected public rate reset: ${seconds}`);
        console.info(
          `Respect public request budget: ${remaining} remaining; wait ${seconds}s for reset`,
        );
        await new Promise((resolve) =>
          setTimeout(resolve, seconds * 1000 + 150),
        );
      }
      await use();
    },
    { auto: true },
  ],
});
export { expect };
