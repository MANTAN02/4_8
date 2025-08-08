import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import type { DatabaseStorage } from "./db-storage";
import { AuthenticationError, ValidationError, RateLimitError } from "./error-handler";
import { logSecurityEvent, logBusinessEvent } from "./logger";

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString('hex');
const SALT_ROUNDS = 14;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

// Enhanced password validation
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,128}$/;

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    userType: string;
    name: string;
  };
  requestId?: string;
}

export interface TokenPayload {
  id: string;
  email: string;
  userType: string;
  name: string;
  iat?: number;
  exp?: number;
}

// In-memory rate limiting (use Redis in production)
const loginAttempts = new Map<string, { count: number; lastAttempt: Date; lockedUntil?: Date }>();

export class EnhancedAuthService {
  constructor(private storage: DatabaseStorage) {}

  async hashPassword(password: string): Promise<string> {
    if (!PASSWORD_REGEX.test(password)) {
      throw new ValidationError(
        'Password must be 8-128 characters with uppercase, lowercase, number, and special character'
      );
    }
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateTokens(payload: TokenPayload): { accessToken: string; refreshToken: string } {
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  verifyRefreshToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  // Check rate limiting
  checkRateLimit(identifier: string): void {
    const attempts = loginAttempts.get(identifier);
    
    if (attempts?.lockedUntil && attempts.lockedUntil > new Date()) {
      const remainingTime = Math.ceil((attempts.lockedUntil.getTime() - Date.now()) / 1000 / 60);
      throw new RateLimitError(`Account locked. Try again in ${remainingTime} minutes`);
    }

    if (attempts && attempts.count >= MAX_LOGIN_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + LOCKOUT_TIME);
      loginAttempts.set(identifier, { ...attempts, lockedUntil });
      
      logSecurityEvent('ACCOUNT_LOCKED', {
        identifier,
        attempts: attempts.count,
        lockedUntil: lockedUntil.toISOString()
      });
      
      throw new RateLimitError(`Too many failed attempts. Account locked for 15 minutes`);
    }
  }

  // Record failed attempt
  recordFailedAttempt(identifier: string): void {
    const attempts = loginAttempts.get(identifier) || { count: 0, lastAttempt: new Date() };
    attempts.count++;
    attempts.lastAttempt = new Date();
    loginAttempts.set(identifier, attempts);
  }

  // Clear attempts on successful login
  clearAttempts(identifier: string): void {
    loginAttempts.delete(identifier);
  }

  // Enhanced registration
  async register(
    email: string, 
    password: string, 
    name: string, 
    userType: "customer" | "business", 
    phone?: string,
    ip?: string
  ) {
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check existing user
    const existingUser = await this.storage.getUserByEmail(normalizedEmail);
    if (existingUser) {
      logSecurityEvent('DUPLICATE_REGISTRATION_ATTEMPT', {
        email: normalizedEmail,
        ip,
        userType
      });
      throw new ValidationError("User with this email already exists");
    }

    // Validate and hash password
    const hashedPassword = await this.hashPassword(password);

    // Create user
    const user = await this.storage.createUser({
      email: normalizedEmail,
      password: hashedPassword,
      name: name.trim(),
      userType,
      phone: phone?.trim() || null,
    });

    // Generate tokens
    const tokenPayload: TokenPayload = {
      id: user.id,
      email: user.email,
      userType: user.userType,
      name: user.name,
    };

    const { accessToken, refreshToken } = this.generateTokens(tokenPayload);

    // Log successful registration
    logBusinessEvent('USER_REGISTERED', user.id, {
      email: normalizedEmail,
      userType,
      ip
    });

    return {
      user: { ...user, password: undefined },
      accessToken,
      refreshToken,
    };
  }

  // Enhanced login
  async login(email: string, password: string, ip?: string) {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check rate limiting
    this.checkRateLimit(normalizedEmail);

    // Get user
    const user = await this.storage.getUserByEmail(normalizedEmail);
    if (!user) {
      this.recordFailedAttempt(normalizedEmail);
      logSecurityEvent('LOGIN_ATTEMPT_INVALID_EMAIL', {
        email: normalizedEmail,
        ip
      });
      throw new AuthenticationError("Invalid email or password");
    }

    // Verify password
    const isValidPassword = await this.comparePassword(password, user.password);
    if (!isValidPassword) {
      this.recordFailedAttempt(normalizedEmail);
      logSecurityEvent('LOGIN_ATTEMPT_INVALID_PASSWORD', {
        email: normalizedEmail,
        userId: user.id,
        ip
      });
      throw new AuthenticationError("Invalid email or password");
    }

    // Clear failed attempts
    this.clearAttempts(normalizedEmail);

    // Generate tokens
    const tokenPayload: TokenPayload = {
      id: user.id,
      email: user.email,
      userType: user.userType,
      name: user.name,
    };

    const { accessToken, refreshToken } = this.generateTokens(tokenPayload);

    // Log successful login
    logBusinessEvent('USER_LOGIN', user.id, {
      email: normalizedEmail,
      ip
    });

    return {
      user: { ...user, password: undefined },
      accessToken,
      refreshToken,
    };
  }

  // Refresh token
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = this.verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new AuthenticationError("Invalid refresh token");
    }

    // Verify user still exists
    const user = await this.storage.getUserById(payload.id);
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    // Generate new tokens
    const newPayload: TokenPayload = {
      id: user.id,
      email: user.email,
      userType: user.userType,
      name: user.name,
    };

    return this.generateTokens(newPayload);
  }
}

// Enhanced authentication middleware
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(new AuthenticationError("Access token required"));
  }

  const authService = new EnhancedAuthService(req.app.locals.storage);
  const payload = authService.verifyAccessToken(token);

  if (!payload) {
    logSecurityEvent('INVALID_TOKEN_USED', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      token: token.substring(0, 10) + '...',
      requestId: req.requestId
    });
    return next(new AuthenticationError("Invalid or expired token"));
  }

  req.user = payload;
  next();
};

// Role-based middleware
export const requireCustomer = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AuthenticationError());
  }
  
  if (req.user.userType !== 'customer') {
    logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', {
      userId: req.user.id,
      requiredRole: 'customer',
      actualRole: req.user.userType,
      ip: req.ip,
      url: req.url
    });
    return next(new AuthenticationError("Customer access required"));
  }
  
  next();
};

export const requireBusiness = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AuthenticationError());
  }
  
  if (req.user.userType !== 'business') {
    logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', {
      userId: req.user.id,
      requiredRole: 'business',
      actualRole: req.user.userType,
      ip: req.ip,
      url: req.url
    });
    return next(new AuthenticationError("Business access required"));
  }
  
  next();
};

// Business ownership verification
export const requireBusinessOwnership = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AuthenticationError());
  }

  const businessId = req.params.businessId || req.body.businessId;
  if (!businessId) {
    return next(new ValidationError("Business ID required"));
  }

  try {
    const storage = req.app.locals.storage as DatabaseStorage;
    const business = await storage.getBusinessById(businessId);
    
    if (!business) {
      return next(new ValidationError("Business not found"));
    }

    if (business.userId !== req.user.id) {
      logSecurityEvent('UNAUTHORIZED_BUSINESS_ACCESS', {
        userId: req.user.id,
        businessId,
        businessOwnerId: business.userId,
        ip: req.ip,
        url: req.url
      });
      return next(new AuthenticationError("You don't own this business"));
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Clean up old rate limiting entries (run periodically)
setInterval(() => {
  const now = new Date();
  for (const [key, data] of loginAttempts.entries()) {
    if (data.lockedUntil && data.lockedUntil < now) {
      loginAttempts.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes