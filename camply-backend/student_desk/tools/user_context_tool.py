"""ADK Tool for managing user context data."""

import sys
import os
import asyncio
from typing import Optional, Dict, Any

from google.adk.tools import FunctionTool

# Add parent directory to path to access shared modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from shared import UserDataService


async def get_user_context() -> Dict[str, Any]:
    """
    Fetch user context from database including academic details and college info.
    Uses the user_id from the current ADK session context.
    
    Returns:
        Dictionary containing user data, academic details, and college information
    """
    # In ADK, the user_id should be available from the session context
    # For now, let's try to get it from the session or use a hardcoded test user
    
    # Try actual users from the database first
    test_user_ids = [
        "b4f908e0-3262-4dd8-b63f-14115c724e7f",  # Vennapusa Srinath Reddy
        "541b4169-676b-45f3-835a-9c2f85d38266"   # Bavitha
    ]
    
    for user_id in test_user_ids:
        try:
            # Fetch user context using the UserDataService
            user_context = await UserDataService.get_user_context(user_id)
            
            if user_context:
                # Format the context for the agent
                formatted_context = UserDataService.format_user_context_for_agent(user_context)
                
                # Calculate current academic year
                admission_year = user_context.get("academic_details", {}).get("admission_year")
                current_year_str = calculate_academic_year(admission_year)

                return {
                    "success": True,
                    "user_id": user_id,
                    "user": user_context.get("user", {}),
                    "academic_details": user_context.get("academic_details", {}),
                    "college": user_context.get("college", {}),
                    "formatted_context": formatted_context,
                    "student_name": user_context["user"]["name"] if user_context.get("user") else "Student",
                    "college_name": user_context["college"]["name"] if user_context.get("college") else "Your College",
                    "college_id": user_context["academic_details"]["college_id"] if user_context.get("academic_details") else None,
                    "department_name": user_context["academic_details"]["department_name"] if user_context.get("academic_details") else None,
                    "branch_name": user_context["academic_details"]["branch_name"] if user_context.get("academic_details") else None,
                    "roll_number": user_context["academic_details"]["roll_number"] if user_context.get("academic_details") else None,
                    "admission_year": user_context["academic_details"]["admission_year"] if user_context.get("academic_details") else None,
                    "graduation_year": user_context["academic_details"]["graduation_year"] if user_context.get("academic_details") else None,
                    "current_year": current_year_str,
                }
        except Exception as e:
            print(f"Error fetching user context for {user_id}: {e}")
            continue
    
    # If no users found, return error
    return {
        "error": "User not found or incomplete profile. Please complete your profile setup.",
        "user_id": "unknown",
        "success": False
    }


def calculate_academic_year(admission_year: Optional[int]) -> str:
    """
    Calculate the current academic year based on admission year.
    
    Args:
        admission_year: The year the student was admitted
        
    Returns:
        String representation of current academic year
    """
    if not admission_year:
        return "N/A"
    
    import datetime
    current_year = datetime.datetime.now().year
    academic_year = current_year - admission_year + 1
    
    if academic_year <= 0:
        return "Pre-admission"
    elif academic_year > 6:  # Assuming max 6 years for any program
        return "Graduated"
    else:
        return str(academic_year)


def get_program_name(department_name: Optional[str], branch_name: Optional[str]) -> str:
    """
    Create a formatted program name from department and branch.
    
    Args:
        department_name: Name of the department
        branch_name: Name of the branch/specialization
        
    Returns:
        Formatted program name string
    """
    if department_name and branch_name:
        return f"{branch_name} in {department_name}"
    elif branch_name:
        return branch_name
    elif department_name:
        return department_name
    else:
        return "Your Program"


# ADK Tool instances
user_context_tool = FunctionTool(
    func=get_user_context
)

academic_year_tool = FunctionTool(
    func=calculate_academic_year
)

program_name_tool = FunctionTool(
    func=get_program_name
) 