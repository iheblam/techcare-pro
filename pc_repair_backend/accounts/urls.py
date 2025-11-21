from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    UserProfileView,
    ChangePasswordView,
    TechnicianApplicationView,
    SubmitTechnicianApplicationView,
    MyTechnicianApplicationView,
    AdminTechnicianApplicationsView,
    ReviewTechnicianApplicationView
)
from .admin_views import (
    AdminUsersListView,
    AdminUserDetailView,
    AdminUserStatsView
)

app_name = 'accounts'

urlpatterns = [
    # Authentication
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User Profile
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    
    # Technician (old endpoint - keep for backward compatibility)
    path('technician/apply/', TechnicianApplicationView.as_view(), name='technician_apply'),
    
    # Technician Applications (new system)
    path('technician-application/submit/', SubmitTechnicianApplicationView.as_view(), name='submit_application'),
    path('technician-application/my-application/', MyTechnicianApplicationView.as_view(), name='my_application'),
    path('admin/technician-applications/', AdminTechnicianApplicationsView.as_view(), name='admin_applications'),
    path('admin/technician-applications/<int:application_id>/review/', ReviewTechnicianApplicationView.as_view(), name='review_application'),
    
    # Admin User Management
    path('admin/users/', AdminUsersListView.as_view(), name='admin_users_list'),
    path('admin/users/stats/', AdminUserStatsView.as_view(), name='admin_users_stats'),
    path('admin/users/<int:user_id>/', AdminUserDetailView.as_view(), name='admin_user_detail'),
]