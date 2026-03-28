# backend/app/email_service.py
import os
import logging
import traceback
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Template

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self):
        self.smtp_server   = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port     = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.base_url      = os.getenv("FRONTEND_URL", "http://localhost:3000")
        self.from_email    = os.getenv("FROM_EMAIL", "trips@packvote.app")

        self.use_smtp = bool(self.smtp_username and self.smtp_password)

        # Log config at construction time so Docker logs show the real values
        logger.info("EmailService init — SMTP: %s:%s user=%s use_smtp=%s",
                    self.smtp_server, self.smtp_port,
                    self.smtp_username or "(empty)",
                    self.use_smtp)
        if not self.use_smtp:
            logger.warning(
                "SMTP_USERNAME or SMTP_PASSWORD is empty — "
                "emails will be MOCKED to stdout only."
            )

    # ── Internal send helper ─────────────────────────────────
    def _send(self, to_email: str, subject: str, html: str) -> bool:
        """Build a MIME message and send it via SMTP TLS."""
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = self.from_email
        msg["To"]      = to_email
        msg.attach(MIMEText(html, "html"))

        try:
            logger.info("Connecting to %s:%s …", self.smtp_server, self.smtp_port)
            with smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=15) as server:
                server.set_debuglevel(1)          # prints SMTP dialog to stderr
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(self.smtp_username, self.smtp_password)
                server.sendmail(self.from_email, to_email, msg.as_string())
            logger.info("Email sent to %s — subject: %s", to_email, subject)
            return True
        except smtplib.SMTPAuthenticationError as e:
            logger.error(
                "SMTP AUTH FAILED for user=%s — code=%s msg=%s\n"
                "Check that you are using a Gmail App Password (not your account password) "
                "and that 2FA is enabled on the account.",
                self.smtp_username, e.smtp_code, e.smtp_error,
            )
            return False
        except Exception:
            logger.error("Failed to send email to %s:\n%s", to_email, traceback.format_exc())
            return False

    # ── Public API ───────────────────────────────────────────
    def send_preference_form(self, participant, trip) -> bool:
        form_url = f"{self.base_url}/preferences/{participant.form_token}"
        subject  = f"Help plan: {trip.name} — Your preferences needed!"
        html     = self._render_form_email(participant, trip, form_url)

        if not self.use_smtp:
            print(f"\n[EMAIL MOCK] To: {participant.email}")
            print(f"  Subject : {subject}")
            print(f"  Link    : {form_url}\n")
            return True

        return self._send(participant.email, subject, html)

    def send_results_ready(self, participant, trip) -> bool:
        subject  = f"Recommendations ready: {trip.name}"
        url      = f"{self.base_url}/trip/{trip.id}/results"
        html     = (
            f"<p>Hi {participant.name or 'there'},</p>"
            f"<p>Recommendations for <strong>{trip.name}</strong> are ready!</p>"
            f"<p><a href='{url}'>View results</a></p>"
        )

        if not self.use_smtp:
            print(f"\n[EMAIL MOCK] To: {participant.email}")
            print(f"  Subject : {subject}\n")
            return True

        return self._send(participant.email, subject, html)

    def _render_form_email(self, participant, trip, form_url: str) -> str:
        template = Template("""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #667eea; color: white; padding: 20px; text-align: center;">
                <h1>🗳️ {{ trip.name }}</h1>
            </div>
            <div style="padding: 20px; background: #f9f9f9;">
                <p>Hi {{ participant.name or 'there' }},</p>
                <p>You're invited to help plan <strong>{{ trip.name }}</strong>!</p>
                <p><strong>Dates:</strong>
                   {{ trip.date_start.strftime('%B %d') if trip.date_start else 'TBD' }} –
                   {{ trip.date_end.strftime('%B %d, %Y') if trip.date_end else 'TBD' }}</p>
                <p><strong>Budget:</strong> ₹{{ trip.budget_min }} – ₹{{ trip.budget_max }}</p>
                <center>
                    <a href="{{ form_url }}"
                       style="background:#667eea;color:white;padding:15px 30px;
                              text-decoration:none;border-radius:5px;
                              display:inline-block;margin:20px 0;">
                        Fill Out Preferences
                    </a>
                </center>
            </div>
        </body>
        </html>
        """)
        return template.render(participant=participant, trip=trip, form_url=form_url)