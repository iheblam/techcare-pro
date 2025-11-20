from rest_framework import serializers
from .models import ChatSession, ChatMessage
from accounts.serializers import UserSerializer


class ChatMessageSerializer(serializers.ModelSerializer):
    """
    Serializer for individual chat messages
    """
    sender_display = serializers.CharField(source='get_sender_display', read_only=True)
    
    class Meta:
        model = ChatMessage
        fields = [
            'id',
            'sender',
            'sender_display',
            'message',
            'timestamp',
            'attachment'
        ]
        read_only_fields = ['id', 'timestamp']


class ChatSessionListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing chat sessions (brief view)
    """
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    issue_type_display = serializers.CharField(source='get_issue_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    message_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatSession
        fields = [
            'id',
            'client',
            'client_name',
            'issue_type',
            'issue_type_display',
            'status',
            'status_display',
            'is_resolved',
            'message_count',
            'created_at',
            'updated_at'
        ]
    
    def get_message_count(self, obj):
        return obj.messages.count()


class ChatSessionDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for detailed chat session view with all messages
    """
    client_info = UserSerializer(source='client', read_only=True)
    messages = ChatMessageSerializer(many=True, read_only=True)
    issue_type_display = serializers.CharField(source='get_issue_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = ChatSession
        fields = [
            'id',
            'client',
            'client_info',
            'issue_type',
            'issue_type_display',
            'status',
            'status_display',
            'problem_summary',
            'is_resolved',
            'resolution_summary',
            'created_at',
            'updated_at',
            'closed_at',
            'messages'
        ]
        read_only_fields = [
            'id',
            'client',
            'status',
            'problem_summary',
            'created_at',
            'updated_at',
            'closed_at'
        ]


class ChatSessionCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new chat sessions
    """
    class Meta:
        model = ChatSession
        fields = ['issue_type']
    
    def validate_issue_type(self, value):
        if value not in ['hardware', 'software']:
            raise serializers.ValidationError("Issue type must be 'hardware' or 'software'")
        return value


class SendMessageSerializer(serializers.Serializer):
    """
    Serializer for sending messages in a chat
    """
    message = serializers.CharField(required=True, allow_blank=False)
    attachment = serializers.FileField(required=False, allow_null=True)
    
    def validate_message(self, value):
        if len(value.strip()) == 0:
            raise serializers.ValidationError("Message cannot be empty")
        if len(value) > 5000:
            raise serializers.ValidationError("Message too long (max 5000 characters)")
        return value.strip()