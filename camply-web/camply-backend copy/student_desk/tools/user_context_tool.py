"""
User Context Tool for Student Desk Agent
CRITICAL: This tool handles user_id extraction from ADK session state
All sub-agents MUST use this tool for user context access.
"""

from google.adk.tools import FunctionTool
from .database_operations import db_operations
import asyncio

@FunctionTool
async def get_user_context(*, tool_context) -> dict:
    """
    MASTER user context function used by ALL agents.
    Extracts user_id from ADK session state and fetches complete user profile.
    
    ADK session state structure:
    tool_context.session_state = {
        "initial_state": {"user_id": "uuid"},
        "user_id": "uuid"  # fallback
    }
    """
    try:
        # STEP 1: Extract user_id from ADK session state (multiple methods)
        user_id = None
        session_state = getattr(tool_context, 'session_state', {})
        
        # Method 1: From initial_state (new format)
        if isinstance(session_state, dict) and 'initial_state' in session_state:
            initial_state = session_state['initial_state']
            if isinstance(initial_state, dict):
                user_id = initial_state.get('user_id')
                print(f"DEBUG: Found user_id in initial_state: {user_id}")
        
        # Method 2: Direct from session_state (fallback)
        if not user_id and isinstance(session_state, dict):
            user_id = session_state.get('user_id')
            print(f"DEBUG: Found user_id in session_state: {user_id}")
        
        # Method 3: From tool_context directly (legacy)
        if not user_id:
            user_id = getattr(tool_context, 'user_id', None)
            print(f"DEBUG: Found user_id in tool_context: {user_id}")
        
        # Method 4: From session_id pattern (emergency fallback)
        if not user_id:
            session_id = getattr(tool_context, 'session_id', '')
            if session_id and '_' in session_id:
                # Try to extract from session_id like "chat_uuid_something"
                parts = session_id.split('_')
                if len(parts) >= 2:
                    potential_user_id = parts[1]
                    if len(potential_user_id) == 36:  # UUID length
                        user_id = potential_user_id
                        print(f"DEBUG: Extracted user_id from session_id: {user_id}")
        
        if not user_id:
            return {
                "success": False,
                "error": "missing_user_id",
                "message": "Could not extract user_id from session state",
                "debug_info": {
                    "session_state": str(session_state)[:200],
                    "available_methods": ["initial_state", "session_state", "tool_context", "session_id"],
                    "tool_context_attrs": [attr for attr in dir(tool_context) if not attr.startswith('_')]
                }
            }
        
        print(f"SUCCESS: Using user_id: {user_id}")
        
        # STEP 2: Fetch user context from database
        try:
            user_context_result = await db_operations.get_user_context(user_id)
            
            if not user_context_result.get("success"):
                return {
                    "success": False,
                    "error": "database_error",
                    "message": "Failed to fetch user context from database",
                    "user_id": user_id,
                    "database_error": user_context_result.get("error", "unknown"),
                    "debug_info": user_context_result
                }
            
            # STEP 3: Return structured user context
            context_data = user_context_result.get("data", {})
            
            return {
                "success": True,
                "user_id": user_id,
                "user_name": context_data.get("user_name"),
                "college_id": context_data.get("college_id"), 
                "college_name": context_data.get("college_name"),
                "department_name": context_data.get("department_name"),
                "branch_name": context_data.get("branch_name"),
                "admission_year": context_data.get("admission_year"),
                "graduation_year": context_data.get("graduation_year"),
                "roll_number": context_data.get("roll_number"),
                "academic_id": context_data.get("academic_id"),
                "semester_info": context_data.get("semester_info", {}),
                "full_context": context_data
            }
            
        except Exception as db_error:
            return {
                "success": False,
                "error": "database_exception",
                "message": f"Database operation failed: {str(db_error)}",
                "user_id": user_id,
                "exception": str(db_error)
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": "system_error", 
            "message": f"User context tool failed: {str(e)}",
            "exception": str(e),
            "debug_info": {
                "tool_context_type": str(type(tool_context)),
                "available_attrs": [attr for attr in dir(tool_context) if not attr.startswith('_')]
            }
        } 