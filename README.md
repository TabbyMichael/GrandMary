# Everbloom Memorial Platform

A comprehensive, production-ready memorial platform built with modern web technologies to honor and celebrate the lives of loved ones. This platform combines elegant frontend design with a robust backend API to create a meaningful digital memorial experience.

## 🌟 Overview

Everbloom is a thoughtfully crafted memorial website that allows family and friends to:
- Share heartfelt tributes and memories
- Light virtual candles in remembrance
- View life timelines and biographies
- Experience a beautiful, responsive interface
- Access multilingual content (English/Swahili)

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

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git for version control
- Modern web browser

### One-Command Development
```bash
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

## 📁 Project Structure

```
everbloom/
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

## 🔧 Technical Features

### Frontend Excellence
- **Type Safety**: Full TypeScript implementation
- **Component Architecture**: Modular, reusable components
- **Performance**: Code splitting and lazy loading
- **Accessibility**: ARIA labels and semantic HTML
- **Responsive**: Mobile-first design approach
- **Internationalization**: Built-in multi-language support
- **Error Boundaries**: Graceful error handling
- **State Management**: Efficient server state synchronization

### Backend Robustness
- **RESTful API**: Clean, documented endpoints
- **Database Design**: Optimized SQLite schema with indexing
- **Security**: Comprehensive security measures
- **Error Handling**: Structured error responses
- **Logging**: Morgan middleware for request tracking
- **Validation**: Joi schemas for all inputs
- **Rate Limiting**: Configurable per-IP limits
- **Analytics**: Built-in usage tracking

### Integration Patterns
- **API Client**: Type-safe API integration
- **React Hooks**: Custom hooks for state management
- **Error Handling**: Consistent error boundaries
- **Loading States**: Optimistic UI updates
- **Caching**: React Query caching strategies

## 🛡️ Security Implementation

### Authentication & Authorization
- JWT-based authentication with secure token generation
- bcrypt password hashing with salt rounds
- Role-based access control for admin features
- Session management with secure cookie handling

### Input Validation & Sanitization
- Joi validation schemas for all API endpoints
- XSS protection with input sanitization
- SQL injection prevention through parameterized queries
- File upload validation and scanning

### Network Security
- CORS configuration for cross-origin requests
- Helmet.js for security headers
- Rate limiting to prevent abuse
- HTTPS enforcement in production
- IP-based tracking and analytics

## 📊 Database Schema

### Core Tables
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

### Performance Optimizations
- Strategic indexing on frequently queried columns
- Composite indexes for complex queries
- VACUUM operations for database maintenance
- Connection pooling for high-traffic scenarios

## 📱 User Experience Features

### Interactive Elements
- **Tribute Wall**: Submit and view memories with pagination
- **Digital Candles**: Light virtual candles with real-time counting
- **Life Timeline**: Visual journey through significant life events
- **Biography Section**: Rich content presentation with typography
- **Responsive Navigation**: Mobile-optimized menu system

### Accessibility & Inclusivity
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Semantic HTML structure

### Performance Optimizations
- Lazy loading for images and components
- Code splitting by route
- Service worker for offline capability
- Optimized bundle sizes with tree shaking

## 🔧 Development Workflow

### Code Quality Standards
- **ESLint**: Consistent code formatting and rules
- **TypeScript**: Static type checking
- **Prettier**: Automated code formatting
- **Husky**: Pre-commit hooks for quality

### Testing Strategy
- **Unit Tests**: Jest for component testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Playwright for user flows
- **Type Checking**: TypeScript compilation

### Build & Deployment
- **Vite**: Fast development and optimized builds
- **Environment Management**: Separate dev/prod configurations
- **Docker Support**: Containerized deployment options
- **CI/CD Ready**: GitHub Actions workflows

## 📚 API Documentation

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

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2024-03-28T10:30:00.000Z"
}
```

## 🚀 Deployment Options

### Traditional VPS Deployment
- Nginx reverse proxy configuration
- PM2 process management
- SSL/TLS certificate setup
- Database backup strategies

### Cloud Platform Deployment
- AWS Elastic Beanstalk
- Google Cloud App Engine
- Azure App Service
- DigitalOcean App Platform

### Container Deployment
- Docker multi-stage builds
- Docker Compose orchestration
- Kubernetes manifests
- CI/CD pipeline integration

### Serverless Architecture
- Vercel for frontend
- Railway/Render for backend
- AWS Lambda functions
- Edge computing optimization

## 📈 Monitoring & Analytics

### Application Monitoring
- Health check endpoints
- Performance metrics tracking
- Error rate monitoring
- User behavior analytics

### Database Performance
- Query optimization tracking
- Index usage analysis
- Connection pool monitoring
- Backup verification

### Security Monitoring
- Failed login attempt tracking
- Rate limit violation alerts
- Unusual activity detection
- Security audit logging

## 🔄 Maintenance & Updates

### Regular Maintenance Tasks
- Database optimization and cleanup
- Security patch updates
- SSL certificate renewal
- Log rotation and archival

### Update Procedures
- Zero-downtime deployment strategies
- Database migration handling
- Rollback procedures
- Feature flag management

## 🤝 Contributing Guidelines

### Development Standards
- Follow existing code patterns
- Write comprehensive tests
- Update documentation
- Use semantic versioning

### Pull Request Process
- Feature branch development
- Code review requirements
- Automated testing validation
- Merge to main branch

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Family & Friends**: For the inspiration and purpose
- **Open Source Community**: For the amazing tools and libraries
- **Contributors**: For making this platform better

## 📞 Support & Contact

For technical support, questions, or contributions:

- **Documentation**: Check `/docs` directory
- **Issues**: Report via GitHub issues
- **Security**: Report security concerns privately
- **Community**: Join our Discord/Slack channel

---

**Everbloom** - Where memories bloom eternally in the digital garden of remembrance.

*Built with love, care, and modern engineering practices to honor those who matter most.*
#   G r a n d M a r y  
 