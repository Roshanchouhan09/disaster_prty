from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.db.models import DisasterEvent
from pydantic import BaseModel, ConfigDict
from datetime import datetime

router = APIRouter(prefix="/events", tags=["Disaster Events"])

class EventBase(BaseModel):
    name: str
    hazard_type: str
    region_name: str
    center_lat: float
    center_lng: float

class EventResponse(EventBase):
    id: int
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

@router.get("", response_model=List[EventResponse])
def list_events(db: Session = Depends(get_db)):
    return db.query(DisasterEvent).all()

@router.post("", response_model=EventResponse)
def create_event(event_in: EventBase, db: Session = Depends(get_db)):
    event = DisasterEvent(
        name=event_in.name,
        hazard_type=event_in.hazard_type,
        region_name=event_in.region_name,
        center_lat=event_in.center_lat,
        center_lng=event_in.center_lng,
        status="ACTIVE"
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
