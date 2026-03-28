# Everbloom Memorial Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-%5E18.0.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%5E5.0.0-blue.svg)](https://www.typescriptlang.org/)

> A comprehensive, production-ready memorial platform built with modern web technologies to honor and celebrate the lives of loved ones. This platform combines elegant frontend design with a robust backend API to create a meaningful digital memorial experience.

## ✨ Features

- 🕯️ **Digital Candles** - Light virtual candles in remembrance with real-time counting
- 💝 **Tribute Wall** - Share heartfelt memories and messages with moderation
- 📅 **Life Timeline** - Visual journey through significant life events
- 🌍 **Multilingual** - English and Swahili language support
- 📱 **Responsive Design** - Beautiful experience on all devices
- 🔐 **Admin Panel** - Secure content management and analytics
- 🎨 **Elegant UI** - Modern design with smooth animations
- ♿ **Accessible** - WCAG 2.1 AA compliant interface

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git for version control
- Modern web browser

### One-Command Development
```bash
# Clone the repository
git clone https://github.com/TabbyMichael/GrandMary.git
cd GrandMary

# Windows
.\scripts\start-full-dev.bat

# Linux/Mac
chmod +x scripts/start-full-dev.sh
./scripts/start-full-dev.sh
```

### Manual Setup
```bash
# Backend
cd backend
npm install
cp .env.example .env
npm run migrate
npm run seed
npm run dev

# Frontend (new terminal)
npm install
npm run dev
```

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Styling**: TailwindCSS with custom design system
- **Animations**: Framer Motion for smooth interactions
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router DOM
- **Build Tool**: Vite for optimal development experience

### Backend (Node.js + Express)
- **Runtime**: Node.js 18+ with ES modules
- **Framework**: Express.js with middleware architecture
- **Database**: SQLite with optimized indexing
- **Authentication**: JWT with bcrypt password hashing
- **Validation**: Joi schemas for input validation
- **Security**: Helmet, CORS, rate limiting
- **Process Management**: PM2-ready for production

## � Project Structure

```
GrandMary/
├── backend/                    # Node.js API Server
│   ├── src/
│   │   ├── routes/           # API endpoints
│   │   │   ├── tributes.js  # Tribute management
│   │   │   ├── candles.js   # Candle system
│   │   │   ├── auth.js      # Authentication
│   │   │   └── admin.js     # Admin panel
│   │   ├── middleware/        # Cross-cutting concerns
│   │   │   ├── auth.js      # JWT middleware
│   │   │   └── validation.js # Input validation
│   │   ├── database/         # Database layer
│   │   │   ├── init.js      # Schema & connection
│   │   │   └── seed.js      # Sample data
│   │   ├── utils/            # Helper functions
│   │   │   └── helpers.js    # Common utilities
│   │   └── server.js        # Application entry
│   ├── scripts/              # Development helpers
│   ├── database/             # SQLite database files
│   └── package.json
├── src/                      # React Frontend
│   ├── components/           # React components
│   │   ├── ui/             # Reusable UI components
│   │   ├── TributeWall.tsx  # Tribute submission/display
│   │   ├── DigitalCandle.tsx # Candle lighting
│   │   ├── LifeTimeline.tsx  # Life events timeline
│   │   └── ...             # Other memorial components
│   ├── hooks/               # Custom React hooks
│   │   ├── useApi.ts       # API integration hooks
│   │   └── useTranslations.ts # i18n support
│   ├── lib/                # Utilities and configs
│   │   ├── api.ts          # API client
│   │   └── translations.ts # Language data
│   ├── contexts/            # React contexts
│   └── pages/              # Route components
├── scripts/                # Development scripts
├── public/                 # Static assets
└── docs/                   # Documentation
```

## �️ Security Features

- 🔐 **JWT Authentication** - Secure token-based authentication
- 🛡️ **Input Validation** - Comprehensive input sanitization with Joi
- 🚦 **Rate Limiting** - Protection against abuse and spam
- 🔒 **HTTPS Ready** - SSL/TLS configuration for production
- 🛡️ **Security Headers** - Helmet.js for comprehensive protection
- 🔍 **XSS Protection** - Input sanitization and CSP headers
- 📊 **Activity Logging** - Complete audit trail for security

## 📊 Database Schema

Optimized SQLite database with strategic indexing:

