"""Data service functions for student_desk agents."""

import sys
import os
import asyncio

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from shared import UserDataService

def get_user_data(user_id: str):
    try:
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(UserDataService.get_user_context(user_id))
    except RuntimeError:
        return asyncio.run(UserDataService.get_user_context(user_id))

def get_campus_data(college_id: str):
    try:
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(UserDataService.get_campus_ai_content(college_id))
    except RuntimeError:
        return asyncio.run(UserDataService.get_campus_ai_content(college_id))

def format_user_data(user_context):
    return UserDataService.format_user_context_for_agent(user_context)

def format_campus_data(campus_content):
    return UserDataService.format_campus_content_for_agent(campus_content) 