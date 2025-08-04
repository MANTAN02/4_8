# Baartal - Hyperlocal Barter and B-Coin Loyalty Platform

## Project Overview
Baartal is a hyperlocal barter and B-Coin loyalty platform focused exclusively on Mumbai, featuring customer and business registration, QR code transactions, bundle management, and ratings system. The platform connects local businesses with customers through a unique loyalty coin system and barter opportunities.

## Architecture
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe operations
- **Authentication**: JWT-based with bcrypt password hashing
- **Frontend**: React with Vite, shadcn/ui components
- **API**: RESTful API with proper authentication middleware

## Recent Changes
### Database & Authentication Migration (2025-08-04)
- Successfully migrated from in-memory storage to PostgreSQL database
- Implemented comprehensive authentication system with JWT tokens
- Added bcrypt password hashing for security
- Created complete database schema with all necessary tables
- Enhanced all API routes with proper authentication middleware
- Implemented role-based access control (customer/business)

## Database Schema
### Core Tables
- **users**: User accounts (customers and businesses)
- **businesses**: Business profiles and information
- **bundles**: Community-based business groupings
- **bundleMemberships**: Many-to-many relationship between bundles and businesses
- **bCoinTransactions**: B-Coin loyalty transactions
- **qrCodes**: QR codes for business transactions
- **ratings**: Customer reviews and ratings for businesses

## Authentication System
### Features
- JWT token-based authentication
- Bcrypt password hashing (12 rounds)
- Role-based access control (customer/business)
- Business ownership verification middleware
- Secure password change functionality

### API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/change-password` - Change password (authenticated)
- `GET /api/users/me` - Get current user profile

## Security Features
- All sensitive routes require authentication
- Business operations require business role
- Customer operations require customer role
- Business ownership verification for business-specific operations
- Password requirements (minimum 6 characters)
- Secure JWT token generation and verification

## API Structure
### Authentication Middleware
- `authenticateToken`: Verifies JWT token
- `requireCustomer`: Ensures customer role
- `requireBusiness`: Ensures business role
- `requireBusinessOwnership`: Verifies business ownership

### Protected Routes
- Business management endpoints
- B-Coin transaction history
- QR code operations
- Rating and review submissions
- User profile access

## User Preferences
*To be documented as user provides feedback and preferences*

## Development Guidelines
- Using PostgreSQL for production-ready data persistence
- Implementing proper error handling and validation
- Following REST API conventions
- Type-safe database operations with Drizzle ORM
- Secure authentication patterns
- Role-based access control implementation

## Next Steps
- Frontend integration with authentication system
- User interface for registration and login
- Business dashboard implementation
- Customer mobile interface
- QR code generation and scanning features