"""Data service functions for student_desk agents."""

import sys
import os
import asyncio
from google.adk.tools import FunctionTool

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from .database_operations import db_operations

@FunctionTool
async def get_user_data(user_id: str, *, tool_context) -> dict:
    """Get user context using DatabaseOperations"""
    try:
        result = await db_operations.get_user_context(user_id)
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}

@FunctionTool  
async def get_campus_data(college_id: str, *, tool_context) -> dict:
    """Get campus data using DatabaseOperations"""
    try:
        result = await db_operations.get_campus_data(college_id)
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}

def format_user_data(user_context):
    """Format user context for agent consumption"""
    if not user_context or not user_context.get("success"):
        return "User context not available"
    
    user_data = user_context.get("user_data", {})
    academic_details = user_data.get("user_academic_details", {})
    
    # Handle case where academic_details might be a list
    if isinstance(academic_details, list) and len(academic_details) > 0:
        academic_details = academic_details[0]
    
    return f"User: {user_data.get('name')} - {academic_details.get('department_name')} - {academic_details.get('branch_name')}"

def format_campus_data(campus_content):
    """Format campus content for agent consumption"""
    if not campus_content or not campus_content.get("success"):
        return "Campus content not available"
    
    college_data = campus_content.get("college_data", {})
    college_info = college_data.get("college_info", {})
    return f"College: {college_info.get('name')} - {college_info.get('city')}, {college_info.get('state')}" 