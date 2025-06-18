import sys
import os
import asyncio
from typing import Optional, Dict, Any

from google.adk.tools import FunctionTool

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from shared import UserDataService


async def get_user_context(*, tool_context) -> Dict[str, Any]:
    session_state = getattr(tool_context, 'state', None)
    if not session_state:
        return {
            "error": "Session state not available in tool context",
            "success": False,
            "debug_info": {
                "tool_context_attributes": [attr for attr in dir(tool_context) if not attr.startswith('_')],
                "message": "ADK session state not accessible from tool_context.state"
            }
        }
    
    user_id = session_state.get('user_id') if hasattr(session_state, 'get') else getattr(session_state, 'user_id', None)
    
    if not user_id:
        return {
            "error": "User ID not found in session state - ensure session is created with user_id in initial state",
            "success": False,
            "debug_info": {
                "session_state_type": type(session_state).__name__,
                "session_state_attributes": [attr for attr in dir(session_state) if not attr.startswith('_')] if session_state else [],
                "session_state_dict": dict(session_state) if hasattr(session_state, 'get') else str(session_state),
                "message": "user_id must be in session state created by main.py"
            }
        }
    
    try:
        user_context = await UserDataService.get_user_context(user_id)
        
        if user_context:
            formatted_context = UserDataService.format_user_context_for_agent(user_context)
            
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
        else:
            return {
                "error": f"User profile not found for user_id: {user_id}. Please complete your profile setup.",
                "user_id": user_id,
                "success": False
            }
            
    except Exception as e:
        return {
            "error": f"Error fetching user context for {user_id}: {str(e)}",
            "user_id": user_id,
            "success": False
        }


def calculate_academic_year(admission_year: Optional[int]) -> str:
    if not admission_year:
        return "N/A"
    
    import datetime
    current_year = datetime.datetime.now().year
    academic_year = current_year - admission_year + 1
    
    if academic_year <= 0:
        return "Pre-admission"
    elif academic_year > 6: 
        return "Graduated"
    else:
        return str(academic_year)


def get_program_name(department_name: Optional[str], branch_name: Optional[str]) -> str:
    if department_name and branch_name:
        return f"{branch_name} in {department_name}"
    elif branch_name:
        return branch_name
    elif department_name:
        return department_name
    else:
        return "Your Program"


user_context_tool = FunctionTool(
    func=get_user_context
)

academic_year_tool = FunctionTool(
    func=calculate_academic_year
)

program_name_tool = FunctionTool(
    func=get_program_name
) 