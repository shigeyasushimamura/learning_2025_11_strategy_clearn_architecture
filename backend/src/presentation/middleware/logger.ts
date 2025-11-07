import { logger as honoLogger } from "hono/logger";

export const logger = honoLogger((message) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
});
