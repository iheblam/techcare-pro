from rest_framework import serializers
from .models import IssueCategory, ResolvedIssue
from accounts.serializers import UserSerializer


class IssueCategorySerializer(serializers.ModelSerializer):
    """
    Serializer for issue categories (Hardware/Software)
    """
    issues_count = serializers.SerializerMethodField()
    
    class Meta:
        model = IssueCategory
        fields = [
            'id',
            'name',
            'category_type',
            'description',
            'icon',
            'is_active',
            'issues_count'
        ]
    
    def get_issues_count(self, obj):
        return obj.resolved_issues.count()


class ResolvedIssueListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing resolved issues (brief view)
    """
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_type = serializers.CharField(source='category.category_type', read_only=True)
    resolved_by_display = serializers.CharField(source='get_resolved_by_display', read_only=True)
    
    class Meta:
        model = ResolvedIssue
        fields = [
            'id',
            'title',
            'description',
            'category',
            'category_name',
            'category_type',
            'resolved_by',
            'resolved_by_display',
            'tags',
            'views',
            'helpful_count',
            'created_at'
        ]


class ResolvedIssueDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for detailed resolved issue view
    """
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_type = serializers.CharField(source='category.category_type', read_only=True)
    resolved_by_display = serializers.CharField(source='get_resolved_by_display', read_only=True)
    technician_info = UserSerializer(source='technician', read_only=True)
    tags_list = serializers.SerializerMethodField()
    
    class Meta:
        model = ResolvedIssue
        fields = [
            'id',
            'title',
            'description',
            'category',
            'category_name',
            'category_type',
            'solution',
            'resolved_by',
            'resolved_by_display',
            'technician',
            'technician_info',
            'tags',
            'tags_list',
            'views',
            'helpful_count',
            'created_at',
            'updated_at'
        ]
    
    def get_tags_list(self, obj):
        """Convert comma-separated tags to list"""
        if obj.tags:
            return [tag.strip() for tag in obj.tags.split(',')]
        return []


class ResolvedIssueCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new resolved issues (admin/technician only)
    """
    class Meta:
        model = ResolvedIssue
        fields = [
            'title',
            'description',
            'category',
            'solution',
            'resolved_by',
            'technician',
            'tags'
        ]
    
    def validate(self, data):
        """Ensure technician is provided if resolved_by is 'technician'"""
        if data.get('resolved_by') == 'technician' and not data.get('technician'):
            raise serializers.ValidationError({
                'technician': 'Technician is required when resolved_by is set to technician'
            })
        return data