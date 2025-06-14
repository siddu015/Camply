"""Tools for the Campus Agent to fetch dynamic campus content."""

import httpx
import json
import re
from typing import Dict, Any, Optional
from google.adk.tools import FunctionTool

async def fetch_campus_content(user_id: str) -> str:
    """
    Fetch campus AI content from the backend API using user_id.
    
    Args:
        user_id: UUID of the user to fetch campus content for
        
    Returns:
        Formatted campus content string for the agent
    """
    # Validate user_id format (should be UUID)
    if not user_id or not re.match(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', user_id, re.IGNORECASE):
        return f"Invalid user_id format: {user_id}. Please provide a valid UUID."
    
    try:
        # Make request to backend API
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "http://localhost:8001/campus-content",
                json={"user_id": user_id},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 404:
                return "Campus content not found for this college. The college may not have uploaded campus information yet."
            
            if response.status_code != 200:
                return f"Unable to fetch campus content at this time (HTTP {response.status_code}). Please try again later."
            
            data = response.json()
            
            if not data.get("success"):
                error_msg = data.get('error', 'Unknown error')
                if error_msg == "campus_content_not_found":
                    return "Campus content is not available for this college yet. The college administration may need to upload the information."
                return f"Campus content service error: {error_msg}"
            
            campus_content = data.get("content")
            if not campus_content:
                return "No campus content found for this college. Please contact the college administration for more information."
            
            # Format the content for the agent
            return format_campus_content_for_agent(campus_content)
            
    except httpx.TimeoutException:
        return "Request timed out while fetching campus content. Please try again."
    except httpx.ConnectError:
        return "Unable to connect to campus content service. The service may be temporarily unavailable."
    except Exception as e:
        return f"Unexpected error while fetching campus content: {str(e)}"

def format_campus_content_for_agent(campus_content: Dict[str, Any]) -> str:
    """
    Format campus AI content for the campus agent with enhanced formatting.
    
    Args:
        campus_content: Campus AI content dictionary
        
    Returns:
        Formatted string for campus agent context
    """
    if not campus_content:
        return "Campus content not available."
    
    content_parts = []
    content_parts.append("=== CAMPUS INFORMATION DATABASE ===")
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

# Create the tool for ADK
fetch_campus_content_tool = FunctionTool(fetch_campus_content) 