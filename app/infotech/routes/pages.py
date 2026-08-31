from fastapi import APIRouter, Depends, Request
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from app.database import get_db
from app.admin.services import members as member_services

templates = Jinja2Templates(directory="HTML_templates/infotech")
router = APIRouter(tags=["pages"])

@router.get("/portal")
def infotech_portal(request: Request):
    return templates.TemplateResponse(request, "it_panel.html")