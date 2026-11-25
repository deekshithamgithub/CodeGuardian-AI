# Normal application configuration
APP_NAME = "CodeGuardian"
DATABASE_NAME = "codeguardian_db"
APP_VERSION = "1.0"
WELCOME_MESSAGE = "Welcome to CodeGuardian"
COMPANY_NAME = "OpenAI"

# Secrets loaded from environment variables
import os

API_KEY = os.getenv("API_KEY")
DATABASE_PASSWORD = os.getenv("DATABASE_PASSWORD")
JWT_SECRET = os.getenv("JWT_SECRET")