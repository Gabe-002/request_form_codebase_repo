from app.database import Base
from sqlalchemy import Column, Integer, Text, Numeric, ForeignKey, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import List, Optional
import inspect
from uuid import UUID as universal_unique_id
from datetime import datetime
from fastapi import Form
from decimal import Decimal

class Devices(Base):
    __tablename__ = 'devices'

    id = Column(Integer, primary_key=True, nullable=False)
    status = Column(Text, nullable=False)
    asset_number = Column(Text, nullable=True)
    asset_type = Column(Text, nullable=False)
    manufacturer = Column(Text, nullable=False)
    model = Column(Text, nullable=False)
    serial_number = Column(Text, nullable=False)
    purchase_price = Column(Numeric, nullable=False)
    order_number = Column(Text, nullable=True)
    condition_notes = Column(Text, nullable=True)
    sharepoint_id = Column(Integer, nullable=True)
    

class TenantUsers(Base):
    __tablename__ = 'tenant_users'

    id = Column(Integer, primary_key=True)
    graph_id = Column(UUID(as_uuid=True), nullable=False, unique=True)
    display_name = Column(Text, nullable=False)
    email = Column(Text, nullable=True)
    account_enabled = Column(Boolean, nullable=True)
    upn = Column(Text, nullable=True)

class TenantSyncState(Base):
    __tablename__ = 'tenant_sync_state'

    id = Column(Integer, primary_key=True)
    delta_link = Column(Text, nullable=True)
    last_sync_at = Column(DateTime(timezone=True), server_default=func.now())
    sync_status = Column(Text, nullable=False)


class CreateTenantUser(BaseModel):
    graph_id: universal_unique_id
    display_name: str
    email: Optional[str] = None
    account_enabled: Optional[bool] = None
    upn: Optional[str] = None


class UpdateTenantUser(BaseModel):
    display_name: str
    email: str
    account_enabled: Optional[bool] = None

class SetSyncState(BaseModel):
    display_name: str
    sync_status: Optional[str] = None
    last_sync_at: Optional[datetime] = None

class Assignments(Base):
    __tablename__ = 'assignments'

    id = Column(Integer, primary_key=True)
    device_id = Column(Integer, ForeignKey('devices.id'), nullable=False)
    tenant_id = Column(Integer, ForeignKey('tenant_users.id'), nullable=False)
    allocated_at = Column(DateTime(timezone=True), server_default=func.now())
    deallocated_at = Column(DateTime(timezone=True))
    sharepoint_id = Column(Integer)
    request_id = Column(Integer, ForeignKey('requests.id'))

class CreateAssignment(BaseModel):
    device_id: int
    tenant_id: int
    request_id: int | None = None
    sharepoint_id: int | None = None


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
    purchase_price: Decimal
    asset_number: Optional[str] = None
    order_number: Optional[str] = None
    condition_notes: Optional[str] = None
    sharepoint_id: Optional[int] = None

class AddAssignment(BaseModel):
    request_id: int
    device_id: int
    tenant_id: universal_unique_id
    assigned_to: str
    assignee_email: str
    deallocated_at: Optional[datetime] = None
    transferred_from: Optional[str] = None