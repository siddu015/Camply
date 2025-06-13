"""Configuration settings for the Camply backend."""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# ADK Server Configuration
ADK_SERVER_URL = os.getenv("ADK_SERVER_URL", "http://localhost:8000")
ADK_APP_NAME = os.getenv("ADK_APP_NAME", "student_desk")

# Validate required environment variables
if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise ValueError(
        "Missing required environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY"
    )

# For backend operations, prefer service role key if available
SUPABASE_BACKEND_KEY = SUPABASE_SERVICE_ROLE_KEY if SUPABASE_SERVICE_ROLE_KEY else SUPABASE_ANON_KEY

if not SUPABASE_SERVICE_ROLE_KEY:
    print("⚠️ WARNING: SUPABASE_SERVICE_ROLE_KEY not set. Using anon key (may cause RLS issues)")
else:
    print("✅ Using service role key for backend operations") 