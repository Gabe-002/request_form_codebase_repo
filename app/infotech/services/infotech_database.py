from app.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select, insert, update, and_, or_
from app.models import Requests, People
from app.infotech.models import Devices, AddDevice, TenantUsers, Assignments, AddAssignment
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

def get_tenant_user_by_query(db: Session, query: str):
    statement = select(
        TenantUsers.id,
        TenantUsers.email,
        TenantUsers.display_name).where(
        or_(
            TenantUsers.email.ilike(f"%{query}%"),
            TenantUsers.display_name.ilike(f"%{query}%")
        )
    )
    results =[
        row
        for row in db.execute(statement=statement).mappings().all()
    ]
    return results

def create_assignment(
    db:Session,
    request_id: int,
    device_id: int,
    tenant_id: UUID,
    assigned_to: str,
    assignee_email: str,
    deallocated_at: datetime,
    transferred_from: str
    ):
    try:
        person_id = db.execute(statement=
            update(Requests)
            .where(Requests.id == request_id)
            .values(it_review='allocated')
            .returning(Requests.person_id)).scalar_one_or_none()
        
        db.execute(statement=
            update(People)
            .where(People.id == person_id)
            .values(person_status='no_request'))

        db.execute(statement=
            insert(Assignments)
            .values(
                request_id=request_id, 
                device_id=device_id, 
                tenant_id=tenant_id, 
                assigned_to=assigned_to,
                assignee_email=assignee_email))
        db.execute(statement=
            update(Devices)
            .where(Devices.id == device_id)
            .values(status='assigned'))
        db.commit()
    except Exception as e:
        db.rollback()
        raise e

    


if __name__ == '__main__':
    db = get_db()
    db = next(db)

    requests = get_tenant_user_by_query(db, "proje")
    for device in requests:
        print(device)
        print()