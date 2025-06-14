"""Data service functions for student_desk agents."""

import sys
import os
import asyncio

# Add parent directory to path to access shared modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from shared import UserDataService

def get_user_data(user_id: str):
    """Get user context data synchronously for ADK agents."""
    try:
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(UserDataService.get_user_context(user_id))
    except RuntimeError:
        # If no event loop is running, create a new one
        return asyncio.run(UserDataService.get_user_context(user_id))

def get_campus_data(college_id: str):
    """Get campus AI content synchronously for ADK agents."""
    try:
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(UserDataService.get_campus_ai_content(college_id))
    except RuntimeError:
        # If no event loop is running, create a new one
        return asyncio.run(UserDataService.get_campus_ai_content(college_id))

def format_user_data(user_context):
    """Format user data for agent consumption."""
    return UserDataService.format_user_context_for_agent(user_context)

def format_campus_data(campus_content):
    """Format campus data for agent consumption."""
    return UserDataService.format_campus_content_for_agent(campus_content) 