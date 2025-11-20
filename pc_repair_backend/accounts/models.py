from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """
    Custom User model with role-based access
    """
    USER_TYPES = (
        ('client', 'Client'),
        ('technician', 'Technician'),
        ('admin', 'Admin'),
    )
    
    user_type = models.CharField(
        max_length=20, 
        choices=USER_TYPES, 
        default='client'
    )
    phone = models.CharField(max_length=20, blank=True)
    profile_picture = models.ImageField(
        upload_to='profiles/', 
        null=True, 
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.username} ({self.get_user_type_display()})"
    
    @property
    def is_client(self):
        return self.user_type == 'client'
    
    @property
    def is_technician(self):
        return self.user_type == 'technician'
    
    @property
    def is_admin_user(self):
        return self.user_type == 'admin'


class TechnicianProfile(models.Model):
    """
    Extended profile for technicians
    """
    SPECIALIZATION_CHOICES = (
        ('hardware', 'Hardware Specialist'),
        ('software', 'Software Specialist'),
        ('both', 'Hardware & Software'),
    )
    
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='technician_profile'
    )
    specialization = models.CharField(
        max_length=20, 
        choices=SPECIALIZATION_CHOICES
    )
    is_approved = models.BooleanField(default=False)
    hourly_rate = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Hourly rate in your currency"
    )
    bio = models.TextField(blank=True)
    years_experience = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.get_specialization_display()}"
    
    class Meta:
        verbose_name = "Technician Profile"
        verbose_name_plural = "Technician Profiles"


class TechnicianApplication(models.Model):
    """
    Model for technician applications - users apply to become technicians
    """
    STATUS_CHOICES = (
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    
    SPECIALIZATION_CHOICES = (
        ('hardware', 'Hardware Specialist'),
        ('software', 'Software Specialist'),
        ('both', 'Hardware & Software'),
    )
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='technician_applications'
    )
    specialization = models.CharField(
        max_length=20,
        choices=SPECIALIZATION_CHOICES
    )
    years_experience = models.IntegerField(
        help_text="Years of experience in PC repair"
    )
    bio = models.TextField(
        help_text="Tell us about your experience and expertise"
    )
    certifications = models.TextField(
        blank=True,
        help_text="List any relevant certifications (optional)"
    )
    portfolio_url = models.URLField(
        blank=True,
        help_text="Link to your portfolio or LinkedIn (optional)"
    )
    hourly_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Desired hourly rate in USD"
    )
    
    # Application status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    admin_notes = models.TextField(
        blank=True,
        help_text="Internal notes from admin (reason for rejection, etc.)"
    )
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_applications'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.get_status_display()}"
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Technician Application"
        verbose_name_plural = "Technician Applications"