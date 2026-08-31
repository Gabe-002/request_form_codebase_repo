from fastapi import APIRouter, Depends, Request
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from app.database import get_db
from app.admin.services import members as member_services

templates = Jinja2Templates(directory="HTML_templates/admin")
router = APIRouter(tags=["pages"])

@router.get("/portal")
def portal(request: Request, db: Session = Depends(get_db)):
    users = member_services.get_all_users(db)
    project_codes = member_services.get_projects_codes(db)
    software = member_services.get_software(db)
    base_country = member_services.get_countries(db)
    employee_divisions = member_services.get_employee_divisions(db)
    return templates.TemplateResponse(
        request, "portal.html", 
        {"users": users, 
        "project_codes": project_codes, 
        "software": software, 
        "base_country": base_country, 
        "employee_divisions": employee_divisions})