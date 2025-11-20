from django.contrib import admin
from .models import IssueCategory, ResolvedIssue

@admin.register(IssueCategory)
class IssueCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'category_type', 'is_active']
    list_filter = ['category_type', 'is_active']

@admin.register(ResolvedIssue)
class ResolvedIssueAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'resolved_by', 'views', 'created_at']
    list_filter = ['resolved_by', 'category']
    search_fields = ['title', 'description', 'tags']