from app.database import Base
from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import List, Optional
import inspect
from fastapi import Form

class SessionsTable(Base):
    __tablename__ = 'sessions'

    id = Column(UUID(as_uuid=True), primary_key=True, nullable=False)
    session_token = Column(Text, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'),nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)

class People(Base):
    __tablename__ = 'people'

    id = Column(Integer, primary_key=True, nullable=False)
    first_name = Column(Text, nullable=False)
    surname = Column(Text, nullable=False)
    national_id_number = Column(Text, nullable=False)
    work_number = Column(Text)
    mobile_number = Column(Text, nullable=False)
    contact_email = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    person_status = Column(Text, server_default='pending_request')

class Requests(Base):
    __tablename__ = 'requests'

    id = Column(Integer, primary_key=True, nullable=False)
    person_id = Column(Integer, nullable=False)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    starting_date = Column(Text, nullable=False)
    expiry_date = Column(Text)
    project_code = Column(Text, nullable=False)
    employee_number = Column(Text, nullable=True)
    employee_division = Column(Text, nullable=False)
    base_country_computer = Column(Text, nullable=False)
    desk_phone_required = Column(Text, nullable=False)
    computer_required = Column(Text, nullable=False)
    required_software = Column(ARRAY(Text))
    other_it_requirements = Column(Text)
    sharepoint_file_rights = Column(Text)
    professional_title = Column(Text, nullable=False)
    employee_type = Column(Text, nullable=False)
    direct_line_manager = Column(Text, nullable=False)
    pm_review_status = Column(Text, nullable=False, server_default='pending_review')
    fd_review_status = Column(Text, nullable=False, server_default='pending_review')
    requestor_user_id = Column(Text, nullable=False)
    reject_description = Column(Text)
    pm_review_date = Column(DateTime(timezone=True))
    fd_review_date = Column(DateTime(timezone=True))
    sharepoint_item_id = Column(Integer)
    sharepoint_sync_status = Column(Text)
    project_manager_id = Column(Integer, ForeignKey('users.id'))
    it_review = Column(Text, nullable=True, server_default='pending')


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
    employee_number: Optional[str] = None
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
    national_id_number: str
    work_number: Optional[str] = None
    mobile_number: str
    contact_email: str

    @classmethod
    def from_data(cls, **data):
        return cls(**data)