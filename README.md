# DISASTERFOG AI

> **AI-Powered Post-Disaster Multi-Source Information Fog & Rescue Decision Support System**

![Production Ready](https://img.shields.io/badge/Status-Production_Ready-emerald)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI_Python_3.11-009688)
![React + TS](https://img.shields.io/badge/Frontend-React_18_TypeScript_Vite-61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC)
![Docker](https://img.shields.io/badge/Deployment-Docker_Compose-2496ED)

---

## 1. System Overview & Problem Statement

During the critical first 24 hours following a widespread disaster, emergency operations centers receive fragmented, contradictory, and unverified reports across word-of-mouth, social media panic, and satellite fragments. 

**DISASTERFOG AI** converts noisy multi-source reports into **verified, prioritized, geospatially actionable intelligence** and optimizes scarce rescue equipment (motor boats, heavy excavators, trauma ambulances, medical teams) with transparent human-readable explanations.

---

## 2. Architecture & AI Engine Pipeline

```
                     +-------------------------------------------------+
                     |            MULTI-SOURCE INGESTION              |
                     | Citizens | Field Officers | Social | Satellites |
                     +------------------------+------------------------+
                                              |
                                              v
                     +-------------------------------------------------+
                     |          AI / DISASTER ENGINE PIPELINE          |
                     |  1. Text & Severity Classifier (NLP / Heuristic)|
                     |  2. Entity Extractor (Casualties, Water level)  |
                     |  3. Dynamic Source Reliability Evaluator         |
                     |  4. Spatial-Temporal Clustering (Deduplication) |
                     |  5. Contradiction / Conflict Detector           |
                     |  6. Incident Fusion & Evidence Aggregator       |
                     |  7. Priority & Mortality-Risk Scorer            |
                     |  8. Resource Allocation & Route Intelligence    |
                     +------------------------+------------------------+
                                              |
                                              v
+---------------------------------------------+---------------------------------------------+
|                               FASTAPI BACKEND SERVICE                                    |
|   - REST API (Auth, Incidents, Reports, Resources, Missions, Analytics, Audits)           |
|   - WebSockets Live Feed Broadcast                                                        |
|   - Simulation & Demo Engine (Scenario Player, Speed 1x-10x)                              |
|   - Database Layer (SQLAlchemy ORM + SQLite/PostgreSQL/PostGIS fallback execution)        |
+---------------------------------------------+---------------------------------------------+
                                              |
                                              v
+---------------------------------------------+---------------------------------------------+
|                                REACT + TS FRONTEND UI                                     |
|   - Command Center Dashboard (KPIs, Alert Feed, Quick Actions)                            |
|   - Interactive GIS Map (Leaflet, Severity Heatmaps, Risk Zones, Layer Toggles)           |
|   - Incident Inspection (Supporting Evidence, Conflict Resolution, Human-in-Loop)        |
|   - Resource & Rescue Mission Operations Manager                                          |
|   - Field Officer Mobile App (Offline Draft Queue & Automatic Sync)                       |
|   - Simulation Control Bar (Play, Pause, Speed 1x-10x, Event Generator)                   |
|   - Analytics & Audit Logs Dashboard                                                      |
+-------------------------------------------------------------------------------------------+
```

### Key AI Algorithms:
1. **Dynamic Transparent Reliability Engine**:
   $$\text{Reliability} = \text{Baseline}(\text{SourceType}) + \text{MediaBonus} + \text{CrossAgreementBonus} - \text{ContradictionPenalty}$$
   Returns transparent factor breakdown for every report.
2. **Spatial-Temporal-Semantic Deduplication**: Uses Haversine geographical distance ($\le 1.8\text{km}$), temporal proximity ($< 120\text{m}$), and Jaccard token overlap to fuse raw reports into unified incidents.
3. **Contradiction Detection Engine**: Flags conflicting claims (e.g. "bridge collapsed" vs "bridge open", or major water depth disparities) for human review.
4. **Explainable Priority & High-Mortality Risk Scoring**:
   $$\text{Priority} = 0.30 \cdot \text{Severity} + 0.25 \cdot \text{PeopleAtRisk} + 0.15 \cdot \text{Vulnerability} + 0.10 \cdot \text{Access} + 0.10 \cdot \text{Confidence} + 0.10 \cdot \text{Time}$$
5. **Rescue Resource Optimizer**: Recommends equipment matching ground conditions with natural language reasoning (e.g., *"Deploy 2 Motorized Boats & 1 Trauma Medical Team because 320 people are trapped in 2.5m floodwater with blocked road access"*).

---

## 3. Quickstart & Installation Guide

### Method 1: Local Direct Execution (Zero External Dependencies)

#### 1. Backend Setup:
```bash
cd backend
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m app.main
```
> If you are running from the backend folder and the app still cannot resolve imports, use the module form above or run `PYTHONPATH=. python app/main.py`.

*Backend API server will run at http://localhost:8000 (OpenAPI Docs at http://localhost:8000/docs).*

#### 2. Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```
*Frontend application will run at http://localhost:3000.*

---

### Method 2: Docker Compose Deployment

```bash
docker compose up --build
```
*Access Frontend at http://localhost:3000 and Backend API at http://localhost:8000.*

---

## 4. Hackathon 3–5 Minute Judge Demonstration Flow

1. **Activate DEMO MODE**: Click the **DEMO MODE** button on the top navigation bar.
2. **Run Scenario**: Click **"START SCENARIO"** (or adjust speed to 5x / 10x).
3. **Observe Live Ingestion**:
   - Watch incoming reports stream via WebSockets.
   - Observe automatic clustering of 127 raw reports into unified incidents.
4. **Inspect Conflict Resolution**:
   - Open Incident **INC-0003** (Main Bridge Overpass).
   - View the flagged **Contradiction Panel** comparing unverified social media claims against verified field officer reports.
5. **Inspect High Mortality Zone & Explainable AI**:
   - Select **INC-0001** (St. Jude Model School).
   - View the **High Mortality Risk Zone** tag, priority score (94.5), and the natural language AI explanation for deploying motor boats and trauma medical teams.
6. **Verify & Dispatch Mission**:
   - Click **"VERIFY & APPROVE"** as EOC Controller.
   - Click **"CREATE RESCUE MISSION"**. Observe assigned resource status transition to `DEPLOYED`.
7. **Offline Mobile Field Tool Demonstration**:
   - Navigate to **"Field Submission"**. Toggle Offline mode, submit a report, observe it saved to local queue, reconnect, and watch it auto-sync.
8. **Audit Trail & Analytics**:
   - Navigate to **"Analytics"** to view real-time charts and **"Audit Logs"** to verify system compliance.

---

## 5. Automated Test Suite

Run backend pytest unit and integration tests:
```bash
python -m pytest backend/tests
```

---

## 6. Default Demo User Accounts

| Role | Username | Password |
|---|---|---|
| Administrator | `admin` | `password123` |
| EOC Controller | `eoc_operator` | `password123` |
| Field Officer | `field_officer` | `password123` |
| Rescue Leader | `rescue_leader` | `password123` |
| Analyst | `analyst_user` | `password123` |
