import { config } from "@/config";
import { logger } from "@/core/logger";
import { errorHandler } from "@/middlewares/error-handler";
import { jwtUtils } from "@workspace/utils";
import { NextFunction, Request, Response } from "express";

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        domain: string;
        [key: string]: any;
      };
    }
  }
}

// Custom error types
class AuthenticationError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = "AuthenticationError";
    this.statusCode = statusCode;
  }
}

export const verifyJWTMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthenticationError("No valid authorization header provided");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new AuthenticationError("No token provided");
    }

    const secret = config.transport.jwt.secret;
    if (!secret) {
      logger.error("JWT secret not configured");
      throw new AuthenticationError("Server configuration error", 500);
    }

    const decoded = jwtUtils.verifyToken(token, secret) as {
      user: {
        userId: string;
        email: string;
        domain: string;
        [key: string]: any;
      };
      [key: string]: any;
    };

    if (!decoded || !decoded.user) {
      throw new AuthenticationError("Invalid token");
    }

    req.user = decoded.user;
    next();
  } catch (err) {
    logger.error(
      `JWT verification failed: ${err instanceof Error ? err.message : String(err)}`,
    );

    if (err instanceof AuthenticationError) {
      errorHandler(err, req, res, next);
    } else {
      errorHandler(
        new AuthenticationError("Authentication failed"),
        req,
        res,
        next,
      );
    }
  }
};
