import sys
import os
from datetime import datetime
from typing import Dict, Any, Optional
from google.adk.tools import FunctionTool

# Import directly from the tools directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

from student_desk.tools.database_operations import db_operations


@FunctionTool
async def get_user_college_context(*, tool_context) -> dict:
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
        
        # Get user_id from session state (handle both dict and object types)
        user_id = None
        if hasattr(session_state, 'get') and callable(getattr(session_state, 'get')):
            user_id = session_state.get('user_id')
        elif hasattr(session_state, 'user_id'):
            user_id = getattr(session_state, 'user_id', None)
        elif isinstance(session_state, dict):
            user_id = session_state.get('user_id')
        elif isinstance(session_state, list) and len(session_state) > 0:
            # Handle case where session_state might be a list
            first_state = session_state[0]
            if isinstance(first_state, dict):
                user_id = first_state.get('user_id')
            elif hasattr(first_state, 'user_id'):
                user_id = getattr(first_state, 'user_id', None)
        
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
        
        user_result = await db_operations.get_user_context(user_id)
        
        if not user_result.get("success") or not user_result.get("user_data"):
            return {
                "success": False,
                "error": "incomplete_profile",
                "message": "User profile not found or academic details incomplete",
                "data": {
                    "user_id": user_id,
                    "profile_status": "incomplete"
                }
            }
        
        user_data = user_result["user_data"]
        academic_details = user_data.get("user_academic_details", {})
        
        # Handle case where academic_details might be a list
        if isinstance(academic_details, list) and len(academic_details) > 0:
            academic_details = academic_details[0]
        
        college_info = academic_details.get("colleges", {}) if academic_details else {}
        
        # Handle case where college_info might be a list
        if isinstance(college_info, list) and len(college_info) > 0:
            college_info = college_info[0]
        
        context_data = {
            "user_profile": {
                "user_id": user_id,
                "name": user_data.get('name'),
                "department": academic_details.get('department_name'),
                "branch": academic_details.get('branch_name'),
                "current_year": academic_details.get('current_year'),
                "admission_year": academic_details.get('admission_year'),
                "graduation_year": academic_details.get('graduation_year')
            },
            "college_details": {
                "college_id": college_info.get('college_id'),
                "name": college_info.get('name'),
                "city": college_info.get('city'),
                "state": college_info.get('state'),
                "university_name": college_info.get('university_name'),
                "website_url": college_info.get('college_website_url'),
                "location_string": f"{college_info.get('city', '')}, {college_info.get('state', '')}".strip(', ')
            },
            "search_context": {
                "primary_search_term": college_info.get('name', ''),
                "location_context": college_info.get('city', ''),
                "academic_context": academic_details.get('department_name', ''),
                "full_context": f"{college_info.get('name', '')} {college_info.get('city', '')} {college_info.get('state', '')}"
            }
        }
        
        return {
            "success": True,
            "message": "College context retrieved successfully",
            "data": context_data,
            "metadata": {
                "retrieved_at": datetime.now().isoformat(),
                "data_completeness": "full" if all([college_info.get('name'), academic_details.get('department_name')]) else "partial"
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": "system_error",
            "message": f"Failed to retrieve college context: {str(e)}",
            "data": None
        }


@FunctionTool
async def fetch_campus_content_by_user_id(*, tool_context) -> dict:
    try:
        session_state = getattr(tool_context, 'state', None)
        if not session_state:
            return {
                "success": False,
                "error": "session_unavailable",
                "message": "Session state not available in tool context"
            }
        
        # Get user_id from session state (handle both dict and object types)
        user_id = None
        if hasattr(session_state, 'get') and callable(getattr(session_state, 'get')):
            user_id = session_state.get('user_id')
        elif hasattr(session_state, 'user_id'):
            user_id = getattr(session_state, 'user_id', None)
        elif isinstance(session_state, dict):
            user_id = session_state.get('user_id')
        elif isinstance(session_state, list) and len(session_state) > 0:
            # Handle case where session_state might be a list
            first_state = session_state[0]
            if isinstance(first_state, dict):
                user_id = first_state.get('user_id')
            elif hasattr(first_state, 'user_id'):
                user_id = getattr(first_state, 'user_id', None)
        
        if not user_id:
            return {
                "success": False,
                "error": "missing_user_id",
                "message": "User ID not found in session state"
            }
        
        user_result = await db_operations.get_user_context(user_id)
        
        if not user_result.get("success") or not user_result.get("user_data"):
            return {
                "success": False,
                "error": "user_profile_incomplete",
                "message": "User profile not found or incomplete. Please ensure the user has completed their academic profile setup.",
                "user_id": user_id
            }
        
        user_data = user_result["user_data"]
        academic_details = user_data.get("user_academic_details", {})
        
        # Handle case where academic_details might be a list
        if isinstance(academic_details, list) and len(academic_details) > 0:
            academic_details = academic_details[0]
        
        college_info = academic_details.get("colleges", {}) if academic_details else {}
        
        # Handle case where college_info might be a list
        if isinstance(college_info, list) and len(college_info) > 0:
            college_info = college_info[0]
        
        college_id = academic_details.get('college_id')
        college_name = college_info.get('name', 'Unknown College')
        college_website = college_info.get('college_website_url')
        
        campus_result = await db_operations.get_campus_data(college_id)
        campus_content = campus_result.get("college_data", {}) if campus_result.get("success") else {}
        
        return {
            "success": True,
            "user_id": user_id,
            "college_id": college_id,
            "college_name": college_name,
            "college_website": college_website,
            "campus_content": campus_content or {},
            "formatted_content": format_campus_content_for_agent(campus_content, college_name) if campus_content else None,
            "last_updated": campus_content.get('updated_at') if campus_content else None
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": "database_error",
            "message": f"Error fetching campus content: {str(e)}"
        }


def format_campus_content_for_agent(campus_content: dict, college_name: str) -> str:
    if not campus_content:
        return f"No specific campus content available for {college_name}."
    
    formatted_sections = []
    
    for section_key, section_data in campus_content.items():
        if section_key not in ['created_at', 'updated_at', 'college_id'] and section_data:
            section_title = section_key.replace('_', ' ').title()
            formatted_sections.append(f"\n{section_title}:\n{section_data}")
    
    if formatted_sections:
        return f"Campus Information for {college_name}:" + "".join(formatted_sections)
    else:
        return f"Limited campus content available for {college_name}." 