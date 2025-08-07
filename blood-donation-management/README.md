# Call For Blood Foundation - Blood Donation Management System

A revolutionary digital platform designed to bridge the critical gap between blood donors and recipients through intelligent automation, real-time communication, and comprehensive data management.

## Project Structure

```
blood-donation-management/
├── client/          # React frontend application
├── server/          # Express.js backend application
├── shared/          # Shared utilities and constants
└── README.md        # This file
```

## Technology Stack

- **Frontend**: React.js with JavaScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js with Express.js framework
- **Database**: MongoDB Atlas (cloud-hosted)
- **Authentication**: JWT tokens with bcrypt password hashing
- **Communication**: WhatsApp Business API integration

## Getting Started

### Prerequisites
- Node.js 14.x or higher
- MongoDB Atlas account (connection string required)
- WhatsApp Business API credentials

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install root dependencies
   npm install
   
   # Install server dependencies
   cd server && npm install
   
   # Install client dependencies
   cd ../client && npm install
   ```

3. Configure environment variables:
   - Copy `server/.env.example` to `server/.env`
   - Update the MongoDB connection string in `server/.env`
   - Add your WhatsApp Business API credentials

4. Start development servers:
   ```bash
   # From root directory - starts both client and server
   npm run dev
   
   # Or start individually:
   npm run server  # Starts Express.js server on port 5000
   npm run client  # Starts React app on port 3000
   ```

### Environment Setup

Update the following variables in `server/.env`:
- `MONGODB_ATLAS_URI`: Your MongoDB Atlas connection string
- `WHATSAPP_TOKEN`: WhatsApp Business API token
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`: Webhook verification token
- `JWT_SECRET`: Secret key for JWT tokens

## Features

- Intelligent donor matching algorithm
- WhatsApp-first communication
- Real-time emergency response coordination
- Comprehensive certification system
- Admin dashboard and analytics
- Mobile-first responsive design
- Premium UI/UX with animations and micro-interactions
- Comprehensive development logging system

## Development Features

### Comprehensive Logging System

The application includes a sophisticated logging system that provides detailed insights during development:

#### Server-Side Logging (`server/utils/logger.js`)
- **Colored console output** with emojis for easy identification
- **Context-aware logging** with categories (DATABASE, API, AUTH, etc.)
- **Performance timing** for operations
- **Request/response logging** with sanitized sensitive data
- **Error tracking** with stack traces
- **Database operation monitoring**

#### Client-Side Logging (`client/src/utils/logger.js`)
- **Component lifecycle tracking** (mount, unmount, updates)
- **User interaction logging** (clicks, form submissions, navigation)
- **Theme changes and UI state tracking**
- **API call monitoring** with response data
- **Performance timing** for client operations
- **Form validation tracking**

#### Log Categories
- 🚀 **STARTUP**: Server initialization and configuration
- 🗄️ **DATABASE**: MongoDB connections and operations
- 🌐 **API**: HTTP requests and responses
- 🔐 **AUTH**: Authentication and authorization
- 🎨 **UI**: User interface interactions and state changes
- 🧭 **ROUTE**: Navigation and routing
- 🌙 **THEME**: Theme switching and preferences
- ❌ **ERROR**: Error handling and debugging

#### Usage
Logs are automatically generated throughout the application and are **only visible in development mode**. In production, logging is disabled for performance and security.

To view logs:
1. Open browser developer tools (F12)
2. Check the Console tab for client-side logs
3. Check terminal/command prompt for server-side logs

### Premium UI Components

The application features a comprehensive design system with reusable components:

- **Button**: Multiple variants (primary, secondary, outline, ghost, danger, success)
- **Card**: Flexible card component with hover effects and sub-components
- **Input**: Advanced input with validation, password toggle, and status indicators
- **Modal**: Animated modal with overlay, keyboard navigation, and size variants

All components include:
- Framer Motion animations
- Dark/light theme support
- Accessibility features
- Comprehensive logging
- TypeScript-like prop validation

## License

© Call For Blood Foundation. All rights reserved.