# Baartal - Hyperlocal Barter & Loyalty Platform

## Overview

Baartal is a hyperlocal barter and loyalty platform focused exclusively on Mumbai that connects local businesses into curated "barter bundles" and allows customers to earn and spend B-Coins (digital loyalty currency) across participating businesses. The platform creates exclusive territory partnerships where only one business per category operates in each local area, fostering collaboration over competition while providing customers with enhanced value through cross-business loyalty rewards.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React SPA**: Built with React 18, TypeScript, and Vite for fast development and optimized builds
- **Routing**: Uses Wouter for lightweight client-side routing with pages for customer/business login, dashboards, and marketing pages
- **UI Framework**: Implements shadcn/ui component library with Radix UI primitives for accessibility and Tailwind CSS for styling
- **State Management**: React Query (TanStack Query) for server state management with local state for forms and UI interactions
- **Authentication**: Client-side auth service with localStorage persistence for user sessions

### Backend Architecture
- **Express.js API**: RESTful API server with TypeScript support and middleware for logging, error handling, and request parsing
- **In-Memory Storage**: Currently uses MemStorage class implementing IStorage interface for development, designed to be easily replaceable with database implementation
- **Route Structure**: Organized API endpoints for authentication, business management, B-Coin transactions, QR code scanning, and ratings
- **Development Setup**: Vite middleware integration for hot module replacement in development mode

### Data Layer
- **Database ORM**: Drizzle ORM configured for PostgreSQL with schema definitions for users, businesses, bundles, transactions, and ratings
- **Schema Design**: Supports multi-user types (customer/business), business categorization, location-based bundles, B-Coin transaction tracking, and QR code management
- **Migration System**: Drizzle Kit for database migrations and schema management

### Key Features & Business Logic
- **Bundle System**: Exclusive territory model ensuring one business per category per pincode area
- **B-Coin Economy**: Digital loyalty currency earned as percentage of purchases, redeemable across bundle partners
- **QR Code Integration**: Businesses generate QR codes for customer scanning to earn B-Coins on purchases
- **Business Categories**: Predefined categories (Kirana, Electronics, Clothing, Food, Salon, etc.) with emoji icons
- **Rating System**: Customer reviews and ratings for businesses within bundles
- **Dashboard Management**: Separate interfaces for customers (transaction history, bundle exploration) and merchants (analytics, QR management, settings)

### Design System
- **Color Scheme**: Custom Baartal brand colors (orange primary, blue secondary, cream background) with CSS custom properties
- **Responsive Design**: Mobile-first approach with Tailwind CSS breakpoints
- **Component Library**: Comprehensive UI components including forms, dialogs, navigation, cards, and specialized components like QR scanner

## External Dependencies

- **Database**: PostgreSQL configured via Neon serverless for production deployment
- **Development Tools**: Replit integration with cartographer plugin and runtime error modal for development environment
- **UI Libraries**: Extensive Radix UI component primitives for accessibility-compliant interface elements
- **Build Tools**: Vite for frontend bundling, esbuild for server bundling, TypeScript compilation
- **Form Handling**: React Hook Form with Zod schema validation for type-safe form management
- **Image Assets**: Unsplash integration for placeholder images throughout the marketing site
- **Styling**: Tailwind CSS with PostCSS for utility-first styling and CSS custom properties for theming