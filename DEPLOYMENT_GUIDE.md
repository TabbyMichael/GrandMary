# 🚀 Everbloom Memorial Gallery - Live Database Deployment Guide

## 📋 Overview
This guide will help you deploy the Everbloom Memorial Gallery with a live database on Netlify using Supabase.

## 🗄️ Database Setup (Supabase)

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" → "New project"
3. Choose organization or create new one
4. Enter project name: `everbloom-memorial`
5. Set database password (save it securely)
6. Choose region closest to your users
7. Click "Create new project"

### 2. Run Database Schema
1. In your Supabase project, go to **SQL Editor**
2. Copy and paste the contents of `supabase-schema.sql`
3. Click **Run** to execute the schema
4. This will create all necessary tables and sample data

### 3. Get Supabase Credentials
1. Go to **Project Settings** → **API**
2. Copy the **Project URL** and **anon public key**
3. These will be used in your Netlify environment variables

## 🔧 Frontend Configuration

### 1. Environment Variables
Create a `.env.production` file in your frontend root:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=https://your-project.netlify.app/.netlify/functions
```

### 2. Update Gallery Component
Replace the current gallery import in `src/pages/Index.tsx`:

```typescript
import Gallery from "@/components/GallerySupabase";
```

### 3. Create Supabase Gallery Component
Create `src/components/GallerySupabase.tsx` that uses the Supabase client instead of the local API.

## 🌐 Netlify Deployment

### 1. Build the Site
```bash
npm run build
```

### 2. Deploy to Netlify
1. Push your code to GitHub
2. Go to Netlify and connect your GitHub repository
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variables in Netlify dashboard:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

## 📁 File Upload Handling

### Option 1: Supabase Storage (Recommended)
Files are uploaded directly to Supabase Storage:

```typescript
// In your upload function
const { data, error } = await supabase.storage
  .from('gallery')
  .upload(filePath, file);
```

### Option 2: Netlify Functions + External Storage
Use Netlify Functions to handle file uploads and store them externally.

## 🔐 Security Considerations

### Row Level Security (RLS)
The Supabase schema includes RLS policies that:
- ✅ Only allow approved public posts to be visible
- ✅ Allow anyone to upload (pending approval)
- ✅ Allow reactions/comments on approved posts
- ✅ Protect against unauthorized access

### File Upload Security
- ✅ File type validation (images and videos only)
- ✅ File size limits (100MB max)
- ✅ Admin approval required for all uploads
- ✅ Content reporting system

## 📊 Database Features

### Tables Created:
- `gallery_posts` - Main content storage
- `gallery_reactions` - User reactions (❤️, 👍, etc.)
- `gallery_comments` - User comments
- `gallery_views` - View tracking
- `gallery_reports` - Content moderation

### Features:
- ✅ Real-time updates
- ✅ Automatic timestamps
- ✅ Data validation
- ✅ Relationship tracking
- ✅ Tag system
- ✅ Search and filtering

## 🎯 Live Features Once Deployed

### User Features:
- ✅ Upload photos and videos
- ✅ Add captions and tags
- ✅ React to posts (❤️, 👍, 😊, 🙏)
- ✅ Comment on posts
- ✅ Search and filter content
- ✅ View in lightbox
- ✅ Share posts

### Admin Features:
- ✅ Approve/reject uploads
- ✅ Moderate comments
- ✅ View analytics
- ✅ Manage reported content

## 🚀 Quick Start Checklist

### Before Deployment:
- [ ] Create Supabase account and project
- [ ] Run the SQL schema in Supabase
- [ ] Get Supabase URL and anon key
- [ ] Add environment variables to `.env.production`
- [ ] Test locally with Supabase connection

### Deployment Steps:
- [ ] Build the project (`npm run build`)
- [ ] Deploy to Netlify
- [ ] Add environment variables in Netlify dashboard
- [ ] Test upload functionality
- [ ] Verify all features work

### Post-Deployment:
- [ ] Monitor Supabase dashboard for usage
- [ ] Set up backups in Supabase
- [ ] Configure any additional security policies
- [ ] Test admin moderation workflow

## 🆘 Troubleshooting

### Common Issues:
1. **CORS Errors**: Add your Netlify domain to Supabase CORS settings
2. **File Upload Fails**: Check Supabase Storage policies
3. **Data Not Showing**: Verify RLS policies and table permissions
4. **Build Errors**: Check environment variables are properly set

### Debug Tips:
- Check browser console for errors
- Verify Supabase connection in network tab
- Check Supabase logs for database errors
- Test with sample data first

## 📈 Scaling Considerations

### For High Traffic:
- Enable Supabase Pro plan for higher limits
- Set up CDN for file delivery
- Implement caching strategies
- Monitor database performance

### Backup Strategy:
- Supabase automatically backs up your database
- Consider additional backups for uploaded files
- Document your deployment process

---

## 🎉 You're Ready!

Once you complete these steps, your Everbloom Memorial Gallery will be live with:
- Real database persistence
- File upload capabilities
- User interactions
- Admin moderation
- Multilingual support
- Beautiful, responsive design

Your memorial site will truly honor Mary Wangui's memory with a professional, feature-rich gallery that friends and family can use to share and cherish memories together.
