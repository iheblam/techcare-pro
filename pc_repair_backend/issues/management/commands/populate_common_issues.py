from django.core.management.base import BaseCommand
from issues.models import IssueCategory, ResolvedIssue
from accounts.models import User


class Command(BaseCommand):
    help = 'Populate issue library with common PC problems'

    def handle(self, *args, **options):
        self.stdout.write('Populating issue library...')

        # Get or create categories
        hardware_cat, _ = IssueCategory.objects.get_or_create(
            name='Hardware Issues',
            defaults={'category_type': 'hardware', 'icon': '🔧'}
        )
        software_cat, _ = IssueCategory.objects.get_or_create(
            name='Software Issues',
            defaults={'category_type': 'software', 'icon': '💻'}
        )
        network_cat, _ = IssueCategory.objects.get_or_create(
            name='Network Issues',
            defaults={'category_type': 'both', 'icon': '🌐'}
        )
        performance_cat, _ = IssueCategory.objects.get_or_create(
            name='Performance Issues',
            defaults={'category_type': 'both', 'icon': '⚡'}
        )

        # Get admin user for attribution
        admin_user = User.objects.filter(user_type='admin').first()

        # Common PC Issues
        issues = [
            {
                'title': 'Computer Won\'t Turn On',
                'category': hardware_cat,
                'description': 'Computer doesn\'t respond when pressing the power button. No lights, no sounds, completely dead.',
                'solution': '''1. Check power cable connections - ensure the power cable is firmly connected to both the computer and wall outlet
2. Try a different power outlet to rule out electrical issues
3. Check if the power supply switch (on the back) is in the ON position
4. If laptop: Remove battery, hold power button for 30 seconds, reconnect power and try again
5. Check for signs of power (LED lights, fan noise) - if present, issue may be with display instead
6. Test power supply with a multimeter or try a known working power supply
7. If still not working, motherboard or power supply may need replacement''',
                'prevention_tips': 'Use a surge protector to protect against power surges. Avoid unplugging while system is running. Keep power supply well-ventilated.',
                'tags': 'power, startup, boot, hardware, power supply, dead computer',
                'resolved_by': 'technician',
            },
            {
                'title': 'Blue Screen of Death (BSOD)',
                'category': software_cat,
                'description': 'Computer crashes with a blue screen showing error messages and codes. System restarts automatically or freezes.',
                'solution': '''1. Note the error code displayed (e.g., DRIVER_IRQL_NOT_LESS_OR_EQUAL)
2. Boot into Safe Mode by pressing F8 during startup
3. Check Windows Event Viewer for crash details (eventvwr.msc)
4. Update all device drivers through Device Manager
5. Run Windows Memory Diagnostic tool to check RAM
6. Check disk health with CHKDSK: Open CMD as admin, run "chkdsk C: /f /r"
7. Uninstall recently installed software or drivers
8. Run System File Checker: "sfc /scannow" in CMD
9. Check for Windows updates
10. If recent changes caused it, use System Restore to previous point''',
                'prevention_tips': 'Keep drivers and Windows updated. Don\'t install untrusted software. Run regular disk checks. Ensure adequate cooling to prevent overheating.',
                'tags': 'bsod, blue screen, crash, windows error, system crash, driver issue',
                'resolved_by': 'technician',
            },
            {
                'title': 'Slow Computer Performance',
                'category': performance_cat,
                'description': 'Computer is running extremely slow. Programs take forever to open, frequent freezing, and overall sluggish performance.',
                'solution': '''1. Check Task Manager (Ctrl+Shift+Esc) to identify resource-hungry programs
2. Disable startup programs: Type "msconfig" → Startup tab → Disable unnecessary items
3. Run Disk Cleanup: Search "Disk Cleanup" → Select drive → Clean system files
4. Uninstall unused programs through Control Panel
5. Run antivirus scan to check for malware
6. Defragment hard drive (not needed for SSDs): Search "Defragment"
7. Add more RAM if usage is consistently high (8GB minimum recommended)
8. Consider upgrading to SSD if using traditional hard drive
9. Check for Windows updates
10. Reset Windows as last resort (backup data first)''',
                'prevention_tips': 'Regularly clean temporary files. Keep only necessary startup programs. Run antivirus scans weekly. Restart computer at least once a week.',
                'tags': 'slow, performance, lag, freeze, sluggish, optimization',
                'resolved_by': 'ai',
            },
            {
                'title': 'No Internet Connection',
                'category': network_cat,
                'description': 'Unable to connect to the internet. WiFi shows connected but no internet access, or can\'t find any networks.',
                'solution': '''1. Restart your router/modem: Unplug for 30 seconds, plug back in
2. Check if other devices can connect to confirm if issue is with PC or network
3. Run Windows Network Troubleshooter: Settings → Network → Status → Troubleshoot
4. Restart network adapter: Device Manager → Network Adapters → Right-click → Disable/Enable
5. Forget and reconnect to WiFi network
6. Update network adapter drivers through Device Manager
7. Reset network settings: CMD as admin → "netsh winsock reset" then "netsh int ip reset"
8. Check if airplane mode is off
9. Disable VPN if running
10. Reset router to factory settings if all else fails''',
                'prevention_tips': 'Keep router firmware updated. Place router in central location. Avoid physical obstructions. Regularly restart router. Use strong WiFi password.',
                'tags': 'internet, wifi, network, connection, no internet, connectivity',
                'resolved_by': 'ai',
            },
            {
                'title': 'Overheating and Loud Fan Noise',
                'category': hardware_cat,
                'description': 'Computer gets very hot, fan runs constantly at high speed making loud noise. May shutdown unexpectedly.',
                'solution': '''1. Immediately shut down if computer is too hot to touch
2. Check air vents for dust buildup - clean with compressed air
3. Ensure computer is on hard, flat surface with good airflow (not on bed/carpet)
4. Clean internal fans and heatsinks (if comfortable opening case)
5. Check Task Manager for programs causing high CPU usage
6. Reapply thermal paste on CPU if not done in 2+ years
7. Check if all fans are spinning properly
8. Consider additional cooling solutions (cooling pad for laptops, extra case fans)
9. Update BIOS to latest version
10. Check temperatures with HWMonitor or similar tool''',
                'prevention_tips': 'Clean dust every 3-6 months. Keep in well-ventilated area. Don\'t block air vents. Avoid using on soft surfaces. Monitor temperatures regularly.',
                'tags': 'overheating, hot, fan, noise, thermal, cooling, temperature',
                'resolved_by': 'technician',
            },
            {
                'title': 'Windows Update Stuck or Failing',
                'category': software_cat,
                'description': 'Windows update won\'t complete, gets stuck at a percentage, or keeps failing with error codes.',
                'solution': '''1. Wait at least 2-3 hours - some updates take very long
2. Disconnect all USB devices except keyboard and mouse
3. Restart computer and try update again
4. Run Windows Update Troubleshooter: Settings → Update & Security → Troubleshoot
5. Clear Windows Update cache: Stop Windows Update service, delete C:\\Windows\\SoftwareDistribution folder contents
6. Run DISM tool: CMD as admin → "DISM /Online /Cleanup-Image /RestoreHealth"
7. Then run SFC: "sfc /scannow"
8. Manually download update from Microsoft Update Catalog
9. Free up disk space - need at least 20GB free
10. Temporarily disable antivirus during update''',
                'prevention_tips': 'Keep at least 20GB free space. Don\'t interrupt updates. Run updates during off-hours. Enable automatic updates. Regular restarts help.',
                'tags': 'windows update, update stuck, update failed, windows 10, windows 11, patch',
                'resolved_by': 'ai',
            },
            {
                'title': 'Hard Drive Not Detected',
                'category': hardware_cat,
                'description': 'Computer can\'t find the hard drive during boot. BIOS shows no drive detected or "No bootable device" error.',
                'solution': '''1. Check if BIOS detects the drive: Press F2/Del during boot to enter BIOS
2. Power off, unplug, and reseat SATA/power cables to hard drive
3. Try different SATA port on motherboard
4. Test drive in another computer to confirm if drive is faulty
5. Check if drive spins up (listen for spinning sound)
6. Update BIOS to latest version
7. Check BIOS boot order - ensure hard drive is first
8. If external drive: Try different USB port and cable
9. For M.2/NVMe: Reseat drive in slot, check BIOS for NVMe support
10. If drive not detected anywhere, likely hardware failure - data recovery service needed''',
                'prevention_tips': 'Handle drives carefully. Keep backups of important data. Monitor drive health with CrystalDiskInfo. Replace drives showing SMART errors.',
                'tags': 'hard drive, hdd, ssd, not detected, boot failure, storage, disk',
                'resolved_by': 'technician',
            },
            {
                'title': 'Black Screen After Login',
                'category': software_cat,
                'description': 'After entering password, screen goes black with only cursor visible. No desktop icons or taskbar appear.',
                'solution': '''1. Press Ctrl+Shift+Esc to open Task Manager
2. Click File → Run new task → Type "explorer.exe" → OK
3. If that works, startup issue with Windows Explorer
4. Boot into Safe Mode: Restart → Hold Shift while clicking Restart
5. In Safe Mode, run antivirus scan
6. Update graphics drivers through Device Manager
7. Check for Windows updates
8. Run System File Checker: CMD as admin → "sfc /scannow"
9. Disable fast startup: Control Panel → Power Options → Choose what power buttons do
10. Create new user account and test
11. If all fails, use System Restore or Reset Windows''',
                'prevention_tips': 'Keep Windows and drivers updated. Use reliable antivirus. Don\'t force shutdown during updates. Regular system maintenance.',
                'tags': 'black screen, blank screen, no desktop, explorer, windows explorer, login issue',
                'resolved_by': 'technician',
            },
            {
                'title': 'USB Devices Not Working',
                'category': hardware_cat,
                'description': 'USB ports not recognizing devices. "USB device not recognized" error or devices not showing up at all.',
                'solution': '''1. Try different USB ports (front and back of PC)
2. Test device on another computer to confirm device works
3. Restart computer with device connected
4. Update USB drivers: Device Manager → Universal Serial Bus controllers → Update drivers
5. Uninstall and reinstall USB controllers in Device Manager
6. Disable USB selective suspend: Power Options → Advanced → USB settings
7. Check for Windows updates
8. Run Hardware and Devices Troubleshooter
9. Check BIOS settings for USB configuration
10. Disable Fast Startup which can cause USB issues
11. If specific port not working, might be hardware damage''',
                'prevention_tips': 'Don\'t force USB devices into ports. Safely eject before removing. Avoid using damaged cables. Keep USB ports clean and dry.',
                'tags': 'usb, usb port, device not recognized, peripheral, hardware',
                'resolved_by': 'ai',
            },
            {
                'title': 'Printer Not Working',
                'category': software_cat,
                'description': 'Printer won\'t print, shows offline status, or print jobs stuck in queue.',
                'solution': '''1. Check printer power and cable connections
2. Ensure printer is set as default: Settings → Printers → Set as default
3. Clear print queue: Open Printers → Right-click printer → See what\'s printing → Cancel all
4. Restart Print Spooler service: Services.msc → Print Spooler → Restart
5. Update printer drivers from manufacturer\'s website
6. Remove and re-add printer in Windows Settings
7. Check printer IP address if network printer (print test page from printer)
8. Disable Windows Firewall temporarily to test
9. Check if printer shows as offline - right-click and choose "Use printer online"
10. For wireless printers: Reconnect to WiFi network
11. Run Windows printer troubleshooter''',
                'prevention_tips': 'Keep printer drivers updated. Regularly clean print heads. Use quality ink/toner. Turn off when not in use. Check paper and ink levels.',
                'tags': 'printer, printing, print spooler, offline printer, print queue',
                'resolved_by': 'ai',
            },
            {
                'title': 'Audio Not Working / No Sound',
                'category': software_cat,
                'description': 'No sound coming from speakers or headphones. Audio devices show disconnected or "no audio output device installed".',
                'solution': '''1. Check volume isn\'t muted - click speaker icon in taskbar
2. Right-click speaker icon → Troubleshoot sound problems
3. Check correct audio output device selected: Right-click speaker → Open Sound settings
4. Update audio drivers: Device Manager → Sound controllers → Update driver
5. Restart Windows Audio service: Services.msc → Windows Audio → Restart
6. Check if audio device disabled: Sound settings → Manage sound devices → Enable
7. Uninstall audio device and restart (Windows will reinstall)
8. Test with different speakers/headphones
9. Check BIOS for onboard audio settings
10. Reinstall audio drivers from manufacturer website''',
                'prevention_tips': 'Keep audio drivers updated. Check physical connections. Avoid force-closing audio-related programs. Regular Windows updates.',
                'tags': 'audio, sound, no sound, speakers, headphones, volume, mute',
                'resolved_by': 'ai',
            },
            {
                'title': 'Keyboard Keys Not Working',
                'category': hardware_cat,
                'description': 'Some or all keyboard keys not responding. Sticky keys, typing wrong characters, or completely unresponsive.',
                'solution': '''1. Restart computer to clear temporary glitches
2. Try keyboard on another computer to test if keyboard is faulty
3. Check for physical debris under keys - clean carefully
4. Update keyboard drivers: Device Manager → Keyboards → Update driver
5. Uninstall keyboard driver and restart (Windows reinstalls)
6. Check if Num Lock or Function Lock affecting keys
7. Test with on-screen keyboard to confirm if issue is hardware
8. Check for Windows updates
9. Disable Filter Keys: Settings → Ease of Access → Keyboard
10. For wireless keyboards: Check batteries and reconnect
11. If spill damage: Disconnect immediately, dry thoroughly (24-48 hours)''',
                'prevention_tips': 'Keep food and drinks away from keyboard. Clean regularly with compressed air. Use keyboard cover. Replace every 3-5 years.',
                'tags': 'keyboard, keys, typing, input, stuck keys, keyboard not working',
                'resolved_by': 'technician',
            },
            {
                'title': 'Monitor No Signal or Black Screen',
                'category': hardware_cat,
                'description': 'Monitor shows "No Signal" message or stays black. Computer seems to be running but nothing displays.',
                'solution': '''1. Check monitor power cable and power button
2. Verify video cable (HDMI/DisplayPort/VGA) securely connected at both ends
3. Try different video cable if available
4. Test monitor with another computer or device
5. Check if computer is actually booting (listen for Windows startup sound)
6. Try different video port on graphics card
7. Reseat RAM modules (power off first)
8. Remove and reseat graphics card if using dedicated GPU
9. Clear CMOS battery on motherboard (consult manual)
10. Try integrated graphics if available (connect to motherboard ports)
11. Check if monitor input source matches cable (HDMI, DisplayPort, etc.)''',
                'prevention_tips': 'Use quality cables. Don\'t bend cables sharply. Keep graphics drivers updated. Ensure proper ventilation for GPU.',
                'tags': 'monitor, display, no signal, black screen, video, screen',
                'resolved_by': 'technician',
            },
            {
                'title': 'Computer Randomly Restarts or Shuts Down',
                'category': hardware_cat,
                'description': 'Computer unexpectedly restarts or shuts down during use. No warning messages, just sudden power off.',
                'solution': '''1. Check Event Viewer for critical errors before shutdown
2. Monitor temperatures - overheating can cause automatic shutdown
3. Test power supply with multimeter or try different PSU
4. Check all power cable connections inside case
5. Update BIOS to latest version
6. Disable automatic restart on system failure: System Properties → Advanced → Startup and Recovery
7. Run memory test: Windows Memory Diagnostic
8. Check for Windows updates and driver updates
9. Test with minimal hardware (disconnect non-essential devices)
10. Scan for malware with full antivirus scan
11. Check capacitors on motherboard for bulging''',
                'prevention_tips': 'Use adequate power supply wattage. Maintain good cooling. Use UPS for power stability. Keep system clean from dust.',
                'tags': 'restart, shutdown, power off, automatic restart, crash, stability',
                'resolved_by': 'technician',
            },
            {
                'title': 'Laptop Battery Not Charging',
                'category': hardware_cat,
                'description': 'Laptop battery stuck at certain percentage, not charging, or draining while plugged in. Shows "Plugged in, not charging".',
                'solution': '''1. Try different power outlet and check adapter LED light
2. Check power adapter wattage matches laptop requirements
3. Inspect charging port for damage or debris
4. Remove battery (if removable), hold power button 30 seconds, reconnect
5. Update BIOS and battery drivers
6. Uninstall battery driver: Device Manager → Batteries → Uninstall
7. Check battery health: CMD → "powercfg /batteryreport"
8. Disable battery charge limit in BIOS/Power settings if enabled
9. Try BIOS battery reset option if available
10. Replace charger if more than 2-3 years old
11. Battery replacement needed if health below 40% or 2-3 years old''',
                'prevention_tips': 'Don\'t leave plugged in constantly. Avoid extreme temperatures. Partial charges (20-80%) extend battery life. Store at 50% if unused long-term.',
                'tags': 'battery, charging, laptop, power, not charging, battery health',
                'resolved_by': 'technician',
            },
        ]

        created_count = 0
        for issue_data in issues:
            # Check if issue already exists (by title)
            if not ResolvedIssue.objects.filter(title=issue_data['title']).exists():
                # Combine solution and prevention tips
                full_solution = issue_data['solution']
                if 'prevention_tips' in issue_data and issue_data['prevention_tips']:
                    full_solution += f"\n\n**Prevention Tips:**\n{issue_data['prevention_tips']}"
                
                ResolvedIssue.objects.create(
                    title=issue_data['title'],
                    category=issue_data['category'],
                    description=issue_data['description'],
                    solution=full_solution,
                    tags=issue_data['tags'],
                    resolved_by=issue_data['resolved_by'],
                    technician=admin_user if admin_user else None,
                )
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'✓ Created: {issue_data["title"]}'))
            else:
                self.stdout.write(self.style.WARNING(f'⊘ Already exists: {issue_data["title"]}'))

        self.stdout.write(self.style.SUCCESS(f'\n✅ Successfully created {created_count} new issues'))
        self.stdout.write(self.style.SUCCESS(f'Total issues in library: {ResolvedIssue.objects.count()}'))
