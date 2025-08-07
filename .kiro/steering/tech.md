# Technology Stack & Build System

## MERN Stack Architecture

### Core Technologies
- **Frontend**: React.js with TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js with Express.js framework
- **Database**: MongoDB Atlas (cloud-hosted) with local fallback capability
- **Authentication**: JWT tokens with bcrypt password hashing
- **Communication**: WhatsApp Business API integration

### UI/UX Framework
- **Design System**: Custom design tokens with light/dark theme support
- **Styling**: Tailwind CSS with custom CSS properties for theming
- **Icons**: Lucide React for consistent iconography
- **Animations**: Framer Motion for performance-optimized micro-interactions
- **Components**: Custom component library with premium design standards

### Free Services Integration
- **Maps**: OpenStreetMap + Leaflet.js for interactive maps (no API costs)
- **Geocoding**: Nominatim API for address validation and search
- **Navigation**: Google Maps URL scheme for turn-by-turn directions
- **Location**: Browser Geolocation API for user positioning

### External APIs
- **WhatsApp Business API**: Primary communication channel
- **SMS Fallback**: Twilio integration for backup notifications
- **Email**: SendGrid for email notifications

## Development Environment

### Prerequisites
- Node.js 14.x or higher
- MongoDB Atlas account or local MongoDB installation
- WhatsApp Business API credentials

### Common Commands

#### Development Setup
```bash
# Install dependencies
npm install

# Start development servers (both client and server)
npm run dev

# Start client only
npm run client

# Start server only
npm run server
```

#### Build & Deployment
```bash
# Build production client
npm run build

# Start production server
npm run start

# Run with PM2 process manager
pm2 start ecosystem.config.js
```

#### Testing
```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage
```

#### Database Operations
```bash
# Seed development data
npm run db:seed

# Reset database
npm run db:reset

# Run migrations
npm run db:migrate
```

## Hosting Compatibility

### Deployment Options
- **Shared Hosting**: Node.js support with MongoDB Atlas
- **VPS/Dedicated**: Full control with optional local MongoDB
- **Traditional Web Hosting**: cPanel support with external database

### Environment Variables
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/bdms
MONGODB_ATLAS_URI=mongodb+srv://...

# Server
PORT=3000
NODE_ENV=production

# WhatsApp
WHATSAPP_TOKEN=your_token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_verify_token

# Security
JWT_SECRET=your_jwt_secret
BCRYPT_ROUNDS=12

# Hosting compatibility
CACHE_TYPE=memory  # or 'redis'
SESSION_STORE=file # or 'database'
```

## Performance Standards

### Response Time Targets
- API endpoints: <200ms for 95% of requests
- Database queries: <50ms average
- WhatsApp message delivery: >95% success rate
- Page load times: <2 seconds

### Code Quality Requirements
- TypeScript for type safety
- ESLint + Prettier for code formatting
- 90% unit test coverage target
- Comprehensive error handling with graceful degradation