# Supabase Setup Guide for Everbloom

This guide will help you set up Supabase as the primary database for the Everbloom memorial platform.

## 🚀 Quick Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" 
3. Sign up with GitHub
4. Click "New Project"
5. Choose your organization
6. Enter project details:
   - **Project Name**: `everbloom` (or your preferred name)
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
7. Click "Create new project"

### 2. Get Your Supabase Credentials

Once your project is ready, go to **Project Settings** → **API**:

```
Project URL: https://your-project-id.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Set Up Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the entire contents of `supabase-schema.sql`
3. Paste it into the SQL Editor
4. Click **Run** to execute the schema

### 4. Configure Environment Variables

#### Backend Configuration

Create `backend/.env`:

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Supabase Configuration (Primary)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database Strategy
DB_PRIMARY=supabase
DB_FALLBACK_ENABLED=true

# SQLite Backup (Fallback)
DB_PATH=./database/everbloom.db

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-this-password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend Configuration

Create `.env` (in root directory):

```env
# Supabase Configuration (Primary)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Local Backend (Fallback for Development)
VITE_API_URL=http://localhost:3001/api

# Database Strategy
VITE_DB_PRIMARY=supabase
```

### 5. Install Dependencies

```bash
# Backend dependencies
cd backend
npm install @supabase/supabase-js

# Frontend dependencies (already installed)
cd ..
npm install @supabase/supabase-js
```

### 6. Test the Configuration

#### Backend Test

```bash
cd backend
npm start
```

Test the health endpoint:
```bash
curl http://localhost:3001/api/health
```

#### Frontend Test

```bash
npm run dev
```

Visit `http://localhost:5173` and verify the gallery loads correctly.

## 🔧 Advanced Configuration

### Database Fallback Strategy

The system is configured with automatic fallback:

1. **Primary**: Supabase (cloud PostgreSQL)
2. **Fallback**: SQLite (local database)
3. **Alternative**: Local PostgreSQL (if configured)

### Storage Configuration

For file uploads, you can use either:

1. **Supabase Storage** (recommended for production)
2. **Local File Storage** (current setup)

To enable Supabase Storage:

```bash
# In Supabase dashboard, go to Storage
# Create a new bucket named 'gallery'
# Set bucket policy to public
```

### Row Level Security (RLS)

The schema includes RLS policies for security:

- ✅ Public posts are viewable by everyone
- ✅ Anyone can upload posts (requires admin approval)
- ✅ Reactions and comments are moderated
- ✅ Content reporting is enabled

### Performance Optimizations

The schema includes:

- ✅ Proper indexes for fast queries
- ✅ GIN index for tag searches
- ✅ Timestamp triggers for updated_at
- ✅ Foreign key constraints for data integrity

## 🚨 Security Considerations

### 1. Environment Variables

- Never commit `.env` files to git
- Use strong, unique secrets
- Rotate keys regularly

### 2. Database Access

- Use service role key only in backend
- Use anon key in frontend
- Enable RLS on all tables

### 3. File Uploads

- Validate file types and sizes
- Scan uploads for malware
- Consider virus scanning for production

## 🔄 Migration from SQLite

If you have existing SQLite data:

1. Export SQLite data:
```bash
cd backend
sqlite3 database/everbloom.db .dump > sqlite-data.sql
```

2. Convert data to Supabase format
3. Import via SQL Editor or migration script

## 📊 Monitoring and Maintenance

### Supabase Dashboard

Monitor:
- Database performance
- API usage
- Storage usage
- Error logs

### Health Checks

Regular health checks:
```bash
curl https://your-app-url.com/api/health
```

### Backup Strategy

- Supabase provides automatic backups
- Consider additional exports for critical data
- Test backup restoration regularly

## 🆘 Troubleshooting

### Common Issues

1. **Connection Errors**
   - Check Supabase URL and keys
   - Verify network connectivity
   - Check RLS policies

2. **Permission Errors**
   - Verify RLS policies are correct
   - Check user authentication
   - Review API key permissions

3. **Performance Issues**
   - Check database indexes
   - Monitor query performance
   - Consider connection pooling

### Getting Help

- Supabase Documentation: https://supabase.com/docs
- Supabase Discord Community
- GitHub Issues for this project

## 🎉 Next Steps

Once Supabase is configured:

1. ✅ Test all gallery functionality
2. ✅ Verify file uploads work
3. ✅ Test admin approval workflow
4. ✅ Deploy to production (Netlify)
5. ✅ Monitor performance and usage

Your Everbloom memorial platform is now running on Supabase with automatic SQLite fallback for maximum reliability!
