from django.db import migrations


def update_admin_user_type(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    # Update existing admin user to have admin user_type
    User.objects.filter(username='admin').update(user_type='admin')


class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0003_create_superuser'),
    ]

    operations = [
        migrations.RunPython(update_admin_user_type, migrations.RunPython.noop),
    ]
