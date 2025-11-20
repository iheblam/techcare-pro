from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([AllowAny])
def api_overview(request):
    """
    API Overview - Lists all available endpoints
    GET /api/
    """
    endpoints = {
        "message": "PC Repair System API",
        "version": "1.0.0",
        "documentation": {
            "Authentication": {
                "POST /api/auth/register/": "Register new client account",
                "POST /api/auth/login/": "Login and get JWT tokens",
                "POST /api/auth/logout/": "Logout (blacklist token)",
                "POST /api/auth/token/refresh/": "Refresh access token",
                "GET /api/auth/profile/": "Get user profile (auth required)",
                "PUT /api/auth/profile/": "Update profile (auth required)",
                "POST /api/auth/change-password/": "Change password (auth required)",
                "POST /api/auth/technician/apply/": "Apply as technician (auth required)"
            },
            "Issues Library": {
                "GET /api/issues/categories/": "List all issue categories",
                "GET /api/issues/resolved/": "List resolved issues (search & filter)",
                "GET /api/issues/resolved/<id>/": "Get issue detail",
                "POST /api/issues/resolved/<id>/helpful/": "Mark issue as helpful (auth required)",
                "GET /api/issues/similar/?query=...": "Find similar issues",
                "GET /api/issues/popular/": "Get popular issues",
                "GET /api/issues/recent/": "Get recent issues"
            },
            "AI Chat (Gemini)": {
                "POST /api/chat/start/": "Start new AI chat session (auth required)",
                "GET /api/chat/sessions/": "List my chat sessions (auth required)",
                "GET /api/chat/sessions/<id>/": "Get chat session detail (auth required)",
                "POST /api/chat/sessions/<id>/message/": "Send message to AI (auth required)",
                "POST /api/chat/sessions/<id>/close/": "Close chat session (auth required)",
                "DELETE /api/chat/sessions/<id>/delete/": "Delete chat session (auth required)"
            },
            "Support Tickets": {
                "Client": {
                    "POST /api/tickets/create/": "Create support ticket (auth required)",
                    "GET /api/tickets/my-tickets/": "View my tickets (auth required)",
                    "GET /api/tickets/<id>/": "View ticket detail (auth required)",
                    "POST /api/tickets/<id>/add-update/": "Add comment (auth required)",
                    "POST /api/tickets/<id>/upload/": "Upload attachment (auth required)"
                },
                "Admin": {
                    "GET /api/tickets/admin/pending/": "View pending tickets (admin only)",
                    "GET /api/tickets/admin/all/": "View all tickets with filters (admin only)",
                    "POST /api/tickets/<id>/assign/": "Assign ticket to technician (admin only)"
                },
                "Technician": {
                    "GET /api/tickets/technician/assigned/": "View assigned tickets (tech only)",
                    "PATCH /api/tickets/<id>/update-status/": "Update ticket status (tech/admin)",
                    "POST /api/tickets/<id>/add-update/": "Add progress update (tech/admin)"
                }
            }
        },
        "features": {
            "authentication": "JWT-based authentication",
            "ai_assistant": "Gemini 2.0 Flash integration",
            "ticket_system": "Complete support ticket workflow",
            "issue_library": "Searchable database of resolved issues",
            "file_uploads": "Support for attachments",
            "role_based_access": "Client, Technician, Admin roles"
        },
        "tech_stack": {
            "framework": "Django + Django REST Framework",
            "ai_model": "Google Gemini 2.0 Flash",
            "authentication": "JWT (Simple JWT)",
            "database": "SQLite (dev) / PostgreSQL (production ready)"
        }
    }
    
    return Response(endpoints)