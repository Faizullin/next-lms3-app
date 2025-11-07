import { config } from "@/config";
import pino from "pino";

const transport = pino.transport({
  target: "pino-mongodb",
  options: {
    uri: config.database.mongoUri,
    collection: "queue_logs",
  },
});

export const logger = pino(transport);
