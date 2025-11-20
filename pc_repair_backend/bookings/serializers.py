from rest_framework import serializers
from .models import SupportTicket, TicketAttachment, TicketUpdate
from accounts.serializers import UserSerializer
from chat.serializers import ChatSessionListSerializer


class TicketAttachmentSerializer(serializers.ModelSerializer):
    """
    Serializer for ticket file attachments
    """
    uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = TicketAttachment
        fields = [
            'id',
            'ticket',
            'uploaded_by',
            'uploaded_by_name',
            'file',
            'file_url',
            'description',
            'uploaded_at'
        ]
        read_only_fields = ['id', 'uploaded_by', 'uploaded_at']
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
        return None


class TicketUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for ticket activity updates
    """
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_type = serializers.CharField(source='user.user_type', read_only=True)
    
    class Meta:
        model = TicketUpdate
        fields = [
            'id',
            'ticket',
            'user',
            'user_name',
            'user_type',
            'update_text',
            'status_changed_to',
            'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']


class SupportTicketListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing tickets (brief view)
    """
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    technician_name = serializers.CharField(source='assigned_technician.get_full_name', read_only=True, allow_null=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    
    class Meta:
        model = SupportTicket
        fields = [
            'id',
            'ticket_number',
            'client',
            'client_name',
            'assigned_technician',
            'technician_name',
            'title',
            'description',
            'issue_type',
            'status',
            'status_display',
            'priority',
            'priority_display',
            'requires_visit',
            'estimated_cost',
            'is_paid',
            'created_at'
        ]


class SupportTicketDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for detailed ticket view
    """
    client_info = UserSerializer(source='client', read_only=True)
    technician_info = UserSerializer(source='assigned_technician', read_only=True, allow_null=True)
    chat_session_info = ChatSessionListSerializer(source='chat_session', read_only=True, allow_null=True)
    attachments = TicketAttachmentSerializer(many=True, read_only=True)
    updates = TicketUpdateSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    
    class Meta:
        model = SupportTicket
        fields = [
            'id',
            'ticket_number',
            'client',
            'client_info',
            'assigned_technician',
            'technician_info',
            'chat_session',
            'chat_session_info',
            'title',
            'description',
            'issue_type',
            'status',
            'status_display',
            'priority',
            'priority_display',
            'requires_visit',
            'visit_address',
            'scheduled_visit_date',
            'estimated_cost',
            'final_cost',
            'is_paid',
            'payment_date',
            'admin_notes',
            'technician_notes',
            'created_at',
            'assigned_at',
            'resolved_at',
            'attachments',
            'updates'
        ]
        read_only_fields = [
            'id',
            'ticket_number',
            'client',
            'created_at',
            'assigned_at',
            'resolved_at'
        ]


class CreateTicketSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new support tickets
    """
    class Meta:
        model = SupportTicket
        fields = [
            'chat_session',
            'title',
            'description',
            'issue_type',
            'requires_visit',
            'visit_address'
        ]
    
    def validate(self, data):
        # If requires_visit is True, visit_address must be provided
        if data.get('requires_visit') and not data.get('visit_address'):
            raise serializers.ValidationError({
                'visit_address': 'Address is required when requesting a home visit'
            })
        return data
    
    def validate_issue_type(self, value):
        if value not in ['hardware', 'software']:
            raise serializers.ValidationError("Issue type must be 'hardware' or 'software'")
        return value


class AssignTicketSerializer(serializers.Serializer):
    """
    Serializer for assigning ticket to technician (Admin only)
    """
    technician_id = serializers.IntegerField(required=True)
    estimated_cost = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    priority = serializers.ChoiceField(choices=['low', 'medium', 'high', 'urgent'], required=False)
    admin_notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_technician_id(self, value):
        from accounts.models import User
        try:
            technician = User.objects.get(id=value, user_type__in=['technician', 'admin'])
            if technician.user_type == 'technician':
                # Check if technician is approved
                if hasattr(technician, 'technician_profile') and not technician.technician_profile.is_approved:
                    raise serializers.ValidationError("This technician is not approved yet")
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid technician ID or user is not a technician")
        return value


class UpdateTicketStatusSerializer(serializers.Serializer):
    """
    Serializer for updating ticket status
    """
    status = serializers.ChoiceField(
        choices=['pending', 'assigned', 'in_progress', 'waiting_payment', 'resolved', 'cancelled'],
        required=True
    )
    update_note = serializers.CharField(required=False, allow_blank=True)
    final_cost = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    technician_notes = serializers.CharField(required=False, allow_blank=True)


class AddTicketUpdateSerializer(serializers.Serializer):
    """
    Serializer for adding updates/comments to tickets
    """
    update_text = serializers.CharField(required=True, allow_blank=False)
    
    def validate_update_text(self, value):
        if len(value.strip()) == 0:
            raise serializers.ValidationError("Update text cannot be empty")
        return value.strip()


class UpdateTicketDetailsSerializer(serializers.Serializer):
    """
    Serializer for updating ticket details (Admin/Technician only)
    """
    title = serializers.CharField(max_length=200, required=False)
    estimated_cost = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    priority = serializers.ChoiceField(
        choices=['low', 'medium', 'high', 'urgent'], 
        required=False
    )
    admin_notes = serializers.CharField(required=False, allow_blank=True)