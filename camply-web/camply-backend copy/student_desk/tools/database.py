"""Database operations for fetching user data from Supabase."""

from supabase import create_client, Client
from typing import Optional, Dict, Any
from .config import Config
import asyncpg
import os

supabase: Client = create_client(Config.SUPABASE_URL, Config.get_supabase_backend_key())

_connection_pool: Optional[asyncpg.Pool] = None

async def get_database_connection():
    """Get database connection from pool."""
    global _connection_pool

    if _connection_pool is None:
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise Exception("DATABASE_URL environment variable not set")

        _connection_pool = await asyncpg.create_pool(
            database_url,
            min_size=1,
            max_size=10,
            command_timeout=60
        )

    return await _connection_pool.acquire()

async def close_connection_pool():
    """Close the connection pool."""
    global _connection_pool
    if _connection_pool:
        await _connection_pool.close()
        _connection_pool = None

class UserDataService:
    """Service for fetching user data from Supabase."""
    
    @staticmethod
    async def get_user_context(user_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch user basic details, academic details, and college information.
        
        Args:
            user_id: UUID of the authenticated user
            
        Returns:
            Dictionary containing user context or None if not found
        """
        try:
            user_response = supabase.table("users").select("*").eq("user_id", user_id).execute()
            
            if not user_response.data:
                print(f"No user found with ID: {user_id}")
                return None
            
            user_data = user_response.data[0]
            
            if user_data.get("academic_id"):
                academic_response = supabase.table("user_academic_details").select(
                    "*, colleges(*)"
                ).eq("academic_id", user_data["academic_id"]).execute()
                
                if academic_response.data:
                    academic_data = academic_response.data[0]
                    college_data = academic_data.get("colleges")
                    
                    return {
                        "user": {
                            "user_id": user_data["user_id"],
                            "name": user_data["name"],
                            "email": user_data["email"],
                            "phone_number": user_data.get("phone_number"),
                            "profile_photo_url": user_data.get("profile_photo_url")
                        },
                        "academic_details": {
                            "academic_id": academic_data["academic_id"],
                            "college_id": academic_data["college_id"],
                            "department_name": academic_data["department_name"],
                            "branch_name": academic_data["branch_name"],
                            "admission_year": academic_data["admission_year"],
                            "graduation_year": academic_data["graduation_year"],
                            "roll_number": academic_data["roll_number"]
                        },
                        "college": {
                            "college_id": college_data["college_id"],
                            "name": college_data["name"],
                            "city": college_data.get("city"),
                            "state": college_data.get("state"),
                            "university_name": college_data.get("university_name"),
                            "college_website_url": college_data.get("college_website_url")
                        } if college_data else None
                    }
            
            return {
                "user": {
                    "user_id": user_data["user_id"],
                    "name": user_data["name"],
                    "email": user_data["email"],
                    "phone_number": user_data.get("phone_number"),
                    "profile_photo_url": user_data.get("profile_photo_url")
                },
                "academic_details": None,
                "college": None
            }
            
        except Exception as e:
            print(f"Error fetching user context: {e}")
            return None
    
    @staticmethod
    async def get_campus_ai_content(college_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch campus AI content for a specific college.
        
        Args:
            college_id: UUID of the college
            
        Returns:
            Dictionary containing campus AI content or None if not found
        """
        try:
            response = supabase.table("campus_ai_content").select("*").eq("college_id", college_id).eq("is_active", True).order("updated_at", desc=True).limit(1).execute()
            
            if not response.data:
                print(f"No campus AI content found for college ID: {college_id}")
                return None
            
            content_data = response.data[0]
            
            return {
                "campus_content_id": content_data["campus_content_id"],
                "college_id": content_data["college_id"],
                "college_overview_content": content_data.get("college_overview_content"),
                "facilities_content": content_data.get("facilities_content"),
                "placements_content": content_data.get("placements_content"),
                "departments_content": content_data.get("departments_content"),
                "admissions_content": content_data.get("admissions_content"),
                "content_version": content_data.get("content_version", 1),
                "updated_at": content_data["updated_at"]
            }
            
        except Exception as e:
            print(f"Error fetching campus AI content: {e}")
            return None
    
    @staticmethod
    def format_user_context_for_agent(user_context: Dict[str, Any]) -> str:
        """
        Format user context data for the student desk agent.
        
        Args:
            user_context: User context dictionary
            
        Returns:
            Formatted string for agent context
        """
        if not user_context:
            return "User context not available."
        
        context_parts = []
        
        user = user_context.get("user", {})
        if user:
            context_parts.append(f"Student Name: {user.get('name', 'N/A')}")
            context_parts.append(f"Email: {user.get('email', 'N/A')}")
            if user.get('phone_number'):
                context_parts.append(f"Phone: {user.get('phone_number')}")
        
        academic = user_context.get("academic_details")
        if academic:
            context_parts.append(f"Department: {academic.get('department_name', 'N/A')}")
            context_parts.append(f"Branch/Specialization: {academic.get('branch_name', 'N/A')}")
            context_parts.append(f"Roll Number: {academic.get('roll_number', 'N/A')}")
            context_parts.append(f"Academic Timeline: {academic.get('admission_year', 'N/A')} - {academic.get('graduation_year', 'N/A')}")
            
            import datetime
            current_year = datetime.datetime.now().year
            if academic.get('admission_year'):
                academic_year = current_year - academic['admission_year'] + 1
                context_parts.append(f"Current Academic Year: {academic_year}")
            
            dept = academic.get('department_name')
            branch = academic.get('branch_name')
            if dept and branch:
                context_parts.append(f"Program: {branch} in {dept}")
            elif branch:
                context_parts.append(f"Program: {branch}")
            elif dept:
                context_parts.append(f"Program: {dept}")
        
        college = user_context.get("college")
        if college:
            context_parts.append(f"College: {college.get('name', 'N/A')}")
            if college.get('city') and college.get('state'):
                context_parts.append(f"Location: {college.get('city')}, {college.get('state')}")
            if college.get('university_name'):
                context_parts.append(f"University: {college.get('university_name')}")
        
        return "\n".join(context_parts) if context_parts else "User context not fully available."
    
    @staticmethod
    def format_campus_content_for_agent(campus_content: Dict[str, Any]) -> str:
        """
        Format campus AI content for the campus agent.
        
        Args:
            campus_content: Campus AI content dictionary
            
        Returns:
            Formatted string for campus agent context
        """
        if not campus_content:
            return "Campus content not available."
        
        content_parts = []
        content_parts.append("=== CAMPUS AI CONTENT ===")
        
        if campus_content.get("college_overview_content"):
            content_parts.append("\n--- COLLEGE OVERVIEW ---")
            overview = campus_content["college_overview_content"]
            if isinstance(overview, dict):
                for key, value in overview.items():
                    content_parts.append(f"{key.replace('_', ' ').title()}: {value}")
            else:
                content_parts.append(str(overview))
        
        if campus_content.get("facilities_content"):
            content_parts.append("\n--- FACILITIES ---")
            facilities = campus_content["facilities_content"]
            if isinstance(facilities, dict):
                for key, value in facilities.items():
                    content_parts.append(f"{key.replace('_', ' ').title()}: {value}")
            else:
                content_parts.append(str(facilities))
        
        if campus_content.get("placements_content"):
            content_parts.append("\n--- PLACEMENTS ---")
            placements = campus_content["placements_content"]
            if isinstance(placements, dict):
                for key, value in placements.items():
                    content_parts.append(f"{key.replace('_', ' ').title()}: {value}")
            else:
                content_parts.append(str(placements))
        
        if campus_content.get("departments_content"):
            content_parts.append("\n--- DEPARTMENTS ---")
            departments = campus_content["departments_content"]
            if isinstance(departments, dict):
                for key, value in departments.items():
                    content_parts.append(f"{key.replace('_', ' ').title()}: {value}")
            else:
                content_parts.append(str(departments))
        
        if campus_content.get("admissions_content"):
            content_parts.append("\n--- ADMISSIONS ---")
            admissions = campus_content["admissions_content"]
            if isinstance(admissions, dict):
                for key, value in admissions.items():
                    content_parts.append(f"{key.replace('_', ' ').title()}: {value}")
            else:
                content_parts.append(str(admissions))
        
        content_parts.append(f"\nContent Version: {campus_content.get('content_version', 1)}")
        content_parts.append(f"Last Updated: {campus_content.get('updated_at', 'N/A')}")
        
        return "\n".join(content_parts) 