from app.models import SessionsTable, People, Requests
from app.database import get_db
import uuid
from app.models import RequestForm ,RequestPersonInfo

import secrets
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import insert, select, delete

SESSION_LIFETIME = timedelta(hours=8)

# Creates a session
def create_session(db: Session, user_id: int) -> str:
    session_id = uuid.uuid4()
    session_token = secrets.token_urlsafe(32)
    created_at = datetime.now().astimezone()
    expires_at = created_at + SESSION_LIFETIME

    statement = insert(SessionsTable).values(id= session_id,session_token=session_token, user_id=user_id, created_at=created_at, expires_at=expires_at)
    db.execute(statement=statement)
    db.commit()
    return session_token # We will send this token to the browser in the response header

# Gets a session by through a session token
def get_session_by_token(db: Session, token: str):
    statement = select(SessionsTable).where(SessionsTable.session_token == token)
    session = db.execute(statement=statement).scalar()
    return {column_name.name: getattr(session, column_name.name) for column_name in SessionsTable.__table__.columns if session}

# Removes a session, primarily for logouts
def remove_session(db: Session, token: str):
    statement = delete(SessionsTable).where(SessionsTable.session_token == token)
    db.execute(statement=statement)
    db.commit()

# This fetches a request based on request id (and associated user info)


if __name__ == "__main__":
    db = get_db()
    db = next(db)
    session = get_session_by_token(db, "cl5ORjxu-17HlBgfsf2sWHyk1EyOz39k5m7OqEmmQ")
    print(session)