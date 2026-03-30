# 🔧 Supabase Setup Instructions

## 🚨 **Current Issue**

The backend is failing to connect to Supabase because the environment variables aren't configured. The logs show:
- "Supabase service error: Query failed: TypeError: fetch failed"
- "Circuit breaker is OPEN for supabase"
- "SQLite connection failed: SQLite operations not fully implemented"

## 📋 **Required Steps**

### **Step 1: Get Your Supabase Credentials**

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy these values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon public** key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - **service_role** key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### **Step 2: Create Your .env File**

In the `backend` directory, create a `.env` file with your actual Supabase credentials:

```bash
# Navigate to backend directory
cd backend

# Create .env file
cp env-template.txt .env
```

### **Step 3: Update .env with Your Values**

Edit the `.env` file and replace the placeholder values:

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration - REPLACE THESE WITH YOUR ACTUAL VALUES
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-actual-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-actual-service-role-key

# Database Strategy
DB_PRIMARY=supabase
DB_FALLBACK_ENABLED=true

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-this-password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security Configuration
ENCRYPTION_KEY=your-encryption-key-here-32-bytes-long
PASSWORD_PEPPER=your-password-pepper-here-16-bytes-long

# MFA Configuration
MFA_ISSUER=Everbloom Memorial Platform
MFA_WINDOW=1

# Monitoring Configuration
SECURITY_MONITORING_ENABLED=true

# CORS Configuration
ALLOWED_ORIGINS=https://everbloom-memorial.netlify.app,https://www.everbloom-memorial.netlify.app
```

### **Step 4: Restart the Backend Server**

```bash
# Stop the current server (Ctrl+C)
# Start it again
cd backend
npm start
```

## 🔍 **Verification**

After setting up the environment variables, you should see:

### **Successful Connection:**
```
🚀 Everbloom Backend Server running on port 3001
📊 Environment: development
🏥 Health check: http://localhost:3001/api/health
```

### **Health Check Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-30T08:40:00.000Z",
  "uptime": 123.45,
  "environment": "development",
  "security": {
    "headers": "enabled",
    "rateLimiting": "enabled",
    "cors": "enabled",
    "compression": "enabled"
  }
}
```

### **No More Database Errors:**
- ✅ No "Supabase service error: Query failed: TypeError: fetch failed"
- ✅ No "Circuit breaker is OPEN for supabase"
- ✅ No "SQLite operations not fully implemented"

## 🚨 **Common Issues & Solutions**

### **Issue 1: Wrong Supabase URL**
**Error**: `TypeError: fetch failed`
**Solution**: Ensure your SUPABASE_URL is correct and includes `https://`

### **Issue 2: Invalid API Keys**
**Error**: Authentication failures
**Solution**: Copy the exact keys from Supabase dashboard (no extra spaces)

### **Issue 3: Project Not Found**
**Error**: 404 errors from Supabase
**Solution**: Verify you're using the correct project ID

### **Issue 4: CORS Issues**
**Error**: "Not allowed by CORS"
**Solution**: Your frontend origin should be in the allowed list (already fixed)

## 📋 **Quick Test**

After setting up the .env file, test the connection:

```bash
# Test health endpoint
curl http://localhost:3001/api/health

# Test gallery endpoint
curl http://localhost:3001/api/gallery/posts
```

Both should return successful responses without database errors.

## 🎯 **Expected Result**

Once the Supabase credentials are properly configured:
- ✅ Backend connects to Supabase successfully
- ✅ Gallery posts load correctly
- ✅ File uploads work properly
- ✅ All API endpoints function normally
- ✅ Frontend can communicate with backend

## 📞 **Need Help?**

If you're still having issues:
1. **Check your Supabase project** is active
2. **Verify the API keys** are copied correctly
3. **Ensure the project URL** is correct
4. **Check the .env file** has no syntax errors

The backend should work perfectly once the Supabase connection is configured! 🎉
