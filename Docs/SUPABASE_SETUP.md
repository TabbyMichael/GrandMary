# 🚀 Supabase Connection Guide - Step by Step

## 📋 What You Need Before Starting

1. ✅ Supabase project created
2. ✅ Database schema already run
3. ✅ Your Supabase URL and Anon Key

## 🔧 Step 1: Get Your Supabase Credentials

1. Go to your Supabase project
2. Click **Project Settings** → **API**
3. Copy these two values:
   - **Project URL**: `https://your-project.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 🔧 Step 2: Create Environment File

Create a file called `.env.local` in your project root:

```env
VITE_SUPABASE_URL=your-supabase-url-here
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Example:**
```env
VITE_SUPABASE_URL=https://abc123def456.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYzEyM2RlZjQ1NiIsInR5cGUiOiJzZXJ2aWNlIiwicHJvamVjdF9pZCI6IjEyMzQ1Njc4IiwiaWF0IjoxNjE5MDAwMDAwLCJleHAiOjE5MzQ1NjAwMDB9.someLongKey
```

## 🔧 Step 3: Test the Connection

1. Restart your development server:
```bash
npm run dev
```

2. Open the browser to `http://localhost:8081`

3. Navigate to the Gallery section

4. You should see:
   - Loading indicator
   - Either sample data from your Supabase database
   - Or an empty gallery (if no data yet)

## 🔧 Step 4: Verify Database Connection

Check the browser console (F12 → Console):
- ✅ You should see NO Supabase connection errors
- ✅ If you see sample data, it's working!
- ❌ If you see errors, check your environment variables

## 🔧 Step 5: Test Upload Functionality

1. Click the "Upload" button in the gallery
2. Fill in the form:
   - Your name: `Test User`
   - Relationship: `Developer`
   - Title: `Test Upload`
   - Caption: `Testing Supabase connection`
3. Select a small image file
4. Click "Upload Files"

**Expected Result:**
- ✅ "Successfully uploaded file(s)!" message
- ✅ File appears in Supabase Storage
- ✅ New post appears in database (pending approval)

## 🔧 Step 6: Check Supabase Dashboard

1. Go to your Supabase project
2. **Table Editor** → `gallery_posts`
3. You should see your uploaded data
4. **Storage** → `gallery` bucket
5. You should see your uploaded file

## 🔧 Step 7: Approve Content (Optional)

1. In Supabase Table Editor
2. Find your uploaded post
3. Change `status` from `pending` to `approved`
4. Refresh your website - the post should appear!

## 🚀 Step 8: Deploy to Netlify

### 8.1 Build Your Site
```bash
npm run build
```

### 8.2 Add Environment Variables to Netlify
1. Go to your Netlify site dashboard
2. **Site settings** → **Environment variables**
3. Add these variables:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

### 8.3 Deploy
1. Push your code to GitHub
2. Netlify will auto-deploy
3. Your live site will work with Supabase!

## 🔍 Troubleshooting

### Common Issues:

**1. "Supabase URL and Anon Key are required"**
- ✅ Check your `.env.local` file exists
- ✅ Verify the variable names are exact
- ✅ Restart your dev server after adding variables

**2. "No data showing in gallery"**
- ✅ Check if database has sample data
- ✅ Run the SQL schema if needed
- ✅ Check browser console for errors

**3. "Upload fails"**
- ✅ Check Supabase Storage policies
- ✅ Verify file size is under 100MB
- ✅ Check file type (images/videos only)

**4. "CORS errors"**
- ✅ Add your Netlify domain to Supabase CORS settings
- ✅ In Supabase: Settings → API → CORS

### Debug Steps:
1. Check browser console (F12)
2. Check Supabase logs
3. Verify environment variables
4. Test with sample data first

## 🎉 Success Indicators

You know it's working when:
- ✅ Gallery loads without errors
- ✅ Sample data appears (or you can upload)
- ✅ Upload functionality works
- ✅ Reactions and comments work
- ✅ Mobile responsive
- ✅ Multilingual support works

## 📞 Need Help?

If you get stuck:
1. Check the browser console for specific errors
2. Verify your Supabase credentials
3. Make sure the database schema was run
4. Check that your environment variables are set correctly

## 🚀 Next Steps

Once working:
1. Upload real photos and videos
2. Test all features (reactions, comments, sharing)
3. Test on mobile devices
4. Invite family and friends to use it

Your memorial gallery will be live and ready to cherish Mary Wangui's memories! 🌹
