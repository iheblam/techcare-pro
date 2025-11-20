from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from .views import api_overview

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API Overview
    path('api/', api_overview, name='api-overview'),
    
    # API endpoints
    path('api/auth/', include('accounts.urls')),
    path('api/issues/', include('issues.urls')),
    path('api/chat/', include('chat.urls')),
    path('api/tickets/', include('bookings.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)