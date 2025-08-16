# 💙 Daddy John Chatbot Platform

> *"No Red Flags. Just Red Roses."*

A beautiful, modern SaaS chatbot platform featuring personalized AI conversations with stunning visual effects and seamless user experience.

## ✨ Features

- 🔐 **User Authentication** - Secure JWT-based login/register
- 🎭 **Personalized Onboarding** - Custom preferences for tailored conversations  
- 💬 **Smart Conversations** - Context-aware chat with automatic summaries
- 🎨 **Stunning UI** - Animated starfield, aurora effects, and glass morphism
- 🤖 **AI-Powered** - Multiple free models via OpenRouter API
- 📱 **Responsive Design** - Beautiful on desktop and mobile
- 🔊 **Interactive Elements** - Typing indicators, sound effects, animations
- 💳 **Smart Error Handling** - User-friendly rate limit and credit messages

## 🎨 Visual Highlights

- **Animated Starfield Background** with twinkling stars
- **Aurora Gradient Effects** with smooth color transitions  
- **Glass Morphism UI** with backdrop blur effects
- **Smooth Message Animations** with slide-in effects
- **Dynamic Typing Indicators** with bouncing dots
- **Interactive Sound Effects** for message feedback

## 🚀 Quick Deploy

### Railway (Recommended)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

1. Click "Deploy on Railway"
2. Connect your GitHub account
3. Add PostgreSQL database
4. Set environment variables
5. Deploy! 🎉

### Other Platforms
- **Render**: Use `render.yaml` configuration
- **Vercel**: Use `vercel.json` configuration  
- **Docker**: Use included `Dockerfile`

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (Supabase recommended)
- **AI**: OpenRouter API with free Dolphin models
- **Authentication**: JWT tokens with bcrypt
- **Deployment**: Railway, Render, Vercel, Docker

## 📋 Environment Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd daddy-john-chatbot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

4. **Run database migrations**
   ```bash
   npm run migrate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🔧 Environment Variables

```env
# Database (Supabase recommended)
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

## 🤖 Available AI Models

Free models you can use by updating `AI_MODEL`:

- `cognitivecomputations/dolphin3.0-mistral-24b:free` (Default)
- `cognitivecomputations/dolphin3.0-r1-mistral-24b:free`  
- `cognitivecomputations/dolphin-mistral-24b-venice-edition:free`

## 📱 Features Overview

### 🎭 Personalized Experience
- Custom onboarding with user preferences
- Tailored conversations based on interests
- Remembers relationship status and connection type
- Avoids topics user dislikes

### 💬 Smart Conversations  
- Context-aware responses using conversation history
- Automatic summaries every 20 messages
- Short, natural message style like real texting
- Emoji support and message formatting

### 🎨 Beautiful Interface
- Modern dark theme with purple/pink gradients
- Animated background with stars and aurora
- Smooth message animations and transitions
- Responsive design for all devices

### 🔊 Interactive Elements
- Typing indicators with animated dots
- Sound effects for message feedback
- Status updates (Online, Typing, Thinking)
- Smart error handling with user-friendly messages

## 🚨 Error Handling

The platform includes intelligent error handling:

- **💳 Credits Exhausted**: Clear message when daily free limits reached
- **⏱️ Rate Limited**: Temporary rate limit notifications  
- **🔐 Auth Errors**: Authentication failure guidance
- **🌐 Network Issues**: Connection error messages

## 📊 Database Schema

- **Users**: Authentication and profile data
- **User Preferences**: Onboarding responses and personalization
- **Conversations**: Chat sessions with summaries
- **Messages**: Individual chat messages with metadata

## 🔍 Health Monitoring

Built-in health check endpoint at `/health`:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z", 
  "uptime": 123.45
}
```

## 📝 License

MIT License - feel free to use for personal or commercial projects.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 💬 Support

For deployment help, see [DEPLOYMENT.md](DEPLOYMENT.md)

---

**Built with ❤️ for amazing conversational experiences**