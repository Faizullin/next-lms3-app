import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

// Simple configuration object
export const config = {
  server: {
    port: Number(process.env.PORT) || 3001,
    host: process.env.HOST || "localhost",
    nodeEnv: process.env.NODE_ENV || "development",
  },

  database: {
    mongoUri: process.env.MONGODB_URI || "",
    redis: {
      host: process.env.REDIS_HOST || "localhost",
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: Number(process.env.REDIS_DB) || 0,
    },
  },

  notification: {
    maxRetries: Number(process.env.NOTIFICATION_MAX_RETRIES) || 3,
    defaultPriority: Number(process.env.NOTIFICATION_DEFAULT_PRIORITY) || 5,
    queueCleanup: {
      completed: Number(process.env.QUEUE_CLEANUP_COMPLETED) || 100,
      failed: Number(process.env.QUEUE_CLEANUP_FAILED) || 50,
    },
  },

  transport: {
    jwt: {
      secret: process.env.TRANSPORT_JWT_SECRET || "",
    },
  },

  mail: {
    host: process.env.SMTP_HOST || process.env.MAIL_HOST || "localhost",
    port: Number(process.env.SMTP_PORT || process.env.MAIL_PORT) || 587,
    secure: process.env.MAIL_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER || process.env.MAIL_USER || "",
      pass: process.env.SMTP_PASSWORD || process.env.MAIL_PASS || "",
    },
    from:
      process.env.EMAIL_FROM ||
      process.env.MAIL_FROM ||
      `${process.env.SUPER_ADMIN_NAME || "CourseKit"} <noreply@coursekit.com>`,
  },
};

// Environment validation
const requiredEnvVars = [
  { key: "MONGODB_URI", value: config.database.mongoUri },
  { key: "TRANSPORT_JWT_SECRET", value: config.transport.jwt.secret },
];

const missingVars = requiredEnvVars.filter((env) => !env.value);

if (missingVars.length > 0) {
  console.error("❌ Missing required environment variables:");
  missingVars.forEach((env) => {
    console.error(`   ${env.key}`);
  });
  console.error(
    "\n💡 Create a .env file in the project root with these variables",
  );
  process.exit(1);
}
