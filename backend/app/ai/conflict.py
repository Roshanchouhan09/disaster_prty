from typing import List, Dict, Any, Optional

class ConflictDetector:
    """Identifies contradictory claims across reports merged into the same incident."""

    @staticmethod
    def detect_conflicts(reports: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Scans a list of reports belonging to a single incident and returns detected conflict records.
        """
        conflicts = []
        n = len(reports)
        
        if n < 2:
            return conflicts

        for i in range(n):
            for j in range(i + 1, n):
                r1 = reports[i]
                r2 = reports[j]
                
                desc1 = r1["description"].lower()
                desc2 = r2["description"].lower()

                # 1. Road Status Contradiction
                r1_blocked = any(w in desc1 for w in ["blocked", "impassable", "collapsed", "cut off"])
                r1_clear = any(w in desc1 for w in ["clear", "passable", "open", "vehicles crossing"])
                
                r2_blocked = any(w in desc2 for w in ["blocked", "impassable", "collapsed", "cut off"])
                r2_clear = any(w in desc2 for w in ["clear", "passable", "open", "vehicles crossing"])

                if (r1_blocked and r2_clear) or (r1_clear and r2_blocked):
                    conflicts.append({
                        "conflict_type": "road_status",
                        "report_a_id": r1["id"],
                        "report_b_id": r2["id"],
                        "claim_a": f"Source ({r1.get('source_type')}): '{r1['description']}'",
                        "claim_b": f"Source ({r2.get('source_type')}): '{r2['description']}'",
                        "description": f"Contradiction detected regarding road access: Report {r1.get('report_code', r1['id'])} vs Report {r2.get('report_code', r2['id'])}"
                    })

                # 2. Water Depth Contradiction
                w1 = r1.get("water_level", 0.0)
                w2 = r2.get("water_level", 0.0)
                if w1 > 0 and w2 > 0 and abs(w1 - w2) >= 1.5:
                    conflicts.append({
                        "conflict_type": "water_level",
                        "report_a_id": r1["id"],
                        "report_b_id": r2["id"],
                        "claim_a": f"Reported water level: {w1} meters",
                        "claim_b": f"Reported water level: {w2} meters",
                        "description": f"Significant water depth disparity ({w1}m vs {w2}m) reported at the same location."
                    })

                # 3. Damage Severity Contradiction
                if ("complete collapse" in desc1 and "minor scratch" in desc2) or \
                   ("minor scratch" in desc1 and "complete collapse" in desc2):
                    conflicts.append({
                        "conflict_type": "damage_scale",
                        "report_a_id": r1["id"],
                        "report_b_id": r2["id"],
                        "claim_a": f"Claim A: {r1['description']}",
                        "claim_b": f"Claim B: {r2['description']}",
                        "description": "Contradictory damage severity descriptions reported across sources."
                    })

        return conflicts
