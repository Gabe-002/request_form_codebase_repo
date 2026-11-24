from app.database import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Column, Integer, Text, Numeric, ForeignKey, DateTime, Boolean, CheckConstraint
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
    __table_args__ = (
        CheckConstraint("status IN ('available', 'assigned', 'repair', 'retired')", name="status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    status: Mapped[str] = mapped_column(server_default="available")
    asset_number: Mapped[str | None] = mapped_column(unique=True)
    asset_type: Mapped[str]
    manufacturer: Mapped[str]
    model: Mapped[str]
    serial_number: Mapped[str]
    purchase_price: Mapped[Decimal | None]
    order_number: Mapped[str | None]
    condition_notes: Mapped[str]
    sharepoint_id: Mapped[int | None]
    location: Mapped[str | None] = mapped_column(server_default="IT Storage")

    itan: Mapped[str | None] # ITAN is an acronym for IT Asset Number
    

class TenantUsers(Base):
    __tablename__ = 'tenant_users'

    id: Mapped[int] = mapped_column(primary_key=True)
    graph_id: Mapped[universal_unique_id] = mapped_column(unique=True)
    email: Mapped[str | None]
    display_name: Mapped[str]
    account_enabled: Mapped[bool | None]
    upn: Mapped[str]


class TenantSyncState(Base):
    __tablename__ = 'tenant_sync_state'

    id: Mapped[int] = mapped_column(primary_key=True)
    delta_link: Mapped[str | None]
    last_sync_at: Mapped[datetime] = mapped_column(server_default=func.now())
    sync_status: Mapped[str]

class Assignments(Base):
    __tablename__ = 'assignments'

    id: Mapped[int] = mapped_column(primary_key=True)
    device_id: Mapped[int] = mapped_column(ForeignKey("devices.id", ondelete="CASCADE"))
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenant_users.id"))
    allocated_at: Mapped[datetime | None] = mapped_column(server_default=func.now())
    deallocated_at: Mapped[datetime | None]
    sharepoint_id: Mapped[int | None]
    request_id: Mapped[int | None] = mapped_column(ForeignKey("requests.id"))

class CreateTenantUser(BaseModel):
    graph_id: universal_unique_id
    display_name: str
    email: Optional[str] = None
    account_enabled: Optional[bool] = None
    upn: Optional[str] = None


class UpdateTenantUser(BaseModel):
    display_name: str
    email: Optional[str] = None
    account_enabled: Optional[bool] = None
    upn: str

class SetSyncState(BaseModel):
    display_name: str
    sync_status: Optional[str] = None
    last_sync_at: Optional[datetime] = None


class CreateAssignment(BaseModel):
    device_id: int
    tenant_id: int
    location: str | None = None
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
    purchase_price: Optional[Decimal] = None
    asset_number: Optional[str] = None
    order_number: Optional[str] = None
    condition_notes: Optional[str] = None
    sharepoint_id: Optional[int] = None
    location: Optional[str] = None

class AddAssignment(BaseModel):
    request_id: int
    device_id: int
    tenant_id: universal_unique_id
    assigned_to: str
    assignee_email: str
    deallocated_at: Optional[datetime] = None
    transferred_from: Optional[str] = None

class UpdateInfo(BaseModel):
    device_id: int
    sharepoint_id: int
    assignment_id: Optional[int] = None
    tenant_id: Optional[int] = None
    status: Optional[str] = None
    condition_notes: Optional[str] = None