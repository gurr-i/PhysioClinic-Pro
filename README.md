# PhysioClinic Pro - Medical Clinic Management System

## Overview

PhysioClinic Pro is a comprehensive medical clinic management system built with a modern full-stack architecture. The application manages patients, appointments, payments, and inventory for a physiotherapy clinic. It features a React-based frontend with a clean, medical-themed UI and an Express.js backend with PostgreSQL database integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom medical theme variables
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL with Neon serverless connection
- **Validation**: Zod schemas for runtime type checking
- **Session Management**: Express sessions with PostgreSQL storage

### Development Environment
- **Hot Reload**: Vite dev server with HMR for frontend
- **Process Management**: TSX for TypeScript execution in development
- **Error Handling**: Runtime error overlay for development debugging
- **Build Process**: ESBuild for server bundling, Vite for client bundling

## Key Components

### Database Schema
The application uses a well-structured relational database with four main entities:

1. **Patients**: Core patient information including demographics, medical history, and contact details
2. **Visits**: Appointment records with treatment details, duration, and charges
3. **Payments**: Financial transactions supporting both payments and advances
4. **Inventory**: Medical equipment and supplies tracking with stock levels

All tables include proper foreign key relationships and timestamps for audit trails.

### API Architecture
RESTful API endpoints organized by resource:
- `/api/patients` - Patient CRUD operations
- `/api/visits` - Appointment management
- `/api/payments` - Financial transaction handling
- `/api/inventory` - Equipment and supplies management
- `/api/dashboard/stats` - Analytics and reporting

### UI Components
Modular component architecture with:
- **Layout Components**: Sidebar navigation with glass morphism effects
- **Form Components**: Reusable forms for each entity with validation
- **Data Tables**: Sortable, searchable tables for data display
- **Dashboard Components**: Statistics cards and charts for analytics
- **UI Primitives**: Complete Shadcn/ui component library

## Data Flow

### Client-Server Communication
1. Frontend makes API requests using TanStack Query
2. Express.js server validates requests with Zod schemas
3. Drizzle ORM handles database operations with type safety
4. Server returns JSON responses with error handling
5. Client updates UI state automatically through React Query cache

### Form Submission Flow
1. React Hook Form captures user input
2. Zod schemas validate data on client side
3. Valid data sent to appropriate API endpoint
4. Server performs additional validation and database operations
5. Success/error responses trigger UI updates and notifications

### Real-time Updates
- React Query automatically refetches data after mutations
- Optimistic updates provide immediate UI feedback
- Error boundaries handle failures gracefully

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Hook Form
- **State Management**: TanStack Query for server state
- **Database**: Drizzle ORM, Neon serverless PostgreSQL
- **Validation**: Zod for schema validation
- **UI Library**: Radix UI primitives, Lucide React icons

### Development Tools
- **Build Tools**: Vite, ESBuild, TypeScript compiler
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer
- **Code Quality**: TypeScript for type safety
- **Database Tools**: Drizzle Kit for migrations

### Production Dependencies
- **Server**: Express.js, session management middleware
- **Charts**: Recharts for dashboard analytics
- **Date Handling**: date-fns for date manipulation
- **Utilities**: Class variance authority, clsx for styling

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite builds React app to `dist/public`
2. **Backend Build**: ESBuild bundles server code to `dist/index.js`
3. **Database**: Drizzle migrations run via `db:push` command
4. **Static Assets**: Served directly by Express in production

### Environment Configuration
- **Development**: Uses Vite dev server with API proxy
- **Production**: Express serves static files and API endpoints
- **Database**: Requires `DATABASE_URL` environment variable
- **Session**: Uses PostgreSQL for session storage

### Production Deployment
- Node.js process runs bundled Express server
- Static files served with proper caching headers
- Database connection pooling for performance
- Error handling with proper HTTP status codes

The application is designed for easy deployment on platforms like Replit, Vercel, or traditional VPS hosting with minimal configuration requirements.