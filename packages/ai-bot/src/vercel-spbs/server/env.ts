// env.mjs
import { z } from "zod";
import "dotenv/config";

// Define schema for environment variables
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),

  // OpenAI
  OPENAI_API_KEY: z.string().optional(),

  // Optional
  DEBUG: z.string().optional(),
});

export const env = envSchema.parse(process.env); 