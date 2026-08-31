from fastapi import APIRouter, Request, Depends, Form
from sqlalchemy.orm import Session # This is for the type hints

from app.database import get_db
from app.admin.services import members as member_services

from pydantic import BaseModel

class CreateUser(BaseModel):
    username: str
    password: str
    role: str
    user_first_name: str
    user_surname: str
    database_id: str
    user_email: str
    database_id: str

class UpdateUser(BaseModel):
    id: int
    role: str

class RemoveUser(BaseModel):
    id: int

class AddProjectCode(BaseModel):
    project_code: str
    description: str

class RemoveProjectCode(BaseModel):
    id: int

class AddSoftware(BaseModel):
    display_name: str

class RemoveSoftware(BaseModel):
    id: int

class BaseCountry(BaseModel):
    country_name: str

class RemoveBaseCountry(BaseModel):
    id: int

class Division(BaseModel):
    division_name: str

class RemoveDivision(BaseModel):
    id: int

router = APIRouter(tags=["members"])

@router.get("/")
def get_all_users(db: Session = Depends(get_db)):
    return member_services.get_all_users(db=db)

@router.get("/id/{user_id}")
def get_user_by_role(user_id: int, db: Session = Depends(get_db)):
    return member_services.get_user_by_id(db, user_id)

@router.get("/roles/{role}")
def get_users_by_role(role: str, db: Session = Depends(get_db)):
    return member_services.get_users_by_role(db, role)

@router.post("/create")
def create_new_user(payload: CreateUser, db: Session = Depends(get_db)):
    return member_services.add_user(db=db, **payload.model_dump())

@router.delete("/remove")
def remove_user(payload: RemoveUser, db: Session = Depends(get_db)):
    member_services.remove_user(db=db, **payload.model_dump())

@router.patch("/update")
def update_user_role(payload: UpdateUser, db: Session = Depends(get_db)):
    return member_services.change_user_role(db=db, **payload.model_dump())


# This next section of routing if for the project codes and software
@router.get("/projectcodes")
def get_project_codes(db: Session = Depends(get_db)):
    return member_services.get_projects_codes(db=db)

@router.post("/projectcodes/add")
def app_project_code(payload: AddProjectCode, db: Session = Depends(get_db)):
    member_services.add_project_code(db=db, **payload.model_dump())

@router.delete("/projectcodes/remove")
def remove_project_code(payload: RemoveProjectCode, db: Session = Depends(get_db)):
    member_services.remove_project_code(db=db, **payload.model_dump())

@router.get("/software")
def get_software(db: Session = Depends(get_db)):
    return member_services.get_software(db=db)

@router.post("/software/add")
def add_software(payload: AddSoftware, db: Session = Depends(get_db)):
    member_services.add_software(db, **payload.model_dump())

@router.delete("/software/remove")
def remove_software(payload: RemoveSoftware, db: Session = Depends(get_db)):
    member_services.remove_software(db, **payload.model_dump())

@router.get("/countries")
def get_countries(db: Session = Depends(get_db)):
    return member_services.get_countries(db=db)

@router.post("/countries/add")
def add_country(payload: BaseCountry, db: Session = Depends(get_db)):
    member_services.add_country(db=db, **payload.model_dump())

@router.delete("/countries/remove")
def remove_country(payload: RemoveBaseCountry, db: Session = Depends(get_db)):
    member_services.remove_country(db=db, **payload.model_dump())

@router.get("/divisions")
def get_division(db: Session = Depends(get_db)):
    return member_services.get_employee_divisions(db)

@router.post("/divisions/add")
def add_division(payload: Division, db: Session = Depends(get_db)):
    member_services.add_employee_division(db, **payload.model_dump())

@router.delete("/divisions/remove")
def remove_division(payload: RemoveDivision, db: Session = Depends(get_db)):
    member_services.remove_employee_division(db, **payload.model_dump())