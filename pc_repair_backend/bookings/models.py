from django.db import models
from django.utils import timezone
from accounts.models import User

class SupportTicket(models.Model):
    """
    Support tickets for human technician assistance
    """
    STATUS_CHOICES = (
        ('pending', 'Pending Admin Review'),
        ('assigned', 'Assigned to Technician'),
        ('in_progress', 'In Progress'),
        ('waiting_payment', 'Waiting for Payment'),
        ('resolved', 'Resolved'),
        ('cancelled', 'Cancelled'),
    )
    
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    )
    
    # Relationships
    client = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='client_tickets'
    )
    assigned_technician = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='technician_tickets',
        limit_choices_to={'user_type__in': ['technician', 'admin']}
    )
    chat_session = models.ForeignKey(
        'chat.ChatSession',  # String reference - FIXED
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        help_text="Link to AI chat that led to this ticket"
    )
    
    # Ticket Information
    ticket_number = models.CharField(max_length=20, unique=True, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField()
    issue_type = models.CharField(max_length=20)
    
    # Status & Priority
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    
    # Visit Information
    requires_visit = models.BooleanField(default=False)
    visit_address = models.TextField(blank=True)
    scheduled_visit_date = models.DateTimeField(null=True, blank=True)
    
    # Financial
    estimated_cost = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True
    )
    final_cost = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True
    )
    is_paid = models.BooleanField(default=False)
    payment_date = models.DateTimeField(null=True, blank=True)
    
    # Notes
    admin_notes = models.TextField(blank=True)
    technician_notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    assigned_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        if not self.ticket_number:
            # Generate unique ticket number
            from datetime import datetime
            date_str = datetime.now().strftime('%Y%m%d')
            last_ticket = SupportTicket.objects.filter(
                ticket_number__startswith=f'TKT-{date_str}'
            ).order_by('-ticket_number').first()
            
            if last_ticket:
                last_num = int(last_ticket.ticket_number.split('-')[-1])
                new_num = last_num + 1
            else:
                new_num = 1
            
            self.ticket_number = f'TKT-{date_str}-{new_num:05d}'
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.ticket_number} - {self.title}"
    
    def assign_to_technician(self, technician):
        self.assigned_technician = technician
        self.status = 'assigned'
        self.assigned_at = timezone.now()
        self.save()
    
    def mark_resolved(self):
        self.status = 'resolved'
        self.resolved_at = timezone.now()
        self.save()


class TicketAttachment(models.Model):
    """
    File attachments for tickets
    """
    ticket = models.ForeignKey(
        SupportTicket, 
        on_delete=models.CASCADE, 
        related_name='attachments'
    )
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    file = models.FileField(upload_to='ticket_files/')
    description = models.CharField(max_length=200, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Attachment for {self.ticket.ticket_number}"


class TicketUpdate(models.Model):
    """
    Activity log for tickets
    """
    ticket = models.ForeignKey(
        SupportTicket, 
        on_delete=models.CASCADE, 
        related_name='updates'
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    update_text = models.TextField()
    status_changed_to = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Update for {self.ticket.ticket_number} by {self.user.username}"