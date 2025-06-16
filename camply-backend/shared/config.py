"""Configuration settings for the Camply backend."""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Configuration class for Camply backend services."""
    
    # Supabase Configuration
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    # ADK Server Configuration
    ADK_SERVER_URL = os.getenv("ADK_SERVER_URL", "http://localhost:8000")
    ADK_APP_NAME = os.getenv("ADK_APP_NAME", "student_desk")
    
    @classmethod
    def validate(cls):
        """Validate required environment variables."""
        if not cls.SUPABASE_URL or not cls.SUPABASE_ANON_KEY:
            raise ValueError(
                "Missing required environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY"
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

# Initialize and validate configuration
Config.validate() 