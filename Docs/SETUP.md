# Everbloom Memorial Website - Complete Setup Guide

This guide will help you set up the complete Everbloom memorial website with both frontend and backend components.

## Prerequisites

- **Node.js** 18+ (recommended: LTS version)
- **npm** or **yarn** package manager
- **Git** for version control
- **SQLite** (comes bundled with the backend)

## Project Structure

```
everbloom/
├── backend/                 # Node.js/Express API server
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Auth, validation
│   │   ├── database/       # Database setup
│   │   ├── utils/          # Helper functions
│   │   └── server.js       # Main server file
│   ├── database/           # SQLite database files
│   ├── package.json
│   └── .env.example
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── hooks/             # Custom hooks
│   ├── lib/               # API client
│   └── ...
├── package.json           # Frontend dependencies
└── README.md
```

## Step 1: Backend Setup

### 1.1 Navigate to Backend Directory
```bash
cd backend
```

### 1.2 Install Dependencies
```bash
npm install
```

### 1.3 Environment Configuration
```bash
# Copy the environment template
cp .env.example .env

# Edit the .env file with your configuration
nano .env  # or use your preferred editor
```

**Important: Update these values in `.env`:**
- `JWT_SECRET`: Generate a strong secret key
- `ADMIN_PASSWORD`: Set a secure admin password
- `PORT`: Server port (default: 3001)

### 1.4 Initialize Database
```bash
# This creates the database and tables
npm run migrate

# Optional: Add sample data for development
npm run seed
```

### 1.5 Start Backend Server
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The backend will be available at `http://localhost:3001`

## Step 2: Frontend Setup

### 2.1 Navigate to Root Directory
```bash
cd ..  # Go back to project root
```

### 2.2 Install Frontend Dependencies
```bash
npm install
```

### 2.3 Frontend Environment Configuration
The frontend already has a `.env` file configured for local development:
```env
VITE_API_URL=http://localhost:3001/api
```

### 2.4 Start Frontend Development Server
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Step 3: Verification

### 3.1 Health Check
Open your browser and navigate to:
- Frontend: `http://localhost:5173`
- Backend Health: `http://localhost:3001/api/health`

### 3.2 Test Functionality
1. **Tribute Submission**: Try submitting a tribute
2. **Candle Lighting**: Light a virtual candle
3. **Admin Panel**: Access admin features (see below)

## Step 4: Admin Panel Setup

### 4.1 Create Admin Account
```bash
# Using the seeded admin account (from seed.js)
# Username: admin
# Password: admin123 (change this immediately!)

# Or create a new admin via API:
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"youradmin","password":"yourpassword","email":"admin@example.com"}'
```

### 4.2 Login to Admin Panel
1. Use the API endpoint `/api/auth/login` to get a token
2. Use the token for admin API calls
3. Access admin endpoints like `/api/admin/dashboard`

### 4.3 Admin Features
- **Dashboard**: Overview statistics
- **Tribute Management**: Approve/delete tributes
- **Analytics**: View usage statistics
- **User Management**: Manage admin accounts

## Step 5: Development Workflow

### 5.1 Making Changes
```bash
# Backend changes (auto-restart)
cd backend && npm run dev

# Frontend changes (hot reload)
cd .. && npm run dev
```

### 5.2 Database Changes
```bash
# For schema changes, modify backend/src/database/init.js
# Then re-run migration:
npm run migrate
```

### 5.3 Testing
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd .. && npm test
```

## Step 6: Production Deployment

### 6.1 Environment Preparation
1. Set `NODE_ENV=production` in backend `.env`
2. Generate a strong `JWT_SECRET`
3. Change default admin credentials
4. Configure proper CORS origins
5. Set up SSL/TLS certificates

### 6.2 Backend Deployment
```bash
cd backend

# Install production dependencies
npm ci --only=production

# Build and start
npm start
```

### 6.3 Frontend Deployment
```bash
# Build for production
npm run build

# Deploy the dist/ folder to your web server
```

### 6.4 Reverse Proxy Setup (nginx example)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Frontend
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Step 7: Security Considerations

### 7.1 Must-Do Security Steps
- ✅ Change default admin password
- ✅ Use strong JWT secret
- ✅ Enable HTTPS in production
- ✅ Configure proper CORS
- ✅ Set up rate limiting
- ✅ Regular database backups

### 7.2 Optional Security Enhancements
- Set up monitoring and alerting
- Implement IP whitelisting for admin access
- Add CAPTCHA to tribute submissions
- Set up automated security scanning

## Troubleshooting

### Common Issues

**Backend won't start**
```bash
# Check if port is in use
netstat -tulpn | grep :3001

# Kill existing process
kill -9 <PID>
```

**Database connection errors**
```bash
# Check database permissions
ls -la backend/database/

# Recreate database
rm backend/database/everbloom.db
npm run migrate
```

**Frontend can't connect to backend**
```bash
# Check if backend is running
curl http://localhost:3001/api/health

# Verify CORS configuration
# Check backend/.env CORS settings
```

**Admin login issues**
```bash
# Reset admin password
# Use the register endpoint with new credentials
```

### Logs and Debugging

**Backend logs**
```bash
# Development: Console output
# Production: Check system logs or use a logging service
```

**Frontend logs**
- Browser Developer Tools → Console
- Network tab for API requests

### Getting Help

1. Check the [API Documentation](backend/README.md)
2. Review the error messages in console
3. Verify environment variables
4. Check network connectivity
5. Ensure all dependencies are installed

## Next Steps

Once everything is set up:

1. **Customize Content**: Update the memorial content, images, and text
2. **Configure Email**: Set up email notifications for new tributes
3. **Add Analytics**: Integrate Google Analytics or similar
4. **Performance**: Set up CDN and caching
5. **Monitoring**: Add uptime monitoring and alerts

## Support

For issues or questions:
1. Check this documentation first
2. Review the code comments
3. Check the GitHub issues (if applicable)
4. Contact the development team

---

**🎉 Congratulations! Your Everbloom memorial website is now ready to honor and celebrate memories.**
