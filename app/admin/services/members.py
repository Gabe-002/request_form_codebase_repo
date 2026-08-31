from app.admin.models import Users, ProjectCodes, Software, BaseCountry, EmployeeDivisions
from sqlalchemy import select, insert, delete, update, case
from sqlalchemy.orm import Session # This is for the type hints (db: Sessions)
from pwdlib import PasswordHash # This is for hashing the passwords
from app.models import SessionsTable
from app.ms_api.authentication import ensure_user

password_hash = PasswordHash.recommended()

# select, insert, delete and update are fomulate the SQL statemnts.

from app.database import get_db

# Simple formatter for multiple lines
def format_rows(model, users):
    # getattr is used to get the value of object attributes, for exmaple, the value of user.name
    # To make a note Users.__table__ refers to the Table object associated with Users
    # In addition, each Column object has associated with it a "name" attribute
    return [{
        column.name: getattr(user, column.name) 
        for column in model.__table__.columns
    } for user in users]

# Gets all of the users in the users table
def get_all_users(db: Session):
    role_order = case(
        {
            "admin": 1,
            "pm": 2,
            "fd": 3,
            "super_user": 5
        },
        value=Users.role,
        else_=5
    )
    statement = select(Users).order_by(role_order)
    users = db.execute(statement=statement).scalars().all()
    return format_rows(Users, users)

# This get a specific user, from their username (This is useful for login)
def get_user_by_username(db: Session, username: str):
    statement = select(Users).where(Users.username == username)
    user = db.execute(statement=statement).scalars().all()
    return format_rows(Users, user)

# Get users by role
def get_users_by_role(db: Session, role: str):
    statement = select(Users).where(Users.role == role)
    users = db.execute(statement=statement).scalars().all()
    return format_rows(Users, users)

# Gets the user by id
def get_user_by_id(db: Session, id: int):
    statement = select(Users).where(Users.id == id)
    user = db.execute(statement=statement).scalars().all()
    return format_rows(Users, user)

# This is to create a new users
def add_user(
        db: Session, 
        username: str, 
        password: str, 
        role: str, 
        user_first_name: str, 
        user_surname: str, 
        database_id: str, 
        user_email: str):
    # We first attempt to find the Sharepoint user ID (for that site collection)
    sharepoint_id = ensure_user(user_email)
    
    statement = insert(Users).values(
        username=username, 
        password=password_hash.hash(password), 
        role=role, user_first_name=user_first_name, 
        user_surname=user_surname, 
        database_id=database_id, 
        user_email=user_email,
        sharepoint_id=sharepoint_id)
    
    db.execute(statement=statement)
    db.commit()

# This is to delete/remove a current user
def remove_user(db: Session, id: int):
    db.execute(delete(SessionsTable).where(SessionsTable.user_id == id))
    result = db.execute(delete(Users).where(Users.id == id))
    if result.rowcount == 0:
        db.rollback()
        raise ValueError(f"User {id} not found")
    db.commit()

# This updates the role of the user
def change_user_role(db: Session, id: int, role: str):
    statement = update(Users).where(Users.id == id).values(role=role)
    db.execute(statement=statement)
    db.commit()

# We need the following functions:
# get_software, add_software, remove_software

# Gets all of the project codes
def get_projects_codes(db: Session):
    statement = select(ProjectCodes)
    project_codes = db.execute(statement=statement).scalars().all()
    return format_rows(ProjectCodes, project_codes)

# Inserts a project code
def add_project_code(db: Session, project_code: str, description: str):
    statement = insert(ProjectCodes).values(project_code=project_code, description=description)
    db.execute(statement=statement)
    db.commit()

# Remove a project code
def remove_project_code(db: Session, id: int):
    statement = delete(ProjectCodes).where(ProjectCodes.id == id)
    db.execute(statement=statement)
    db.commit()


# This is to get all the available software
def get_software(db: Session):
    statement = select(Software)
    software = db.execute(statement=statement).scalars().all()
    return format_rows(Software, software)

# This adds software
def add_software(db: Session, display_name: str):
    software = "_".join(display_name.lower().split())
    statement = insert(Software).values(display_name=display_name, software=software)
    db.execute(statement=statement)
    db.commit()

# This removes software
def remove_software(db: Session, id: int):
    statement = delete(Software).where(Software.id == id)
    db.execute(statement=statement)
    db.commit()

# This is to get all the base countries
def get_countries(db: Session):
    statement = select(BaseCountry)
    countries = db.execute(statement=statement).scalars().all()
    return format_rows(BaseCountry, countries)

def add_country(db: Session, country_name: str):
    statement = insert(BaseCountry).values(country_name=country_name)
    db.execute(statement=statement)
    db.commit()

def remove_country(db: Session, id: int):
    statement = delete(BaseCountry).where(BaseCountry.id == id)
    db.execute(statement=statement)
    db.commit()

def get_employee_divisions(db: Session):
    statement = select(EmployeeDivisions)
    divisions = db.execute(statement=statement).scalars().all()
    return format_rows(EmployeeDivisions, divisions)

def add_employee_division(db: Session, division_name: str):
    statement = insert(EmployeeDivisions).values(division_name=division_name)
    db.execute(statement=statement)
    db.commit()

def remove_employee_division(db: Session, id: int):
    statement = delete(EmployeeDivisions).where(EmployeeDivisions.id == id)
    db.execute(statement=statement)
    db.commit()

if __name__ == "__main__":
    db_gen = get_db()
    db = next(db_gen)

    remove_country(db, 1)