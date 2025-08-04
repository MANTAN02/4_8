import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import type { IStorage } from "./storage";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const SALT_ROUNDS = 12;

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    userType: string;
    name: string;
  };
}

export interface TokenPayload {
  id: string;
  email: string;
  userType: string;
  name: string;
}

export class AuthService {
  constructor(private storage: IStorage) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
  }

  verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  async register(email: string, password: string, name: string, userType: "customer" | "business", phone?: string) {
    // Check if user already exists
    const existingUser = await this.storage.getUserByEmail(email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create user
    const user = await this.storage.createUser({
      email,
      password: hashedPassword,
      name,
      userType,
      phone: phone || null,
    });

    // Generate token
    const tokenPayload: TokenPayload = {
      id: user.id,
      email: user.email,
      userType: user.userType,
      name: user.name,
    };

    const token = this.generateToken(tokenPayload);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: user.userType,
        phone: user.phone,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async login(email: string, password: string) {
    // Find user
    const user = await this.storage.getUserByEmail(email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Verify password
    const isValidPassword = await this.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid email or password");
    }

    // Generate token
    const tokenPayload: TokenPayload = {
      id: user.id,
      email: user.email,
      userType: user.userType,
      name: user.name,
    };

    const token = this.generateToken(tokenPayload);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: user.userType,
        phone: user.phone,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.storage.getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    const isValidPassword = await this.comparePassword(currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password
    const hashedNewPassword = await this.hashPassword(newPassword);

    // Update password
    await this.storage.updateUser(userId, { password: hashedNewPassword });

    return { success: true };
  }

  async resetPassword(email: string, newPassword: string) {
    const user = await this.storage.getUserByEmail(email);
    if (!user) {
      throw new Error("User not found");
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update password
    await this.storage.updateUser(user.id, { password: hashedPassword });

    return { success: true };
  }
}

// Middleware to authenticate requests
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  const authService = new AuthService(req.app.locals.storage);
  const payload = authService.verifyToken(token);

  if (!payload) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }

  req.user = payload;
  next();
}

// Middleware to check if user is a customer
export function requireCustomer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.userType !== "customer") {
    return res.status(403).json({ error: "Customer access required" });
  }
  next();
}

// Middleware to check if user is a business
export function requireBusiness(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.userType !== "business") {
    return res.status(403).json({ error: "Business access required" });
  }
  next();
}

// Middleware to check if user owns the business
export async function requireBusinessOwnership(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.userType !== "business") {
    return res.status(403).json({ error: "Business access required" });
  }

  const businessId = req.params.businessId || req.body.businessId;
  if (!businessId) {
    return res.status(400).json({ error: "Business ID required" });
  }

  const storage = req.app.locals.storage as IStorage;
  const business = await storage.getBusinessById(businessId);

  if (!business || business.userId !== req.user.id) {
    return res.status(403).json({ error: "Access denied: You don't own this business" });
  }

  next();
}