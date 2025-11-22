from django.urls import path
from .views import (
    IssueCategoryListView,
    ResolvedIssueListView,
    ResolvedIssueDetailView,
    MarkIssueHelpfulView,
    ResolvedIssueCreateView,
    SimilarIssuesView,
    PopularIssuesView,
    RecentIssuesView,
    AdminDeleteIssueView
)

app_name = 'issues'

urlpatterns = [
    # Categories
    path('categories/', IssueCategoryListView.as_view(), name='categories'),
    
    # Resolved Issues
    path('resolved/', ResolvedIssueListView.as_view(), name='resolved-list'),
    path('resolved/create/', ResolvedIssueCreateView.as_view(), name='resolved-create'),
    path('resolved/<int:pk>/', ResolvedIssueDetailView.as_view(), name='resolved-detail'),
    path('resolved/<int:pk>/helpful/', MarkIssueHelpfulView.as_view(), name='mark-helpful'),
    path('resolved/<int:pk>/delete/', AdminDeleteIssueView.as_view(), name='admin-delete-issue'),
    
    # Discovery
    path('similar/', SimilarIssuesView.as_view(), name='similar'),
    path('popular/', PopularIssuesView.as_view(), name='popular'),
    path('recent/', RecentIssuesView.as_view(), name='recent'),
]