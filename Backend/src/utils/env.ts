import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
export const env = createEnv({
  server: {
    PORT: z.string().default("3000"),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    MONGODB_URI: z.string(),
    MONGODB_PASSWORD: z.string().optional(),
  },
  runtimeEnvStrict: {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_PASSWORD: process.env.MONGODB_PASSWORD,
  },
});
