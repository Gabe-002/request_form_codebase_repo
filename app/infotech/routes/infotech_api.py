from fastapi import APIRouter, Depends, Request
from app.database import get_db
from sqlalchemy.orm import Session
from app.infotech.services.infotech_database import assignment_requests, get_devices, add_device, get_device_by_query, get_tenant_user_by_query, create_assignment
from app.services.request_forms import infotech_request_info
from app.infotech.models import Devices, AddDevice, AddAssignment
from uuid import UUID

router = APIRouter(prefix="/it/api", tags=["infotech_api"])

@router.get("/requests")
def get_assignment_requests(db: Session = Depends(get_db)):
    return assignment_requests(db=db)

@router.get("/devices")
def get_devices_api(db: Session = Depends(get_db)):
    return get_devices(db=db)

@router.post("/devices")
def add_device_post(
    device: AddDevice,
    db: Session = Depends(get_db)):
    add_device(db, device)

@router.get("/request")
def get_request_info(request_id: int, db: Session = Depends(get_db)):
    request =  infotech_request_info(db, request_id)
    return request

@router.get("/query/devices")
def query_devices(query: str, db: Session = Depends(get_db)):
    laptops = get_device_by_query(db=db, query=query)
    return laptops

@router.get("/query/users")
def query_users(query: str, db: Session = Depends(get_db)):
    users = get_tenant_user_by_query(db=db, query=query)
    return users

@router.post("/assign")
def assign_device(
    payload: AddAssignment,
    db:Session = Depends(get_db),
    ):
    create_assignment(
        db=db, **payload.model_dump())