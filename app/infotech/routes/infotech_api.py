from fastapi import APIRouter, Depends, Request
from app.database import get_db
from sqlalchemy.orm import Session
from app.infotech.services.infotech_database import assignment_requests, get_devices, add_device
from app.services.request_forms import infotech_request_info
from app.infotech.models import Devices, AddDevice

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
    return infotech_request_info(db, request_id)