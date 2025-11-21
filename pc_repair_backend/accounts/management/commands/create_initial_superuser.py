from django.core.management.base import BaseCommand
from accounts.models import User


class Command(BaseCommand):
    help = 'Create initial superuser if it does not exist'

    def handle(self, *args, **options):
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                email='admin@techcare.com',
                password='Admin@123456',
                first_name='Admin',
                last_name='User',
                user_type='admin'
            )
            self.stdout.write(self.style.SUCCESS('Superuser "admin" created successfully!'))
            self.stdout.write(self.style.WARNING('Username: admin'))
            self.stdout.write(self.style.WARNING('Password: Admin@123456'))
            self.stdout.write(self.style.WARNING('CHANGE THIS PASSWORD IMMEDIATELY!'))
        else:
            self.stdout.write(self.style.SUCCESS('Superuser already exists'))
