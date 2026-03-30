# 🔍 CORS Debugging Guide

## 🚨 Current Issue

The backend is running but blocking CORS requests from the frontend. The logs show "Not allowed by CORS" errors.

## 🔧 **Fix Applied**

### ✅ **Updated CORS Configuration**
- Added more development origins to allowed list
- Added 127.0.0.1 variants for local development
- Added additional ports (8080, 8081)
- Added CORS logging for debugging

### ✅ **Allowed Origins Updated**
```javascript
const allowedOrigins = [
  'https://everbloom-memorial.netlify.app',
  'https://www.everbloom-memorial.netlify.app',
  'http://localhost:5173',  // Vite default
  'http://localhost:3000',  // React default
  'http://localhost:8080',  // Alternative
  'http://localhost:8081',  // Alternative
  'http://127.0.0.1:5173',  // Vite alternative
  'http://127.0.0.1:3000',  // React alternative
  'http://127.0.0.1:8080',  // Alternative
  'http://127.0.0.1:8081'   // Alternative
];
```

---

## 🔍 **Debugging Steps**

### **1. Check Frontend Port**
```bash
# Check which port your frontend is running on
netstat -ano | findstr :5173
netstat -ano | findstr :3000
netstat -ano | findstr :8080
```

### **2. Test Backend Directly**
```bash
# Test health endpoint
curl http://localhost:3001/api/health

# Test with CORS headers
curl -H "Origin: http://localhost:5173" http://localhost:3001/api/health
```

### **3. Check Browser Console**
- Open browser dev tools (F12)
- Look at Network tab
- Check for CORS errors
- Note the origin being used

---

## 🛠️ **Additional Solutions**

### **Option 1: Temporary Development CORS**
If you're still having issues, temporarily allow all origins for development:

```javascript
// In server.js, temporarily use this for development
app.use(cors({
  origin: '*', // Allow all origins (development only!)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
```

### **Option 2: Frontend API URL**
Make sure your frontend is using the correct backend URL:

```javascript
// In your frontend .env or config
VITE_API_URL=http://localhost:3001/api
```

### **Option 3: Check Frontend Port**
Make sure you know which port your frontend is running on:

```bash
# Vite (usually 5173)
npm run dev

# React (usually 3000)
npm start

# Check the output for the actual port
```

---

## 📋 **Troubleshooting Checklist**

### **Backend**
- [x] CORS configuration updated
- [x] Added development origins
- [x] Added CORS logging
- [ ] Server restarted after changes

### **Frontend**
- [ ] Check which port it's running on
- [ ] Verify API URL is correct
- [ ] Check browser console for errors
- [ ] Test API calls directly

### **Network**
- [ ] Firewall not blocking requests
- [ ] Antivirus not interfering
- [ ] Both frontend and backend accessible

---

## 🚀 **Quick Test**

### **1. Restart Backend**
```bash
# Stop the current server (Ctrl+C)
# Start it again
cd backend
npm start
```

### **2. Check CORS Logs**
Look for these messages in the backend console:
```
🌐 CORS Request: OPTIONS /api/gallery/stats from origin: http://localhost:5173
   User-Agent: Mozilla/5.0...
   IP: ::1
```

### **3. Test Frontend**
Open your frontend and check if the CORS errors are resolved.

---

## 🎯 **Expected Result**

After applying the fix, you should see:
- ✅ No more "Not allowed by CORS" errors
- ✅ CORS requests being logged in backend
- ✅ Frontend successfully connecting to backend
- ✅ API calls working properly

---

## 🔄 **If Still Having Issues**

### **Check Frontend Port**
```bash
# Look for output like:
#   VITE v4.x.x  ready in xxx ms
#   ➜  Local:   http://localhost:5173/
```

### **Update CORS if Needed**
If your frontend is on a different port, add it to the allowed origins list in `server.js`.

### **Use Browser Tools**
- Open DevTools → Network
- Look at failed requests
- Check the "Origin" header
- Verify it matches an allowed origin

---

## 📞 **Help**

If you're still stuck:
1. **Check the backend logs** for CORS messages
2. **Verify the frontend port** being used
3. **Test the API directly** with curl
4. **Check browser console** for specific errors

The CORS issue should now be resolved with the updated configuration! 🎉
