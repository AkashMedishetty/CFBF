# Project Structure & Organization

## Modular Monolithic Architecture

The BDMS follows a modular monolithic approach with clear separation between client and server, organized into logical modules that can run on older hosting systems.

## Directory Structure

```
blood-donation-management/
├── client/                     # React frontend application
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ui/            # Base UI components (buttons, cards, forms)
│   │   │   ├── layout/        # Layout components (header, sidebar, footer)
│   │   │   └── features/      # Feature-specific components
│   │   ├── pages/             # Route-based page components
│   │   │   ├── auth/          # Authentication pages
│   │   │   ├── donor/         # Donor dashboard and profile
│   │   │   ├── admin/         # Admin dashboard
│   │   │   ├── public/        # Public landing pages
│   │   │   └── emergency/     # Emergency request pages
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API service functions
│   │   ├── utils/             # Utility functions
│   │   ├── styles/            # Global styles and theme
│   │   └── types/             # TypeScript type definitions
│   ├── package.json
│   └── tailwind.config.js
├── server/                     # Node.js backend application
│   ├── src/
│   │   ├── modules/           # Application modules
│   │   │   ├── auth/          # Authentication module
│   │   │   ├── users/         # User management module
│   │   │   ├── donors/        # Donor-specific functionality
│   │   │   ├── requests/      # Blood request processing
│   │   │   ├── notifications/ # Communication system
│   │   │   ├── matching/      # Donor matching algorithm
│   │   │   ├── analytics/     # Analytics and reporting
│   │   │   ├── hospitals/     # Hospital integration
│   │   │   ├── certification/ # Donation certification
│   │   │   ├── referrals/     # Referral system
│   │   │   └── admin/         # Admin functionality
│   │   ├── middleware/        # Express middleware
│   │   ├── models/            # MongoDB data models
│   │   ├── routes/            # API route definitions
│   │   ├── services/          # Business logic services
│   │   ├── utils/             # Utility functions
│   │   ├── config/            # Configuration files
│   │   └── tests/             # Test files
│   ├── package.json
│   └── ecosystem.config.js    # PM2 configuration
├── shared/                     # Shared types and utilities
│   ├── types/                 # Common TypeScript types
│   └── constants/             # Shared constants
├── docs/                      # Documentation
├── .env.example               # Environment variables template
├── package.json               # Root package.json for scripts
└── README.md
```

## Module Organization

### Frontend Modules (client/src/)

#### Components Structure
- **ui/**: Base design system components (Button, Card, Input, Modal)
- **layout/**: Layout components (Header, Sidebar, Footer, Navigation)
- **features/**: Feature-specific components organized by domain

#### Pages Structure
- **auth/**: Login, registration, OTP verification
- **donor/**: Dashboard, profile, donation history, certificates
- **admin/**: Dashboard, donor management, analytics, system monitoring
- **public/**: Landing page, about us, blood bank directory
- **emergency/**: Emergency request forms, guest access

### Backend Modules (server/src/modules/)

#### Core Modules
- **auth/**: JWT authentication, OTP verification, session management
- **users/**: User registration, profile management, preferences
- **donors/**: Donor-specific features, eligibility, availability management
- **requests/**: Blood request processing, lifecycle management
- **notifications/**: WhatsApp, SMS, email communication system
- **matching/**: Intelligent donor matching algorithm
- **analytics/**: System metrics, reporting, dashboard data

#### Extended Modules
- **hospitals/**: Institutional accounts, inventory management
- **certification/**: Post-donation certification, QR code generation
- **referrals/**: Referral tracking, rewards, network management
- **admin/**: Administrative tools, verification workflows

## Naming Conventions

### Files and Directories
- **Components**: PascalCase (e.g., `DonorDashboard.tsx`)
- **Hooks**: camelCase with "use" prefix (e.g., `useAuth.ts`)
- **Services**: camelCase (e.g., `donorService.ts`)
- **Types**: PascalCase with descriptive names (e.g., `BloodRequest.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)

### API Routes
- RESTful conventions: `/api/v1/donors`, `/api/v1/requests`
- Nested resources: `/api/v1/donors/:id/donations`
- Actions: `/api/v1/requests/:id/match-donors`

### Database Collections
- Plural nouns: `users`, `donors`, `bloodRequests`, `donations`
- Consistent with model names

## Code Organization Principles

### Separation of Concerns
- **Models**: Data structure and validation only
- **Services**: Business logic and external API interactions
- **Controllers**: Request/response handling and validation
- **Middleware**: Cross-cutting concerns (auth, logging, error handling)

### Feature-Based Organization
- Group related functionality together
- Each module should be self-contained with clear interfaces
- Shared utilities in common directories

### Import/Export Standards
- Use barrel exports (`index.ts`) for clean imports
- Absolute imports for better maintainability
- Consistent import ordering (external, internal, relative)

## Configuration Management

### Environment-Based Configuration
- Development, staging, and production configurations
- Sensitive data in environment variables only
- Configuration validation on startup

### Feature Flags
- Toggle features for gradual rollout
- A/B testing capabilities
- Emergency feature disabling

## Testing Structure

### Test Organization
- **Unit Tests**: Alongside source files (`*.test.ts`)
- **Integration Tests**: In `tests/integration/`
- **E2E Tests**: In `tests/e2e/`
- **Test Utilities**: In `tests/utils/`

### Test Naming
- Descriptive test names explaining the scenario
- Group related tests in describe blocks
- Use consistent test data factories