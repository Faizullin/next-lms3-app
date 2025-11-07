import { config } from "@/config";
import { ConnectionOptions } from "bullmq";

/**
 * Redis connection configuration for BullMQ
 */
export class RedisConfig {
  /**
   * Get BullMQ Redis connection options
   */
  static getConnectionOptions(): ConnectionOptions {
    return {
      host: config.database.redis.host,
      port: config.database.redis.port,
      password: config.database.redis.password || undefined,
      db: config.database.redis.db,
      //   retryDelayOnFailover: 100,
      //   maxRetriesPerRequest: 3,
      //   lazyConnect: true,
      //   // Additional Redis options for better performance
      //   connectTimeout: 10000,
      //   commandTimeout: 5000,
      //   enableReadyCheck: true,
      //   maxLoadingTime: 5000,
    };
  }
}
