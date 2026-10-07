from app.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select, insert, update, and_, or_
from app.models import Requests, People
from app.infotech.models import Devices, AddDevice, TenantUsers, Assignments, AddAssignment, CreateTenantUser, UpdateTenantUser, TenantSyncState
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

def update_tenant_user(
    db: Session,
    graph_id: str,
    payload: UpdateTenantUser
    ):
    statement = update(TenantUsers).values(**payload.model_dump()).where(TenantUsers.graph_id == graph_id)
    db.execute(statement=statement)
    db.commit()

def get_tenant_user(db: Session, graph_id: str):
    statement = select(TenantUsers).where(TenantUsers.graph_id == graph_id)
    user = db.execute(statement=statement).scalar_one_or_none()
    if user is None: 
        return None
    return {
        column.name: getattr(user, column.name)
        for column in TenantUsers.__table__.columns
    }

def deactivate_tenant_user(db: Session, graph_id: str):
    statement = update(TenantUsers).values(account_enabled=False).where(TenantUsers.graph_id == graph_id)
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

def add_sync_state(db: Session, delta_link: str, sync_status: str):
    payload = {"delta_link": delta_link, "sync_status": sync_status}
    statement = insert(TenantSyncState).values(**payload).returning(TenantSyncState.last_sync_at)
    last_sync_at = db.execute(statement=statement).scalar_one_or_none()
    db.commit()
    return last_sync_at

def get_last_sync(db: Session):
    statement = (
        select(TenantSyncState.last_sync_at)
        .order_by(TenantSyncState.last_sync_at.desc())
        .limit(1)
    )
    last_sync = db.execute(statement=statement).scalar_one_or_none()
    return last_sync


from app.ms_api.authentication import call_graph_api

def sync_tenant_users(db: Session):

    columnMapping = {
        "displayName": "display_name",
        "mail": "email",
        "accountEnabled": "account_enabled",
        "id": "graph_id",
        "userPrincipalName": "upn"
    }

    delta_link = get_delta_link(db)
    response = call_graph_api(delta_link)

    changes = response.json().get('value', '')
    
    new_delta_link = response.json().get('@odata.deltaLink')
    if not changes:
        print("Nothing to update. Updating link")
        return add_sync_state(db, new_delta_link, 'update link')
        
    changes = [{'displayName': 'Tenant Sync Test', 'userPrincipalName': 'Tenant.SyncTest@teichmanngrp.com', 'accountEnabled': True, 'id': '202e72e8-a4f8-46f2-b841-4fe83dfedb14'}]
    for change in changes:
        graph_id = change.get('id')
        if '@remove' in change:
            deactivate_tenant_user(db, graph_id)
            continue

    domain_changes = [
        change for change in changes 
        if "@teichmanngrp.com" in (change.get('mail') or change.get('userPrincipalName') or '')
    ]
    print(domain_changes)

    if not domain_changes:
        return add_sync_state(db, new_delta_link, 'update link')

    user_changes = []
    for change in domain_changes:
        user = {}
        for key, value in columnMapping.items():
            user[value] = change.get(key)
        user_changes.append(user)

    for user in user_changes:
        if user.get('account_enabled') is False:
            print("The account has seemingly been deactivated")
            continue
        existing_user = get_tenant_user(db, user.get('graph_id'))
        if existing_user:
            graph_id = user.pop('graph_id')
            update_tenant_user(db, graph_id, UpdateTenantUser(**user))
            print("The user info has been updated")
        else: 
            print("The new user has been added")
            add_tenant_user(db, CreateTenantUser(**user))

    return add_sync_state(db, new_delta_link, 'success')



if __name__ == '__main__':
    db = get_db()
    db = next(db)

    sync_tenant_users(db)