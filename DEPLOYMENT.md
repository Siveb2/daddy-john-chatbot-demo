# 🚀 Deployment Guide

This guide covers deploying the Daddy John Chatbot to various platforms.

## 📋 Prerequisites

1. **GitHub Repository** - Push your code to GitHub
2. **Supabase Database** - Set up PostgreSQL database
3. **OpenRouter API Key** - Get from [openrouter.ai](https://openrouter.ai)

## 🌐 Deployment Options

### 1. Railway (Recommended) 🚂

**Why Railway?**
- ✅ Free tier available
- ✅ Automatic deployments from GitHub
- ✅ Built-in PostgreSQL database
- ✅ Easy environment variable management

**Steps:**
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub account
3. Create new project from GitHub repo
4. Add PostgreSQL database service
5. Set environment variables:
   ```
   DATABASE_URL=<railway-postgres-url>
   JWT_SECRET=<your-secret-key>
   OPENROUTER_API_KEY=<your-openrouter-key>
   AI_MODEL=cognitivecomputations/dolphin3.0-mistral-24b:free
   NODE_ENV=production
   ```
6. Deploy automatically!

### 2. Render 🎨

**Steps:**
1. Go to [render.com](https://render.com)
2. Create new Web Service from GitHub
3. Use these settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Node Version**: 18
4. Add PostgreSQL database
5. Set environment variables (same as Railway)

### 3. Vercel ⚡

**Note**: Vercel is better for frontend apps, but can work with serverless functions.

**Steps:**
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in project directory
3. Follow prompts
4. Set environment variables in Vercel dashboard

### 4. Docker 🐳

**Local Docker:**
```bash
# Build image
docker build -t daddy-john-chatbot .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="your-db-url" \
  -e JWT_SECRET="your-secret" \
  -e OPENROUTER_API_KEY="your-key" \
  daddy-john-chatbot
```

## 🔧 Environment Variables

Required for all deployments:

```env
# Database (use your Supabase connection string)
DATABASE_URL=postgresql://postgres:password@host:5432/database

# Security
JWT_SECRET=your-super-secret-jwt-key-make-it-long-and-random

# AI Configuration
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-api-key
AI_MODEL=cognitivecomputations/dolphin3.0-mistral-24b:free

# Optional
NODE_ENV=production
PORT=3000
```

## 📊 Database Setup

The app automatically runs migrations on startup (`postinstall` script), so your database will be set up automatically when deployed.

## 🔍 Health Checks

The app includes a health check endpoint at `/health` for monitoring:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45
}
```

## 🚨 Troubleshooting

### Common Issues:

1. **Database Connection Failed**
   - Check `DATABASE_URL` format
   - Ensure database is accessible from deployment platform

2. **OpenRouter API Errors**
   - Verify `OPENROUTER_API_KEY` is correct
   - Check if you have credits/rate limits

3. **Build Failures**
   - Ensure Node.js version is 16+ 
   - Check all dependencies are in `package.json`

### Logs:
- **Railway**: View in dashboard
- **Render**: Check deploy logs
- **Vercel**: Use `vercel logs`

## 🎯 Recommended: Railway Deployment

For the easiest deployment experience:

1. **Fork/Clone** this repository
2. **Push to GitHub**
3. **Connect to Railway**
4. **Add PostgreSQL service**
5. **Set environment variables**
6. **Deploy!**

Your chatbot will be live at `https://your-app.railway.app` 🎉

## 📱 Testing Deployment

After deployment:
1. Visit your app URL
2. Register a new account
3. Complete onboarding
4. Send a test message
5. Verify all features work

## 🔄 Updates

To update your deployment:
1. Push changes to GitHub
2. Platform will auto-deploy (Railway/Render)
3. Or redeploy manually (Vercel)

Happy deploying! 🚀