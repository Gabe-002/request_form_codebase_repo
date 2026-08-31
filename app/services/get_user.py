from datetime import datetime, timezone
from fastapi import Depends, Request, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import sessions as session_services
from app.admin.services import members as member_services


def login_redirect():
    raise HTTPException(
        status_code=status.HTTP_302_FOUND,
        headers= {"Location": "/login/"}
    )

def get_current_user(request: Request, db: Session = Depends(get_db)):
    session_token = request.cookies.get("session_id")
    if not session_token:
        login_redirect()

    session = session_services.get_session_by_token(db, session_token)
    if not session or session.get("expires_at") < datetime.now().astimezone():
        login_redirect()

    user = member_services.get_user_by_id(db, session.get("user_id"))
    if not user:
        login_redirect()

    return user

def get_project_codes(db: Session = Depends(get_db)):
    project_codes = member_services.get_projects_codes(db=db)
    return project_codes

def get_software(db:Session = Depends(get_db)):
    software = member_services.get_software(db)
    return software

def get_project_managers(db: Session = Depends(get_db)):
    project_manager = member_services.get_users_by_role(db, "pm")
    return project_manager


if __name__ == "__main__":
    db = get_db()
    db = next(db)

    print(get_project_codes())