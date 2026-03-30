# 🔐 Setup Your Supabase Credentials

## 🚨 **Important Security Note**

I've created a template file with your credentials, but you need to create the actual `.env` file manually to keep your secrets safe.

## 📋 **Steps to Set Up Backend**

### **Step 1: Create Backend .env File**

In the `backend` directory, create your `.env` file:

```bash
cd backend
cp env-local.txt .env
```

### **Step 2: Update with Your Credentials**

Edit the `.env` file and update these values with your actual Supabase credentials:

```bash
# Your actual Supabase URL
SUPABASE_URL=https://vyoplbhgbczrqbpishee.supabase.co

# Your actual Supabase anon key
SUPABASE_ANON_KEY=sb_publishable_ksF2LGKTO4im_XKUMetKOw_ts-5FqIs

# You need to get the service_role key from Supabase dashboard
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### **Step 3: Get Service Role Key**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `vyoplbhgbczrqbpishee`
3. Go to **Settings** → **API**
4. Copy the **service_role** key (it's longer than the anon key)
5. Replace `your-service-role-key-here` with the actual key

### **Step 4: Update Frontend Environment**

In your root `.env` file, add:

```bash
# Frontend Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=https://vyoplbhgbczrqbpishee.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_ksF2LGKTO4im_XKUMetKOw_ts-5FqIs
```

### **Step 5: Restart Backend**

```bash
cd backend
npm start
```

## 🔒 **Security Protection**

Your `.gitignore` file already protects:
- ✅ `.env` files
- ✅ `.env.local` files  
- ✅ `.env.*` files
- ✅ All credential files

## 🎯 **Expected Result**

After setup, you should see:
- ✅ Backend connects to Supabase successfully
- ✅ No more database errors
- ✅ Gallery posts load correctly
- ✅ File uploads work properly

## 🚨 **Important Security Reminders**

1. **Never commit** `.env` files to Git
2. **Never share** your service_role key publicly
3. **Use different** keys for development and production
4. **Rotate keys** if they're ever exposed

## 📞 **Need Help?**

If you need the service_role key:
1. Login to Supabase dashboard
2. Go to your project settings
3. Look for "service_role" key in API section
4. It should start with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

Your Everbloom platform should work perfectly once the credentials are properly configured! 🌹
