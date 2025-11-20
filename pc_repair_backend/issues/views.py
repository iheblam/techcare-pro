from rest_framework import generics, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from django.db.models import Q, F
from .models import IssueCategory, ResolvedIssue
from .serializers import (
    IssueCategorySerializer,
    ResolvedIssueListSerializer,
    ResolvedIssueDetailSerializer,
    ResolvedIssueCreateSerializer
)


class IssueCategoryListView(generics.ListAPIView):
    """
    API endpoint to list all issue categories
    GET /api/issues/categories/
    """
    queryset = IssueCategory.objects.filter(is_active=True)
    serializer_class = IssueCategorySerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by type if provided
        category_type = self.request.query_params.get('type', None)
        if category_type in ['hardware', 'software']:
            queryset = queryset.filter(category_type=category_type)
        
        return queryset


class ResolvedIssueListView(generics.ListAPIView):
    """
    API endpoint to list all resolved issues with search and filters
    GET /api/issues/resolved/
    
    Query parameters:
    - search: Search in title, description, tags, solution
    - type: Filter by hardware/software
    - category: Filter by category ID
    - resolved_by: Filter by ai/technician
    - ordering: Sort by views, helpful_count, created_at (prefix with - for descending)
    """
    serializer_class = ResolvedIssueListSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'tags', 'solution']
    ordering_fields = ['created_at', 'views', 'helpful_count']
    ordering = ['-created_at']  # Default ordering
    
    def get_queryset(self):
        queryset = ResolvedIssue.objects.select_related('category', 'technician').all()
        
        # Filter by category type (hardware/software)
        category_type = self.request.query_params.get('type', None)
        if category_type:
            queryset = queryset.filter(category__category_type=category_type)
        
        # Filter by specific category ID
        category_id = self.request.query_params.get('category', None)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        # Filter by who resolved it (ai/technician)
        resolved_by = self.request.query_params.get('resolved_by', None)
        if resolved_by in ['ai', 'technician']:
            queryset = queryset.filter(resolved_by=resolved_by)
        
        # Search query
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(tags__icontains=search) |
                Q(solution__icontains=search)
            )
        
        return queryset


class ResolvedIssueDetailView(generics.RetrieveAPIView):
    """
    API endpoint to get detailed view of a resolved issue
    GET /api/issues/resolved/<id>/
    
    Automatically increments view count
    """
    queryset = ResolvedIssue.objects.select_related('category', 'technician').all()
    serializer_class = ResolvedIssueDetailSerializer
    permission_classes = [AllowAny]
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Increment view count
        ResolvedIssue.objects.filter(pk=instance.pk).update(views=F('views') + 1)
        
        # Refresh from database to get updated view count
        instance.refresh_from_db()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class MarkIssueHelpfulView(APIView):
    """
    API endpoint to mark an issue as helpful
    POST /api/issues/resolved/<id>/helpful/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        try:
            issue = ResolvedIssue.objects.get(pk=pk)
            issue.mark_helpful()
            
            return Response({
                'message': 'Marked as helpful',
                'helpful_count': issue.helpful_count
            }, status=status.HTTP_200_OK)
        
        except ResolvedIssue.DoesNotExist:
            return Response({
                'error': 'Issue not found'
            }, status=status.HTTP_404_NOT_FOUND)


class ResolvedIssueCreateView(generics.CreateAPIView):
    """
    API endpoint to create a new resolved issue (Admin/Technician only)
    POST /api/issues/resolved/create/
    """
    serializer_class = ResolvedIssueCreateSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        # Auto-assign current user as technician if they're creating it
        if self.request.user.user_type in ['technician', 'admin']:
            serializer.save(technician=self.request.user)
        else:
            serializer.save()


class SimilarIssuesView(generics.ListAPIView):
    """
    API endpoint to find similar issues based on a query
    GET /api/issues/similar/?query=my+computer+wont+start
    """
    serializer_class = ResolvedIssueListSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        query = self.request.query_params.get('query', '')
        
        if not query:
            return ResolvedIssue.objects.none()
        
        # Search for similar issues
        return ResolvedIssue.objects.filter(
            Q(title__icontains=query) |
            Q(description__icontains=query) |
            Q(tags__icontains=query)
        ).order_by('-helpful_count', '-views')[:5]  # Top 5 similar issues


class PopularIssuesView(generics.ListAPIView):
    """
    API endpoint to get most popular/viewed issues
    GET /api/issues/popular/
    """
    serializer_class = ResolvedIssueListSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        limit = int(self.request.query_params.get('limit', 10))
        return ResolvedIssue.objects.all().order_by('-views')[:limit]


class RecentIssuesView(generics.ListAPIView):
    """
    API endpoint to get recently resolved issues
    GET /api/issues/recent/
    """
    serializer_class = ResolvedIssueListSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        limit = int(self.request.query_params.get('limit', 10))
        return ResolvedIssue.objects.all().order_by('-created_at')[:limit]