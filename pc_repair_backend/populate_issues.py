import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from issues.models import IssueCategory, ResolvedIssue

# Create sample categories if they don't exist
categories_data = [
    {'name': 'Boot Issues', 'category_type': 'hardware', 'description': 'Computer won\'t start or boot problems'},
    {'name': 'Display Problems', 'category_type': 'hardware', 'description': 'Screen, monitor, or graphics issues'},
    {'name': 'Blue Screen (BSOD)', 'category_type': 'software', 'description': 'Blue screen of death errors'},
    {'name': 'Slow Performance', 'category_type': 'both', 'description': 'Computer running slow'},
    {'name': 'Network Issues', 'category_type': 'software', 'description': 'WiFi, internet connection problems'},
]

print("Creating categories...")
for cat_data in categories_data:
    category, created = IssueCategory.objects.get_or_create(
        name=cat_data['name'],
        defaults={
            'category_type': cat_data['category_type'],
            'description': cat_data['description'],
            'is_active': True
        }
    )
    print(f"{'Created' if created else 'Already exists'}: {category.name}")

# Create sample resolved issues
boot_cat = IssueCategory.objects.get(name='Boot Issues')
display_cat = IssueCategory.objects.get(name='Display Problems')
bsod_cat = IssueCategory.objects.get(name='Blue Screen (BSOD)')
slow_cat = IssueCategory.objects.get(name='Slow Performance')
network_cat = IssueCategory.objects.get(name='Network Issues')

issues_data = [
    {
        'title': 'Computer Won\'t Turn On - No Power',
        'description': 'Desktop computer shows no signs of life when power button is pressed. No fans spinning, no lights, completely dead.',
        'category': boot_cat,
        'solution': '''1. Check power cable is firmly connected to both PC and wall outlet
2. Try a different power outlet to rule out outlet issues
3. Check if power supply switch (on back of PC) is in ON position
4. Test with a different power cable if available
5. If still no power, the power supply unit (PSU) may be faulty and need replacement
6. Check if motherboard has any indicator lights - if no lights at all, PSU is likely the issue''',
        'resolved_by': 'ai',
        'tags': 'power, boot, dead, PSU, won\'t start',
        'helpful_count': 45,
        'views': 230,
    },
    {
        'title': 'Black Screen After Windows Logo',
        'description': 'Computer starts normally, shows manufacturer logo and Windows loading screen, but then goes to black screen with cursor visible.',
        'category': boot_cat,
        'solution': '''1. Boot into Safe Mode by pressing F8 during startup
2. Once in Safe Mode, open Device Manager
3. Uninstall display adapter drivers
4. Restart computer normally
5. Windows will reinstall basic drivers automatically
6. Download latest drivers from manufacturer website
7. If problem persists, check for Windows updates
8. Run System File Checker: open CMD as admin and run "sfc /scannow"''',
        'resolved_by': 'technician',
        'tags': 'black screen, boot, display, graphics driver',
        'helpful_count': 67,
        'views': 445,
    },
    {
        'title': 'BSOD: SYSTEM_SERVICE_EXCEPTION',
        'description': 'Getting blue screen with error code SYSTEM_SERVICE_EXCEPTION, usually happens randomly or when playing games.',
        'category': bsod_cat,
        'solution': '''1. Update all device drivers, especially graphics and chipset drivers
2. Run Windows Memory Diagnostic tool to check RAM
3. Check for Windows updates
4. Disable any recently installed programs or drivers
5. Run CHKDSK: open CMD as admin and run "chkdsk /f /r"
6. Update BIOS to latest version from manufacturer
7. If error mentions a specific .sys file, search online for that file to identify problematic driver
8. As last resort, perform clean Windows installation''',
        'resolved_by': 'ai',
        'tags': 'BSOD, blue screen, crash, SYSTEM_SERVICE_EXCEPTION',
        'helpful_count': 89,
        'views': 567,
    },
    {
        'title': 'Computer Running Very Slow After Windows Update',
        'description': 'PC has become extremely slow after recent Windows update. Takes forever to open programs and boot time increased significantly.',
        'category': slow_cat,
        'solution': '''1. Open Task Manager (Ctrl+Shift+Esc) and check what's using resources
2. Disable unnecessary startup programs in Task Manager > Startup tab
3. Check Windows Update settings and pause updates if needed
4. Run Disk Cleanup to free up space
5. Disable Windows Search indexing temporarily
6. Check if Windows is installing updates in background
7. Roll back the problematic update: Settings > Update & Security > View update history > Uninstall updates
8. Perform disk defragmentation (for HDDs only, not SSDs)
9. Consider upgrading to SSD if using HDD''',
        'resolved_by': 'technician',
        'tags': 'slow, performance, Windows update, lag',
        'helpful_count': 123,
        'views': 789,
    },
    {
        'title': 'WiFi Connected But No Internet Access',
        'description': 'WiFi shows connected with strong signal but websites won\'t load. Other devices on same network work fine.',
        'category': network_cat,
        'solution': '''1. Run Windows Network Troubleshooter
2. Restart router and modem
3. Forget WiFi network and reconnect
4. Update network adapter drivers
5. Reset TCP/IP: open CMD as admin and run these commands:
   - netsh winsock reset
   - netsh int ip reset
   - ipconfig /release
   - ipconfig /renew
   - ipconfig /flushdns
6. Disable IPv6 in network adapter settings
7. Change DNS servers to Google DNS (8.8.8.8 and 8.8.4.4)
8. Restart computer after making changes''',
        'resolved_by': 'ai',
        'tags': 'WiFi, internet, network, no internet, connected',
        'helpful_count': 156,
        'views': 891,
    },
    {
        'title': 'No Display Signal - Monitor Says No Signal',
        'description': 'Monitor powers on but shows "No Signal" message. Computer seems to be running (fans spinning, lights on).',
        'category': display_cat,
        'solution': '''1. Check monitor power cable and video cable connections
2. Try different video cable (HDMI, DisplayPort, DVI)
3. Test monitor with another device to ensure monitor works
4. If using dedicated graphics card, try connecting to motherboard video output
5. Reseat RAM modules - remove and firmly reinstall them
6. Remove and reseat graphics card
7. Clear CMOS battery for 30 seconds to reset BIOS
8. Check if graphics card fans are spinning
9. Try booting with only one RAM stick installed
10. If integrated graphics work but dedicated GPU doesn't, GPU may be faulty''',
        'resolved_by': 'technician',
        'tags': 'no signal, display, monitor, black screen, video',
        'helpful_count': 201,
        'views': 1234,
    },
]

print("\nCreating resolved issues...")
for issue_data in issues_data:
    issue, created = ResolvedIssue.objects.get_or_create(
        title=issue_data['title'],
        defaults=issue_data
    )
    print(f"{'Created' if created else 'Already exists'}: {issue.title}")

print(f"\nDone! Total categories: {IssueCategory.objects.count()}")
print(f"Total resolved issues: {ResolvedIssue.objects.count()}")
