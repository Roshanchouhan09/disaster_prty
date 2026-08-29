from typing import Dict, Any, List

SOURCE_BASELINES = {
    "citizen": 0.45,
    "social_media": 0.35,
    "emergency_comm": 0.85,
    "field_officer": 0.80,
    "government": 0.90,
    "satellite": 0.90,
    "iot_sensor": 0.95
}

class ReliabilityEngine:
    """Calculates dynamic, transparent, explainable source reliability scores."""

    @staticmethod
    def calculate_reliability(
        source_type: str,
        has_media: bool = False,
        supporting_reports_count: int = 0,
        has_field_confirmation: bool = False,
        has_contradiction: bool = False,
        is_stale: bool = False,
        has_gps_coords: bool = True
    ) -> Dict[str, Any]:
        
        baseline = SOURCE_BASELINES.get(source_type.lower(), 0.50)
        score = baseline
        factors: List[Dict[str, Any]] = []

        factors.append({
            "factor": f"Source Baseline ({source_type.replace('_', ' ').title()})",
            "delta": round(baseline, 2),
            "running_total": round(score, 2)
        })

        if has_media:
            delta = 0.10
            score += delta
            factors.append({
                "factor": "Media Evidence Attached (Photo/Video)",
                "delta": +delta,
                "running_total": round(score, 2)
            })

        if supporting_reports_count > 0:
            delta = min(0.20, supporting_reports_count * 0.05)
            score += delta
            factors.append({
                "factor": f"Cross-Source Agreement ({supporting_reports_count} supporting reports)",
                "delta": round(+delta, 2),
                "running_total": round(score, 2)
            })

        if has_field_confirmation:
            delta = 0.15
            score += delta
            factors.append({
                "factor": "Verified Field Officer Confirmation",
                "delta": +delta,
                "running_total": round(score, 2)
            })

        if has_gps_coords:
            delta = 0.05
            score += delta
            factors.append({
                "factor": "Exact Geolocation Coordinates",
                "delta": +delta,
                "running_total": round(score, 2)
            })

        if has_contradiction:
            delta = -0.20
            score += delta
            factors.append({
                "factor": "Contradictory Evidence Flagged",
                "delta": delta,
                "running_total": round(score, 2)
            })

        if is_stale:
            delta = -0.10
            score += delta
            factors.append({
                "factor": "Stale Report (>2 hours old without update)",
                "delta": delta,
                "running_total": round(score, 2)
            })

        final_score = round(min(0.99, max(0.05, score)), 2)

        return {
            "source_type": source_type,
            "final_reliability": final_score,
            "confidence_percentage": int(final_score * 100),
            "factors": factors
        }
