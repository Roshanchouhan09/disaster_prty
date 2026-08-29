import math
from typing import List, Dict, Any, Optional

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates the great-circle distance between two points on the Earth in km."""
    R = 6371.0 # Earth radius in km
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

def jaccard_similarity(text1: str, text2: str) -> float:
    """Calculates word token overlap ratio between two texts."""
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    
    if not words1 or not words2:
        return 0.0
        
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    
    return len(intersection) / len(union)

class ReportClusteringEngine:
    """Groups incoming disaster reports into spatially, temporally, and semantically unified incidents."""
    
    MAX_CLUSTER_DISTANCE_KM = 1.8 # max 1.8km radius for cluster
    MIN_SEMANTIC_SIMILARITY = 0.15 # token overlap threshold
    
    @classmethod
    def find_matching_incident(
        cls,
        new_report: Dict[str, Any],
        active_incidents: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """
        Finds the best active incident to merge this report into, or returns None if it's a new incident.
        """
        new_lat = new_report["latitude"]
        new_lng = new_report["longitude"]
        new_category = new_report.get("category", "unknown")
        new_text = new_report.get("description", "")
        
        best_match = None
        highest_score = 0.0
        
        for incident in active_incidents:
            dist_km = haversine_distance_km(new_lat, new_lng, incident["latitude"], incident["longitude"])
            
            if dist_km <= cls.MAX_CLUSTER_DISTANCE_KM:
                category_match = (new_category == incident["category"]) or (new_category == "unknown" or incident["category"] == "unknown")
                similarity = jaccard_similarity(new_text, incident.get("description_summary", ""))
                
                # Composite matching score
                spatial_score = 1.0 - (dist_km / cls.MAX_CLUSTER_DISTANCE_KM)
                category_score = 1.0 if category_match else 0.4
                
                match_score = (spatial_score * 0.5) + (category_score * 0.3) + (similarity * 0.2)
                
                if match_score > 0.45 and match_score > highest_score:
                    highest_score = match_score
                    best_match = incident
                    
        return best_match
