"""Configuration settings for the Camply backend."""

import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Configuration class for Camply backend services."""
    
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    ADK_SERVER_URL = os.getenv("ADK_SERVER_URL", "http://localhost:8000")
    ADK_APP_NAME = os.getenv("ADK_APP_NAME", "student_desk")
    
    # CORS origins (comma-separated list)
    ALLOWED_ORIGINS = os.getenv(
        "ALLOWED_ORIGINS", 
        "http://localhost:5173,http://localhost:3000"
    ).split(",")
    
    # Google Genai Configuration for ADK
    GOOGLE_GENAI_USE_VERTEXAI = os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "FALSE")
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
    
    # Server Configuration
    PORT = int(os.getenv("PORT", "8080"))
    
    @classmethod
    def validate(cls):
        """Validate required environment variables."""
        missing_vars = []
        
        if not cls.SUPABASE_URL:
            missing_vars.append("SUPABASE_URL")
        if not cls.SUPABASE_ANON_KEY:
            missing_vars.append("SUPABASE_ANON_KEY")
        if not cls.GOOGLE_API_KEY:
            missing_vars.append("GOOGLE_API_KEY")
            
        if missing_vars:
            raise ValueError(
                f"Missing required environment variables: {', '.join(missing_vars)}"
            )
    
    @classmethod 
    def get_supabase_backend_key(cls):
        """Get the appropriate Supabase key for backend operations."""
        if cls.SUPABASE_SERVICE_ROLE_KEY:
            print("Using service role key for backend operations")
            return cls.SUPABASE_SERVICE_ROLE_KEY
        else:
            print("WARNING: SUPABASE_SERVICE_ROLE_KEY not set. Using anon key (may cause RLS issues)")
            return cls.SUPABASE_ANON_KEY

Config.validate() 