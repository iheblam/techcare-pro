from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import ChatSession, ChatMessage
from .serializers import (
    ChatSessionListSerializer,
    ChatSessionDetailSerializer,
    ChatSessionCreateSerializer,
    SendMessageSerializer,
    ChatMessageSerializer
)
from .ai_service import AIChatService
from issues.models import ResolvedIssue, IssueCategory


class StartChatSessionView(generics.CreateAPIView):
    """
    Start a new AI chat session
    POST /api/chat/start/
    
    Body: {
        "issue_type": "hardware" or "software"
    }
    """
    serializer_class = ChatSessionCreateSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create the chat session
        session = serializer.save(client=request.user)
        
        # Initialize AI service
        ai_service = AIChatService()
        
        # Get welcome message from AI
        welcome_message = ai_service.start_chat_session(
            session.id,
            session.get_issue_type_display()
        )
        
        # Save AI's welcome message
        ai_message = ChatMessage.objects.create(
            session=session,
            sender='ai',
            message=welcome_message
        )
        
        # Return full session details with the welcome message
        response_serializer = ChatSessionDetailSerializer(session)
        
        return Response({
            'message': 'Chat session started successfully',
            'session': response_serializer.data
        }, status=status.HTTP_201_CREATED)


class ChatSessionListView(generics.ListAPIView):
    """
    List all chat sessions for the authenticated user
    GET /api/chat/sessions/
    """
    serializer_class = ChatSessionListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ChatSession.objects.filter(
            client=self.request.user
        ).order_by('-created_at')


class ChatSessionDetailView(generics.RetrieveAPIView):
    """
    Get detailed view of a specific chat session with all messages
    GET /api/chat/sessions/<id>/
    """
    serializer_class = ChatSessionDetailSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ChatSession.objects.filter(client=self.request.user)


class SendMessageView(APIView):
    """
    Send a message in a chat session and get AI response
    POST /api/chat/sessions/<session_id>/message/
    
    Body: {
        "message": "User's message text",
        "attachment": file (optional)
    }
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, session_id):
        # Get the chat session
        session = get_object_or_404(
            ChatSession,
            id=session_id,
            client=request.user
        )
        
        # Check if session is still active
        if session.status in ['resolved', 'abandoned']:
            return Response({
                'error': 'This chat session is closed'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate message
        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user_message_text = serializer.validated_data['message']
        attachment = serializer.validated_data.get('attachment')
        
        # Save user's message
        user_message = ChatMessage.objects.create(
            session=session,
            sender='user',
            message=user_message_text,
            attachment=attachment
        )
        
        # Get AI response
        ai_service = AIChatService()
        ai_result = ai_service.get_ai_response(session, user_message_text)
        
        # Save AI's response
        ai_message = ChatMessage.objects.create(
            session=session,
            sender='ai',
            message=ai_result['response']
        )
        
        # Update session status if escalation is recommended
        if ai_result['should_escalate'] and session.status == 'active':
            session.status = 'escalated'
            # Generate problem summary for potential ticket creation
            session.problem_summary = ai_service.generate_problem_summary(session)
            session.save()
        
        # Return both messages and session status
        return Response({
            'user_message': ChatMessageSerializer(user_message).data,
            'ai_message': ChatMessageSerializer(ai_message).data,
            'should_escalate': ai_result['should_escalate'],
            'session': {
                'id': session.id,
                'status': session.status,
                'status_display': session.get_status_display(),
                'problem_summary': session.problem_summary
            }
        }, status=status.HTTP_200_OK)


class CloseChatSessionView(APIView):
    """
    Close a chat session (mark as resolved)
    POST /api/chat/sessions/<session_id>/close/
    
    Body: {
        "resolution_summary": "Brief summary (optional)",
        "category_id": "Category ID (optional)",
        "title": "Issue title (optional)"
    }
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, session_id):
        session = get_object_or_404(
            ChatSession,
            id=session_id,
            client=request.user
        )
        
        resolution_summary = request.data.get('resolution_summary', 'Issue resolved')
        category_id = request.data.get('category_id')
        title = request.data.get('title', session.problem_summary or 'AI Resolved Issue')
        
        session.close_session(resolution_summary)
        session.status = 'resolved'
        session.save()
        
        # Automatically create a resolved issue for AI-resolved chats
        try:
            # Get category - try from request, fallback to issue_type
            category = None
            if category_id:
                category = IssueCategory.objects.filter(id=category_id).first()
            
            if not category:
                # Try to find a category based on issue_type
                if session.issue_type == 'hardware':
                    category = IssueCategory.objects.filter(category_type='hardware').first()
                else:
                    category = IssueCategory.objects.filter(category_type='software').first()
            
            if category:
                # Extract description from chat history (first few user messages)
                description = session.problem_summary or 'Issue resolved via AI chat'
                user_messages = [
                    msg.message for msg in session.messages.filter(sender='user')[:3]
                ]
                if user_messages:
                    description = '\n'.join(user_messages)
                
                # Create the resolved issue
                ResolvedIssue.objects.create(
                    title=title[:200],  # Ensure it fits in CharField
                    description=description,
                    category=category,
                    solution=resolution_summary,
                    resolved_by='ai',
                    technician=None,
                    tags='ai-resolved,chat',
                    views=0,
                    helpful_count=0
                )
        except Exception as e:
            # Log error but don't fail the close operation
            print(f"Failed to create resolved issue from chat: {e}")
        
        return Response({
            'message': 'Chat session closed successfully and added to issue library',
            'session': ChatSessionDetailSerializer(session).data
        }, status=status.HTTP_200_OK)


class DeleteChatSessionView(generics.DestroyAPIView):
    """
    Delete a chat session
    DELETE /api/chat/sessions/<id>/
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ChatSession.objects.filter(client=self.request.user)