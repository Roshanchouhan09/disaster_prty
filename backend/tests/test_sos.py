import pytest
from fastapi.testclient import TestClient
from app.main import app
import uuid

client = TestClient(app)

def test_sos_lifecycle():
    phone_number = f"+9198{uuid.uuid4().hex[:8]}"

    # 1. Activate SOS
    sos_payload = {
        "reporter_name": "Test Citizen In Distress",
        "contact_phone": phone_number,
        "emergency_type": "flood",
        "severity": "CRITICAL",
        "latitude": 26.1855,
        "longitude": 91.7505,
        "location_name": "Near Brahmaputra Embankment Sector 4",
        "message": "Water rising rapidly, 3 people stranded on roof.",
        "emergency_contacts": [
            {"name": "Relative", "phone": "+919876543210", "relation": "Family"}
        ],
        "device_telemetry": {
            "accuracy": 12.5,
            "battery": 45
        }
    }

    res = client.post("/api/sos", json=sos_payload)
    assert res.status_code == 201
    data = res.json()
    assert "sos_code" in data
    assert data["sos_code"].startswith("SOS-")
    assert data["status"] == "DISPATCHED" # auto-dispatched
    assert data["dispatched_service"] is not None
    assert "SDRF" in data["dispatched_service"] or "Rescue" in data["dispatched_service"]
    sos_id = data["id"]

    # 2. Duplicate Detection
    dup_res = client.post("/api/sos", json=sos_payload)
    assert dup_res.status_code == 409
    dup_data = dup_res.json()
    assert "already submitted" in str(dup_data["detail"])

    # 3. List SOS alerts
    list_res = client.get("/api/sos")
    assert list_res.status_code == 200
    alerts = list_res.json()
    assert any(a["id"] == sos_id for a in alerts)

    # 4. Get SOS Detail
    detail_res = client.get(f"/api/sos/{sos_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == sos_id
    assert detail_res.json()["emergency_type"] == "flood"

    # 5. Patch SOS Status (e.g. In Action / Resolved)
    patch_res = client.patch(f"/api/sos/{sos_id}", json={
        "status": "ACTIVE",
        "dispatcher_notes": "Rescue boat dispatched and en route to sector 4."
    })
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "ACTIVE"
    assert "en route" in patch_res.json()["dispatcher_notes"]

    # 6. Cancel or Resolve
    resolve_res = client.patch(f"/api/sos/{sos_id}", json={
        "status": "RESOLVED",
        "dispatcher_notes": "All victims successfully evacuated."
    })
    assert resolve_res.status_code == 200
    assert resolve_res.json()["status"] == "RESOLVED"
    assert resolve_res.json()["resolved_at"] is not None

def test_sos_invalid_coordinates():
    res = client.post("/api/sos", json={
        "contact_phone": "+919999999999",
        "latitude": 999.0, # invalid
        "longitude": 91.75
    })
    assert res.status_code == 422
