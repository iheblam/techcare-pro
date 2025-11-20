from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import (
    UserRegistrationSerializer, 
    UserSerializer, 
    ChangePasswordSerializer,
    TechnicianProfileSerializer,
    TechnicianApplicationSerializer
)
from .models import TechnicianProfile, TechnicianApplication
from config.email_service import EmailService  # Add this import

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    API endpoint for client registration
    POST /api/auth/register/
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Send welcome email
        EmailService.send_welcome_email(user)  # Add this line
        
        # Generate tokens for auto-login after registration
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'message': 'Registration successful. Welcome email sent!',
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """
    API endpoint for login (uses JWT)
    POST /api/auth/login/
    Body: {"email": "...", "password": "..."}
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response({
                'error': 'Please provide both email and password'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        if not user.check_password(password):
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        if not user.is_active:
            return Response({
                'error': 'Account is disabled'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    API endpoint for logout
    POST /api/auth/logout/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({
                'message': 'Logout successful'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': 'Invalid token'
            }, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    API endpoint to get/update user profile
    GET/PUT/PATCH /api/auth/profile/
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """
    API endpoint to change password
    POST /api/auth/change-password/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        
        if serializer.is_valid():
            user = request.user
            
            # Check old password
            if not user.check_password(serializer.validated_data['old_password']):
                return Response({
                    'error': 'Old password is incorrect'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Set new password
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            return Response({
                'message': 'Password changed successfully'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TechnicianApplicationView(generics.CreateAPIView):
    """
    API endpoint for technician application
    POST /api/auth/technician/apply/
    """
    serializer_class = TechnicianProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        # Check if user already has a technician profile
        if hasattr(request.user, 'technician_profile'):
            return Response({
                'error': 'You already have a technician application'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Add user_id to request data
        data = request.data.copy()
        data['user_id'] = request.user.id
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            'message': 'Technician application submitted. Waiting for admin approval.',
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)


class SubmitTechnicianApplicationView(APIView):
    """
    Submit application to become a technician
    POST /api/auth/technician-application/submit/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        from .serializers import CreateTechnicianApplicationSerializer
        from .models import TechnicianApplication
        
        # Check if user is already a technician
        if request.user.user_type == 'technician':
            return Response({
                'error': 'You are already a technician'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user already has a pending or approved application
        existing_app = TechnicianApplication.objects.filter(
            user=request.user,
            status__in=['pending', 'approved']
        ).first()
        
        if existing_app:
            return Response({
                'error': f'You already have a {existing_app.status} application',
                'application': TechnicianApplicationSerializer(existing_app).data
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user has applied in the last 30 days
        from datetime import timedelta
        from django.utils import timezone
        
        recent_app = TechnicianApplication.objects.filter(
            user=request.user,
            created_at__gte=timezone.now() - timedelta(days=30)
        ).order_by('-created_at').first()
        
        if recent_app:
            days_remaining = 30 - (timezone.now() - recent_app.created_at).days
            return Response({
                'error': f'You can reapply {days_remaining} days after your last application',
                'days_remaining': days_remaining,
                'last_application_date': recent_app.created_at,
                'can_reapply_date': recent_app.created_at + timedelta(days=30)
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = CreateTechnicianApplicationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create the application
        application = TechnicianApplication.objects.create(
            user=request.user,
            **serializer.validated_data
        )
        
        # Send notification email to admins
        admin_users = User.objects.filter(user_type='admin')
        for admin in admin_users:
            EmailService.send_technician_application_notification(admin, application)
        
        return Response({
            'message': 'Application submitted successfully! You will be notified once reviewed.',
            'application': TechnicianApplicationSerializer(application).data
        }, status=status.HTTP_201_CREATED)


class MyTechnicianApplicationView(APIView):
    """
    Get current user's technician application status
    GET /api/auth/technician-application/my-application/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from .serializers import TechnicianApplicationSerializer
        from .models import TechnicianApplication
        
        application = TechnicianApplication.objects.filter(
            user=request.user
        ).order_by('-created_at').first()
        
        if not application:
            return Response({
                'message': 'No application found',
                'has_application': False
            }, status=status.HTTP_200_OK)
        
        return Response({
            'has_application': True,
            'application': TechnicianApplicationSerializer(application).data
        }, status=status.HTTP_200_OK)


class AdminTechnicianApplicationsView(APIView):
    """
    Admin view to list all technician applications
    GET /api/auth/admin/technician-applications/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from .serializers import TechnicianApplicationSerializer
        from .models import TechnicianApplication
        
        if request.user.user_type != 'admin':
            return Response({
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        status_filter = request.query_params.get('status', None)
        
        applications = TechnicianApplication.objects.all()
        
        if status_filter:
            applications = applications.filter(status=status_filter)
        
        applications = applications.select_related('user', 'reviewed_by').order_by('-created_at')
        
        serializer = TechnicianApplicationSerializer(applications, many=True)
        
        # Get statistics
        stats = {
            'total': TechnicianApplication.objects.count(),
            'pending': TechnicianApplication.objects.filter(status='pending').count(),
            'approved': TechnicianApplication.objects.filter(status='approved').count(),
            'rejected': TechnicianApplication.objects.filter(status='rejected').count(),
        }
        
        return Response({
            'applications': serializer.data,
            'stats': stats
        }, status=status.HTTP_200_OK)


class ReviewTechnicianApplicationView(APIView):
    """
    Admin view to approve/reject technician applications
    POST /api/auth/admin/technician-applications/<id>/review/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, application_id):
        from .serializers import ReviewApplicationSerializer, TechnicianApplicationSerializer
        from .models import TechnicianApplication, TechnicianProfile
        from django.utils import timezone
        
        if request.user.user_type != 'admin':
            return Response({
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            application = TechnicianApplication.objects.select_related('user').get(id=application_id)
        except TechnicianApplication.DoesNotExist:
            return Response({
                'error': 'Application not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        if application.status != 'pending':
            return Response({
                'error': f'Application already {application.status}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = ReviewApplicationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        new_status = serializer.validated_data['status']
        admin_notes = serializer.validated_data.get('admin_notes', '')
        
        # Update application
        application.status = new_status
        application.admin_notes = admin_notes
        application.reviewed_by = request.user
        application.reviewed_at = timezone.now()
        application.save()
        
        # If approved, create technician profile and upgrade user
        if new_status == 'approved':
            # Change user type to technician
            application.user.user_type = 'technician'
            application.user.save()
            
            # Create technician profile
            TechnicianProfile.objects.create(
                user=application.user,
                specialization=application.specialization,
                years_experience=application.years_experience,
                bio=application.bio,
                hourly_rate=application.hourly_rate,
                is_approved=True
            )
            
            # Send approval email
            EmailService.send_technician_approval_email(application.user, application)
        else:
            # Send rejection email
            EmailService.send_technician_rejection_email(application.user, application)
        
        return Response({
            'message': f'Application {new_status} successfully',
            'application': TechnicianApplicationSerializer(application).data
        }, status=status.HTTP_200_OK)