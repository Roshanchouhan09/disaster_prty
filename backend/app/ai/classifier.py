import re
from typing import Dict, Any, Tuple

CATEGORY_KEYWORDS = {
    "flood": ["flood", "water", "inundated", "submerged", "river", "overflow", "flooding", "drowning", "rising water"],
    "building_collapse": ["collapse", "collapsed", "rubble", "caved in", "structure failure", "trapped under debris", "crushed", "building fell"],
    "road_blockage": ["road blocked", "landslide", "mudslide", "debris on road", "road closed", "impassable", "boulder", "cut off"],
    "bridge_damage": ["bridge", "overpass", "bridge collapse", "bridge damaged", "river crossing blocked", "washed away"],
    "fire": ["fire", "blaze", "explosion", "smoke", "burning", "flames"],
    "medical_emergency": ["injured", "medical", "ambulance", "bleeding", "casualties", "sick", "hospital needed", "unconscious", "fatalities"],
    "trapped_persons": ["trapped", "marooned", "stranded", "cannot exit", "roof", "rooftop", "stuck in water", "help needed"],
    "shelter_emergency": ["shelter", "homeless", "food", "drinking water", "blankets", "relief camp"],
    "infrastructure_failure": ["power grid", "transformer", "electricity down", "dam breach", "levee", "communication down", "substation"]
}

SEVERITY_KEYWORDS = {
    "CRITICAL": ["massive", "severe", "death", "fatal", "trapped children", "complete collapse", "chest deep", "submerged roofs", "urgent", "dying", "critical"],
    "HIGH": ["heavy", "rising fast", "extensive damage", "multiple injured", "trapped", "knee deep", "no access", "landslide"],
    "MEDIUM": ["water logging", "waist deep", "minor injuries", "partially blocked", "cracked wall", "slow movement"],
    "LOW": ["minor", "drizzle", "small puddle", "power flicker", "precautionary", "standing water"]
}

class AIClassifier:
    """NLP Text & Severity Classifier + Entity Extractor for Disaster Reports"""
    
    @staticmethod
    def classify_text(text: str, damage_type: str = "unknown", water_level: float = 0.0) -> Tuple[str, str, float]:
        text_lower = text.lower()
        
        category_scores = {cat: 0 for cat in CATEGORY_KEYWORDS}
        for cat, keywords in CATEGORY_KEYWORDS.items():
            for kw in keywords:
                if kw in text_lower:
                    category_scores[cat] += 1
        
        if damage_type in CATEGORY_KEYWORDS:
            category_scores[damage_type] += 3
        if water_level > 0.5:
            category_scores["flood"] += 2
        
        best_category = max(category_scores, key=category_scores.get)
        if category_scores[best_category] == 0:
            best_category = "unknown"
            
        severity_scores = {sev: 0 for sev in SEVERITY_KEYWORDS}
        for sev, keywords in SEVERITY_KEYWORDS.items():
            for kw in keywords:
                if kw in text_lower:
                    severity_scores[sev] += 1
                    
        if water_level >= 2.0 or "collapse" in text_lower or "trapped" in text_lower:
            severity_scores["CRITICAL"] += 3
        elif water_level >= 1.0 or "injured" in text_lower:
            severity_scores["HIGH"] += 2
        elif water_level >= 0.3:
            severity_scores["MEDIUM"] += 1
            
        best_severity = max(severity_scores, key=severity_scores.get)
        if severity_scores[best_severity] == 0:
            best_severity = "MEDIUM" if water_level > 0 else "LOW"
            
        total_matches = sum(category_scores.values()) + sum(severity_scores.values())
        confidence = min(0.95, max(0.55, 0.50 + (total_matches * 0.08)))
        
        return best_category, best_severity, round(confidence, 2)

    @staticmethod
    def extract_entities(text: str) -> Dict[str, Any]:
        text_lower = text.lower()
        entities = {
            "estimated_people": 0,
            "extracted_water_level": 0.0,
            "has_trapped_people": False,
            "has_injuries": False,
            "road_status": "UNKNOWN"
        }
        
        people_matches = re.findall(r'(\d+)\s*(?:people|civilians|residents|persons|citizens|children|families|trapped)', text_lower)
        if people_matches:
            entities["estimated_people"] = sum(int(m) for m in people_matches[:3])
            
        water_m_matches = re.findall(r'(\d+(?:\.\d+)?)\s*(?:meters|m|meter)', text_lower)
        if water_m_matches:
            entities["extracted_water_level"] = float(water_m_matches[0])
        else:
            water_ft_matches = re.findall(r'(\d+(?:\.\d+)?)\s*(?:feet|ft)', text_lower)
            if water_ft_matches:
                entities["extracted_water_level"] = round(float(water_ft_matches[0]) * 0.3048, 2)
                
        if any(w in text_lower for w in ["trapped", "marooned", "stranded", "stuck"]):
            entities["has_trapped_people"] = True
        if any(w in text_lower for w in ["injured", "casualties", "bleeding", "hospital", "dead"]):
            entities["has_injuries"] = True
            
        if any(w in text_lower for w in ["road clear", "passable", "vehicles crossing"]):
            entities["road_status"] = "SAFE"
        elif any(w in text_lower for w in ["road blocked", "impassable", "landslide", "cut off"]):
            entities["road_status"] = "BLOCKED"
            
        return entities
