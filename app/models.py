from app.database import Base
from sqlalchemy import Text, ForeignKey, ARRAY, text, CheckConstraint, Identity
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import List, Optional
import inspect
from fastapi import Form
from datetime import datetime

import uuid

class SessionsTable(Base):
    __tablename__ = 'sessions'

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, server_default=text("gen_random_uuid()"))
    session_token: Mapped[str] = mapped_column(unique=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    expires_at: Mapped[datetime]

class People(Base):
    __tablename__ = 'people'
    __table_args__ = (
        CheckConstraint("person_status IN ('pending_request', 'no_request')", name="person_status"),
    )

    id: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    first_name: Mapped[str]
    surname: Mapped[str]
    created_at: Mapped[datetime | None] = mapped_column(server_default=func.now())
    person_status: Mapped[str | None] = mapped_column(server_default='pending_request')

class Requests(Base):
    __tablename__ = 'requests'
    __table_args__ = (
        CheckConstraint("pm_review_status IN ('pending_review', 'approved', 'rejected')", name="pm_review_status"),
        CheckConstraint("fd_review_status IN ('pending_review', 'approved', 'rejected')", name="fd_review_status"),
        CheckConstraint("it_review IN ('pending', 'allocated', 'incomplete')", name="it_review"),
        CheckConstraint("sharepoint_sync_status IN ('success', 'failure')", name="sharepoint_sync_status"),
    )

    id: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    person_id: Mapped[int] = mapped_column(ForeignKey('people.id'))
    submitted_at: Mapped[datetime | None] = mapped_column(server_default=func.now())
    starting_date: Mapped[str]
    expiry_date: Mapped[str | None]
    project_code: Mapped[str]
    employee_division: Mapped[str]
    base_country_computer: Mapped[str]
    desk_phone_required: Mapped[str]
    computer_required: Mapped[str]
    required_software: Mapped[list[str] | None] = mapped_column(ARRAY(Text))
    other_it_requirements: Mapped[str | None]
    sharepoint_file_rights: Mapped[str | None]
    professional_title: Mapped[str]
    employee_type: Mapped[str]
    direct_line_manager: Mapped[str]
    pm_review_status: Mapped[str] = mapped_column(server_default='pending_review')
    fd_review_status: Mapped[str] = mapped_column(server_default='pending_review')
    requestor_user_id: Mapped[int]
    reject_description: Mapped[str | None]
    pm_review_date: Mapped[datetime | None]
    fd_review_date: Mapped[datetime | None]
    sharepoint_item_id: Mapped[int | None]
    sharepoint_sync_status: Mapped[str | None]
    project_manager_id: Mapped[int | None] = mapped_column(ForeignKey('users.id'))
    it_review: Mapped[str | None] = mapped_column(server_default='pending')

    # Will have to add a few more requirements here

# We'll create a decorator that acts constructor like
def from_data(cls):
    parameters = [
        inspect.Parameter(
            name,
            inspect.Parameter.POSITIONAL_ONLY,
            default=Form(...) if field.is_required() else Form(field.default),
            annotation=field.annotation
        )
        for name, field in cls.model_fields.items()
    ]
    signature = inspect.Signature(parameters=parameters)
    def from_data_func(**data):
        return cls(**data)
    from_data_func.__signature__ = signature
    setattr(cls, "from_data", from_data_func)
    return cls

@from_data
class RequestForm(BaseModel):
    starting_date: str
    expiry_date: Optional[str] = None
    project_code: str
    employee_division: str
    base_country_computer: str
    desk_phone_required: str
    computer_required: str
    required_software: List[str] = []
    other_it_requirements: Optional[str] = None
    sharepoint_file_rights: Optional[str] = None
    professional_title: str
    employee_type: str
    direct_line_manager: str
    project_manager_id: int
    requestor_user_id: int

    # Create an alternative constructor
    @classmethod
    def from_data(cls, **data):
        return cls(**data)

@from_data
class RequestPersonInfo(BaseModel):
    first_name: str
    surname: str

    @classmethod
    def from_data(cls, **data):
        return cls(**data)