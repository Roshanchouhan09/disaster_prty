import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["system"] == "DISASTERFOG AI Intelligence Platform API"

def test_list_events():
    response = client.get("/api/events")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_list_incidents():
    response = client.get("/api/incidents")
    assert response.status_code == 200
    incidents = response.json()
    assert isinstance(incidents, list)
    assert len(incidents) > 0
    assert "code" in incidents[0]

def test_submit_report_and_fusion():
    payload = {
        "source_type": "citizen",
        "reporter_name": "Test Reporter",
        "latitude": 26.121,
        "longitude": 85.451,
        "location_name": "Test Market Sector",
        "description": "Rising flood water 1.8 meters deep! People stranded on building balcony!",
        "reported_damage": "flood",
        "water_level": 1.8,
        "estimated_people_affected": 45
    }
    response = client.post("/api/reports", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["report_code"].startswith("RPT-")
    assert data["source_reliability"] > 0
    assert data["incident_id"] is not None

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
