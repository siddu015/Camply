"""Core Context Management Tools for Campus Agent."""

import sys
import os
from datetime import datetime
from typing import Dict, Any, Optional
from google.adk.tools import FunctionTool

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

from shared import UserDataService


@FunctionTool
async def get_user_college_context(user_id: str, *, tool_context) -> dict:
    """
    Primary context fetcher - gets user's complete college information for all campus queries.
    This is the foundational tool that should be called first for any campus-related request.
    
    Args:
        user_id: UUID of the user to fetch college context for
        
    Returns:
        Structured college context with comprehensive information
    """
    try:
        session_user_id = getattr(tool_context, 'user_id', None)
        effective_user_id = user_id or session_user_id
        
        if not effective_user_id:
            return {
                "success": False,
                "error": "missing_user_id",
                "message": "User ID is required to fetch college context",
                "data": None
            }
        
        user_context = await UserDataService.get_user_context(effective_user_id)
        
        if not user_context or not user_context.get('academic_details'):
            return {
                "success": False,
                "error": "incomplete_profile",
                "message": "User profile not found or academic details incomplete",
                "data": {
                    "user_id": effective_user_id,
                    "profile_status": "incomplete"
                }
            }
        
        college_info = user_context.get('college', {})
        academic_info = user_context.get('academic_details', {})
        
        context_data = {
            "user_profile": {
                "user_id": effective_user_id,
                "name": user_context.get('user', {}).get('name'),
                "department": academic_info.get('department_name'),
                "branch": academic_info.get('branch_name'),
                "current_year": user_context.get('current_year'),
                "admission_year": academic_info.get('admission_year'),
                "graduation_year": academic_info.get('graduation_year')
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
                "academic_context": academic_info.get('department_name', ''),
                "full_context": f"{college_info.get('name', '')} {college_info.get('city', '')} {college_info.get('state', '')}"
            }
        }
        
        return {
            "success": True,
            "message": "College context retrieved successfully",
            "data": context_data,
            "metadata": {
                "retrieved_at": datetime.now().isoformat(),
                "data_completeness": "full" if all([college_info.get('name'), academic_info.get('department_name')]) else "partial"
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
async def fetch_campus_content_by_user_id(user_id: str, *, tool_context) -> dict:
    """
    Fetch comprehensive campus AI content using user_id to get their college information.
    
    Args:
        user_id: UUID of the user to fetch campus content for
        
    Returns:
        Structured campus content dictionary
    """
    try:
        user_context = await UserDataService.get_user_context(user_id)
        
        if not user_context or not user_context.get('academic_details'):
            return {
                "success": False,
                "error": "user_profile_incomplete",
                "message": "User profile not found or incomplete. Please ensure the user has completed their academic profile setup.",
                "user_id": user_id
            }
        
        college_id = user_context['academic_details']['college_id']
        college_name = user_context['college']['name'] if user_context.get('college') else 'Unknown College'
        college_website = user_context['college'].get('college_website_url') if user_context.get('college') else None
        
        campus_content = await UserDataService.get_campus_ai_content(college_id)
        
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
            "message": f"Error fetching campus content: {str(e)}",
            "user_id": user_id
        }


def format_campus_content_for_agent(campus_content: dict, college_name: str) -> str:
    """Format campus content for agent consumption."""
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