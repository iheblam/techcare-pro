from django.contrib import admin
from .models import SupportTicket, TicketAttachment, TicketUpdate


# ====== INLINE FOR ATTACHMENTS ======
class TicketAttachmentInline(admin.TabularInline):  # or StackedInline
    model = TicketAttachment
    extra = 1  # Show 1 empty form
    fields = ['file', 'description', 'uploaded_by']
    readonly_fields = ['uploaded_at']


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ['ticket_number', 'client', 'status', 'priority', 'created_at']
    list_filter = ['status', 'priority', 'requires_visit', 'is_paid']
    search_fields = ['ticket_number', 'title', 'client__username']
    readonly_fields = ['ticket_number', 'created_at', 'assigned_at', 'resolved_at']

    # ADD THIS LINE
    inlines = [TicketAttachmentInline]

    fieldsets = (
        (None, {
            'fields': ('ticket_number', 'client', 'assigned_technician', 'title', 'issue_type')
        }),
        ('Details', {
            'fields': ('description', 'status', 'priority', 'requires_visit', 'visit_address', 'scheduled_visit_date')
        }),
        ('Financial', {
            'fields': ('estimated_cost', 'final_cost', 'is_paid', 'payment_date')
        }),
        ('Notes', {
            'fields': ('admin_notes', 'technician_notes'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'assigned_at', 'resolved_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(TicketAttachment)
class TicketAttachmentAdmin(admin.ModelAdmin):
    list_display = ['ticket', 'uploaded_by', 'file', 'uploaded_at']
    list_filter = ['uploaded_at']
    search_fields = ['ticket__ticket_number', 'description']


@admin.register(TicketUpdate)
class TicketUpdateAdmin(admin.ModelAdmin):
    list_display = ['ticket', 'user', 'update_text', 'created_at']
    search_fields = ['ticket__ticket_number', 'update_text']