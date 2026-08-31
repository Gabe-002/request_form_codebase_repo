from app.database import Base
from sqlalchemy import Column, Integer, Text

class Users(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, nullable=False)
    username = Column(Text, nullable=False)
    password = Column(Text, nullable=False)
    role = Column(Text, nullable=False)
    user_first_name = Column(Text, nullable=False)
    user_surname = Column(Text, nullable=False)
    database_id = Column(Text, nullable=False)
    user_email = Column(Text, nullable=False)
    sharepoint_id = Column(Integer, nullable=True, default=None)

class ProjectCodes(Base):
    __tablename__ = 'project_codes'

    id = Column(Integer, primary_key=True, nullable=False)
    project_code = Column(Text, nullable=False)
    description = Column(Text, nullable=False)

class Software(Base):
    __tablename__ = 'software'

    id = Column(Integer, primary_key=True, nullable=False)
    software = Column(Text, nullable=False)
    display_name = Column(Text, nullable=False)

class EmployeeDivisions(Base):
    __tablename__ = 'employee_divisions'

    id = Column(Integer, primary_key=True, nullable=False)
    division_name = Column(Text, nullable=False)

class BaseCountry(Base):
    __tablename__ = 'base_country'

    id = Column(Integer, primary_key=True, nullable=False)
    country_name = Column(Text, nullable=False)