import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from './error-handler';
import { logSecurityEvent } from './logger';

// Sanitize strings to prevent XSS
export const sanitizeString = (str: string): string => {
  return str
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

// Enhanced validation schemas
export const emailSchema = z.string()
  .email('Invalid email format')
  .min(5, 'Email too short')
  .max(255, 'Email too long')
  .transform(email => email.toLowerCase().trim());

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/^(?=.*[a-z])/, 'Password must contain lowercase letter')
  .regex(/^(?=.*[A-Z])/, 'Password must contain uppercase letter')
  .regex(/^(?=.*\d)/, 'Password must contain number')
  .regex(/^(?=.*[@$!%*?&])/, 'Password must contain special character');

export const nameSchema = z.string()
  .min(2, 'Name too short')
  .max(100, 'Name too long')
  .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces')
  .transform(sanitizeString);

export const phoneSchema = z.string()
  .optional()
  .refine(val => !val || /^\+?[\d\s\-()]{10,15}$/.test(val), 'Invalid phone format');

export const pincodeSchema = z.string()
  .regex(/^[0-9]{6}$/, 'Pincode must be 6 digits');

export const businessNameSchema = z.string()
  .min(2, 'Business name too short')
  .max(255, 'Business name too long')
  .transform(sanitizeString);

export const addressSchema = z.string()
  .min(10, 'Address too short')
  .max(500, 'Address too long')
  .transform(sanitizeString);

export const descriptionSchema = z.string()
  .max(1000, 'Description too long')
  .optional()
  .transform(val => val ? sanitizeString(val) : val);

export const bCoinRateSchema = z.string()
  .refine(val => {
    const num = parseFloat(val);
    return num >= 1 && num <= 25;
  }, 'B-Coin rate must be between 1-25%');

// Registration validation
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  userType: z.enum(['customer', 'business'], {
    errorMap: () => ({ message: 'User type must be customer or business' })
  }),
  phone: phoneSchema,
});

// Login validation
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password required'),
});

// Business creation validation
// Valid business categories
const VALID_CATEGORIES = [
  "electronics", "clothing", "restaurant", "salon", "footwear", 
  "cafe", "gifts", "pharmacy", "stationery", "ethnic-wear", 
  "kids-clothing", "formal-wear", "cosmetics", "turf", "beauty-parlour"
];

export const businessSchema = z.object({
  businessName: businessNameSchema,
  category: z.string()
    .min(1, 'Category required')
    .refine(val => VALID_CATEGORIES.includes(val), 'Invalid category selected'),
  description: descriptionSchema,
  address: addressSchema,
  pincode: pincodeSchema,
  phone: phoneSchema,
  bCoinRate: bCoinRateSchema,
});

// Transaction validation
export const transactionSchema = z.object({
  qrCodeId: z.string().uuid('Invalid QR code ID'),
  amount: z.number()
    .positive('Amount must be positive')
    .max(100000, 'Amount too large')
    .multipleOf(0.01, 'Amount can have max 2 decimal places'),
});

// Rating validation
export const ratingSchema = z.object({
  businessId: z.string().uuid('Invalid business ID'),
  rating: z.number().int().min(1).max(5, 'Rating must be 1-5'),
  comment: z.string()
    .max(500, 'Comment too long')
    .optional()
    .transform(val => val ? sanitizeString(val) : val),
});

// Validation middleware factory
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate and sanitize input
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Log validation failure for security monitoring
        logSecurityEvent('VALIDATION_FAILED', {
          ip: req.ip,
          url: req.url,
          method: req.method,
          errors: error.issues,
          userAgent: req.get('User-Agent')
        });
        
        next(new ValidationError(`Validation failed: ${error.issues.map(i => i.message).join(', ')}`));
      } else {
        next(error);
      }
    }
  };
};

// Query parameter validation
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedQuery = schema.parse(req.query);
      req.query = validatedQuery;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ValidationError(`Query validation failed: ${error.issues.map(i => i.message).join(', ')}`));
      } else {
        next(error);
      }
    }
  };
};

// Params validation
export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedParams = schema.parse(req.params);
      req.params = validatedParams;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ValidationError(`Params validation failed: ${error.issues.map(i => i.message).join(', ')}`));
      } else {
        next(error);
      }
    }
  };
};

// UUID validation schema
export const uuidSchema = z.object({
  id: z.string().uuid('Invalid ID format')
});

// Pagination validation
export const paginationSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val), 100) : 20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

// Search validation
export const searchSchema = z.object({
  q: z.string().min(1, 'Search query required').max(100, 'Search query too long').transform(sanitizeString),
  category: z.string().optional(),
  pincode: pincodeSchema.optional()
});

// Export common validation middleware
export const validateRegistration = validate(registerSchema);
export const validateLogin = validate(loginSchema);
export const validateBusiness = validate(businessSchema);
export const validateTransaction = validate(transactionSchema);
export const validateRating = validate(ratingSchema);
export const validateUUID = validateParams(uuidSchema);
export const validatePagination = validateQuery(paginationSchema);
export const validateSearch = validateQuery(searchSchema);