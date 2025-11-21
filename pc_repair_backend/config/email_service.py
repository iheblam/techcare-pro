from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags


class EmailService:
    """
    Centralized email service for sending notifications
    """
    
    @staticmethod
    def send_email(subject, message, recipient_list, html_message=None):
        """
        Send email helper function
        """
        try:
            print(f"=== EMAIL DEBUG ===")
            print(f"SMTP Host: {settings.EMAIL_HOST}")
            print(f"SMTP Port: {settings.EMAIL_PORT}")
            print(f"SMTP User: {settings.EMAIL_HOST_USER}")
            print(f"SMTP Password: {'*' * len(settings.EMAIL_HOST_PASSWORD) if settings.EMAIL_HOST_PASSWORD else 'NOT SET'}")
            print(f"Attempting to send email to: {recipient_list}")
            print(f"From: {settings.DEFAULT_FROM_EMAIL}")
            print(f"==================")
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=recipient_list,
                html_message=html_message,
                fail_silently=False,  # Changed to False to see errors
            )
            print(f"Email sent successfully to: {recipient_list}")
            return True
        except Exception as e:
            print(f"Email sending failed: {str(e)}")
            print(f"Error type: {type(e).__name__}")
            import traceback
            traceback.print_exc()
            return False
    
    @staticmethod
    def send_welcome_email(user):
        """
        Send welcome email to newly registered users
        """
        subject = "Welcome to PC Repair System! 🎉"
        
        message = f"""
Hi {user.first_name or user.username},

Welcome to PC Repair System!

Your account has been successfully created. You can now:
- Chat with our AI assistant for instant PC troubleshooting
- Browse our library of resolved issues
- Create support tickets for complex problems
- Get help from our expert technicians

Get started now by logging in to your account.

Need help? Just reply to this email!

Best regards,
The PC Repair Team
        """
        
        html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .button {{ display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .features {{ background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }}
        .feature {{ margin: 15px 0; padding-left: 25px; position: relative; }}
        .feature:before {{ content: "✓"; position: absolute; left: 0; color: #667eea; font-weight: bold; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to PC Repair System!</h1>
        </div>
        <div class="content">
            <p>Hi <strong>{user.first_name or user.username}</strong>,</p>
            
            <p>Your account has been successfully created! We're excited to help you with all your PC repair needs.</p>
            
            <div class="features">
                <h3>What you can do now:</h3>
                <div class="feature">Chat with our AI assistant for instant troubleshooting</div>
                <div class="feature">Browse our library of resolved PC issues</div>
                <div class="feature">Create support tickets for complex problems</div>
                <div class="feature">Get help from our expert technicians</div>
            </div>
            
            <p>Ready to get started?</p>
            
            <p><strong>Need help?</strong> Just reply to this email and we'll be happy to assist!</p>
            
            <p>Best regards,<br><strong>The PC Repair Team</strong></p>
        </div>
    </div>
</body>
</html>
        """
        
        return EmailService.send_email(
            subject=subject,
            message=message,
            recipient_list=[user.email],
            html_message=html_message
        )
    
    @staticmethod
    def send_ticket_created_email(ticket):
        """
        Send confirmation email when client creates a ticket
        """
        subject = f"Ticket Created: {ticket.ticket_number}"
        
        message = f"""
Hi {ticket.client.first_name},

Your support ticket has been created successfully!

Ticket Number: {ticket.ticket_number}
Title: {ticket.title}
Status: {ticket.get_status_display()}
Priority: {ticket.get_priority_display()}

Our admin team will review your request and assign it to a technician shortly. You'll receive an email notification once it's assigned.

You can track your ticket status anytime in your dashboard.

Thank you for choosing PC Repair System!

Best regards,
The PC Repair Team
        """
        
        html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .ticket-info {{ background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }}
        .label {{ font-weight: bold; color: #667eea; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Ticket Created Successfully</h1>
        </div>
        <div class="content">
            <p>Hi <strong>{ticket.client.first_name}</strong>,</p>
            
            <p>Your support ticket has been created successfully!</p>
            
            <div class="ticket-info">
                <p><span class="label">Ticket Number:</span> {ticket.ticket_number}</p>
                <p><span class="label">Title:</span> {ticket.title}</p>
                <p><span class="label">Status:</span> {ticket.get_status_display()}</p>
                <p><span class="label">Priority:</span> {ticket.get_priority_display()}</p>
                {'<p><span class="label">Home Visit:</span> Yes</p>' if ticket.requires_visit else ''}
            </div>
            
            <p>Our admin team will review your request and assign it to a technician shortly. You'll receive an email notification once it's assigned.</p>
            
            <p>Thank you for choosing PC Repair System!</p>
            
            <p>Best regards,<br><strong>The PC Repair Team</strong></p>
        </div>
    </div>
</body>
</html>
        """
        
        return EmailService.send_email(
            subject=subject,
            message=message,
            recipient_list=[ticket.client.email],
            html_message=html_message
        )
    
    @staticmethod
    def send_ticket_assigned_email(ticket):
        """
        Send email to technician when ticket is assigned
        """
        subject = f"New Ticket Assigned: {ticket.ticket_number}"
        
        message = f"""
Hi {ticket.assigned_technician.first_name},

A new ticket has been assigned to you!

Ticket Number: {ticket.ticket_number}
Title: {ticket.title}
Client: {ticket.client.get_full_name()}
Priority: {ticket.get_priority_display()}
Estimated Cost: ${ticket.estimated_cost or 'Not set'}

Issue Type: {ticket.issue_type.title()}
Requires Visit: {'Yes - ' + ticket.visit_address if ticket.requires_visit else 'No'}

Problem Description:
{ticket.description}

Admin Notes:
{ticket.admin_notes or 'None'}

Please log in to view full details and start working on this ticket.

Best regards,
PC Repair Admin Team
        """
        
        html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .ticket-info {{ background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; }}
        .priority-high {{ color: #ef4444; font-weight: bold; }}
        .priority-urgent {{ color: #dc2626; font-weight: bold; background: #fee; padding: 2px 8px; border-radius: 3px; }}
        .label {{ font-weight: bold; color: #10b981; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔧 New Ticket Assigned to You</h1>
        </div>
        <div class="content">
            <p>Hi <strong>{ticket.assigned_technician.first_name}</strong>,</p>
            
            <p>A new ticket has been assigned to you!</p>
            
            <div class="ticket-info">
                <p><span class="label">Ticket Number:</span> {ticket.ticket_number}</p>
                <p><span class="label">Title:</span> {ticket.title}</p>
                <p><span class="label">Client:</span> {ticket.client.get_full_name()}</p>
                <p><span class="label">Priority:</span> <span class="priority-{ticket.priority}">{ticket.get_priority_display()}</span></p>
                <p><span class="label">Estimated Cost:</span> ${ticket.estimated_cost or 'Not set'}</p>
                <p><span class="label">Issue Type:</span> {ticket.issue_type.title()}</p>
                {'<p><span class="label">Home Visit Required:</span> Yes<br><span class="label">Address:</span> ' + ticket.visit_address + '</p>' if ticket.requires_visit else ''}
            </div>
            
            <div style="background: white; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p><strong>Problem Description:</strong></p>
                <p>{ticket.description}</p>
            </div>
            
            {f'<div style="background: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #ffc107;"><p><strong>Admin Notes:</strong></p><p>{ticket.admin_notes}</p></div>' if ticket.admin_notes else ''}
            
            <p>Please log in to your dashboard to view full details and start working on this ticket.</p>
            
            <p>Best regards,<br><strong>PC Repair Admin Team</strong></p>
        </div>
    </div>
</body>
</html>
        """
        
        return EmailService.send_email(
            subject=subject,
            message=message,
            recipient_list=[ticket.assigned_technician.email],
            html_message=html_message
        )
    
    @staticmethod
    def send_ticket_status_update_email(ticket, old_status, new_status):
        """
        Send email to client when ticket status changes
        """
        subject = f"Ticket Update: {ticket.ticket_number} - {new_status.replace('_', ' ').title()}"
        
        status_messages = {
            'assigned': f"Your ticket has been assigned to {ticket.assigned_technician.get_full_name() if ticket.assigned_technician else 'a technician'}.",
            'in_progress': "Our technician has started working on your issue.",
            'waiting_payment': f"Your issue has been resolved. {f'Final cost: ${ticket.final_cost}. ' if ticket.final_cost else ''}Please proceed with payment.",
            'resolved': "Your issue has been successfully resolved!",
            'cancelled': "Your ticket has been cancelled."
        }
        
        status_message = status_messages.get(new_status, f"Status changed to {new_status}")
        
        message = f"""
Hi {ticket.client.first_name},

Your support ticket status has been updated!

Ticket Number: {ticket.ticket_number}
Previous Status: {old_status.replace('_', ' ').title()}
New Status: {new_status.replace('_', ' ').title()}

{status_message}

{f'Technician: {ticket.assigned_technician.get_full_name()}' if ticket.assigned_technician else ''}
{f'Final Cost: ${ticket.final_cost}' if ticket.final_cost and new_status == 'waiting_payment' else ''}

{'Technician Notes:' + chr(10) + ticket.technician_notes if ticket.technician_notes else ''}

You can view full details and updates in your dashboard.

Best regards,
The PC Repair Team
        """
        
        html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .status-box {{ background: white; padding: 20px; border-left: 4px solid #3b82f6; margin: 20px 0; }}
        .label {{ font-weight: bold; color: #3b82f6; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 Ticket Status Update</h1>
        </div>
        <div class="content">
            <p>Hi <strong>{ticket.client.first_name}</strong>,</p>
            
            <p>Your support ticket status has been updated!</p>
            
            <div class="status-box">
                <p><span class="label">Ticket Number:</span> {ticket.ticket_number}</p>
                <p><span class="label">Previous Status:</span> {old_status.replace('_', ' ').title()}</p>
                <p><span class="label">New Status:</span> <strong>{new_status.replace('_', ' ').title()}</strong></p>
            </div>
            
            <p style="background: #e0f2fe; padding: 15px; border-radius: 5px; border-left: 4px solid #0284c7;">
                {status_message}
            </p>
            
            {f'<p><span class="label">Technician:</span> {ticket.assigned_technician.get_full_name()}</p>' if ticket.assigned_technician else ''}
            {f'<p><span class="label">Final Cost:</span> <strong style="color: #10b981; font-size: 18px;">${ticket.final_cost}</strong></p>' if ticket.final_cost and new_status == "waiting_payment" else ''}
            
            {f'<div style="background: white; padding: 15px; margin: 20px 0; border-radius: 5px;"><p><strong>Technician Notes:</strong></p><p>{ticket.technician_notes}</p></div>' if ticket.technician_notes else ''}
            
            <p>You can view full details and updates in your dashboard.</p>
            
            <p>Best regards,<br><strong>The PC Repair Team</strong></p>
        </div>
    </div>
</body>
</html>
        """
        
        return EmailService.send_email(
            subject=subject,
            message=message,
            recipient_list=[ticket.client.email],
            html_message=html_message
        )
    
    @staticmethod
    def send_ticket_resolved_email(ticket):
        """
        Send email when ticket is marked as resolved
        """
        subject = f"Ticket Resolved: {ticket.ticket_number} ✅"
        
        message = f"""
Hi {ticket.client.first_name},

Great news! Your support ticket has been resolved!

Ticket Number: {ticket.ticket_number}
Title: {ticket.title}
Resolved by: {ticket.assigned_technician.get_full_name() if ticket.assigned_technician else 'Admin'}
Final Cost: ${ticket.final_cost or ticket.estimated_cost or 'N/A'}

Solution Summary:
{ticket.technician_notes or 'Issue has been fixed successfully.'}

We hope you're satisfied with our service! If you have any questions or need further assistance, please don't hesitate to reach out.

Would you like to rate your experience? (Future feature)

Best regards,
The PC Repair Team
        """
        
        html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .success-box {{ background: #d1fae5; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 5px; }}
        .label {{ font-weight: bold; color: #059669; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Ticket Resolved Successfully!</h1>
        </div>
        <div class="content">
            <p>Hi <strong>{ticket.client.first_name}</strong>,</p>
            
            <p>Great news! Your support ticket has been resolved!</p>
            
            <div class="success-box">
                <p><span class="label">Ticket Number:</span> {ticket.ticket_number}</p>
                <p><span class="label">Title:</span> {ticket.title}</p>
                <p><span class="label">Resolved by:</span> {ticket.assigned_technician.get_full_name() if ticket.assigned_technician else 'Admin'}</p>
                <p><span class="label">Final Cost:</span> <strong style="color: #10b981; font-size: 18px;">${ticket.final_cost or ticket.estimated_cost or 'N/A'}</strong></p>
            </div>
            
            <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 5px;">
                <p><strong>Solution Summary:</strong></p>
                <p>{ticket.technician_notes or 'Issue has been fixed successfully.'}</p>
            </div>
            
            <p>We hope you're satisfied with our service! If you have any questions or need further assistance, please don't hesitate to reach out.</p>
            
            <p>Thank you for choosing PC Repair System!</p>
            
            <p>Best regards,<br><strong>The PC Repair Team</strong></p>
        </div>
    </div>
</body>
</html>
        """
        
        return EmailService.send_email(
            subject=subject,
            message=message,
            recipient_list=[ticket.client.email],
            html_message=html_message
        )
    
    @staticmethod
    def send_new_update_notification(ticket, update, recipients):
        """
        Send email when someone adds an update/comment to ticket
        """
        subject = f"New Update on Ticket: {ticket.ticket_number}"
        
        message = f"""
A new update has been added to ticket {ticket.ticket_number}.

From: {update.user.get_full_name()} ({update.user.user_type})
Date: {update.created_at.strftime('%Y-%m-%d %H:%M')}

Update:
{update.update_text}

{'Status changed to: ' + update.status_changed_to if update.status_changed_to else ''}

View full ticket details in your dashboard.

Best regards,
The PC Repair Team
        """
        
        html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #8b5cf6; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .update-box {{ background: white; padding: 20px; border-left: 4px solid #8b5cf6; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💬 New Update on Your Ticket</h1>
        </div>
        <div class="content">
            <p>A new update has been added to ticket <strong>{ticket.ticket_number}</strong>.</p>
            
            <div class="update-box">
                <p><strong>From:</strong> {update.user.get_full_name()} ({update.user.user_type.title()})</p>
                <p><strong>Date:</strong> {update.created_at.strftime('%Y-%m-%d %H:%M')}</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
                <p>{update.update_text}</p>
                {f'<p style="background: #fef3c7; padding: 10px; border-radius: 5px; margin-top: 10px;"><strong>Status changed to:</strong> {update.status_changed_to.replace("_", " ").title()}</p>' if update.status_changed_to else ''}
            </div>
            
            <p>View full ticket details in your dashboard.</p>
            
            <p>Best regards,<br><strong>The PC Repair Team</strong></p>
        </div>
    </div>
</body>
</html>
        """
        
        return EmailService.send_email(
            subject=subject,
            message=message,
            recipient_list=recipients,
            html_message=html_message
        )
    
    @staticmethod
    def send_technician_application_notification(admin, application):
        """
        Notify admin of new technician application
        """
        subject = f"New Technician Application from {application.user.get_full_name()}"
        
        message = f"""
Hi {admin.first_name},

A new technician application has been submitted and requires your review.

Applicant: {application.user.get_full_name()}
Email: {application.user.email}
Specialization: {application.get_specialization_display()}
Experience: {application.years_experience} years
Hourly Rate: ${application.hourly_rate}

Please review the application in the admin dashboard.

Best regards,
PC Repair System
        """
        
        html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .info-box {{ background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }}
        .label {{ font-weight: bold; color: #667eea; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📝 New Technician Application</h1>
        </div>
        <div class="content">
            <p>Hi <strong>{admin.first_name}</strong>,</p>
            
            <p>A new technician application has been submitted and requires your review.</p>
            
            <div class="info-box">
                <p><span class="label">Applicant:</span> {application.user.get_full_name()}</p>
                <p><span class="label">Email:</span> {application.user.email}</p>
                <p><span class="label">Specialization:</span> {application.get_specialization_display()}</p>
                <p><span class="label">Experience:</span> {application.years_experience} years</p>
                <p><span class="label">Hourly Rate:</span> <strong style="color: #10b981; font-size: 18px;">${application.hourly_rate}</strong></p>
            </div>
            
            <p>Please review the application in the admin dashboard.</p>
            
            <p>Best regards,<br><strong>PC Repair System</strong></p>
        </div>
    </div>
</body>
</html>
        """
        
        return EmailService.send_email(
            subject=subject,
            message=message,
            recipient_list=[admin.email],
            html_message=html_message
        )
    
    @staticmethod
    def send_technician_approval_email(user, application):
        """
        Send approval email to technician applicant
        """
        subject = "🎉 Your Technician Application Has Been Approved!"
        
        message = f"""
Hi {user.first_name},

Congratulations! Your application to become a technician has been approved!

You can now:
- Log in to your technician dashboard
- View and accept ticket assignments
- Start helping clients with their PC issues

Your specialization: {application.get_specialization_display()}
Your hourly rate: ${application.hourly_rate}

Thank you for joining our team!

Best regards,
The PC Repair Team
        """
        
        html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .success-box {{ background: #d1fae5; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 5px; }}
        .button {{ display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Application Approved!</h1>
        </div>
        <div class="content">
            <p>Hi <strong>{user.first_name}</strong>,</p>
            
            <p><strong>Congratulations!</strong> Your application to become a technician has been approved!</p>
            
            <div class="success-box">
                <p><strong>Your Technician Profile:</strong></p>
                <p>Specialization: {application.get_specialization_display()}</p>
                <p>Hourly Rate: ${application.hourly_rate}</p>
                <p>Experience: {application.years_experience} years</p>
            </div>
            
            <p>You can now:</p>
            <ul>
                <li>Access your technician dashboard</li>
                <li>View and accept ticket assignments</li>
                <li>Start helping clients with their PC issues</li>
                <li>Track your earnings and performance</li>
            </ul>
            
            <p>Thank you for joining our team!</p>
            
            <p>Best regards,<br><strong>The PC Repair Team</strong></p>
        </div>
    </div>
</body>
</html>
        """
        
        return EmailService.send_email(
            subject=subject,
            message=message,
            recipient_list=[user.email],
            html_message=html_message
        )
    
    @staticmethod
    def send_technician_rejection_email(user, application):
        """
        Send rejection email to technician applicant
        """
        subject = "Technician Application Update"
        
        message = f"""
Hi {user.first_name},

Thank you for your interest in becoming a technician with PC Repair System.

After careful review, we regret to inform you that we are unable to approve your application at this time.

{f'Reason: {application.admin_notes}' if application.admin_notes else ''}

You are welcome to reapply in the future. We encourage you to gain more experience and certifications before applying again.

Best regards,
The PC Repair Team
        """
        
        html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Application Update</h1>
        </div>
        <div class="content">
            <p>Hi <strong>{user.first_name}</strong>,</p>
            
            <p>Thank you for your interest in becoming a technician with PC Repair System.</p>
            
            <p>After careful review, we regret to inform you that we are unable to approve your application at this time.</p>
            
            {f'<div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;"><strong>Admin Feedback:</strong><br>{application.admin_notes}</div>' if application.admin_notes else ''}
            
            <p>You are welcome to reapply in the future. We encourage you to:</p>
            <ul>
                <li>Gain more hands-on experience</li>
                <li>Obtain relevant certifications</li>
                <li>Build a portfolio of your work</li>
            </ul>
            
            <p>Best regards,<br><strong>The PC Repair Team</strong></p>
        </div>
    </div>
</body>
</html>
        """
        
        return EmailService.send_email(
            subject=subject,
            message=message,
            recipient_list=[user.email],
            html_message=html_message
        )