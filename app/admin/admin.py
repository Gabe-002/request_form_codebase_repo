from fastapi import FastAPI
from app.admin.routes.members import router as members_router
from app.admin.routes.pages import router as pages_router

admin_app = FastAPI()
admin_app.include_router(members_router)
admin_app.include_router(pages_router)