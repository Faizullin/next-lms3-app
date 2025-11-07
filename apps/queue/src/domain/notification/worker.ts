import { logger } from "@/core/logger";
import { RedisConfig } from "@/core/redis";
import { Worker } from "bullmq";
import { notificationEmitter } from "./emitters/notification";
import nodemailer from "nodemailer";
import { config } from "@/config";

const redisConfig = RedisConfig.getConnectionOptions();

const notificationWorker = new Worker(
  "notification",
  async (job) => {
    console.log("[notificationWorker]", job, "|", job.data);
    const notification = job.data;
    try {
      deliverInAppNotification(notification);
    } catch (err: any) {
      logger.error(err);
    }
  },
  { connection: redisConfig },
);

const transporter = nodemailer.createTransport({
  host: config.mail.host,
  port: config.mail.port,
  secure: config.mail.secure,
  auth: {
    user: config.mail.auth.user,
    pass: config.mail.auth.pass,
  },
});

const mailWorker = new Worker(
  "mail",
  async (job) => {
    const { to, from, subject, body } = job.data;
    try {
      console.log("Sending mail to", to, from, subject);
      await transporter.sendMail({
        from: from || config.mail.from,
        to: Array.isArray(to) ? to.join(", ") : to,
        subject,
        html: body,
        text: body,
      });
    } catch (err: any) {
      logger.error(err);
      throw err;
    }
  },
  {
    connection: redisConfig,
    concurrency: 5,
    removeOnComplete: { age: 24 * 3600, count: 100 },
    removeOnFail: { age: 24 * 3600, count: 50 },
  },
);

function deliverInAppNotification(notification: any) {
  notificationEmitter.emit("newNotification", notification);
}
