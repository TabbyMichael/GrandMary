# 🌸 Everbloom Memorial Platform

<div align="center">

![Everbloom Logo](https://img.shields.io/badge/Everbloom-Memorial%20Platform-purple?style=for-the-badge&logo=react)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-%5E18.0.0-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%5E5.0.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

*A comprehensive, production-ready memorial platform built with modern web technologies to honor and celebrate the lives of loved ones. This platform combines elegant frontend design with a robust backend API to create a meaningful digital memorial experience.*

[▶️ Live Demo](https://your-demo-link.com) • [📚 Documentation](./docs) • [🚀 Quick Start](#-quick-start)

</div>

---

## ✨ Features

<div align="center">

| Feature | Description |
|---------|-------------|
| 🕯️ **Digital Candles** | Light virtual candles in remembrance with real-time counting |
| 💝 **Tribute Wall** | Share heartfelt memories and messages with moderation |
| 📅 **Life Timeline** | Visual journey through significant life events |
| 🌍 **Multilingual** | English and Swahili language support |
| 📱 **Responsive Design** | Beautiful experience on all devices |
| 🔐 **Admin Panel** | Secure content management and analytics |
| 🎨 **Elegant UI** | Modern design with smooth animations |
| ♿ **Accessible** | WCAG 2.1 AA compliant interface |

</div>

---

## 🚀 Quick Start

### 📋 Prerequisites

- **Node.js** 18+ and npm
- **Git** for version control
- **Modern web browser** (Chrome 90+, Firefox 88+, Safari 14+)

### ⚡ One-Command Development

```bash
# Clone the repository
git clone https://github.com/TabbyMichael/GrandMary.git
cd GrandMary

# Start development (Windows)
.\scripts\start-full-dev.bat

# Start development (Linux/Mac)
chmod +x scripts/start-full-dev.sh
./scripts/start-full-dev.sh
```

### 🔧 Manual Setup

<details>
<summary>Click to expand manual setup instructions</summary>

```bash
# Backend Setup
cd backend
npm install
cp .env.example .env
npm run migrate
npm run seed
npm run dev

# Frontend Setup (new terminal)
cd ..
npm install
npm run dev
```

</details>

---

## 🏗️ Architecture

<div align="center">

### 🎨 Frontend Stack

```typescript
// Modern React Ecosystem
{
  "framework": "React 18 + TypeScript",
  "styling": "TailwindCSS + shadcn/ui",
  "animations": "Framer Motion",
  "state": "TanStack Query",
  "routing": "React Router DOM",
  "build": "Vite"
}
```

### ⚙️ Backend Stack

```javascript
// Robust Node.js Backend
{
  "runtime": "Node.js 18+",
  "framework": "Express.js",
  "database": "SQLite with indexing",
  "auth": "JWT + bcrypt",
  "validation": "Joi schemas",
  "security": "Helmet + CORS + rate limiting"
}
```

</div>

---

## 📁 Project Structure

```
GrandMary/
├── 📂 backend/                    # Node.js API Server
│   ├── 📂 src/
│   │   ├── 📂 routes/           # API endpoints
│   │   │   ├── 📄 tributes.js  # Tribute management
│   │   │   ├── 📄 candles.js   # Candle system
│   │   │   ├── 📄 auth.js      # Authentication
│   │   │   └── 📄 admin.js     # Admin panel
│   │   ├── 📂 middleware/        # Cross-cutting concerns
│   │   │   ├── 📄 auth.js      # JWT middleware
│   │   │   └── 📄 validation.js # Input validation
│   │   ├── 📂 database/         # Database layer
│   │   │   ├── 📄 init.js      # Schema & connection
│   │   │   └── 📄 seed.js      # Sample data
│   │   ├── 📂 utils/            # Helper functions
│   │   │   └── 📄 helpers.js    # Common utilities
│   │   └── 📄 server.js        # Application entry
│   ├── 📂 scripts/              # Development helpers
│   ├── 📂 database/             # SQLite database files
│   └── 📄 package.json
├── 📂 src/                      # React Frontend
│   ├── 📂 components/           # React components
│   │   ├── 📂 ui/             # Reusable UI components
│   │   ├── 📄 TributeWall.tsx  # Tribute submission/display
│   │   ├── 📄 DigitalCandle.tsx # Candle lighting
│   │   ├── 📄 LifeTimeline.tsx  # Life events timeline
│   │   └── 📄 ...             # Other memorial components
│   ├── 📂 hooks/               # Custom React hooks
│   │   ├── 📄 useApi.ts       # API integration hooks
│   │   └── 📄 useTranslations.ts # i18n support
│   ├── 📂 lib/                # Utilities and configs
│   │   ├── 📄 api.ts          # API client
│   │   └── 📄 translations.ts # Language data
│   ├── 📂 contexts/            # React contexts
│   └── 📂 pages/              # Route components
├── 📂 scripts/                # Development scripts
├── 📂 public/                 # Static assets
└── 📂 docs/                   # Documentation
```

---

## 🛡️ Security Features

<div align="center">

| Security Measure | Implementation |
|----------------|----------------|
| 🔐 **Authentication** | JWT tokens with bcrypt password hashing |
| 🛡️ **Input Validation** | Comprehensive Joi schemas |
| 🚦 **Rate Limiting** | Configurable per-IP limits |
| 🔒 **HTTPS Ready** | SSL/TLS configuration |
| 🛡️ **Security Headers** | Helmet.js protection |
| 🔍 **XSS Protection** | Input sanitization & CSP |
| 📊 **Activity Logging** | Complete audit trail |

</div>

---

## 📊 Database Schema

<details>
<summary>📄 Click to view complete database schema</summary>

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

</details>

---

## 📚 API Documentation

### 🔗 Core Endpoints

| Endpoint | Method | Description |
|-----------|---------|-------------|
| `/api/tributes` | GET | Fetch approved tributes |
| `/api/tributes` | POST | Submit new tribute |
| `/api/tributes/stats` | GET | Get tribute statistics |
| `/api/candles` | POST | Light a candle |
| `/api/candles/count` | GET | Get total candle count |
| `/api/candles/recent` | GET | Recent candle activity |
| `/api/auth/login` | POST | Admin authentication |
| `/api/admin/dashboard` | GET | Overview statistics |

<details>
<summary>🔧 View complete API reference</summary>

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

</details>

---

## 🚀 Deployment

### 🌐 Deployment Options

| Platform | Type | Command |
|-----------|--------|---------|
| **Vercel** | Frontend | `vercel --prod` |
| **Railway** | Backend | Connect GitHub repo |
| **AWS** | Full Stack | Elastic Beanstalk/EC2 |
| **DigitalOcean** | Full Stack | App Platform |
| **Netlify** | Frontend | Static hosting |

<details>
<summary>⚙️ View deployment scripts</summary>

```bash
# Development
npm run dev:full      # Start both services
npm run dev:backend   # Backend only
npm run dev:frontend  # Frontend only

# Production
npm run build         # Production build
npm start             # Start production server
pm2 start ecosystem.config.js  # PM2 deployment
```

</details>

---

## 📈 Performance

### ⚡ Frontend Optimizations
- 🗜️ **Bundle Splitting** - Automatic code splitting by routes
- 🖼️ **Image Optimization** - Lazy loading and WebP support
- 💾 **Smart Caching** - React Query with intelligent caching
- 📱 **Mobile First** - Progressive enhancement approach

### 🚀 Backend Performance
- 🗄️ **Database Indexing** - Optimized queries with strategic indexes
- 🔄 **Connection Pooling** - Efficient database connection management
- 📊 **Real-time Analytics** - Performance monitoring
- 🛡️ **Intelligent Rate Limiting** - Abuse prevention

---

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

| Test Type | Tool | Coverage |
|-----------|-------|----------|
| **Unit Tests** | Jest | Component & utility testing |
| **Integration Tests** | Supertest | API endpoint testing |
| **E2E Tests** | Playwright | Complete user flows |
| **Type Checking** | TypeScript | Static validation |

---

## 🤝 Contributing

We welcome contributions! Here's how to help:

### 📝 Development Standards
- Follow existing code patterns and conventions
- Write comprehensive tests for new features
- Update documentation for API changes
- Use semantic versioning for releases

### 🔄 Pull Request Process
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### 🎨 Code Style
- Use TypeScript for all new code
- Follow ESLint rules and Prettier formatting
- Write meaningful commit messages
- Add tests for new functionality

---

## 📋 Requirements

### 💻 System Requirements
- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher
- **Database**: SQLite 3.x (included)
- **OS**: Windows 10+, macOS 10.15+, Ubuntu 18.04+

### 🌐 Browser Support
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Family & Friends** - For the inspiration and purpose behind this project
- **React Team** - For the amazing framework and ecosystem
- **TailwindCSS** - For the utility-first CSS framework
- **Open Source Community** - For incredible tools and libraries that make this possible

---

## 📞 Support

For technical support, questions, or contributions:

- 📧 **Email**: support@everbloom.com
- 🐛 **Issues**: [Report via GitHub Issues](https://github.com/TabbyMichael/GrandMary/issues)
- 🔒 **Security**: Report security concerns privately
- 💬 **Discussions**: [GitHub Discussions](https://github.com/TabbyMichael/GrandMary/discussions)

---

<div align="center">

## 🌸 Everbloom

### *Where memories bloom eternally in the digital garden of remembrance*

**Built with ❤️, care, and modern engineering practices to honor those who matter most**

---

[⭐ Star this repo](https://github.com/TabbyMichael/GrandMary) • [🍴 Fork this repo](https://github.com/TabbyMichael/GrandMary/fork) • [📧 Contact Us](mailto:support@everbloom.com)

</div>
