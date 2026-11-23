from app.database import Base
from sqlalchemy import Column, Integer, Text, Identity, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column

class Users(Base):
    __tablename__ = 'users'
    __table_args__ = (
        CheckConstraint("role IN ('admin', 'pm', 'fd', 'super_user')", name="role"),
        CheckConstraint("status IN ('active', 'deactivated')", name="status"),
    )

    id: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    username: Mapped[str] = mapped_column(unique=True)
    password: Mapped[str]
    role: Mapped[str]
    user_first_name: Mapped[str]
    user_surname: Mapped[str]
    database_id: Mapped[str]
    user_email: Mapped[str | None]
    sharepoint_id: Mapped[int | None]
    status: Mapped[str] = mapped_column(server_default="active")

class ProjectCodes(Base):
    __tablename__ = 'project_codes'

    id: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    project_code: Mapped[str]
    description: Mapped[str]

class Software(Base):
    __tablename__ = 'software'

    id: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    software: Mapped[str]
    display_name: Mapped[str]

class EmployeeDivisions(Base):
    __tablename__ = 'employee_divisions'

    id: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    division_name: Mapped[str]

class BaseCountry(Base):
    __tablename__ = 'base_country'

    id: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    country_name: Mapped[str]