# Everbloom Backend API

A comprehensive Node.js/Express backend for the Everbloom memorial website, providing tribute management, candle lighting, and admin functionality.

## Features

- **Tribute Management**: Submit, approve, and manage memorial tributes
- **Candle System**: Track virtual candles lit in memory
- **Admin Panel**: Secure authentication and content moderation
- **Analytics**: Comprehensive tracking and reporting
- **Security**: Rate limiting, input validation, and XSS protection
- **Database**: SQLite with optimized queries and indexing

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
PORT=3001
NODE_ENV=development
DB_PATH=./database/everbloom.db
JWT_SECRET=your-super-secret-jwt-key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-this-password
```

4. Initialize the database:
```bash
npm run migrate
```

5. Seed with sample data (optional):
```bash
npm run seed
```

6. Start the server:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Tributes
- `GET /api/tributes` - Get approved tributes (paginated)
- `POST /api/tributes` - Submit new tribute
- `GET /api/tributes/stats` - Get tribute statistics

### Candles
- `POST /api/candles` - Light a new candle
- `GET /api/candles/count` - Get total candle count
- `GET /api/candles/recent` - Get recent candle activity
- `GET /api/candles/stats` - Get candle statistics

### Authentication
- `POST /api/auth/register` - Register admin user
- `POST /api/auth/login` - Admin login
- `GET /api/auth/me` - Get current user info (protected)
- `POST /api/auth/logout` - Logout (protected)

### Admin Panel (Protected)
- `GET /api/admin/dashboard` - Dashboard overview
- `GET /api/admin/tributes` - Manage tributes
- `PUT /api/admin/tributes/:id/approve` - Approve tribute
- `DELETE /api/admin/tributes/:id` - Delete tribute
- `GET /api/admin/analytics` - Get detailed analytics

## API Documentation

### Tribute Submission

**POST /api/tributes**
```json
{
  "name": "John Doe",
  "relationship": "Friend",
  "message": "A beautiful memory that will last forever.",
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "message": "Tribute submitted successfully. It will be visible once approved.",
  "tributeId": 123,
  "status": "pending_approval"
}
```

### Candle Lighting

**POST /api/candles**
```json
{}
```

**Response:**
```json
{
  "message": "Candle lit successfully",
  "candleId": 456,
  "litAt": "2024-03-28T10:30:00.000Z"
}
```

### Admin Login

**POST /api/auth/login**
```json
{
  "username": "admin",
  "password": "your-password"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com"
  }
}
```

## Database Schema

### Tributes Table
```sql
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
```

### Candles Table
```sql
CREATE TABLE candles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Admin Users Table
```sql
CREATE TABLE admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Security Features

- **Rate Limiting**: Configurable rate limits per IP
- **Input Validation**: Joi validation for all inputs
- **XSS Protection**: Input sanitization
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **CORS Protection**: Configured for production
- **Helmet**: Security headers

## Development

### Scripts
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run migrate` - Initialize database
- `npm run seed` - Seed sample data

### Environment Variables
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `DB_PATH` - SQLite database file path
- `JWT_SECRET` - JWT signing secret
- `ADMIN_USERNAME` - Default admin username
- `ADMIN_PASSWORD` - Default admin password
- `RATE_LIMIT_WINDOW_MS` - Rate limit window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Change default admin credentials
4. Configure proper CORS origins
5. Set up SSL/TLS
6. Configure reverse proxy (nginx/Apache)
7. Set up database backups
8. Monitor logs and analytics

## License

MIT License - see LICENSE file for details
