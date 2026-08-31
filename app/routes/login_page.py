from fastapi import APIRouter, Depends, Request, Response, HTTPException, status 
from fastapi.templating import Jinja2Templates

from sqlalchemy.orm import Session
from app.database import get_db
from app.admin.services import members as member_services
from app.services import sessions as session_services

from pwdlib import PasswordHash

from pydantic import BaseModel

class Login(BaseModel):
    username: str
    password: str

router = APIRouter(prefix="/login", tags=["login"])

templates = Jinja2Templates(directory="HTML_templates/main")

def raise_authentication_error():
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect username and password"
    )

@router.get("/")
def login_page(request: Request, error = ""):
    return templates.TemplateResponse(request, "login.html")

@router.post("/")
def login_authentication(request: Request, response: Response, payload: Login,  db: Session = Depends(get_db)):
    print("We have landed in here")
    login_info = {**payload.model_dump()}

    user_array = member_services.get_user_by_username(db, login_info.get("username"))

    if not user_array:
        raise_authentication_error()

    user_info = user_array[0]
    if not PasswordHash.recommended().verify(
        login_info.get("password"),
        user_info.get("password")
        ):
        raise_authentication_error()

    # Now, we set the cookie up:
    session_token = session_services.create_session(db, user_info.get("id"))

    # This sets up the cookie. Simply a set of instructions for how the browser is to treat the cookie
    response.set_cookie(
        key="session_id",
        value=session_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=8*60*60,
        path="/",
    )
    return {
        "status": "success",
        "redirect": "/requests/"
        }

@router.delete("/logout")
def portal_logout(request: Request, db: Session = Depends(get_db)):
    session_token = request.cookies.get("session_id")
    session_services.remove_session(db, session_token)

    return {
        "status": "success",
        "redirect": "/login"
    }