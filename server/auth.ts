import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import type { DatabaseStorage } from "./db-storage";

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
  constructor(private storage: DatabaseStorage) {}

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
      user: { ...user, password: undefined },
      token,
    };
  }

  async login(email: string, password: string) {
    const user = await this.storage.getUserByEmail(email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isValidPassword = await this.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid email or password");
    }

    const tokenPayload: TokenPayload = {
      id: user.id,
      email: user.email,
      userType: user.userType,
      name: user.name,
    };

    const token = this.generateToken(tokenPayload);

    return {
      user: { ...user, password: undefined },
      token,
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.storage.getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const isValidPassword = await this.comparePassword(currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error("Current password is incorrect");
    }

    const hashedNewPassword = await this.hashPassword(newPassword);
    await this.storage.updateUser(userId, { password: hashedNewPassword });

    return { success: true };
  }
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const authService = new AuthService(req.app.locals.storage);
    const user = authService.verifyToken(token);
    if (!user) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireCustomer = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.userType !== 'customer') {
    return res.status(403).json({ error: 'Customer access required' });
  }
  next();
};

export const requireBusiness = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.userType !== 'business') {
    return res.status(403).json({ error: 'Business access required' });
  }
  next();
};

export const requireBusinessOwnership = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.userType !== 'business') {
    return res.status(403).json({ error: 'Business access required' });
  }

  try {
    const storage = req.app.locals.storage as DatabaseStorage;
    const businessId = req.params.businessId || req.body.businessId;
    
    if (!businessId) {
      return res.status(400).json({ error: 'Business ID required' });
    }

    const business = await storage.getBusinessById(businessId);
    if (!business || business.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to access this business' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to verify business ownership' });
  }
};