from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import TechnicianProfile, TechnicianApplication

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for client registration
    """
    password = serializers.CharField(
        write_only=True, 
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True, 
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = [
            'username', 
            'email', 
            'password', 
            'password_confirm', 
            'first_name', 
            'last_name', 
            'phone'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match."
            })
        return attrs
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone=validated_data.get('phone', ''),
            user_type='client'  # Default to client
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile
    """
    full_name = serializers.SerializerMethodField()
    profile_picture = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 
            'username', 
            'email', 
            'first_name', 
            'last_name',
            'full_name',
            'phone', 
            'user_type', 
            'profile_picture',
            'created_at'
        ]
        read_only_fields = ['id', 'username', 'user_type', 'created_at']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()
    
    def get_profile_picture(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None


class TechnicianProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for technician profile
    """
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = TechnicianProfile
        fields = [
            'id',
            'user',
            'user_id',
            'specialization',
            'is_approved',
            'hourly_rate',
            'bio',
            'years_experience',
            'created_at'
        ]
        read_only_fields = ['id', 'is_approved', 'created_at']


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for password change
    """
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(
        required=True, 
        write_only=True,
        validators=[validate_password]
    )
    new_password_confirm = serializers.CharField(required=True, write_only=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                "new_password": "Password fields didn't match."
            })
        return attrs


class TechnicianApplicationSerializer(serializers.ModelSerializer):
    """
    Serializer for creating technician applications
    """
    user_info = UserSerializer(source='user', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    specialization_display = serializers.CharField(source='get_specialization_display', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = TechnicianApplication
        fields = [
            'id',
            'user',
            'user_info',
            'specialization',
            'specialization_display',
            'years_experience',
            'bio',
            'certifications',
            'portfolio_url',
            'hourly_rate',
            'status',
            'status_display',
            'admin_notes',
            'reviewed_by',
            'reviewed_by_name',
            'reviewed_at',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['user', 'status', 'admin_notes', 'reviewed_by', 'reviewed_at']


class CreateTechnicianApplicationSerializer(serializers.Serializer):
    """
    Serializer for creating a new technician application
    """
    specialization = serializers.ChoiceField(
        choices=[('hardware', 'Hardware'), ('software', 'Software'), ('both', 'Both')]
    )
    years_experience = serializers.IntegerField(min_value=0, max_value=50)
    bio = serializers.CharField(min_length=50, max_length=1000)
    certifications = serializers.CharField(required=False, allow_blank=True, max_length=500)
    portfolio_url = serializers.URLField(required=False, allow_blank=True)
    hourly_rate = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=10, max_value=500)
    
    def validate_bio(self, value):
        if len(value.strip()) < 50:
            raise serializers.ValidationError("Bio must be at least 50 characters long.")
        return value.strip()


class ReviewApplicationSerializer(serializers.Serializer):
    """
    Serializer for admin to review applications
    """
    status = serializers.ChoiceField(choices=['approved', 'rejected'])
    admin_notes = serializers.CharField(required=False, allow_blank=True)