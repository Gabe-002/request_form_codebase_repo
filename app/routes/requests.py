from fastapi import Request, APIRouter, Depends
from fastapi.templating import Jinja2Templates
from fastapi.responses import RedirectResponse
from fastapi import status, Form
from app.services.get_user import get_current_user, get_project_codes, get_software, get_project_managers
from app.models import RequestForm, RequestPersonInfo, People, Requests
from app.services.request_forms import get_user_by_id, append_request, append_person, get_request, update_review, get_pending_requests, update_person, update_request, append_sharepoint_info, get_sharepoint_item_id
from sqlalchemy.orm import Session
from sqlalchemy import func, select, and_ 
from app.database import get_db
from pydantic import BaseModel
from app.config import settings
from app.ms_api.authentication import call_graph_api

INSERT_URL = f"https://graph.microsoft.com/v1.0/sites/{settings.SITE_ID}/lists/{settings.PENDING_REQUESTS_LIST_ID}/items"
DEVICE_URL= f"https://graph.microsoft.com/v1.0/sites/{settings.SITE_ID}/lists/{settings.DEVICE_LIST_TESTING_LIST_ID}/items"


router = APIRouter(prefix="/requests", tags=["requests"])
templates = Jinja2Templates(directory="HTML_templates/main")

class updateReviewStatus(BaseModel):
    status: str
    role: str
    request_id: int

@router.get("/")
def requests_portal(request: Request, user = Depends(get_current_user)):
    return templates.TemplateResponse(request, "request_portal.html", {"user": user})

@router.get("/new")
def new_request(request: Request, 
    user = Depends(get_current_user), 
    project_codes = Depends(get_project_codes), 
    software = Depends(get_software), 
    project_managers = Depends(get_project_managers)
    ):
    return templates.TemplateResponse(request, "requests_page.html", {
        "user": user[0], 
        "project_codes": project_codes, 
        "software": software,
        "project_managers": project_managers})

@router.post("/new")
def submit_form(request: Request,
    user = Depends(get_current_user),
    db: Session = Depends(get_db),
    request_info: RequestForm = Depends(RequestForm.from_data),
    person_info: RequestPersonInfo = Depends(RequestPersonInfo.from_data)
    ):
    person_id = append_person(db, person_info)
    request_id, project_manager_id = append_request(db, request_form=request_info, person_id=person_id)
    project_manager = get_user_by_id(db, project_manager_id)

    # fields = {
    #     "Title": f"Pending request for {project_manager[0].get("user_first_name")}",
    #     "Description": f"{project_manager[0].get("user_first_name")} {project_manager[0].get("user_surname")}",
    #     "ResponsibleManagerLookupId": str(project_manager[0].get("sharepoint_id", 13)),
    #     "RequestLink": {
    #         "Url": f"http://192.168.64.200:80/requests/pending/{request_id}",
    #         "Description": f"{person_info.first_name.capitalize()} {person_info.surname.capitalize()}",
    #     },
    #     "SubjectofRequest0": f"{person_info.first_name.capitalize()} {person_info.surname.capitalize()}"
    # }
    # body = {"fields": fields}
    # response = call_graph_api(INSERT_URL, "POST", body)
    # if (response.ok):
    #     append_sharepoint_info(db, request_id, response.json()['id'], "success")
    # else:
    #     append_sharepoint_info(db, request_id, None, "failure")
    
    return RedirectResponse(url="/requests/", status_code=status.HTTP_303_SEE_OTHER)

@router.get("/pending/page")
def pending_page(
    request: Request,
    user = Depends(get_current_user),
    db: Session = Depends(get_db)
    ):
    pending_requests = get_pending_requests(db, user[0].get("id"), user[0].get("role"))
    print(pending_requests)
    return templates.TemplateResponse(request, "pending_page.html", {"user": user, "pending_requests": pending_requests})

@router.get("/pending/{request_id}")
def pending_form(request: Request,
    request_id: int,
    user = Depends(get_current_user),
    db: Session = Depends(get_db),
    ):
    request_info, person_info, requestor_info, pm_info = get_request(db, request_id)
    return templates.TemplateResponse(request, "review_page.html", {"user": user, "request_info": request_info, "person_info": person_info, "requestor_info": requestor_info, "pm_info": pm_info})

@router.patch("/pending/review")
def form_review(payload: updateReviewStatus, db: Session = Depends(get_db)):
    sharepoint_item_id = get_sharepoint_item_id(db, payload.request_id)
    if sharepoint_item_id:
        update_url = f"{INSERT_URL}/{sharepoint_item_id}"
        if payload.status == "rejected" or payload.role == "fd":
            call_graph_api(update_url, "DELETE")
        else:
            fields = {
                "Title": f"Pending request for Dorita",
                "ResponsibleManagerLookupId": str(14),
            }
            body = {"fields": fields}
            call_graph_api(update_url, "PATCH", json_body=body)
    update_review(db, **payload.model_dump())

@router.get("/pending/edit/{request_id}")
def edit_form(
    request: Request,
    request_id: int,
    user = Depends(get_current_user),
    project_codes = Depends(get_project_codes),
    software = Depends(get_software), 
    project_managers = Depends(get_project_managers), 
    db: Session = Depends(get_db)
    ):
    request_info, person_info, requestor_info, pm_info = get_request(db, request_id)
    return templates.TemplateResponse(request, "edit_page.html", {
        "user": user,
        "project_codes": project_codes,
        "software": software,
        "project_managers": project_managers,
        "request_info": request_info, 
        "person_info": person_info, 
        "requestor_info": requestor_info, 
        "pm_info": pm_info
        })

@router.post("/pending/edit/{request_id}")
def update_info(
    request: Request,
    request_id: int,
    person_id: int = Form(...),
    db: Session = Depends(get_db),
    request_info: RequestForm = Depends(RequestForm.from_data),
    person_info: RequestPersonInfo = Depends(RequestPersonInfo.from_data)
    ):
    update_person(db, person_id, person_info)
    update_request(db, request_id, request_info)
    return RedirectResponse(url = f"/requests/pending/{request_id}", status_code=status.HTTP_303_SEE_OTHER)

@router.get("/search")
def request_search(query: str,
    db: Session = Depends(get_db), 
    user = Depends(get_current_user)
    ):
    if not query:
        return []
    query = [part.lower().replace(".", "") for part in query.split() if part.strip()]
    full_name = func.concat(People.first_name, ' ', People.surname)
    conditions = [full_name.ilike(f"%{part}%") for part in query]

    statement = select(
        People.first_name,
        People.surname,
        Requests.id.label("request_id"),
        Requests.requestor_user_id,
        Requests.project_manager_id,
        Requests.project_code,
        Requests.pm_review_status,
        Requests.fd_review_status).join(Requests, Requests.person_id == People.id).where(and_(*conditions))
    results = db.execute(statement=statement)
    return [{
        "first_name": result.first_name,
        "surname": result.surname,
        "request_id": result.request_id,
        "project_code": result.project_code,
        "pm_review_status": result.pm_review_status,
        "fd_review_status": result.fd_review_status,
        "requestor_user_id": result.requestor_user_id,
        "project_manager_id": result.project_manager_id
    }
    for result in results]