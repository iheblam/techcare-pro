from django.db import models
from accounts.models import User

class IssueCategory(models.Model):
    """
    Categories for PC issues (Hardware/Software)
    """
    CATEGORY_TYPES = (
        ('hardware', 'Hardware'),
        ('software', 'Software'),
        ('both', 'Hardware & Software'),  # Add this line
    )
    
    name = models.CharField(max_length=100)
    category_type = models.CharField(max_length=20, choices=CATEGORY_TYPES)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name_plural = "Issue Categories"
        ordering = ['category_type', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.get_category_type_display()})"


class ResolvedIssue(models.Model):
    """
    Library of previously resolved issues for client reference
    """
    RESOLVED_BY_CHOICES = (
        ('ai', 'AI Assistant (Gemini)'),
        ('technician', 'Human Technician'),
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField(help_text="Detailed description of the problem")
    category = models.ForeignKey(
        IssueCategory, 
        on_delete=models.CASCADE, 
        related_name='resolved_issues'
    )
    solution = models.TextField(help_text="Step-by-step solution")
    resolved_by = models.CharField(max_length=20, choices=RESOLVED_BY_CHOICES)
    technician = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        limit_choices_to={'user_type__in': ['technician', 'admin']}
    )
    
    # SEO and Discovery
    tags = models.CharField(
        max_length=500, 
        blank=True,
        help_text="Comma-separated tags for search"
    )
    views = models.IntegerField(default=0)
    helpful_count = models.IntegerField(default=0)
    
    # Link to original ticket (if created from ticket)
    related_ticket = models.OneToOneField(
        'bookings.SupportTicket',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_issue'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Resolved Issue"
        verbose_name_plural = "Resolved Issues"
    
    def __str__(self):
        return self.title
    
    def increment_views(self):
        self.views += 1
        self.save(update_fields=['views'])
    
    def mark_helpful(self):
        self.helpful_count += 1
        self.save(update_fields=['helpful_count'])