from app.database import get_db
from sqlalchemy import insert, select, delete, update, and_
from sqlalchemy.orm import Session
from app.models import People, Requests, RequestForm, RequestPersonInfo
from app.admin.services.members import get_user_by_id
from datetime import datetime, timezone
from sqlalchemy.exc import IntegrityError

def create_dictionary(obj, table_name):
    return {col.name: getattr(obj, col.name) for col in table_name.__table__.columns}

def person_info(db: Session,
    first_name: str,
    surname: str,
    national_id_number: str,
    mobile_number: str,
    contact_email: str,
    work_number: str = "",
    ):
    # This search looks for any open requests for the given person. If one is open, then no new request will be put forward
    pending_search = select(People).where(
        People.national_id_number == national_id_number,
        People.person_status == 'pending_request')
    pending_status = db.execute(statement=pending_search).scalar()
    if pending_status: # This means that the person has a request pending
        print(pending_status.first_name)
        return "pending"

    # This the above search comes back empty, we then check if the person exists within the database
    # If so, we procedd with the request, but do not create a new person
    national_id_search = select(People).where(People.national_id_number == national_id_number)
    person = db.execute(statement=national_id_search).scalar()
    if person: # It means the user already exists, so no need to make a new user
        print(person.first_name)
        return "exists"

    # Then, if the above search comes back empty, we create the person's request
    statement = insert(People).values(
        first_name=first_name,
        surname=surname, 
        national_id_number=national_id_number,
        work_number=work_number,
        mobile_number=mobile_number,
        contact_email=contact_email)
    db.execute(statement=statement)
    db.commit()
    return "created"

# This appends the person info, making the request
def append_person(db: Session, person_requesting: RequestPersonInfo):
    statement = insert(People).values(**person_requesting.model_dump()).returning(People.id)
    try:   
        returning = db.execute(statement=statement)
        db.commit()
        return returning.scalar_one()
    except IntegrityError:
        db.rollback()
        national_id_number = person_requesting.model_dump().get("national_id_number")
        existing = db.execute(
            select(People.id).where(People.national_id_number == national_id_number)
        ).scalar_one()
        return existing

# This appends the request info
def append_request(db: Session, request_form: RequestForm, person_id: int):
    statement = insert(Requests).values(person_id=person_id, **request_form.model_dump()).returning(Requests.id, Requests.project_manager_id)
    result = db.execute(statement=statement)
    db.commit()
    row = result.one()
    return row.id, row.project_manager_id

def append_sharepoint_info(db: Session, request_id: int, sharepoint_item_id: int, sharepoint_sync_status: str):
    statement = update(Requests).values(
        sharepoint_item_id=sharepoint_item_id,
        sharepoint_sync_status=sharepoint_sync_status).where(Requests.id == request_id)
    db.execute(statement=statement)
    db.commit()

def update_person(db: Session, person_id: int, person_requesting: RequestPersonInfo):
    statement = update(People).values(**person_requesting.model_dump()).where(People.id == person_id)
    db.execute(statement=statement)
    db.commit()

def update_request(db: Session, request_id: int, request_form: RequestForm):
    statement = update(Requests).values(**request_form.model_dump()).where(Requests.id == request_id)
    db.execute(statement=statement)
    db.commit()


# This captures the request and the person info
def get_request(db: Session, request_id: int):
    statement = select(Requests, People).join(People, People.id == Requests.person_id).where(Requests.id == request_id)
    result = db.execute(statement=statement).first()
    request_obj, person_obj = result

    requesting_user = get_user_by_id(db, request_obj.requestor_user_id)[0] if get_user_by_id(db, request_obj.requestor_user_id) else {}
    project_manager = get_user_by_id(db, request_obj.project_manager_id)[0] if get_user_by_id(db, request_obj.project_manager_id) else {}
    return create_dictionary(request_obj, Requests), create_dictionary(person_obj, People), requesting_user, project_manager

# This gets the pending requests for the give user
def get_pending_requests(db: Session, user_id: int, role: str):
    statement = select(
        People.first_name,
        People.surname,
        Requests.id.label("request_id"),
        Requests.project_code,
        Requests.pm_review_status,
        Requests.fd_review_status
    ).join(People, People.id == Requests.person_id)
    if role == "admin":
        statement = statement.where(
            and_(
                Requests.requestor_user_id == user_id,
                Requests.fd_review_status == "pending_review",
                Requests.pm_review_status != "rejected"
            )
        )
    elif role == "pm":
        statement = statement.where(
            and_(
                Requests.project_manager_id == user_id,
                Requests.pm_review_status == "pending_review"
            )
        )
    elif role == "fd":
        statement = statement.where(
            and_(
                Requests.fd_review_status == "pending_review",
                Requests.pm_review_status == "approved"
            )
        )
    result = db.execute(statement=statement).all()
    return [dict(row._mapping) for row in result]

def get_sharepoint_item_id(db: Session, request_id: int):
    statement = select(Requests.sharepoint_item_id).where(and_(
        Requests.id == request_id,
        Requests.sharepoint_sync_status == "success"
    ))
    result = db.execute(statement=statement)
    sharepoint_item_id = result.scalar_one_or_none()
    return sharepoint_item_id
    

def update_review(db: Session, status: str, role: str, request_id: int):
    role_column = "pm_review_status" if role == "pm" else "fd_review_status"
    if role == "pm":
        role_column = "pm_review_status"
        time_column = "pm_review_date"
    elif role == "fd":
        role_column = "fd_review_status"
        time_column = "fd_review_date"
    statement = (
        update(Requests)
        .where(Requests.id == request_id)
        .values({
            role_column: status,
            time_column: datetime.now(timezone.utc)}))
    db.execute(statement=statement)
    db.commit()

def infotech_request_info(db: Session, request_id: int):
    statement = (
        select(Requests.project_code,
               Requests.employee_division,
               Requests.base_country_computer,
               Requests.computer_required,
               Requests.desk_phone_required,
               Requests.required_software, 
               People.first_name,
               People.surname,
               People.id)
        .join(People, People.id == Requests.person_id)
        .where(Requests.id == request_id))
    result = db.execute(statement=statement).mappings().first()
    return dict(result) if result else None
    
if __name__ == "__main__":
    db = get_db()
    db = next(get_db())
    print(infotech_request_info(db, 82))