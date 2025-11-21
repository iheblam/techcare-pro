from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .serializers import UserSerializer

User = get_user_model()


class AdminUsersListView(generics.ListAPIView):
    """
    List all users (Admin only)
    GET /api/admin/users/
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Only admin can access
        if self.request.user.user_type != 'admin':
            return User.objects.none()
        
        # Get filter parameters
        user_type = self.request.query_params.get('user_type')
        search = self.request.query_params.get('search')
        
        queryset = User.objects.all().order_by('-created_at')
        
        if user_type:
            queryset = queryset.filter(user_type=user_type)
        
        if search:
            queryset = queryset.filter(
                username__icontains=search
            ) | queryset.filter(
                email__icontains=search
            ) | queryset.filter(
                first_name__icontains=search
            ) | queryset.filter(
                last_name__icontains=search
            )
        
        return queryset
    
    def get_serializer_context(self):
        return {'request': self.request}


class AdminUserDetailView(APIView):
    """
    Get, update or delete a user (Admin only)
    GET/PUT/DELETE /api/admin/users/<id>/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id):
        if request.user.user_type != 'admin':
            return Response({'error': 'Admin access required'}, status=403)
        
        try:
            user = User.objects.get(id=user_id)
            serializer = UserSerializer(user, context={'request': request})
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
    
    def delete(self, request, user_id):
        if request.user.user_type != 'admin':
            return Response({'error': 'Admin access required'}, status=403)
        
        # Prevent admin from deleting themselves
        if request.user.id == user_id:
            return Response({'error': 'Cannot delete your own account'}, status=400)
        
        try:
            user = User.objects.get(id=user_id)
            username = user.username
            user.delete()
            return Response({
                'message': f'User {username} deleted successfully'
            }, status=200)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)


class AdminUserStatsView(APIView):
    """
    Get user statistics (Admin only)
    GET /api/admin/users/stats/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if request.user.user_type != 'admin':
            return Response({'error': 'Admin access required'}, status=403)
        
        total_users = User.objects.count()
        clients = User.objects.filter(user_type='client').count()
        technicians = User.objects.filter(user_type='technician').count()
        admins = User.objects.filter(user_type='admin').count()
        
        return Response({
            'total': total_users,
            'clients': clients,
            'technicians': technicians,
            'admins': admins
        })
