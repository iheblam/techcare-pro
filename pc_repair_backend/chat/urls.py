from django.urls import path
from .views import (
    StartChatSessionView,
    ChatSessionListView,
    ChatSessionDetailView,
    SendMessageView,
    CloseChatSessionView,
    DeleteChatSessionView
)

app_name = 'chat'

urlpatterns = [
    # Start new chat
    path('start/', StartChatSessionView.as_view(), name='start-chat'),
    
    # List and view sessions
    path('sessions/', ChatSessionListView.as_view(), name='session-list'),
    path('sessions/<int:pk>/', ChatSessionDetailView.as_view(), name='session-detail'),
    
    # Send messages
    path('sessions/<int:session_id>/message/', SendMessageView.as_view(), name='send-message'),
    
    # Close/Delete sessions
    path('sessions/<int:session_id>/close/', CloseChatSessionView.as_view(), name='close-session'),
    path('sessions/<int:pk>/delete/', DeleteChatSessionView.as_view(), name='delete-session'),
]