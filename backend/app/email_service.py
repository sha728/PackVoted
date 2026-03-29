# backend/app/email_service.py
import os
import logging
import traceback

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self):
        self.sendgrid_api_key = os.getenv("SENDGRID_API_KEY", "")
        self.from_email       = os.getenv("FROM_EMAIL", "packvoted@gmail.com")
        self.base_url         = os.getenv("FRONTEND_URL", "http://localhost:3000")
        self.use_sendgrid     = bool(self.sendgrid_api_key)

        logger.info(
            "EmailService init — provider=%s from=%s",
            "sendgrid" if self.use_sendgrid else "MOCK",
            self.from_email,
        )
        if not self.use_sendgrid:
            logger.warning(
                "SENDGRID_API_KEY not set — emails will be printed to stdout only."
            )

    # ── Internal send helper ─────────────────────────────────
    def _send(self, to_email: str, subject: str, html: str) -> bool:
        """Send via SendGrid HTTP API (works on Render free tier)."""
        if not self.use_sendgrid:
            return False

        try:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail

            message = Mail(
                from_email=self.from_email,
                to_emails=to_email,
                subject=subject,
                html_content=html,
            )
            sg = SendGridAPIClient(self.sendgrid_api_key)
            response = sg.send(message)
            status = response.status_code
            logger.info("SendGrid response %s for %s — %s", status, to_email, subject)
            return status in (200, 201, 202)
        except Exception:
            logger.error(
                "SendGrid failed sending to %s:\n%s", to_email, traceback.format_exc()
            )
            return False

    # ── Public API ───────────────────────────────────────────
    def send_preference_form(self, participant, trip) -> bool:
        form_url = f"{self.base_url}/preferences/{participant.form_token}"
        subject  = f"Help plan: {trip.name} — Your preferences needed!"
        html     = self._render_form_email(participant, trip, form_url)

        if not self.use_sendgrid:
            print(f"\n[EMAIL MOCK] To: {participant.email}")
            print(f"  Subject : {subject}")
            print(f"  Link    : {form_url}\n")
            return True

        return self._send(participant.email, subject, html)

    def send_results_ready(self, participant, trip) -> bool:
        subject = f"Recommendations ready: {trip.name}"
        url     = f"{self.base_url}/trip/{trip.id}/results"
        html    = (
            f"<p>Hi {participant.name or 'there'},</p>"
            f"<p>Recommendations for <strong>{trip.name}</strong> are ready!</p>"
            f"<p><a href='{url}'>View results</a></p>"
        )

        if not self.use_sendgrid:
            print(f"\n[EMAIL MOCK] To: {participant.email}")
            print(f"  Subject : {subject}\n")
            return True

        return self._send(participant.email, subject, html)

    def _render_form_email(self, participant, trip, form_url: str) -> str:
        from jinja2 import Template
        template = Template("""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #667eea; color: white; padding: 20px; text-align: center;">
                <h1>🗳️ {{ trip_name }}</h1>
            </div>
            <div style="padding: 20px; background: #f9f9f9;">
                <p>Hi {{ participant_name }},</p>
                <p>You're invited to help plan <strong>{{ trip_name }}</strong>!</p>
                <p><strong>Dates:</strong> {{ date_start }} – {{ date_end }}</p>
                <p><strong>Budget:</strong> ₹{{ budget_min }} – ₹{{ budget_max }}</p>
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

        date_start = trip.date_start.strftime('%B %d') if trip.date_start else 'TBD'
        date_end   = trip.date_end.strftime('%B %d, %Y') if trip.date_end else 'TBD'

        return template.render(
            participant_name=participant.name or "there",
            trip_name=trip.name,
            date_start=date_start,
            date_end=date_end,
            budget_min=trip.budget_min,
            budget_max=trip.budget_max,
            form_url=form_url,
        )