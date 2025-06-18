"""User Context Tool for Handbook Agent - using session state directly like root tools."""

import sys
import os
from google.adk.tools import FunctionTool

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
from shared import UserDataService


@FunctionTool
async def get_user_handbook_context(*, tool_context) -> dict:
    try:
        session_state = getattr(tool_context, 'state', None)
        if not session_state:
            return {
                "success": False,
                "error": "session_unavailable",
                "message": "Session state not available in tool context",
                "debug_info": {
                    "tool_context_attributes": [attr for attr in dir(tool_context) if not attr.startswith('_')],
                    "message": "ADK session state not accessible from tool_context.state"
                }
            }
        
        user_id = session_state.get('user_id') if hasattr(session_state, 'get') else getattr(session_state, 'user_id', None)
        
        if not user_id:
            return {
                "success": False,
                "error": "missing_user_id",
                "message": "User ID not found in session state",
                "debug_info": {
                    "session_state_type": type(session_state).__name__,
                    "session_state_attributes": [attr for attr in dir(session_state) if not attr.startswith('_')] if session_state else [],
                    "message": "user_id must be in session state created by main.py"
                }
            }

        user_context = await UserDataService.get_user_context(user_id)
        
        if not user_context:
            return {
                "success": False,
                "error": "user_profile_not_found",
                "message": f"User profile not found for user_id: {user_id}. Please complete your profile setup.",
                "user_id": user_id
            }

        academic_details = user_context.get("academic_details", {})
        academic_id = academic_details.get("academic_id")
        
        if not academic_id:
            return {
                "success": False,
                "error": "missing_academic_id",
                "message": "Academic ID not found in user profile. Please complete your academic profile.",
                "user_id": user_id
            }

        return {
            "success": True,
            "user_id": user_id,
            "academic_id": academic_id,
            "student_name": user_context.get("user", {}).get("name", "Student"),
            "college_name": user_context.get("college", {}).get("name", "Your College"),
            "college_id": academic_details.get("college_id"),
            "department_name": academic_details.get("department_name"),
            "branch_name": academic_details.get("branch_name"),
            "current_year": user_context.get("current_year"),
            "full_context": {
                "user": user_context.get("user", {}),
                "academic_details": academic_details,
                "college": user_context.get("college", {})
            }
        }

    except Exception as e:
        return {
            "success": False,
            "error": "system_error",
            "message": f"Failed to retrieve handbook context: {str(e)}"
        } 