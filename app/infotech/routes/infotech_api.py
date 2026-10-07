from fastapi import APIRouter, Depends, Request
from fastapi.encoders import jsonable_encoder
from app.database import get_db
from sqlalchemy.orm import Session
from app.infotech.services.infotech_database import assignment_requests, get_devices, add_device, get_device_by_query
from app.services.request_forms import infotech_request_info
import app.ms_api.authentication as msapi
from app.infotech.models import Devices, AddDevice, AddAssignment
from app.config import settings
from uuid import UUID
import requests

router = APIRouter(prefix="/it/api", tags=["infotech_api"])

list_url = settings.LIST_URL
devices_id = settings.DEVICES_ID
insert_url = f"{list_url}/{devices_id}/items"

columnMapping = {
    "asset_number": "Title",
    "serial_number": "SerialNumber",
    "manufacturer": "Manufacturer",
    "model": "Model",
    "asset_type": "AssetType",
    "status": "Status",
    "purchase_price": "PurchasePrice",
    "asset_number": "Title",
    "order_number": "OrderNumber",
    "condition_notes": "ConditionNotes",
    "current": "CurrentOwnerLookupId",
    "previous": "PreviousOwnerLookupId"
}

@router.get("/requests")
def get_assignment_requests(db: Session = Depends(get_db)):
    return assignment_requests(db=db)

@router.get("/devices")
def get_devices_api(db: Session = Depends(get_db)):
    return get_devices(db=db)

@router.post("/devices")
async def add_device_post(
    device: AddDevice,
    db: Session = Depends(get_db)):
    body = {
        "fields": {}
    }
    device_info = jsonable_encoder(device.model_dump())
    for key, value in device_info.items():
        if key in columnMapping and value is not None:
            body["fields"][columnMapping[key]] = value

    try:
        response = msapi.call_graph_api(
            url=insert_url,
            method="POST", 
            json_body=body)

        response.raise_for_status()
        sharepoint_id = response.json()['id']
        device.sharepoint_id = int(sharepoint_id)

    except requests.exceptions.RequestException as e:
        print(f"Microsoft graph error: {e}")
    except (ValueError, KeyError) as e:
        print(f"Could not extract Sharpoint item ID from the response!")

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
    # users = get_tenant_user_by_query(db=db, query=query)
    # return users
    pass


# @router.post("/assign")
# def assign_device(
#     payload: AddAssignment,
#     db:Session = Depends(get_db),
#     ):
#     create_assignment(
#         db=db, **payload.model_dump())
