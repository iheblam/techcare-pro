from django.contrib import admin
from .models import ChatSession, ChatMessage

@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'client', 'issue_type', 'status', 'created_at']
    list_filter = ['status', 'issue_type']
    search_fields = ['client__username']

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['session', 'sender', 'timestamp']
    list_filter = ['sender']