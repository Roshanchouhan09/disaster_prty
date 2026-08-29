from typing import Dict, Any, Tuple
from app.config import settings

SEVERITY_TIER_SCORES = {
    "CRITICAL": 100.0,
    "HIGH": 75.0,
    "MEDIUM": 45.0,
    "LOW": 20.0,
    "UNKNOWN": 10.0
}

class PriorityScorer:
    """Calculates explainable multi-factor priority scores and identifies High-Mortality Risk Zones."""

    @staticmethod
    def calculate_priority(
        severity: str,
        estimated_people_affected: int,
        vulnerability_index: float = 0.5, # 0.0 to 1.0
        access_blocked: bool = False,
        confidence_score: float = 0.70, # 0.0 to 1.0
        minutes_since_first_report: float = 30.0,
        category: str = "unknown"
    ) -> Tuple[float, str, bool, Dict[str, Any]]:
        """
        Returns (priority_score_0_100, priority_tier, is_high_mortality_zone, breakdown_dict)
        """
        # 1. Threat Severity component (0-100)
        threat_score = SEVERITY_TIER_SCORES.get(severity.upper(), 30.0)

        # 2. People at Risk component (0-100, log-scaled)
        if estimated_people_affected <= 0:
            people_score = 10.0
        elif estimated_people_affected < 20:
            people_score = 35.0
        elif estimated_people_affected < 100:
            people_score = 65.0
        elif estimated_people_affected < 500:
            people_score = 85.0
        else:
            people_score = 100.0

        # 3. Vulnerability score (0-100)
        vuln_score = vulnerability_index * 100.0

        # 4. Access difficulty (0-100)
        access_score = 90.0 if access_blocked else 30.0

        # 5. Confidence score (0-100)
        conf_score = confidence_score * 100.0

        # 6. Time Criticality (0-100) - urgency increases as time elapses without resolution
        time_score = min(100.0, max(20.0, 20.0 + (minutes_since_first_report * 0.5)))

        # Weighted calculation based on admin configured weights
        w_sev = settings.WEIGHT_SEVERITY
        w_peo = settings.WEIGHT_PEOPLE_AT_RISK
        w_vul = settings.WEIGHT_VULNERABILITY
        w_acc = settings.WEIGHT_ACCESS_DIFFICULTY
        w_cnf = settings.WEIGHT_CONFIDENCE
        w_tim = settings.WEIGHT_TIME_CRITICALITY

        final_priority = (
            (w_sev * threat_score) +
            (w_peo * people_score) +
            (w_vul * vuln_score) +
            (w_acc * access_score) +
            (w_cnf * conf_score) +
            (w_tim * time_score)
        )
        final_priority = round(min(100.0, max(0.0, final_priority)), 1)

        # Priority tier mapping
        if final_priority >= 80.0:
            tier = "CRITICAL"
        elif final_priority >= 60.0:
            tier = "HIGH"
        elif final_priority >= 40.0:
            tier = "MEDIUM"
        else:
            tier = "LOW"

        # High-Mortality Risk Zone Trigger
        is_high_mortality = False
        if final_priority >= 75.0 or category in ["building_collapse", "trapped_persons"] or estimated_people_affected >= 100:
            is_high_mortality = True

        breakdown = {
            "threat_severity_score": threat_score,
            "people_at_risk_score": people_score,
            "vulnerability_score": vuln_score,
            "access_difficulty_score": access_score,
            "confidence_score": conf_score,
            "time_criticality_score": time_score,
            "weights": {
                "severity": w_sev,
                "people_at_risk": w_peo,
                "vulnerability": w_vul,
                "access": w_acc,
                "confidence": w_cnf,
                "time": w_tim
            }
        }

        return final_priority, tier, is_high_mortality, breakdown
