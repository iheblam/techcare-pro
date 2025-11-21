from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, Avg
from .models import SupportTicket
from chat.models import ChatSession
from issues.models import ResolvedIssue
from accounts.models import User


class AdminDashboardStatsView(APIView):
    """
    Get dashboard statistics for admin
    GET /api/admin/dashboard-stats/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Only admin can access
        if request.user.user_type != 'admin':
            return Response({
                'error': 'Admin access required'
            }, status=403)
        
        # Ticket statistics
        total_tickets = SupportTicket.objects.count()
        pending_tickets = SupportTicket.objects.filter(status='pending').count()
        assigned_tickets = SupportTicket.objects.filter(status='assigned').count()
        in_progress_tickets = SupportTicket.objects.filter(status='in_progress').count()
        resolved_tickets = SupportTicket.objects.filter(status='resolved').count()
        
        # Chat statistics
        total_chats = ChatSession.objects.count()
        active_chats = ChatSession.objects.filter(status='active').count()
        escalated_chats = ChatSession.objects.filter(status='escalated').count()
        resolved_chats = ChatSession.objects.filter(status='resolved').count()
        
        # User statistics
        total_clients = User.objects.filter(user_type='client').count()
        total_technicians = User.objects.filter(user_type='technician').count()
        approved_technicians = User.objects.filter(
            user_type='technician',
            technician_profile__is_approved=True
        ).count()
        
        # Get available technicians for ticket assignment (approved + admin)
        available_technicians = User.objects.filter(
            Q(user_type='technician', technician_profile__is_approved=True) |
            Q(user_type='admin')
        ).annotate(
            active_tickets=Count('technician_tickets', filter=Q(technician_tickets__status__in=['assigned', 'in_progress']))
        ).values('id', 'first_name', 'last_name', 'active_tickets')
        
        technicians_list = [
            {
                'id': tech['id'],
                'name': f"{tech['first_name']} {tech['last_name']}".strip() or 'User',
                'active_tickets': tech['active_tickets']
            }
            for tech in available_technicians
        ]
        
        # Issue library statistics
        total_resolved_issues = ResolvedIssue.objects.count()
        ai_resolved = ResolvedIssue.objects.filter(resolved_by='ai').count()
        technician_resolved = ResolvedIssue.objects.filter(resolved_by='technician').count()
        
        # Recent activity
        recent_tickets = SupportTicket.objects.select_related('client').order_by('-created_at')[:5]
        recent_chats = ChatSession.objects.select_related('client').order_by('-created_at')[:5]
        
        # Ticket status breakdown
        tickets_by_status = SupportTicket.objects.values('status').annotate(
            count=Count('id')
        )
        
        return Response({
            'tickets': {
                'total': total_tickets,
                'pending': pending_tickets,
                'assigned': assigned_tickets,
                'in_progress': in_progress_tickets,
                'resolved': resolved_tickets,
                'by_status': list(tickets_by_status)
            },
            'chats': {
                'total': total_chats,
                'active': active_chats,
                'escalated': escalated_chats,
                'resolved': resolved_chats
            },
            'users': {
                'total_clients': total_clients,
                'total_technicians': total_technicians,
                'approved_technicians': approved_technicians
            },
            'technicians': technicians_list,  # Add available technicians list
            'issue_library': {
                'total': total_resolved_issues,
                'ai_resolved': ai_resolved,
                'technician_resolved': technician_resolved
            },
            'recent_activity': {
                'recent_tickets': [
                    {
                        'id': t.id,
                        'ticket_number': t.ticket_number,
                        'title': t.title,
                        'status': t.status,
                        'client_name': t.client.get_full_name(),
                        'created_at': t.created_at
                    } for t in recent_tickets
                ],
                'recent_chats': [
                    {
                        'id': c.id,
                        'issue_type': c.issue_type,
                        'status': c.status,
                        'client_name': c.client.get_full_name(),
                        'created_at': c.created_at
                    } for c in recent_chats
                ]
            }
        })