# pyrefly: ignore [missing-import]
import pytest
from fastapi.testclient import TestClient
from app.main import app
import uuid

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ONLINE"
    assert "DISASTERFOG AI" in data["system"]

def test_auth_login():
    response = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "admin"

def test_list_events():
    response = client.get("/api/events")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

def test_list_incidents():
    response = client.get("/api/incidents")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

def test_submit_report_and_fusion():
    report_payload = {
        "client_uuid": f"test-uuid-{uuid.uuid4()}",
        "source_type": "field_officer",
        "reporter_name": "Test Officer Rahul",
        "latitude": 26.1205,
        "longitude": 85.4510,
        "location_name": "Sector 4 St. Jude School",
        "description": "Flash flood level rising rapidly to 2.4m, roughly 320 people marooned.",
        "reported_damage": "flood",
        "water_level": 2.4,
        "estimated_people_affected": 320
    }
    response = client.post("/api/reports", json=report_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["report_code"].startswith("RPT-")
    assert data["source_reliability"] > 0
    assert "incident_id" in data

def test_incident_detail_and_verification():
    inc_list = client.get("/api/incidents").json()
    assert len(inc_list) > 0
    inc_id = inc_list[0]["id"]

    detail_res = client.get(f"/api/incidents/{inc_id}")
    assert detail_res.status_code == 200
    data = detail_res.json()
    assert data["id"] == inc_id
    assert "reports" in data

    # Verify action
    login_res = client.post("/api/auth/login", json={"username": "admin", "password": "password123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    verify_res = client.post(
        f"/api/incidents/{inc_id}/verify", 
        json={"status": "VERIFIED", "notes": "Automated verification test"}, 
        headers=headers
    )
    assert verify_res.status_code == 200
    assert verify_res.json()["verification_status"] == "VERIFIED"

def test_resources_lifecycle():
    res_list = client.get("/api/resources")
    assert res_list.status_code == 200
    assert isinstance(res_list.json(), list)

    test_code = f"RES-TEST-{uuid.uuid4().hex[:6]}"
    new_res = client.post("/api/resources", json={
        "code": test_code,
        "name": "Rapid Inflatable Boat Alpha",
        "resource_type": "boat",
        "status": "AVAILABLE",
        "location_lat": 26.125,
        "location_lng": 85.455,
        "capacity": 6
    })
    assert new_res.status_code == 200
    assert new_res.json()["code"] == test_code

def test_missions_lifecycle():
    login_res = client.post("/api/auth/login", json={"username": "admin", "password": "password123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    inc_list = client.get("/api/incidents").json()
    inc_id = inc_list[0]["id"]

    create_res = client.post("/api/missions", json={
        "incident_id": inc_id,
        "title": "Operation Swift Hope",
        "priority": "HIGH",
        "assigned_team": "NDRF Quick Response #2",
        "resource_ids": [],
        "notes": "Test mission creation"
    }, headers=headers)
    assert create_res.status_code == 200
    mission_id = create_res.json()["id"]

    patch_res = client.patch(f"/api/missions/{mission_id}", json={
        "status": "IN_PROGRESS",
        "notes": "Team arrived at site"
    }, headers=headers)
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "IN_PROGRESS"

def test_analytics_summary():
    response = client.get("/api/analytics")
    assert response.status_code == 200
    data = response.json()
    assert data["total_reports_count"] >= 1
    assert data["overall_confidence_score"] > 0

def test_simulation_status():
    response = client.get("/api/simulation/status")
    assert response.status_code == 200
    assert "scenario_name" in response.json()

def test_generate_briefing():
    response = client.post("/api/incidents/generate-briefing")
    assert response.status_code == 200
    assert "EXECUTIVE SITUATIONAL BRIEFING" in response.json()["briefing"]
