"""
This module is responsible for loading in all of the environment variables
Here we will be using the pydantic-settings module
Settings inherits from the class BaseSettings
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

# This resolves the file path to the .env file, which is in the root directory
ENV_FILE_PATH = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ENV_FILE_PATH/".env", extra="ignore") # extra="ignore" is is for any variables not mentioned in the class

    # These are the parameters for the database connection
    db_name: str
    db_user: str
    db_password: str
    db_host: str
    db_port: str

    # These are the credentials for the graph and sharepoint api
    CLIENT_ID: str
    CLIENT_SECRET: str
    SITE_ID: str
    TENANT_ID: str

    SP_KEY_PATH: str
    SP_CERT_THUMBPRINT: str

    PENDING_REQUESTS_LIST_ID: str
    DEVICE_LIST_TESTING_LIST_ID: str

    LIST_URL: str
    DEVICES_ID: str

settings = Settings()