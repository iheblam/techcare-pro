from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import PasswordResetToken
from .serializers import RequestPasswordResetSerializer, ResetPasswordSerializer
from config.email_service import EmailService

User = get_user_model()


class RequestPasswordResetView(APIView):
    """
    Request password reset - sends email with reset link
    POST /api/auth/password-reset/request/
    Body: {"email": "user@example.com"}
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = RequestPasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        user = User.objects.get(email=email)
        
        # Invalidate any existing tokens for this user
        PasswordResetToken.objects.filter(user=user, is_used=False).update(is_used=True)
        
        # Create new reset token
        reset_token = PasswordResetToken.objects.create(user=user)
        
        # Send password reset email
        try:
            EmailService.send_password_reset_email(user, reset_token)
            return Response({
                'message': 'Password reset email sent successfully. Please check your inbox.'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': 'Failed to send password reset email. Please try again later.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ResetPasswordView(APIView):
    """
    Reset password using token from email
    POST /api/auth/password-reset/confirm/
    Body: {
        "token": "abc123...",
        "new_password": "newpassword",
        "confirm_password": "newpassword"
    }
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token_str = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']
        
        try:
            reset_token = PasswordResetToken.objects.get(token=token_str)
        except PasswordResetToken.DoesNotExist:
            return Response({
                'error': 'Invalid reset token.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if token is valid (not expired, not used)
        if not reset_token.is_valid():
            return Response({
                'error': 'This reset token has expired or has already been used. Please request a new password reset.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Reset the password
        user = reset_token.user
        user.set_password(new_password)
        user.save()
        
        # Mark token as used
        reset_token.is_used = True
        reset_token.save()
        
        return Response({
            'message': 'Password reset successful. You can now login with your new password.'
        }, status=status.HTTP_200_OK)


class VerifyResetTokenView(APIView):
    """
    Verify if a reset token is valid
    GET /api/auth/password-reset/verify/?token=abc123...
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        token_str = request.query_params.get('token')
        
        if not token_str:
            return Response({
                'valid': False,
                'error': 'Token parameter is required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            reset_token = PasswordResetToken.objects.get(token=token_str)
            
            if reset_token.is_valid():
                return Response({
                    'valid': True,
                    'email': reset_token.user.email,
                    'expires_at': reset_token.expires_at
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'valid': False,
                    'error': 'Token has expired or has already been used.'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except PasswordResetToken.DoesNotExist:
            return Response({
                'valid': False,
                'error': 'Invalid token.'
            }, status=status.HTTP_400_BAD_REQUEST)
