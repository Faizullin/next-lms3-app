import mongoose from "mongoose";
import { config } from "@/config";

export class DatabaseManager {
  private static mongoConnection: mongoose.Connection | null = null;

  /**
   * Initialize MongoDB connection
   */
  static async connect(): Promise<mongoose.Connection> {
    if (this.mongoConnection?.readyState === 1) {
      return this.mongoConnection;
    }

    try {
      const connection = await mongoose.connect(config.database.mongoUri, {
        // maxPoolSize: 10,
        // serverSelectionTimeoutMS: 5000,
        // socketTimeoutMS: 45000,
        // bufferCommands: false,
      });

      this.mongoConnection = connection.connection;

      // Event listeners
      this.mongoConnection.on("connected", () => {
        console.log("✅ MongoDB connected successfully");
      });

      this.mongoConnection.on("error", (error) => {
        console.error("❌ MongoDB connection error:", error);
      });

      this.mongoConnection.on("disconnected", () => {
        console.log("⚠️ MongoDB disconnected");
      });

      return this.mongoConnection;
    } catch (error) {
      console.error("❌ Failed to connect to MongoDB:", error);
      throw new Error(`MongoDB connection failed: ${error}`);
    }
  }

  /**
   * Close MongoDB connection
   */
  static async disconnect(): Promise<void> {
    if (this.mongoConnection?.readyState === 1) {
      await mongoose.disconnect();
      console.log("✅ MongoDB connection closed");
    }
    this.mongoConnection = null;
  }

  /**
   * Get connection health status
   */
  static getHealthStatus() {
    return {
      status:
        this.mongoConnection?.readyState === 1 ? "connected" : "disconnected",
      readyState: this.mongoConnection?.readyState || 0,
      uri: config.database.mongoUri ? "✅ Set" : "❌ Missing",
    };
  }
}
