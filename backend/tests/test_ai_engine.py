import pytest
from app.ai.classifier import AIClassifier
from app.ai.reliability import ReliabilityEngine
from app.ai.clustering import haversine_distance_km, jaccard_similarity, ReportClusteringEngine
from app.ai.conflict import ConflictDetector
from app.ai.priority import PriorityScorer
from app.ai.resource_optimizer import ResourceOptimizer

def test_ai_classifier():
    text = "Severe flooding submerged school roof. 50 children trapped in waist deep water."
    cat, sev, conf = AIClassifier.classify_text(text, water_level=2.2)
    assert cat in ["flood", "trapped_persons"]
    assert sev in ["CRITICAL", "HIGH"]
    assert conf >= 0.50

def test_entity_extractor():
    text = "About 120 people trapped near river. Water level 2.5 meters."
    entities = AIClassifier.extract_entities(text)
    assert entities["estimated_people"] == 120
    assert entities["extracted_water_level"] == 2.5
    assert entities["has_trapped_people"] is True

def test_reliability_engine():
    rel = ReliabilityEngine.calculate_reliability(
        source_type="field_officer",
        has_media=True,
        supporting_reports_count=2,
        has_field_confirmation=True
    )
    assert rel["final_reliability"] > 0.85
    assert len(rel["factors"]) >= 4

def test_clustering_haversine():
    dist = haversine_distance_km(26.120, 85.450, 26.125, 85.455)
    assert 0.5 <= dist <= 1.5

def test_conflict_detector():
    reports = [
        {"id": 1, "report_code": "RPT-01", "source_type": "citizen", "description": "Main river bridge completely collapsed and destroyed!", "water_level": 0.0},
        {"id": 2, "report_code": "RPT-02", "source_type": "field_officer", "description": "Bridge is open and passable for vehicles.", "water_level": 0.0}
    ]
    conflicts = ConflictDetector.detect_conflicts(reports)
    assert len(conflicts) >= 1
    assert conflicts[0]["conflict_type"] == "road_status"

def test_priority_scorer():
    priority, tier, mort, breakdown = PriorityScorer.calculate_priority(
        severity="CRITICAL",
        estimated_people_affected=600,
        access_blocked=True,
        confidence_score=0.90,
        category="trapped_persons"
    )
    assert priority >= 80.0
    assert tier == "CRITICAL"
    assert mort is True

def test_resource_optimizer():
    recommendations, explanation = ResourceOptimizer.recommend_resources(
        category="flood",
        severity="CRITICAL",
        estimated_affected=300,
        water_level=2.5,
        road_status="BLOCKED"
    )
    assert recommendations["boat"] >= 2
    assert "Rescue Boat" in explanation
