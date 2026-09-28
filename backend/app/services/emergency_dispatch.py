import logging
import requests
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from app.config import settings
from app.db import models

logger = logging.getLogger(__name__)

class EmergencyDispatchService:
    """
    Production-grade Emergency Services Dispatch Abstraction.
    Handles dispatching to external emergency APIs, SMS gateways, webhooks,
    and automatic assignment of nearest tactical rescue teams.
    """

    @staticmethod
    def check_duplicate_active_sos(
        db: Session, 
        contact_phone: str, 
        latitude: float, 
        longitude: float, 
        window_minutes: int = 5
    ) -> Optional[models.SOSAlert]:
        """
        Check if an active SOS request was already submitted from this phone number
        or proximate location within the recent window.
        """
        threshold = datetime.utcnow() - timedelta(minutes=window_minutes)
        existing = db.query(models.SOSAlert).filter(
            models.SOSAlert.contact_phone == contact_phone,
            models.SOSAlert.status.in_(["PENDING", "LOCATION_VERIFIED", "DISPATCHED", "ACTIVE"]),
            models.SOSAlert.created_at >= threshold
        ).first()

        if existing:
            return existing

        # Also check within 50 meters if same coordinates
        proximate = db.query(models.SOSAlert).filter(
            models.SOSAlert.status.in_(["PENDING", "LOCATION_VERIFIED", "DISPATCHED", "ACTIVE"]),
            models.SOSAlert.created_at >= threshold,
            models.SOSAlert.latitude.between(latitude - 0.0005, latitude + 0.0005),
            models.SOSAlert.longitude.between(longitude - 0.0005, longitude + 0.0005)
        ).first()

        return proximate

    @staticmethod
    def select_appropriate_dispatch_service(emergency_type: str) -> str:
        services = {
            "medical": "Emergency Medical Services (EMS) - Ambulance Rapid Unit",
            "trapped": "NDRF Urban Search & Rescue (USAR) Specialist Team",
            "flood": "SDRF Flood Rescue Inflatable Boat Unit",
            "structural_collapse": "Heavy Rescue & Collapse Extrication Squad",
            "fire": "Fire & Rescue Tactical Hazmat Unit",
            "general": "Emergency Operations Central Response Taskforce"
        }
        return services.get(emergency_type.lower(), "State Disaster Emergency Response Taskforce")

    @classmethod
    def dispatch_alert(
        cls, 
        sos_alert: models.SOSAlert, 
        db: Session
    ) -> Dict[str, Any]:
        """
        Notify external emergency services and emergency contacts.
        """
        assigned_unit = cls.select_appropriate_dispatch_service(sos_alert.emergency_type)
        sos_alert.dispatched_service = assigned_unit
        sos_alert.status = "DISPATCHED"

        dispatch_payload = {
            "sos_code": sos_alert.sos_code,
            "emergency_type": sos_alert.emergency_type,
            "severity": sos_alert.severity,
            "coordinates": {
                "latitude": sos_alert.latitude,
                "longitude": sos_alert.longitude
            },
            "location_name": sos_alert.location_name,
            "reporter_name": sos_alert.reporter_name,
            "contact_phone": sos_alert.contact_phone,
            "message": sos_alert.message,
            "timestamp": sos_alert.created_at.isoformat() if sos_alert.created_at else datetime.utcnow().isoformat(),
            "assigned_unit": assigned_unit,
            "helpline": settings.EMERGENCY_HELPLINE_NUMBER
        }

        webhook_status = "simulated"
        sms_status = "simulated"

        # 1. External Webhook if configured
        if settings.EMERGENCY_DISPATCH_WEBHOOK_URL:
            try:
                headers = {"Content-Type": "application/json"}
                if settings.EMERGENCY_API_KEY:
                    headers["Authorization"] = f"Bearer {settings.EMERGENCY_API_KEY}"
                resp = requests.post(
                    settings.EMERGENCY_DISPATCH_WEBHOOK_URL,
                    json=dispatch_payload,
                    headers=headers,
                    timeout=5
                )
                webhook_status = f"dispatched_{resp.status_code}"
            except Exception as e:
                logger.error(f"External webhook dispatch failed: {e}")
                webhook_status = f"failed: {str(e)}"

        # 2. SMS Gateway if configured
        if settings.EMERGENCY_SMS_GATEWAY_URL and sos_alert.emergency_contacts:
            try:
                sms_payload = {
                    "to": [c.get("phone") for c in sos_alert.emergency_contacts if isinstance(c, dict) and c.get("phone")],
                    "message": f"EMERGENCY SOS ALERT: {sos_alert.reporter_name} activated SOS at {sos_alert.location_name}. Coords: {sos_alert.latitude}, {sos_alert.longitude}. Helpline: {settings.EMERGENCY_HELPLINE_NUMBER}."
                }
                requests.post(
                    settings.EMERGENCY_SMS_GATEWAY_URL,
                    json=sms_payload,
                    timeout=5
                )
                sms_status = "dispatched"
            except Exception as e:
                logger.error(f"SMS gateway dispatch failed: {e}")
                sms_status = f"failed: {str(e)}"

        # Mark emergency contacts notified
        if sos_alert.emergency_contacts and isinstance(sos_alert.emergency_contacts, list):
            updated_contacts = []
            for contact in sos_alert.emergency_contacts:
                if isinstance(contact, dict):
                    updated_contacts.append({
                        **contact,
                        "notified": True,
                        "notified_at": datetime.utcnow().isoformat()
                    })
                else:
                    updated_contacts.append(contact)
            sos_alert.emergency_contacts = updated_contacts

        sos_alert.dispatcher_notes = (
            f"Auto-dispatched to [{assigned_unit}]. "
            f"Webhook: {webhook_status}. SMS: {sms_status}."
        )

        return {
            "assigned_service": assigned_unit,
            "webhook_status": webhook_status,
            "sms_status": sms_status,
            "dispatched_at": datetime.utcnow().isoformat()
        }
