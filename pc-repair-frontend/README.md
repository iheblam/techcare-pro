# PC Repair System - Frontend

Modern, responsive React frontend for the PC Repair System with AI-powered support.

## 🚀 Features

### ✅ Implemented Features

- **Authentication System** 🔐 - User registration, login with JWT, role-based access
- **AI Chat Interface** 🤖 - Real-time chat with Google Gemini AI, auto-escalation
- **Issue Library** 📚 - Browse resolved issues, search, filter, and vote
- **Support Ticket System** 🎫 - Create tickets, track status, add comments and files
- **Admin Dashboard** 👑 - Manage tickets, assign to technicians, view statistics
- **Technician Dashboard** 🔧 - View assigned tickets, update status, manage workflow

## 🛠️ Tech Stack

- React 19, Vite, React Router, Tailwind CSS, Axios, Lucide Icons, React Hot Toast

## 📦 Quick Start

```bash
# Install dependencies
npm install

# Configure .env
VITE_API_URL=http://localhost:8000/api

# Start dev server
npm run dev

# Build for production
npm run build
```

## 📱 Pages

- `/` - Home page
- `/login`, `/register` - Authentication
- `/issues` - Issue library
- `/chat` - AI chat (protected)
- `/tickets` - Support tickets (protected)
- `/admin` - Admin dashboard (admin only)
- `/technician` - Technician dashboard (technician only)

## 🎨 Design

- Responsive mobile-first design
- Modern UI with Tailwind CSS
- Accessible components
- Performance optimized

## 📝 Notes

Ensure Django backend is running on `http://localhost:8000`

© 2025 PC Repair System. All rights reserved.
