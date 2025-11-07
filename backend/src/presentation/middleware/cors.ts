import { cors as honoCors } from "hono/cors";

export const cors = honoCors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
});
