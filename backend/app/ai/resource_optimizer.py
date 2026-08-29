from typing import Dict, Any, List, Tuple

class ResourceOptimizer:
    """Recommends resource allocation (boats, excavators, ambulances, medical teams) with explainable natural language reasons."""

    @staticmethod
    def recommend_resources(
        category: str,
        severity: str,
        estimated_affected: int,
        water_level: float = 0.0,
        road_status: str = "SAFE",
        report_count: int = 1
    ) -> Tuple[Dict[str, int], str]:
        """
        Returns (recommended_counts_dict, human_explanation_text)
        """
        recommendations = {
            "boat": 0,
            "excavator": 0,
            "ambulance": 0,
            "medical_team": 0,
            "rescue_personnel": 0,
            "shelter_kit": 0,
            "food_water_unit": 0
        }
        reasons = []

        # 1. Flood & Water Level rules
        if category in ["flood", "trapped_persons"] or water_level > 0.5:
            boat_count = max(1, min(6, int(estimated_affected / 60) + 1))
            recommendations["boat"] = boat_count
            recommendations["rescue_personnel"] += boat_count * 4
            reasons.append(f"{boat_count} Rescue Boat(s) required due to {water_level:.1f}m water depth and trapped civilians.")

        # 2. Structural collapse rules
        if category == "building_collapse":
            recommendations["excavator"] = 2 if estimated_affected > 50 else 1
            recommendations["rescue_personnel"] += 10
            recommendations["medical_team"] += 1
            reasons.append(f"{recommendations['excavator']} Heavy Excavator(s) recommended for rubble extraction and structure clearing.")

        # 3. Medical Emergency & Casualty rules
        if category in ["medical_emergency", "building_collapse"] or severity in ["CRITICAL", "HIGH"]:
            medical_teams = 2 if estimated_affected > 100 else 1
            ambulances = max(1, min(5, int(estimated_affected / 40) + 1))
            recommendations["medical_team"] += medical_teams
            recommendations["ambulance"] += ambulances
            reasons.append(f"{medical_teams} Trauma Medical Team(s) and {ambulances} Ambulance(s) dispatched for critical triage.")

        # 4. Road Blockage rules
        if category == "road_blockage" or road_status == "BLOCKED":
            if recommendations["excavator"] == 0:
                recommendations["excavator"] = 1
            reasons.append("Road blockage detected along access route; heavy equipment needed to clear transit corridor.")

        # 5. Mass displacement & Shelter / Relief rules
        if estimated_affected >= 50:
            food_units = max(1, int(estimated_affected / 50))
            shelter_kits = max(1, int(estimated_affected / 30))
            recommendations["food_water_unit"] = food_units
            recommendations["shelter_kit"] = shelter_kits
            reasons.append(f"{food_units} Emergency Food/Water Unit(s) and {shelter_kits} Relief Shelter Kit(s) provisioned for {estimated_affected} affected residents.")

        # Default fallback if empty
        if sum(recommendations.values()) == 0:
            recommendations["rescue_personnel"] = 5
            reasons.append("Standard 5-person disaster reconnaissance team assigned for initial assessment.")

        explanation = f"AI Assessment for {severity} {category.replace('_', ' ').upper()} (Affecting ~{estimated_affected} people): " + " ".join(reasons) + f" (Ground evidence supported by {report_count} independent report(s))."

        return recommendations, explanation
