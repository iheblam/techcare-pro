from django.db import models
from django.utils import timezone
from accounts.models import User

class ChatSession(models.Model):
    """
    AI Chat session between client and Gemini
    """
    ISSUE_TYPE_CHOICES = (
        ('hardware', 'Hardware Problem'),
        ('software', 'Software Problem'),
    )
    
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('resolved', 'Resolved by AI'),
        ('escalated', 'Escalated to Technician'),
        ('abandoned', 'Abandoned'),
    )
    
    client = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='chat_sessions'
    )
    issue_type = models.CharField(max_length=20, choices=ISSUE_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Gemini conversation storage
    gemini_conversation_history = models.JSONField(
        default=list,
        help_text="Stores full conversation for context"
    )
    problem_summary = models.TextField(
        blank=True,
        help_text="AI-generated summary of the problem"
    )
    
    is_resolved = models.BooleanField(default=False)
    resolution_summary = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Chat #{self.id} - {self.client.username} ({self.get_issue_type_display()})"
    
    def close_session(self, resolution_summary=''):
        self.is_resolved = True
        self.closed_at = timezone.now()
        self.resolution_summary = resolution_summary
        self.save()


class ChatMessage(models.Model):
    """
    Individual messages in a chat session
    """
    SENDER_CHOICES = (
        ('user', 'User'),
        ('ai', 'Gemini AI'),
    )
    
    session = models.ForeignKey(
        ChatSession, 
        on_delete=models.CASCADE, 
        related_name='messages'
    )
    sender = models.CharField(max_length=10, choices=SENDER_CHOICES)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Optional attachments (screenshots, error logs, etc.)
    attachment = models.FileField(
        upload_to='chat_attachments/', 
        null=True, 
        blank=True
    )
    
    class Meta:
        ordering = ['timestamp']
    
    def __str__(self):
        return f"{self.get_sender_display()}: {self.message[:50]}..."