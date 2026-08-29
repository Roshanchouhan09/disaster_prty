from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.db.models import Resource
from app.schemas.schemas import ResourceCreate, ResourceResponse

router = APIRouter(prefix="/resources", tags=["Resource Management"])

@router.get("", response_model=List[ResourceResponse])
def list_resources(status: Optional[str] = None, resource_type: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Resource)
    if status:
        query = query.filter(Resource.status == status)
    if resource_type:
        query = query.filter(Resource.resource_type == resource_type)
    return query.all()

@router.post("", response_model=ResourceResponse)
def create_resource(res_in: ResourceCreate, db: Session = Depends(get_db)):
    res = Resource(
        code=res_in.code,
        name=res_in.name,
        resource_type=res_in.resource_type,
        status=res_in.status,
        location_lat=res_in.location_lat,
        location_lng=res_in.location_lng,
        capacity=res_in.capacity
    )
    db.add(res)
    db.commit()
    db.refresh(res)
    return res
