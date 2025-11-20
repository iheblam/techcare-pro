# PC Repair System - Backend API

A comprehensive Django REST API for PC repair services with AI-powered troubleshooting using Google Gemini 2.0 Flash.

## Features

- 🤖 **AI Assistant**: Gemini 2.0 Flash integration for automated PC troubleshooting
- 🎫 **Support Tickets**: Complete ticket management system
- 👥 **Role-Based Access**: Client, Technician, and Admin roles
- 📚 **Issue Library**: Searchable database of resolved PC issues
- 💬 **Real-time Chat**: AI-powered diagnostic conversations
- 📎 **File Uploads**: Support for attachments and screenshots
- 🔐 **JWT Authentication**: Secure token-based authentication

## Tech Stack

- **Framework**: Django 5.0 + Django REST Framework
- **AI Model**: Google Gemini 2.0 Flash
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Database**: SQLite (development) / PostgreSQL (production-ready)
- **File Storage**: Local media files (development)

## Installation

### Prerequisites

- Python 3.10+
- pip
- Virtual environment

### Setup

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd pc_repair_system
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Create .env file**
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
GEMINI_API_KEY=your-gemini-api-key
```

5. **Run migrations**
```bash
python manage.py migrate
```

6. **Create superuser**
```bash
python manage.py createsuperuser
```

7. **Run server**
```bash
python manage.py runserver
```

API will be available at: `http://127.0.0.1:8000/api/`

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new client
- `POST /api/auth/login/` - Login
- `GET /api/auth/profile/` - Get profile

### AI Chat
- `POST /api/chat/start/` - Start AI chat session
- `POST /api/chat/sessions/<id>/message/` - Send message

### Support Tickets
- `POST /api/tickets/create/` - Create ticket
- `GET /api/tickets/my-tickets/` - View my tickets
- `GET /api/tickets/admin/pending/` - Admin: View pending (admin only)
- `POST /api/tickets/<id>/assign/` - Admin: Assign ticket (admin only)

### Issue Library
- `GET /api/issues/resolved/` - Browse resolved issues
- `GET /api/issues/resolved/?search=blue+screen` - Search issues

Full API documentation: `GET /api/`

## User Roles

### Client
- Chat with AI assistant
- Create support tickets
- View own tickets
- Add updates and attachments

### Technician
- View assigned tickets
- Update ticket status
- Add progress notes
- Upload work photos
- Mark tickets as resolved

### Admin
- View all tickets
- Assign tickets to technicians
- Manage technician approvals
- View dashboard statistics
- Full system access

## Workflow

1. **Client** encounters PC issue
2. **Client** chats with **Gemini AI** for diagnosis
3. If AI can't resolve, it suggests **escalation**
4. **Client** creates **support ticket**
5. **Admin** reviews and assigns to **Technician**
6. **Technician** works on issue and updates status
7. **Technician** marks as resolved with final cost
8. **Client** confirms resolution

## Development

### Run tests
```bash
python manage.py test
```

### Create migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Access admin panel
```
http://127.0.0.1:8000/admin/
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SECRET_KEY` | Django secret key | Yes |
| `DEBUG` | Debug mode (True/False) | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |

## Project Structure
```
pc_repair_system/
├── accounts/          # User authentication & profiles
├── issues/            # Issue library & categories
├── chat/              # AI chat with Gemini
├── bookings/          # Support tickets
├── config/            # Project settings
├── media/             # Uploaded files
├── manage.py
├── requirements.txt
└── .env
```

## License

MIT License

## Support

For issues or questions, please open a GitHub issue.