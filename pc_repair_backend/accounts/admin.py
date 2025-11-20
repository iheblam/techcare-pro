from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, TechnicianProfile, TechnicianApplication

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'user_type', 'is_staff', 'created_at']
    list_filter = ['user_type', 'is_staff', 'is_active']
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('user_type', 'phone', 'profile_picture')}),
    )

@admin.register(TechnicianProfile)
class TechnicianProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'specialization', 'is_approved', 'hourly_rate']
    list_filter = ['is_approved', 'specialization']
    search_fields = ['user__username', 'user__email']


@admin.register(TechnicianApplication)
class TechnicianApplicationAdmin(admin.ModelAdmin):
    list_display = ['user', 'specialization', 'status', 'years_experience', 'hourly_rate', 'created_at']
    list_filter = ['status', 'specialization', 'created_at']
    search_fields = ['user__username', 'user__email', 'bio']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Applicant Information', {
            'fields': ('user', 'specialization', 'years_experience', 'hourly_rate')
        }),
        ('Application Details', {
            'fields': ('bio', 'certifications', 'portfolio_url')
        }),
        ('Review Status', {
            'fields': ('status', 'admin_notes', 'reviewed_by', 'reviewed_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )