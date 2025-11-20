from django.urls import path
from .views import (
    CreateTicketView,
    MyTicketsView,
    TicketDetailView,
    # Admin
    AdminPendingTicketsView,
    AdminAllTicketsView,
    AssignTicketView,
    DeleteTicketView,
    UpdateTicketDetailsView,
    CreateIssueFromTicketView,
    # Technician
    TechnicianAssignedTicketsView,
    UpdateTicketStatusView,
    AddTicketUpdateView,
    UploadTicketAttachmentView
)
from .admin_views import AdminDashboardStatsView  # Add this

app_name = 'bookings'

urlpatterns = [
    # Client endpoints
    path('create/', CreateTicketView.as_view(), name='create-ticket'),
    path('my-tickets/', MyTicketsView.as_view(), name='my-tickets'),
    path('<int:pk>/', TicketDetailView.as_view(), name='ticket-detail'),
    
    # Admin endpoints
    path('admin/pending/', AdminPendingTicketsView.as_view(), name='admin-pending'),
    path('admin/all/', AdminAllTicketsView.as_view(), name='admin-all'),
    path('admin/dashboard-stats/', AdminDashboardStatsView.as_view(), name='admin-dashboard'),  # Add this
    path('<int:ticket_id>/assign/', AssignTicketView.as_view(), name='assign-ticket'),
    
    # Technician endpoints
    path('technician/assigned/', TechnicianAssignedTicketsView.as_view(), name='technician-assigned'),
    path('<int:ticket_id>/update-status/', UpdateTicketStatusView.as_view(), name='update-status'),
    path('<int:ticket_id>/update-details/', UpdateTicketDetailsView.as_view(), name='update-details'),
    
    # Shared (Client/Technician/Admin)
    path('<int:ticket_id>/add-update/', AddTicketUpdateView.as_view(), name='add-update'),
    path('<int:ticket_id>/upload/', UploadTicketAttachmentView.as_view(), name='upload-attachment'),
    path('<int:ticket_id>/delete/', DeleteTicketView.as_view(), name='delete-ticket'),
    path('<int:ticket_id>/create-issue/', CreateIssueFromTicketView.as_view(), name='create-issue-from-ticket'),
]