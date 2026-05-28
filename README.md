# PC Repair System

Full-stack PC repair support platform with a Django REST backend and a React/Vite frontend. The system combines account management, AI-assisted troubleshooting, issue browsing, support tickets, technician workflows, and admin tools.

## Overview

The repository is split into two applications:

- [pc_repair_backend](pc_repair_backend) - Django API, authentication, ticketing, issue library, AI chat, and email/file handling.
- [pc-repair-frontend](pc-repair-frontend) - React application for clients, technicians, and admins.

The frontend talks to the backend through a JSON API and uses JWT authentication for protected routes.

## Features

### Backend

- JWT authentication with refresh tokens
- Role-based access for client, technician, and admin users
- AI troubleshooting chat service
- Support ticket workflow with assignments, updates, and attachments
- Issue library with search and helpful votes
- Password reset and technician application flows
- SQLite for local development and PostgreSQL for production

### Frontend

- Public pages for home, login, registration, password reset, and issue browsing
- Protected chat, profile, ticket, technician, and admin routes
- Token refresh handling and API interceptors
- Responsive UI built with React, Vite, and Tailwind CSS
- Toast notifications and client-side route protection

## Tech Stack

Backend:

- Django 5.2
- Django REST Framework
- Simple JWT
- SQLite for development
- PostgreSQL for production
- CORS support for the frontend
- WhiteNoise for static assets in production

Frontend:

- React 19
- Vite
- React Router
- Axios
- Tailwind CSS
- React Hot Toast

## Project Structure

```text
pc_repair_system/
├── pc_repair_backend/
│   ├── accounts/
│   ├── bookings/
│   ├── chat/
│   ├── config/
│   ├── issues/
│   ├── manage.py
│   └── requirements.txt
├── pc-repair-frontend/
│   ├── src/
│   ├── public/
│   └── package.json
└── docs and deployment notes
```

## Prerequisites

- Python 3.10 or newer
- Node.js 18 or newer
- npm
- Git

## Backend Setup

Open a terminal in `pc_repair_backend` and run:

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `pc_repair_backend` with the values your environment needs. A good starting point is:

```env
DEBUG=True
SECRET_KEY=replace-with-a-secure-secret
ALLOWED_HOSTS=localhost,127.0.0.1

# Development uses SQLite automatically when DATABASE_URL is not set
# DATABASE_URL=postgres://user:password@host:5432/dbname

# AI services
GROQ_API_KEY=your-groq-api-key
GEMINI_API_KEY=your-gemini-api-key

# Email / notifications
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@example.com
EMAIL_HOST_PASSWORD=your-app-password
RESEND_API_KEY=your-resend-api-key
```

Then prepare the database and start the server:

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

The API is available at `http://127.0.0.1:8000/` and the API overview is at `http://127.0.0.1:8000/api/`.

### Backend Environment Variables

- `SECRET_KEY` - Django secret key
- `DEBUG` - `True` or `False`
- `ALLOWED_HOSTS` - Comma-separated host list
- `DATABASE_URL` - PostgreSQL connection string for production
- `GROQ_API_KEY` - AI chat key used by the backend settings
- `GEMINI_API_KEY` - Gemini key used by the chat service
- `EMAIL_HOST` - SMTP host
- `EMAIL_PORT` - SMTP port
- `EMAIL_USE_TLS` - Enable TLS for SMTP
- `EMAIL_HOST_USER` - Email username
- `EMAIL_HOST_PASSWORD` - Email password or app password
- `RESEND_API_KEY` - Optional Resend API key for transactional email

## Frontend Setup

Open a second terminal in `pc-repair-frontend` and run:

```bash
npm install
```

Create a `.env` file in `pc-repair-frontend`:

```env
VITE_API_URL=http://localhost:8000
```

The frontend API client automatically appends `/api` if you only provide the backend host.

Start the frontend with:

```bash
npm run dev
```

Build it with:

```bash
npm run build
```

The app normally runs on `http://localhost:5173/`.

## Running The Full Stack

1. Start the Django backend with `python manage.py runserver`.
2. Start the Vite frontend with `npm run dev`.
3. Open the frontend in your browser and sign in or register.

## Main Frontend Routes

- `/` - Home
- `/login` - Login
- `/register` - Register
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset confirmation
- `/issues` - Issue library
- `/issues/:id` - Issue details
- `/profile` - User profile
- `/chat` - AI support chat
- `/tickets` - My tickets
- `/tickets/:id` - Ticket details
- `/technician` - Technician dashboard
- `/technician/apply` - Technician application form
- `/technician/application-status` - Application status
- `/admin` - Admin dashboard
- `/admin/tickets` - Admin ticket management
- `/admin/applications` - Technician applications
- `/admin/users` - User management

## API Highlights

The backend exposes its full endpoint list at `GET /api/`. The main groups are:

- Authentication: register, login, logout, token refresh, profile, password reset, technician applications
- Issues: categories, resolved issues, search, helpful votes, popular and recent issues
- Chat: start sessions, send messages, list sessions, close sessions, delete sessions
- Tickets: create tickets, list personal tickets, admin assignment tools, technician assignment tools, file uploads, status updates

## Deployment Notes

- The backend is configured for SQLite locally and PostgreSQL in production through `DATABASE_URL`.
- CORS is already set up for local Vite ports and the documented Vercel frontend domains.
- `Procfile`, `nixpacks.toml`, and `railway.json` are included for Railway deployment.
- `vercel.json` is included for frontend deployment.

## Helpful Docs

- [Backend guide](pc_repair_backend/README.md)
- [Frontend guide](pc-repair-frontend/README.md)
- [Deployment guide](DEPLOYMENT_GUIDE.md)
- [UI implementation notes](UI_IMPLEMENTATION_COMPLETE.md)
- [UI enhancements](UI_ENHANCEMENTS.md)

## Notes

If you run into API errors after setting up the frontend, confirm that the backend is running and that `VITE_API_URL` points to the backend host, not the `/api` path itself unless you intentionally want to include it.
