"""Database operations for fetching user data from Supabase."""

from supabase import create_client, Client
from typing import Optional, Dict, Any
import config

# Initialize Supabase client with service role key for backend operations
supabase: Client = create_client(config.SUPABASE_URL, config.SUPABASE_BACKEND_KEY)

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
            # Fetch user basic info
            user_response = supabase.table("users").select("*").eq("user_id", user_id).execute()
            
            if not user_response.data:
                print(f"No user found with ID: {user_id}")
                return None
            
            user_data = user_response.data[0]
            
            # If user has academic_id, fetch academic details
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
            
            # Return basic user data if no academic details
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
        
        # User basic info
        user = user_context.get("user", {})
        if user:
            context_parts.append(f"Student Name: {user.get('name', 'N/A')}")
            context_parts.append(f"Email: {user.get('email', 'N/A')}")
            if user.get('phone_number'):
                context_parts.append(f"Phone: {user.get('phone_number')}")
        
        # Academic details
        academic = user_context.get("academic_details")
        if academic:
            context_parts.append(f"Department: {academic.get('department_name', 'N/A')}")
            context_parts.append(f"Branch/Specialization: {academic.get('branch_name', 'N/A')}")
            context_parts.append(f"Roll Number: {academic.get('roll_number', 'N/A')}")
            context_parts.append(f"Academic Timeline: {academic.get('admission_year', 'N/A')} - {academic.get('graduation_year', 'N/A')}")
            
            # Calculate current academic year
            import datetime
            current_year = datetime.datetime.now().year
            if academic.get('admission_year'):
                academic_year = current_year - academic['admission_year'] + 1
                context_parts.append(f"Current Academic Year: {academic_year}")
            
            # Create program description
            dept = academic.get('department_name')
            branch = academic.get('branch_name')
            if dept and branch:
                context_parts.append(f"Program: {branch} in {dept}")
            elif branch:
                context_parts.append(f"Program: {branch}")
            elif dept:
                context_parts.append(f"Program: {dept}")
        
        # College info
        college = user_context.get("college")
        if college:
            context_parts.append(f"College: {college.get('name', 'N/A')}")
            if college.get('city') and college.get('state'):
                context_parts.append(f"Location: {college.get('city')}, {college.get('state')}")
            if college.get('university_name'):
                context_parts.append(f"University: {college.get('university_name')}")
        
        return "\n".join(context_parts) if context_parts else "User context not fully available." 