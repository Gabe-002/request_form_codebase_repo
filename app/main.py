from pathlib import Path # To resolve the file path
from fastapi import FastAPI, Request, Depends
from fastapi.staticfiles import StaticFiles

import os 

from app.admin.admin import admin_app
from app.infotech.infotech import infotech_app
from app.infotech.routes.infotech_api import router as it_router
from app.routes.login_page import router as login_router
from app.routes.requests import router as requests_router

# first parent resolves to the directory in which main lives, then the next parent resolves to the main directory
ROOT_DIRECTORY = Path(__file__).resolve().parent.parent
STATIC_DIRECTORY = os.path.join(ROOT_DIRECTORY, "static")

# The main application instance. This is for the form
app = FastAPI()

app.include_router(login_router)
app.include_router(requests_router)
app.include_router(it_router)
# /static here refers to url path. It's a route prefix in the app's url namespace
app.mount("/static", StaticFiles(directory=STATIC_DIRECTORY), name="static")
app.mount("/admin", admin_app)
app.mount("/infotech", infotech_app)