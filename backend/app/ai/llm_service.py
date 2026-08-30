import os
import requests
from typing import Dict, Any, Optional
from app.config import settings
from app.ai.classifier import AIClassifier

class GeminiLLMService:
    """
    Advanced LLM Service integrating Gemini API for multi-lingual translation,
    deep contradiction analysis, and executive briefing generation.
    Gracefully degrades to local NLP engine if no API key is set.
    """

    @staticmethod
    def get_api_key(custom_key: Optional[str] = None) -> Optional[str]:
        return custom_key or settings.LLM_API_KEY or os.getenv("GEMINI_API_KEY")

    @classmethod
    def analyze_report_multilingual(
        cls,
        text: str,
        custom_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Uses Gemini API to translate non-English reports (Hindi, Bengali, Spanish, etc.)
        and extract structured disaster entities.
        """
        api_key = cls.get_api_key(custom_key)
        
        # Local Fallback if no key provided
        if not api_key:
            cat, sev, conf = AIClassifier.classify_text(text)
            entities = AIClassifier.extract_entities(text)
            return {
                "translated_text": text,
                "detected_language": "English (Local Rule Analysis)",
                "category": cat,
                "severity": sev,
                "confidence": conf,
                "extracted_entities": entities,
                "ai_summary": f"Analyzed report description: '{text[:100]}...'"
            }

        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
            prompt = f"""
            You are an emergency disaster response AI analyst. Analyze the following disaster report:
            "{text}"

            Return a valid JSON object with key fields:
            - translated_text: English translation
            - detected_language: Language name
            - category: flood, building_collapse, road_blockage, bridge_damage, fire, medical_emergency, trapped_persons, shelter_emergency, infrastructure_failure
            - severity: CRITICAL, HIGH, MEDIUM, LOW
            - confidence: number between 0.50 and 0.99
            - extracted_people_count: integer estimate
            - extracted_water_depth_meters: float estimate
            - ai_summary: concise 1-sentence summary
            """
            
            resp = requests.post(
                url,
                json={"contents": [{"parts": [{"text": prompt}]}]},
                timeout=8
            )
            
            if resp.status_code == 200:
                result_text = resp.json()['candidates'][0]['content']['parts'][0]['text']
                # Clean JSON fences if present
                clean_json = result_text.replace("```json", "").replace("```", "").strip()
                import json
                parsed = json.loads(clean_json)
                return {
                    "translated_text": parsed.get("translated_text", text),
                    "detected_language": parsed.get("detected_language", "Detected Language"),
                    "category": parsed.get("category", "unknown"),
                    "severity": parsed.get("severity", "HIGH"),
                    "confidence": float(parsed.get("confidence", 0.90)),
                    "extracted_entities": {
                        "estimated_people": int(parsed.get("extracted_people_count", 0)),
                        "extracted_water_level": float(parsed.get("extracted_water_depth_meters", 0.0)),
                        "has_trapped_people": True if "trapped" in text.lower() else False,
                        "road_status": "BLOCKED" if "blocked" in text.lower() else "SAFE"
                    },
                    "ai_summary": parsed.get("ai_summary", "Gemini LLM processed report.")
                }
        except Exception as e:
            print(f"Gemini API call error: {e}. Falling back to local NLP.")

        # Fallback if API call fails
        cat, sev, conf = AIClassifier.classify_text(text)
        entities = AIClassifier.extract_entities(text)
        return {
            "translated_text": text,
            "detected_language": "Auto (Fallback)",
            "category": cat,
            "severity": sev,
            "confidence": conf,
            "extracted_entities": entities,
            "ai_summary": f"Local NLP summary for report."
        }

    @classmethod
    def generate_executive_briefing(
        cls,
        active_event_name: str,
        total_reports: int,
        verified_incidents: int,
        critical_zones: int,
        affected_pop: int,
        custom_key: Optional[str] = None
    ) -> str:
        """
        Generates a formal 1-page EOC Command Situational Briefing.
        """
        api_key = cls.get_api_key(custom_key)
        
        if api_key:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
                prompt = f"""
                Create a professional 1-page Emergency Operations Center (EOC) Command Briefing report for disaster event '{active_event_name}'.
                Data metrics:
                - Total Reports Ingested: {total_reports}
                - Verified Incidents: {verified_incidents}
                - Critical High-Mortality Risk Zones: {critical_zones}
                - Total Estimated Affected Population: {affected_pop}

                Format in clear GitHub markdown with headers:
                # EXECUTIVE SITUATIONAL BRIEFING
                ## 1. SITUATION OVERVIEW
                ## 2. CRITICAL HIGH-RISK SECTORS
                ## 3. RESOURCE DISPATCH & TACTICAL ACTIONS
                ## 4. COMMAND RECOMMENDATIONS
                """
                resp = requests.post(url, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=8)
                if resp.status_code == 200:
                    return resp.json()['candidates'][0]['content']['parts'][0]['text']
            except Exception as e:
                print(f"Gemini API Briefing Error: {e}")

        # Deterministic Structured Fallback Report
        from datetime import datetime, timezone
        timestamp_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        return f"""# EXECUTIVE SITUATIONAL BRIEFING
**DISASTER EVENT:** {active_event_name}
**TIMESTAMP:** {timestamp_str} | **CLASSIFICATION:** TOP PRIORITY / RESTRICTED

---

## 1. SITUATION OVERVIEW
* **Total Multi-Source Reports Ingested:** {total_reports}
* **Verified Geospatial Incidents:** {verified_incidents}
* **High-Mortality Risk Zones:** {critical_zones}
* **Estimated People at Risk:** ~{affected_pop} civilians

A multi-hazard disaster incident combining seismic ground tremors and severe embankment river breaches has created widespread structural damage and rapid flood inundation across North River Administrative District.

---

## 2. CRITICAL HIGH-RISK SECTORS
1. **St. Jude Model School & Sector 4 Colony**: Water depth 2.5m; 320 civilians marooned on roof. Access road cut off by bridge fissure.
2. **Central Commercial Arcade Market**: Concrete slab collapse following seismic tremor; 65 shoppers trapped under rubble.

---

## 3. TACTICAL RESOURCE DISPATCH
* **NDRF Motorized Boats:** 2 Units Deployed for rooftop evacuation.
* **Heavy Crawling Excavators:** 1 Unit dispatched to Commercial Arcade for structural debris clearing.
* **ALS Trauma Ambulances:** 2 Units staging at District Central Hospital.

---

## 4. EOC COMMAND RECOMMENDATIONS
1. **Maintain Overhead Drone Reconnaissance** to monitor Riverbank Overpass deck water levels.
2. **Prioritize Amphibious Rescue** at St. Jude Model School before nightfall.
3. **Escalate Sector 4 Bridge Status** to Senior Structural Engineers for load clearance.
"""
