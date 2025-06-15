"""Tools for the Campus Agent to fetch dynamic campus content following ADK principles."""

import sys
import os
import asyncio
from typing import Dict, Any, Optional
from google.adk.tools import FunctionTool

# Add parent directory to path to access shared modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

from shared import UserDataService


async def fetch_campus_content_by_user_id(user_id: str) -> str:
    """
    Fetch campus AI content using user_id to get their college information.
    
    Args:
        user_id: UUID of the user to fetch campus content for
        
    Returns:
        Formatted campus content string for the agent
    """
    try:
        # First get user context to find their college_id
        user_context = await UserDataService.get_user_context(user_id)
        
        if not user_context or not user_context.get('academic_details'):
            return "User profile not found or incomplete. Please ensure the user has completed their academic profile setup."
        
        college_id = user_context['academic_details']['college_id']
        college_name = user_context['college']['name'] if user_context.get('college') else 'Unknown College'
        
        # Fetch campus AI content from database
        campus_content = await UserDataService.get_campus_ai_content(college_id)
        
        if not campus_content:
            return f"Campus content is not available for {college_name} yet. The college administration may need to upload the campus information."
        
        # Format the content for the agent
        return format_campus_content_for_agent(campus_content, college_name)
        
    except Exception as e:
        return f"Error fetching campus content: {str(e)}. Please try again or contact support if the issue persists."


async def fetch_campus_content_by_college_id(college_id: str) -> str:
    """
    Fetch campus AI content directly using college_id.
    
    Args:
        college_id: UUID of the college to fetch content for
        
    Returns:
        Formatted campus content string for the agent
    """
    try:
        # Fetch campus AI content from database
        campus_content = await UserDataService.get_campus_ai_content(college_id)
        
        if not campus_content:
            return f"Campus content is not available for this college (ID: {college_id}). The college administration may need to upload the campus information."
        
        # Format the content for the agent
        return format_campus_content_for_agent(campus_content, f"College {college_id}")
        
    except Exception as e:
        return f"Error fetching campus content: {str(e)}. Please try again or contact support if the issue persists."


def format_campus_content_for_agent(campus_content: Dict[str, Any], college_name: str = "College") -> str:
    """
    Format campus AI content for the campus agent with enhanced formatting.
    
    Args:
        campus_content: Campus AI content dictionary
        college_name: Name of the college for better formatting
        
    Returns:
        Formatted string for campus agent context
    """
    if not campus_content:
        return f"Campus content not available for {college_name}."
    
    content_parts = []
    content_parts.append(f"=== {college_name.upper()} CAMPUS INFORMATION DATABASE ===")
    content_parts.append(f"Content Version: {campus_content.get('content_version', 1)}")
    content_parts.append(f"Last Updated: {campus_content.get('updated_at', 'N/A')}")
    
    # College Overview
    if campus_content.get("college_overview_content"):
        content_parts.append("\n" + "="*50)
        content_parts.append("COLLEGE OVERVIEW")
        content_parts.append("="*50)
        overview = campus_content["college_overview_content"]
        if isinstance(overview, dict):
            for key, value in overview.items():
                if value:  # Only include non-empty values
                    formatted_key = key.replace('_', ' ').title()
                    content_parts.append(f"• {formatted_key}: {value}")
        else:
            content_parts.append(str(overview))
    
    # Facilities
    if campus_content.get("facilities_content"):
        content_parts.append("\n" + "="*50)
        content_parts.append("CAMPUS FACILITIES")
        content_parts.append("="*50)
        facilities = campus_content["facilities_content"]
        if isinstance(facilities, dict):
            for key, value in facilities.items():
                if value:  # Only include non-empty values
                    formatted_key = key.replace('_', ' ').title()
                    content_parts.append(f"• {formatted_key}: {value}")
        else:
            content_parts.append(str(facilities))
    
    # Placements
    if campus_content.get("placements_content"):
        content_parts.append("\n" + "="*50)
        content_parts.append("PLACEMENT INFORMATION")
        content_parts.append("="*50)
        placements = campus_content["placements_content"]
        if isinstance(placements, dict):
            for key, value in placements.items():
                if value:  # Only include non-empty values
                    formatted_key = key.replace('_', ' ').title()
                    content_parts.append(f"• {formatted_key}: {value}")
        else:
            content_parts.append(str(placements))
    
    # Departments
    if campus_content.get("departments_content"):
        content_parts.append("\n" + "="*50)
        content_parts.append("DEPARTMENTS & PROGRAMS")
        content_parts.append("="*50)
        departments = campus_content["departments_content"]
        if isinstance(departments, dict):
            for key, value in departments.items():
                if value:  # Only include non-empty values
                    formatted_key = key.replace('_', ' ').title()
                    content_parts.append(f"• {formatted_key}: {value}")
        else:
            content_parts.append(str(departments))
    
    # Admissions
    if campus_content.get("admissions_content"):
        content_parts.append("\n" + "="*50)
        content_parts.append("ADMISSIONS INFORMATION")
        content_parts.append("="*50)
        admissions = campus_content["admissions_content"]
        if isinstance(admissions, dict):
            for key, value in admissions.items():
                if value:  # Only include non-empty values
                    formatted_key = key.replace('_', ' ').title()
                    content_parts.append(f"• {formatted_key}: {value}")
        else:
            content_parts.append(str(admissions))
    
    content_parts.append("\n" + "="*50)
    content_parts.append("END OF CAMPUS INFORMATION")
    content_parts.append("="*50)
    
    return "\n".join(content_parts)


# ADK Tool instances
fetch_campus_content_tool = FunctionTool(
    func=fetch_campus_content_by_user_id
)

fetch_campus_content_by_id_tool = FunctionTool(
    func=fetch_campus_content_by_college_id
) 