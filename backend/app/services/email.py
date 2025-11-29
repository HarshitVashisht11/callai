import resend
from typing import Dict, Any, Optional
from datetime import datetime
from app.config import get_settings

settings = get_settings()

# Initialize Resend
resend.api_key = settings.resend_api_key


class EmailService:
    """Service for sending emails using Resend"""
    
    def __init__(self):
        self.from_email = settings.email_from
    
    async def send_meeting_confirmation(
        self,
        to_email: str,
        attendee_name: str,
        meeting_title: str,
        meeting_time: str,
        meeting_link: str = "",
        calendar_link: str = "",
        notes: str = ""
    ) -> Dict[str, Any]:
        """Send meeting confirmation email"""
        try:
            # Parse and format the meeting time
            try:
                dt = datetime.fromisoformat(meeting_time.replace('Z', '+00:00'))
                formatted_time = dt.strftime("%A, %B %d, %Y at %I:%M %p")
            except:
                formatted_time = meeting_time
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: #000; color: #fff; padding: 20px; text-align: center; }}
                    .content {{ padding: 20px; background: #f9f9f9; }}
                    .meeting-details {{ background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                    .detail-row {{ padding: 10px 0; border-bottom: 1px solid #eee; }}
                    .detail-label {{ font-weight: bold; color: #666; }}
                    .button {{ display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px 10px 0; }}
                    .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Meeting Confirmed! ✓</h1>
                    </div>
                    <div class="content">
                        <p>Hi {attendee_name},</p>
                        <p>Your meeting has been successfully scheduled. Here are the details:</p>
                        
                        <div class="meeting-details">
                            <div class="detail-row">
                                <span class="detail-label">Meeting:</span><br>
                                {meeting_title}
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">When:</span><br>
                                {formatted_time}
                            </div>
                            {f'<div class="detail-row"><span class="detail-label">Notes:</span><br>{notes}</div>' if notes else ''}
                        </div>
                        
                        <div style="text-align: center;">
                            {f'<a href="{meeting_link}" class="button">Join Meeting</a>' if meeting_link else ''}
                            {f'<a href="{calendar_link}" class="button" style="background: #4285f4;">View in Calendar</a>' if calendar_link else ''}
                        </div>
                        
                        <p>A calendar invite has also been sent to your email.</p>
                        <p>We look forward to speaking with you!</p>
                    </div>
                    <div class="footer">
                        <p>This email was sent by Voice Agent AI</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            text_content = f"""
Meeting Confirmed!

Hi {attendee_name},

Your meeting has been successfully scheduled.

Meeting: {meeting_title}
When: {formatted_time}
{f'Notes: {notes}' if notes else ''}

{f'Join Meeting: {meeting_link}' if meeting_link else ''}
{f'View in Calendar: {calendar_link}' if calendar_link else ''}

A calendar invite has also been sent to your email.

We look forward to speaking with you!
            """
            
            params = {
                "from": self.from_email,
                "to": [to_email],
                "subject": f"Meeting Confirmed: {meeting_title}",
                "html": html_content,
                "text": text_content
            }
            
            response = resend.Emails.send(params)
            
            return {
                'success': True,
                'email_id': response.get('id'),
                'message': 'Confirmation email sent'
            }
            
        except Exception as e:
            print(f"Email send error: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def send_campaign_email(
        self,
        to_email: str,
        to_name: str,
        subject: str,
        campaign_name: str,
        call_link: str,
        custom_template: str = ""
    ) -> Dict[str, Any]:
        """Send campaign email with AI call link"""
        try:
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }}
                    .container {{ max-width: 600px; margin: 0 auto; }}
                    .header {{ background: #000; color: #fff; padding: 40px 20px; text-align: center; }}
                    .header h1 {{ margin: 0; font-size: 28px; }}
                    .content {{ padding: 40px 20px; background: #fff; }}
                    .cta-section {{ text-align: center; margin: 30px 0; }}
                    .cta-button {{ 
                        display: inline-block; 
                        background: #000; 
                        color: #fff !important; 
                        padding: 16px 40px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-size: 18px;
                        font-weight: bold;
                    }}
                    .cta-button:hover {{ background: #333; }}
                    .features {{ background: #f9f9f9; padding: 30px 20px; }}
                    .feature-item {{ padding: 10px 0; }}
                    .feature-item::before {{ content: "✓ "; color: #22c55e; font-weight: bold; }}
                    .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f9f9f9; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎯 Exclusive Opportunity</h1>
                    </div>
                    <div class="content">
                        <p>Hi {to_name},</p>
                        
                        <p>We have something special for you! Our team has identified that you could benefit greatly from what we have to offer.</p>
                        
                        <p>Instead of reading through pages of information, <strong>speak directly with our AI assistant</strong> who can answer all your questions instantly and help you find the perfect solution.</p>
                        
                        <div class="cta-section">
                            <a href="{call_link}" class="cta-button">🎤 Start AI Call Now</a>
                        </div>
                        
                        <p style="text-align: center; color: #666; font-size: 14px;">
                            Takes less than 5 minutes • Available 24/7 • No obligation
                        </p>
                    </div>
                    
                    <div class="features">
                        <p style="font-weight: bold; margin-bottom: 15px;">What you'll discover:</p>
                        <div class="feature-item">Personalized recommendations for your needs</div>
                        <div class="feature-item">Instant answers to all your questions</div>
                        <div class="feature-item">Option to book a demo with our team</div>
                        <div class="feature-item">Exclusive offers available only through this call</div>
                    </div>
                    
                    <div class="footer">
                        <p>This email was sent as part of the {campaign_name} campaign.</p>
                        <p>If you no longer wish to receive these emails, simply ignore this message.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            text_content = f"""
Hi {to_name},

We have something special for you!

Instead of reading through pages of information, speak directly with our AI assistant who can answer all your questions instantly.

Start your AI call now: {call_link}

Takes less than 5 minutes • Available 24/7 • No obligation

What you'll discover:
✓ Personalized recommendations for your needs
✓ Instant answers to all your questions
✓ Option to book a demo with our team
✓ Exclusive offers available only through this call

---
This email was sent as part of the {campaign_name} campaign.
            """
            
            params = {
                "from": self.from_email,
                "to": [to_email],
                "subject": subject,
                "html": html_content,
                "text": text_content
            }
            
            response = resend.Emails.send(params)
            
            return {
                'success': True,
                'email_id': response.get('id'),
                'message': 'Campaign email sent'
            }
            
        except Exception as e:
            print(f"Campaign email send error: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def send_meeting_cancellation(
        self,
        to_email: str,
        attendee_name: str,
        meeting_title: str,
        meeting_time: str,
        reason: str = ""
    ) -> Dict[str, Any]:
        """Send meeting cancellation email"""
        try:
            # Parse and format the meeting time
            try:
                dt = datetime.fromisoformat(meeting_time.replace('Z', '+00:00'))
                formatted_time = dt.strftime("%A, %B %d, %Y at %I:%M %p")
            except:
                formatted_time = meeting_time
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: #dc2626; color: #fff; padding: 20px; text-align: center; }}
                    .content {{ padding: 20px; background: #f9f9f9; }}
                    .meeting-details {{ background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                    .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Meeting Cancelled</h1>
                    </div>
                    <div class="content">
                        <p>Hi {attendee_name},</p>
                        <p>Your meeting has been cancelled.</p>
                        
                        <div class="meeting-details">
                            <p><strong>Meeting:</strong> {meeting_title}</p>
                            <p><strong>Originally scheduled for:</strong> {formatted_time}</p>
                            {f'<p><strong>Reason:</strong> {reason}</p>' if reason else ''}
                        </div>
                        
                        <p>If you'd like to reschedule, please contact us.</p>
                    </div>
                    <div class="footer">
                        <p>This email was sent by Voice Agent AI</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            params = {
                "from": self.from_email,
                "to": [to_email],
                "subject": f"Meeting Cancelled: {meeting_title}",
                "html": html_content
            }
            
            response = resend.Emails.send(params)
            
            return {
                'success': True,
                'email_id': response.get('id'),
                'message': 'Cancellation email sent'
            }
            
        except Exception as e:
            print(f"Email send error: {e}")
            return {
                'success': False,
                'error': str(e)
            }


email_service = EmailService()
