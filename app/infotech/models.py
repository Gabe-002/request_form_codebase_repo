from app.database import Base
from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import List, Optional
import inspect
from fastapi import Form

class Devices(Base):
    __tablename__ = 'devices'

    id = Column(Integer, primary_key=True, nullable=False)
    serial_number = Column(Text, nullable=False)
    manufacturer = Column(Text, nullable=False)
    model = Column(Text, nullable=False)
    asset_type = Column(Text, nullable=False)
    status = Column(Text, nullable=False)
    assigned_to = Column(Text, nullable=True)
    requests_id = Column(Integer, nullable=True)
    asset_number = Column(Text, nullable=True)

class TenantUsers(Base):
    __tablename__ = 'tenant_users'

    id = Column(UUID(as_uuid=True), primary_key=True, nullable=False)
    display_name = Column(Text, nullable=False)
    email = Column(Text, nullable=False)
    last_synched = Column(DateTime(timezone=True), nullable=False)

class Assignment(Base):
    __tablename__ = 'assignments'

    id = Column(Integer, primary_key=True, nullable=False)
    request_id = Column(Integer, ForeignKey('requests.id'))
    device_id = Column(Integer, ForeignKey('devices.id'))
    assigned_to = Column(Text, nullable=False)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    deallocated_at = Column(DateTime(timezone=True))
    assignee_email = Column(Text)
    transferred_from = Column(Text)
    sharepoint_item_id = Column(Integer)
    tenant_id = Column(UUID(as_uuid=True))

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


class AddDevice(BaseModel):
    serial_number: str
    manufacturer: str
    model: str
    asset_type: str
    status: str
    assigned_to: Optional[str] = None
    requests_id: Optional[int] = None
    asset_number: Optional[str] = None

    @classmethod
    def from_data(cls, **data):
        return cls(**data)