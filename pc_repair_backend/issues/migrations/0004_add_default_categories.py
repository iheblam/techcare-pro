# Generated migration to add default issue categories

from django.db import migrations


def create_default_categories(apps, schema_editor):
    IssueCategory = apps.get_model('issues', 'IssueCategory')
    
    categories = [
        {'name': 'Software Issues', 'category_type': 'software', 'description': 'Operating system problems, software errors, updates'},
        {'name': 'Hardware Issues', 'category_type': 'hardware', 'description': 'Physical component failures, hardware malfunctions'},
        {'name': 'Network & Connectivity', 'category_type': 'both', 'description': 'Internet connection problems, network configuration'},
        {'name': 'Performance', 'category_type': 'both', 'description': 'Slow performance, freezing, lag issues'},
        {'name': 'Security & Virus', 'category_type': 'software', 'description': 'Malware, viruses, security threats'},
        {'name': 'Data Recovery', 'category_type': 'both', 'description': 'Lost files, data backup and recovery'},
    ]
    
    for cat in categories:
        IssueCategory.objects.get_or_create(
            name=cat['name'],
            defaults={
                'category_type': cat['category_type'],
                'description': cat['description'],
                'is_active': True
            }
        )


def reverse_categories(apps, schema_editor):
    IssueCategory = apps.get_model('issues', 'IssueCategory')
    IssueCategory.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('issues', '0003_resolvedissue_related_ticket'),
    ]

    operations = [
        migrations.RunPython(create_default_categories, reverse_categories),
    ]
