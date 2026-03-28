# 🚀 Quick Start - Connect Your Supabase

## ✅ Your Credentials Are Ready!

**Supabase URL:** `https://vyoplbhgbczrqbpishee.supabase.co`
**Anon Key:** `sb_publishable_ksF2LGKTO4im_XKUMetKOw_ts-5FqIs`

## 🔧 Step 1: Create Your Environment File

Create a file called `.env.local` in your project root (same level as package.json):

```env
VITE_SUPABASE_URL=https://vyoplbhgbczrqbpishee.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_ksF2LGKTO4im_XKUMetKOw_ts-5FqIs
```

## 🔧 Step 2: Run Database Schema

1. Go to your Supabase project: https://vyoplbhgbczrqbpishee.supabase.co
2. Click **SQL Editor** in the left sidebar
3. Copy the contents of `supabase-schema.sql` file
4. Paste it into the SQL Editor
5. Click **Run** to create all tables

## 🔧 Step 3: Start Your Development Server

```bash
npm run dev
```

## 🔧 Step 4: Test the Gallery

1. Open your browser to: `http://localhost:8081`
2. Scroll down to the **Gallery** section
3. You should see either:
   - Sample data (if schema was run)
   - An empty gallery with upload button

## 🔧 Step 5: Test Upload

1. Click the **Upload** button
2. Fill in:
   - Your name: `Test User`
   - Relationship: `Developer`
   - Title: `Test Upload`
   - Caption: `Testing Supabase connection`
3. Select a small image file
4. Click **Upload Files**

**Expected:** "Successfully uploaded file(s)!" message

## 🔧 Step 6: Check Supabase Dashboard

1. In your Supabase project
2. **Table Editor** → `gallery_posts` table
3. You should see your uploaded data
4. **Storage** → `gallery` bucket
5. You should see your uploaded file

## 🎉 Success Indicators

✅ No Supabase connection errors in browser console
✅ Gallery loads without errors
✅ Upload functionality works
✅ Data appears in Supabase tables

## 🚀 Deploy to Netlify

Once working locally:

1. Build your site:
```bash
npm run build
```

2. In Netlify dashboard, add environment variables:
   - `VITE_SUPABASE_URL`: `https://vyoplbhgbczrqbpishee.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `sb_publishable_ksF2LGKTO4im_XKUMetKOw_ts-5FqIs`

3. Deploy! Your live site will work with Supabase.

## 🔍 Troubleshooting

**If you see "Supabase URL and Anon Key are required":**
- Make sure `.env.local` file exists
- Restart your dev server after creating the file

**If gallery shows no data:**
- Run the SQL schema in Supabase SQL Editor
- Check browser console for errors

**If upload fails:**
- Check Supabase Storage policies
- Verify file is under 100MB
- Check that it's an image or video file

Your Everbloom Memorial Gallery will be live with real database storage! 🌹