```sql
-- Tributes submitted by users
CREATE TABLE tributes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  message TEXT NOT NULL,
  email TEXT,
  approved BOOLEAN DEFAULT FALSE,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Virtual candles lit in memory
CREATE TABLE candles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Admin user management
CREATE TABLE admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Analytics and tracking
CREATE TABLE analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  event_data TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

##  API Documentation

### Core Endpoints

#### Tributes
```http
GET    /api/tributes           # Fetch approved tributes
POST   /api/tributes           # Submit new tribute
GET    /api/tributes/stats      # Get tribute statistics
```

#### Candles
```http
POST   /api/candles            # Light a candle
GET    /api/candles/count       # Get total count
GET    /api/candles/recent     # Recent activity
GET    /api/candles/stats       # Candle analytics
```

#### Authentication
```http
POST   /api/auth/register       # Create admin account
POST   /api/auth/login         # Admin authentication
GET    /api/auth/me           # Current user info
POST   /api/auth/logout        # Logout
```

#### Admin Panel
```http
GET    /api/admin/dashboard     # Overview statistics
GET    /api/admin/tributes     # Manage tributes
PUT    /api/admin/tributes/:id/approve  # Approve tribute
DELETE /api/admin/tributes/:id           # Delete tribute
GET    /api/admin/analytics    # Detailed analytics
```

## 🎨 Frontend Features

### Interactive Components
- **Tribute Wall**: Real-time tribute submission with pagination
- **Digital Candles**: Animated candle lighting with live counting
- **Life Timeline**: Interactive timeline with smooth animations
- **Biography Section**: Rich content presentation with typography
- **Responsive Navigation**: Mobile-optimized menu system

### Technical Excellence
- **Type Safety**: Full TypeScript implementation
- **Performance**: Code splitting and lazy loading
- **Accessibility**: ARIA labels and semantic HTML
- **Internationalization**: Built-in multi-language support
- **Error Boundaries**: Graceful error handling
- **State Management**: Efficient server state synchronization

## 🚀 Deployment

### Quick Deploy Options

#### Development
```bash
# Start both frontend and backend
npm run dev:full

# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend
```

#### Production
```bash
# Build for production
npm run build

# Start production server
npm start

# Deploy with PM2
pm2 start ecosystem.config.js
```

### Platform-Specific Deployment

- **Vercel** (Frontend) - `vercel --prod`
- **Railway** (Backend) - Connect GitHub repository
- **AWS** - Elastic Beanstalk or EC2 with Nginx
- **DigitalOcean** - App Platform or Droplet
- **Netlify** - Static frontend hosting

## 📈 Performance

### Frontend Optimizations
- ⚡ **Bundle Splitting** - Automatic code splitting by routes
- 🗜️ **Tree Shaking** - Dead code elimination
- 🖼️ **Image Optimization** - Lazy loading and WebP support
- 💾 **Caching Strategy** - React Query with intelligent caching
- 📱 **Mobile First** - Progressive enhancement approach

### Backend Performance
- 🗄️ **Database Indexing** - Optimized queries with strategic indexes
- � **Connection Pooling** - Efficient database connection management
- 📊 **Analytics Tracking** - Real-time performance monitoring
- 🛡️ **Rate Limiting** - Intelligent abuse prevention

## 🧪 Testing

```bash
# Run all tests
npm test

# Frontend tests
npm run test:frontend

# Backend tests
npm run test:backend

# E2E tests
npm run test:e2e
```

### Test Coverage
- **Unit Tests**: Jest for component and utility testing
- **Integration Tests**: API endpoint testing with Supertest
- **E2E Tests**: Playwright for complete user flows
- **Type Checking**: TypeScript compilation validation

## 🔧 Development

### Code Quality
- **ESLint**: Consistent code formatting and rules
- **Prettier**: Automated code formatting
- **Husky**: Pre-commit hooks for quality
- **TypeScript**: Static type checking

### Scripts
```bash
# Development
npm run dev              # Start development servers
npm run dev:backend       # Backend only
npm run dev:frontend      # Frontend only

# Building
npm run build            # Production build
npm run build:dev        # Development build

# Database
npm run migrate           # Initialize database
npm run seed             # Add sample data

# Deployment
npm run deploy            # Deploy to production
```

## 📋 Requirements

### System Requirements
- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher
- **Database**: SQLite 3.x (included)
- **OS**: Windows 10+, macOS 10.15+, Ubuntu 18.04+

### Browser Support
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🤝 Contributing

We welcome contributions to help make Everbloom better! Here's how you can help:

### Development Standards
- Follow existing code patterns and conventions
- Write comprehensive tests for new features
- Update documentation for API changes
- Use semantic versioning for releases

### Pull Request Process
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use TypeScript for all new code
- Follow ESLint rules and Prettier formatting
- Write meaningful commit messages
- Add tests for new functionality

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Family & Friends** - For the inspiration and purpose behind this project
- **React Team** - For the amazing framework and ecosystem
- **TailwindCSS** - For the utility-first CSS framework
- **Open Source Community** - For the incredible tools and libraries that make this possible

## 📞 Support

For technical support, questions, or contributions:

- 📧 **Email**: support@everbloom.com
- 🐛 **Issues**: [Report via GitHub Issues](https://github.com/TabbyMichael/GrandMary/issues)
- 🔒 **Security**: Report security concerns privately
- 💬 **Discussions**: [GitHub Discussions](https://github.com/TabbyMichael/GrandMary/discussions)

---

<div align="center">

**Everbloom** - Where memories bloom eternally in the digital garden of remembrance

*Built with ❤️, care, and modern engineering practices to honor those who matter most*

[⭐ Star this repo](https://github.com/TabbyMichael/GrandMary) • [🍴 Fork this repo](https://github.com/TabbyMichael/GrandMary/fork)

</div>
#   G r a n d M a r y 
 
 