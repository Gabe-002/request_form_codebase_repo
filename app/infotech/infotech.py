from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.infotech.routes.pages import router as it
from pathlib import Path

STATIC_DIR = Path(__file__).parent.parent.parent/"static"

infotech_app = FastAPI()
infotech_app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="js")
# infotech_app.include_router(it)

if __name__ == '__main__':
    print(STATIC_DIR)