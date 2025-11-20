# 🚀 Complete Deployment Guide - TechCare Pro

## ✅ **Recommended: Railway.app (FREE with GitHub Student Pack)**

### **Benefits:**
- $5/month credit FREE forever (with Student Pack)
- PostgreSQL database included
- Automatic deployments from GitHub
- Custom domains
- File uploads work perfectly
- Zero configuration

---

## 📋 **Pre-Deployment Checklist**

### ✅ Files Created:
- `pc_repair_backend/Procfile` - Railway startup commands
- `pc_repair_backend/runtime.txt` - Python version
- `pc_repair_backend/railway.json` - Railway configuration
- Updated `requirements.txt` - Added production packages
- Updated `settings.py` - Production-ready settings

---

## 🎯 **Step-by-Step Deployment**

### **Step 1: Push to GitHub**

```powershell
cd C:\Users\ihebl\Documents\pc_repair_system

# Initialize git (if not already)
git init
git add .
git commit -m "Prepare for deployment"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/techcare-pro.git
git branch -M main
git push -u origin main
```

### **Step 2: Get Railway Student Pack**

1. Go to https://railway.app/
2. Sign up with your **GitHub account** (same as Student Pack)
3. Go to https://education.github.com/pack
4. Find **Railway** in the list
5. Click "Get Railway" and link your account
6. You'll get **$5/month credit for 1 year** (automatically renews with Student Pack)

### **Step 3: Deploy Backend on Railway**

1. **Create New Project**:
   - Login to Railway dashboard
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `techcare-pro` repository

2. **Add PostgreSQL Database**:
   - In your project, click "+ New"
   - Select "Database" → "PostgreSQL"
   - Railway creates database automatically

3. **Configure Backend Service**:
   - Click on your GitHub repo service
   - Go to "Settings" → "Root Directory"
   - Set to: `pc_repair_backend`
   
4. **Add Environment Variables**:
   Click "Variables" tab and add:
   ```
   DEBUG=False
   SECRET_KEY=your-super-secret-key-here-change-this
   GEMINI_API_KEY=your-gemini-api-key
   ALLOWED_HOSTS=*.railway.app
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   ```
   
   **Note**: `DATABASE_URL` is automatically set by Railway when you add PostgreSQL!

5. **Deploy**:
   - Click "Deploy" - Railway will:
     - Install dependencies
     - Run migrations
     - Collect static files
     - Start gunicorn server

6. **Get Your Backend URL**:
   - Go to "Settings" → "Networking"
   - Click "Generate Domain"
   - Copy URL (e.g., `https://techcare-pro-production.up.railway.app`)

### **Step 4: Deploy Frontend**

**Option A: Railway (Recommended)**

1. In same project, click "+ New" → "GitHub Repo"
2. Select same repo
3. Configure:
   - Root Directory: `pc-repair-frontend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npx serve -s dist -l $PORT`

4. Add Environment Variable:
   ```
   VITE_API_URL=https://your-backend-url.railway.app
   ```

5. Generate domain for frontend

**Option B: Vercel (Alternative - Free)**

1. Go to https://vercel.com
2. Import `pc-repair-frontend` folder
3. Set:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variable: `VITE_API_URL=https://your-backend-url.railway.app`

### **Step 5: Update Frontend API URLs**

Update `pc-repair-frontend/src/services/api.js`:

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  // ...rest of config
});
```

### **Step 6: Update CORS in Django**

In `settings.py`, update:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://your-frontend.vercel.app",  # Add your frontend URL
    "https://your-frontend.railway.app",  # If using Railway for frontend
]
```

Push changes:
```powershell
git add .
git commit -m "Configure production URLs"
git push
```

Railway will auto-deploy!

---

## 🎉 **Your App is Live!**

- **Backend**: `https://techcare-pro-backend.railway.app`
- **Frontend**: `https://techcare-pro.vercel.app`
- **Database**: PostgreSQL (managed by Railway)
- **Media Files**: Served by Django + WhiteNoise

---

## 📊 **Costs Breakdown**

### With GitHub Student Pack:
| Service | Cost | Duration |
|---------|------|----------|
| Railway | $5/month FREE | 1 year (renewable) |
| PostgreSQL | Included | FREE |
| Vercel | FREE | Forever |
| Domain (optional) | $0-10/year | Via Namecheap Student |

**Total: $0/month** 🎉

---

## 🔧 **Post-Deployment Tasks**

### 1. Create Admin User
```bash
# In Railway dashboard, open "Deploy Logs" terminal
python manage.py createsuperuser
```

### 2. Test Everything
- ✅ User registration
- ✅ Login/Logout
- ✅ Profile image upload
- ✅ AI Chat (Gemini API)
- ✅ Support tickets
- ✅ Issue library
- ✅ Technician applications

### 3. Add Custom Domain (Optional)
- Railway: Settings → Domains → Add custom domain
- Point your domain DNS to Railway
- SSL certificate automatic!

---

## 🐛 **Troubleshooting**

### Database Errors
```bash
# In Railway terminal
python manage.py migrate
python manage.py createsuperuser
```

### Static Files Not Loading
```bash
python manage.py collectstatic --noinput
```

### CORS Errors
- Check `ALLOWED_HOSTS` in settings.py
- Add frontend URL to `CORS_ALLOWED_ORIGINS`

### Environment Variables
- Verify all required vars in Railway dashboard
- Restart service after changes

---

## 📱 **Alternative: Render.com (100% Free)**

If you prefer completely free (no credit card):

1. **Backend + Database**:
   - https://render.com → New Web Service
   - Connect GitHub repo
   - Select `pc_repair_backend` folder
   - Add PostgreSQL database (FREE)
   - Set environment variables
   - ⚠️ Sleeps after 15min inactivity (wakes in 30s)

2. **Frontend**:
   - New Static Site
   - Build: `npm run build`
   - Publish: `dist`

**Render is perfect for testing, Railway better for production.**

---

## 🎓 **GitHub Student Pack Bonuses**

Don't forget to claim:
- **Namecheap**: Free domain (.me) for 1 year
- **DigitalOcean**: $200 credit (for future scaling)
- **Heroku**: Credits for dynos
- **MongoDB Atlas**: Extra storage
- **Stripe**: Waived fees (for payments)

---

## 📈 **Monitoring & Maintenance**

### Railway Dashboard:
- View logs in real-time
- Monitor CPU/Memory usage
- Database metrics
- Deployment history

### Set up alerts for:
- High CPU usage
- Database storage (5GB free limit)
- Error rates

---

## 🚀 **Ready to Deploy?**

1. ✅ All files created
2. ✅ Settings configured
3. ✅ Requirements updated
4. Follow Step 1: Push to GitHub
5. Follow Step 2-6: Deploy!

**Questions? Check Railway docs or ask me!** 🎯
