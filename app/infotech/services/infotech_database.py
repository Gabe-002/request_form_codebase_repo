from app.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select, insert, update, and_, or_
from app.models import Requests, People
from app.infotech.models import Devices, AddDevice, TenantUsers, Assignments, AddAssignment, CreateTenantUser, TenantSyncState
from uuid import UUID
from datetime import datetime


def format_output(model, request):
    return {
        column.name: getattr(request, column.name)
        for column in model.__table__.columns
    }

def simple_format(model, objects):
    return [{
        column.name: getattr(object, column.name)
        for column in model.__table__.columns
    } for object in objects]

def assignment_requests(db: Session):
    statement = (select(Requests, People)
    .join(People, People.id == Requests.person_id)
    .where(and_(
        Requests.pm_review_status == 'approved',
        Requests.fd_review_status == 'approved',
        Requests.it_review == 'pending'
    )))
    full_requests = db.execute(statement=statement).all()
    output = []
    for full_request in full_requests:
        request = format_output(Requests, full_request[0])
        people = format_output(People, full_request[1])
        output.append(people | request) # This combines the resulting dictionaries
    return output

def get_devices(db: Session):
    statement = select(Devices)
    devices = db.execute(statement=statement).scalars().all()
    return simple_format(Devices, devices)

def add_device(db: Session, device: AddDevice):
    statement = insert(Devices).values(**device.model_dump())
    try:   
        db.execute(statement=statement)
        db.commit()
    except IntegrityError:
        db.rollback()

def add_tenant_user(
    db: Session,
    payload: CreateTenantUser      
    ):
    statement = insert(TenantUsers).values(**payload.model_dump())
    db.execute(statement=statement)
    db.commit()    

def get_device_by_query(db: Session, query: str):
    statement = select(
        Devices.id,
        Devices.asset_number,
        Devices.model,
        Devices.manufacturer,
        Devices.serial_number).where(
        or_(
            Devices.asset_number.ilike(f"%{query}%"),
            Devices.model.ilike(f"%{query}%"),
            Devices.manufacturer.ilike(f"%{query}%")
        ),
        and_(Devices.status == 'available'),
        and_(Devices.asset_type == 'Laptop')
    )
    results = [
        row
        for row in db.execute(statement=statement).mappings().all()
    ]
    return results

def get_delta_link(db: Session):
    statement = (
        select(TenantSyncState.delta_link)
        .order_by(TenantSyncState.last_sync_at.desc())
        .limit(1)
    )
    delta_link = db.execute(statement=statement).scalar_one_or_none()
    return delta_link

from app.ms_api.authentication import call_graph_api

def sync_tenant_users(db: Session):

    columnMapping = {
        "displayName": "display_name",
        "mail": "email",
        "accountEnabled": "account_enabled",
        "id": "graph_id"
    }

    delta_link = get_delta_link(db)
    response = call_graph_api(delta_link)

    changes = response.json().get('value', '')
    for change in changes:
        print(change)



    pass

    

if __name__ == '__main__':
    db = get_db()
    db = next(db)

    print(sync_tenant_users(db))