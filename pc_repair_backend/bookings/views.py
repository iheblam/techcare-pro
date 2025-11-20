from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
from config.email_service import EmailService
from .models import SupportTicket, TicketAttachment, TicketUpdate
from chat.models import ChatSession
from .serializers import (
    SupportTicketListSerializer,
    SupportTicketDetailSerializer,
    CreateTicketSerializer,
    AssignTicketSerializer,
    UpdateTicketStatusSerializer,
    AddTicketUpdateSerializer,
    UpdateTicketDetailsSerializer,
    TicketAttachmentSerializer,
    TicketUpdateSerializer
)


class CreateTicketView(generics.CreateAPIView):
    """
    Create a new support ticket with anti-spam protection
    POST /api/tickets/create/
    
    Anti-spam measures:
    1. Max 3 pending tickets at a time
    2. Max 5 tickets per day
    3. 10-minute cooldown between tickets
    4. Must have at least one active chat session before creating ticket
    """
    serializer_class = CreateTicketSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        from django.utils import timezone
        from datetime import timedelta
        
        user = request.user
        now = timezone.now()
        
        # Check 1: Maximum pending tickets (3)
        pending_count = SupportTicket.objects.filter(
            client=user,
            status__in=['pending', 'assigned']
        ).count()
        
        if pending_count >= 3:
            return Response({
                'error': 'You have reached the maximum of 3 pending tickets. Please wait for your existing tickets to be processed.',
                'pending_tickets': pending_count
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        # Check 2: Maximum tickets per day (5)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        tickets_today = SupportTicket.objects.filter(
            client=user,
            created_at__gte=today_start
        ).count()
        
        if tickets_today >= 5:
            return Response({
                'error': 'You have reached the daily limit of 5 tickets. Please try again tomorrow.',
                'tickets_created_today': tickets_today,
                'reset_time': (today_start + timedelta(days=1)).isoformat()
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        # Check 3: Cooldown period (10 minutes between tickets)
        last_ticket = SupportTicket.objects.filter(
            client=user
        ).order_by('-created_at').first()
        
        if last_ticket:
            time_since_last = now - last_ticket.created_at
            cooldown_minutes = 10
            
            if time_since_last < timedelta(minutes=cooldown_minutes):
                remaining_seconds = (timedelta(minutes=cooldown_minutes) - time_since_last).total_seconds()
                remaining_minutes = int(remaining_seconds // 60)
                
                return Response({
                    'error': f'Please wait {remaining_minutes + 1} more minute(s) before creating another ticket.',
                    'cooldown_remaining_seconds': int(remaining_seconds),
                    'can_create_at': (last_ticket.created_at + timedelta(minutes=cooldown_minutes)).isoformat()
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        # Check 4: Must have chat session (optional but recommended)
        chat_session_id = request.data.get('chat_session')
        if not chat_session_id:
            from chat.models import ChatSession
            has_chat = ChatSession.objects.filter(client=user).exists()
            if not has_chat:
                return Response({
                    'warning': 'We recommend starting a chat with our AI assistant before creating a ticket. It might be able to help you immediately!',
                    'suggest_chat': True
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # All checks passed, proceed with ticket creation
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Return detailed ticket info
        ticket = SupportTicket.objects.get(id=serializer.instance.id)
        response_serializer = SupportTicketDetailSerializer(ticket)
        
        return Response({
            'message': 'Support ticket created successfully. Confirmation email sent!',
            'ticket': response_serializer.data,
            'limits': {
                'pending_tickets': pending_count + 1,
                'max_pending': 3,
                'tickets_today': tickets_today + 1,
                'daily_limit': 5
            }
        }, status=status.HTTP_201_CREATED)
    
    def perform_create(self, serializer):
        ticket = serializer.save(client=self.request.user)
        
        # Add initial update
        TicketUpdate.objects.create(
            ticket=ticket,
            user=self.request.user,
            update_text="Ticket created by client",
            status_changed_to='pending'
        )
        
        # Send confirmation email to client
        EmailService.send_ticket_created_email(ticket)


class MyTicketsView(generics.ListAPIView):
    """
    List all tickets for the authenticated client
    GET /api/tickets/my-tickets/
    """
    serializer_class = SupportTicketListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SupportTicket.objects.filter(
            client=self.request.user
        ).select_related('assigned_technician', 'client').order_by('-created_at')


class TicketDetailView(generics.RetrieveAPIView):
    """
    Get detailed view of a specific ticket
    GET /api/tickets/<id>/
    """
    serializer_class = SupportTicketDetailSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Clients can only see their own tickets
        if user.user_type == 'client':
            return SupportTicket.objects.filter(client=user)
        
        # Technicians can see assigned tickets
        elif user.user_type == 'technician':
            return SupportTicket.objects.filter(assigned_technician=user)
        
        # Admin can see all tickets
        elif user.user_type == 'admin':
            return SupportTicket.objects.all()
        
        return SupportTicket.objects.none()


# ==================== ADMIN ENDPOINTS ====================

class AdminPendingTicketsView(generics.ListAPIView):
    """
    List all pending tickets (Admin only)
    GET /api/tickets/admin/pending/
    """
    serializer_class = SupportTicketListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Only admin can access
        if self.request.user.user_type != 'admin':
            return SupportTicket.objects.none()
        
        return SupportTicket.objects.filter(
            status='pending'
        ).select_related('client').order_by('-created_at')


class AdminAllTicketsView(generics.ListAPIView):
    """
    List all tickets with filters (Admin only)
    GET /api/tickets/admin/all/?status=pending&priority=high
    """
    serializer_class = SupportTicketListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Only admin can access
        if self.request.user.user_type != 'admin':
            return SupportTicket.objects.none()
        
        queryset = SupportTicket.objects.all().select_related(
            'client', 'assigned_technician'
        ).order_by('-created_at')
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by priority
        priority_filter = self.request.query_params.get('priority')
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)
        
        # Filter by technician
        technician_id = self.request.query_params.get('technician')
        if technician_id:
            queryset = queryset.filter(assigned_technician_id=technician_id)
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(ticket_number__icontains=search) |
                Q(title__icontains=search) |
                Q(description__icontains=search)
            )
        
        return queryset


class AssignTicketView(APIView):
    """
    Assign ticket to technician (Admin only)
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, ticket_id):
        # Only admin can assign
        if request.user.user_type != 'admin':
            return Response({
                'error': 'Only administrators can assign tickets'
            }, status=status.HTTP_403_FORBIDDEN)
        
        ticket = get_object_or_404(SupportTicket, id=ticket_id)
        
        serializer = AssignTicketSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        from accounts.models import User
        technician = User.objects.get(id=serializer.validated_data['technician_id'])
        
        # Assign the ticket
        ticket.assign_to_technician(technician)
        
        # Update additional fields
        if 'estimated_cost' in serializer.validated_data:
            ticket.estimated_cost = serializer.validated_data['estimated_cost']
        
        if 'priority' in serializer.validated_data:
            ticket.priority = serializer.validated_data['priority']
        
        if 'admin_notes' in serializer.validated_data:
            ticket.admin_notes = serializer.validated_data['admin_notes']
        
        ticket.save()
        
        # Add update log
        TicketUpdate.objects.create(
            ticket=ticket,
            user=request.user,
            update_text=f"Ticket assigned to {technician.get_full_name()}",
            status_changed_to='assigned'
        )
        
        # Send email notifications
        EmailService.send_ticket_assigned_email(ticket)  # To technician
        EmailService.send_ticket_status_update_email(ticket, 'pending', 'assigned')  # To client
        
        return Response({
            'message': 'Ticket assigned successfully. Notifications sent!',
            'ticket': SupportTicketDetailSerializer(ticket).data
        }, status=status.HTTP_200_OK)   


# ==================== TECHNICIAN ENDPOINTS ====================

class TechnicianAssignedTicketsView(generics.ListAPIView):
    """
    List all tickets assigned to the authenticated technician
    GET /api/tickets/technician/assigned/
    """
    serializer_class = SupportTicketListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Only technicians and admin
        if self.request.user.user_type not in ['technician', 'admin']:
            return SupportTicket.objects.none()
        
        return SupportTicket.objects.filter(
            assigned_technician=self.request.user
        ).select_related('client').order_by('-created_at')


class UpdateTicketStatusView(APIView):
    """
    Update ticket status (Technician/Admin)
    """
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, ticket_id):
        ticket = get_object_or_404(SupportTicket, id=ticket_id)
        
        # Check permissions
        user = request.user
        if user.user_type == 'client':
            return Response({
                'error': 'Clients cannot update ticket status'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if user.user_type == 'technician' and ticket.assigned_technician != user:
            return Response({
                'error': 'You can only update your assigned tickets'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = UpdateTicketStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        old_status = ticket.status
        new_status = serializer.validated_data['status']
        
        # Update status
        ticket.status = new_status
        
        # Handle resolved status
        resolved_now = False
        if new_status == 'resolved' and old_status != 'resolved':
            ticket.mark_resolved()
            resolved_now = True
            # Send resolved email
            EmailService.send_ticket_resolved_email(ticket)  # Add this
        
        # Update final cost if provided
        if 'final_cost' in serializer.validated_data:
            ticket.final_cost = serializer.validated_data['final_cost']
        
        # Update technician notes if provided
        if 'technician_notes' in serializer.validated_data:
            ticket.technician_notes = serializer.validated_data['technician_notes']
        
        ticket.save()
        
        # Add update log
        update_text = serializer.validated_data.get('update_note', f'Status changed from {old_status} to {new_status}')
        TicketUpdate.objects.create(
            ticket=ticket,
            user=user,
            update_text=update_text,
            status_changed_to=new_status
        )
        
        # Send status update email (if not resolved - resolved has its own email)
        if new_status != 'resolved':
            EmailService.send_ticket_status_update_email(ticket, old_status, new_status)  # Add this
        
        response_data = {
            'message': 'Ticket status updated successfully. Email notification sent!',
            'ticket': SupportTicketDetailSerializer(ticket).data,
            'resolved_now': resolved_now,
            'can_add_to_library': resolved_now  # Flag to show "Add to Issue Library" prompt in frontend
        }
        
        return Response(response_data, status=status.HTTP_200_OK)

class AddTicketUpdateView(APIView):
    """
    Add a comment/update to a ticket
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, ticket_id):
        ticket = get_object_or_404(SupportTicket, id=ticket_id)
        
        # Check if user has access to this ticket
        user = request.user
        if user.user_type == 'client' and ticket.client != user:
            return Response({
                'error': 'You can only update your own tickets'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if user.user_type == 'technician' and ticket.assigned_technician != user:
            return Response({
                'error': 'You can only update your assigned tickets'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = AddTicketUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        update = TicketUpdate.objects.create(
            ticket=ticket,
            user=user,
            update_text=serializer.validated_data['update_text']
        )
        
        # Determine who should receive notification
        recipients = []
        
        # Always notify the client (if update is not from client)
        if user != ticket.client:
            recipients.append(ticket.client.email)
        
        # Notify technician (if assigned and update is not from technician)
        if ticket.assigned_technician and user != ticket.assigned_technician:
            recipients.append(ticket.assigned_technician.email)
        
        # Send notification email
        if recipients:
            EmailService.send_new_update_notification(ticket, update, recipients)  # Add this
        
        return Response({
            'message': 'Update added successfully. Notifications sent!',
            'update': TicketUpdateSerializer(update).data
        }, status=status.HTTP_201_CREATED)


class UploadTicketAttachmentView(APIView):
    """
    Upload file attachment to ticket
    POST /api/tickets/<ticket_id>/upload/
    
    Body (form-data):
        file: [file]
        description: "Screenshot of error"
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, ticket_id):
        ticket = get_object_or_404(SupportTicket, id=ticket_id)
        
        # Check access
        user = request.user
        if user.user_type == 'client' and ticket.client != user:
            return Response({
                'error': 'Access denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if user.user_type == 'technician' and ticket.assigned_technician != user:
            return Response({
                'error': 'Access denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if 'file' not in request.FILES:
            return Response({
                'error': 'No file provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        attachment = TicketAttachment.objects.create(
            ticket=ticket,
            uploaded_by=user,
            file=request.FILES['file'],
            description=request.data.get('description', '')
        )
        
        return Response({
            'message': 'File uploaded successfully',
            'attachment': TicketAttachmentSerializer(attachment, context={'request': request}).data
        }, status=status.HTTP_201_CREATED)


class UpdateTicketDetailsView(APIView):
    """
    Update ticket details like title, estimated_cost, priority, admin_notes
    PATCH /api/tickets/{ticket_id}/update-details/
    """
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, ticket_id):
        ticket = get_object_or_404(SupportTicket, id=ticket_id)
        
        # Check permissions - only admin and assigned technician can update
        user = request.user
        if user.user_type == 'client':
            return Response({
                'error': 'Clients cannot update ticket details'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if user.user_type == 'technician' and ticket.assigned_technician != user:
            return Response({
                'error': 'You can only update tickets assigned to you'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = UpdateTicketDetailsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Update fields if provided
        if 'title' in serializer.validated_data:
            ticket.title = serializer.validated_data['title']
        
        if 'estimated_cost' in serializer.validated_data:
            ticket.estimated_cost = serializer.validated_data['estimated_cost']
        
        if 'priority' in serializer.validated_data:
            ticket.priority = serializer.validated_data['priority']
        
        if 'admin_notes' in serializer.validated_data:
            ticket.admin_notes = serializer.validated_data['admin_notes']
        
        ticket.save()
        
        return Response({
            'message': 'Ticket details updated successfully',
            'ticket': SupportTicketDetailSerializer(ticket).data
        }, status=status.HTTP_200_OK)


class DeleteTicketView(APIView):
    """
    Delete a ticket (Admin only)
    DELETE /api/tickets/{ticket_id}/delete/
    """
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, ticket_id):
        # Only admin can delete tickets
        if request.user.user_type != 'admin':
            return Response({
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        ticket = get_object_or_404(SupportTicket, id=ticket_id)
        
        # Only allow deletion of resolved or cancelled tickets
        if ticket.status not in ['resolved', 'cancelled']:
            return Response({
                'error': 'Only resolved or cancelled tickets can be deleted',
                'current_status': ticket.status
            }, status=status.HTTP_400_BAD_REQUEST)
        
        ticket_number = ticket.ticket_number
        ticket.delete()
        
        return Response({
            'message': f'Ticket {ticket_number} deleted successfully'
        }, status=status.HTTP_200_OK)


class CreateIssueFromTicketView(APIView):
    """
    Create a resolved issue from a ticket for the Issue Library
    POST /api/tickets/<ticket_id>/create-issue/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, ticket_id):
        from issues.models import ResolvedIssue, IssueCategory
        
        # Only admin and technicians can add to library
        if request.user.user_type not in ['admin', 'technician']:
            return Response({
                'error': 'Only admins and technicians can add issues to library'
            }, status=status.HTTP_403_FORBIDDEN)
        
        ticket = get_object_or_404(SupportTicket, id=ticket_id)
        
        # Only resolved tickets can be added to library
        if ticket.status != 'resolved':
            return Response({
                'error': 'Only resolved tickets can be added to the issue library'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get data from request
        title = request.data.get('title', ticket.title)
        description = request.data.get('description', ticket.description)
        solution = request.data.get('solution', ticket.technician_notes or ticket.admin_notes or 'Solution provided by technician.')
        category_id = request.data.get('category_id')
        tags = request.data.get('tags', '')
        
        # Validate category
        if not category_id:
            return Response({
                'error': 'Category is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            category = IssueCategory.objects.get(id=category_id)
        except IssueCategory.DoesNotExist:
            return Response({
                'error': 'Invalid category'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if issue already created from this ticket
        if ResolvedIssue.objects.filter(related_ticket=ticket).exists():
            return Response({
                'error': 'An issue has already been created from this ticket'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Determine resolved_by based on whether ticket came from chat session or technician
        resolved_by = 'technician'
        if ticket.chat_session:
            resolved_by = 'ai'
        elif ticket.assigned_technician:
            resolved_by = 'technician'
        
        # Create the resolved issue
        issue = ResolvedIssue.objects.create(
            title=title,
            description=description,
            category=category,
            solution=solution,
            resolved_by=resolved_by,
            technician=ticket.assigned_technician,
            tags=tags,
            related_ticket=ticket,
            views=0,
            helpful_count=0
        )
        
        return Response({
            'message': 'Issue added to library successfully!',
            'issue_id': issue.id,
            'issue_title': issue.title
        }, status=status.HTTP_201_CREATED)