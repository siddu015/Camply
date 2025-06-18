import asyncio
from datetime import datetime
from google.adk.tools import FunctionTool
from shared.database import supabase

def get_user_id_from_session_state(tool_context) -> tuple[str, dict]:
    """
    Get user_id from ADK session state.
    Returns tuple of (user_id, debug_info)
    """
    # Access session state directly from tool_context (as shown in debug logs)
    session_state = getattr(tool_context, 'state', None)
    if not session_state:
        return None, {
            "error": "Session state not available in tool context",
            "tool_context_attributes": [attr for attr in dir(tool_context) if not attr.startswith('_')],
            "message": "ADK session state not accessible from tool_context.state"
        }
    
    # Read user_id from session state (stored during session creation)
    user_id = session_state.get('user_id') if hasattr(session_state, 'get') else getattr(session_state, 'user_id', None)
    
    debug_info = {
        "session_state_type": type(session_state).__name__,
        "session_state_attributes": [attr for attr in dir(session_state) if not attr.startswith('_')] if session_state else [],
        "session_state_dict": dict(session_state) if hasattr(session_state, 'get') else str(session_state),
        "user_id_from_state": user_id,
        "message": "user_id must be in session state created by main.py"
    }
    
    return user_id, debug_info

@FunctionTool
async def verify_pdf_collection(handbook_id: str, *, tool_context) -> dict:
    """Verify if we can access and collect the uploaded PDF file."""
    user_id, debug_info = get_user_id_from_session_state(tool_context)
    
    if not user_id:
        return {
            "success": False,
            "error": "User ID not found in session state - ensure main agent stores user_id in session.state['user_id']",
            "handbook_id": handbook_id,
            "debug_info": debug_info
        }

    try:
        # Get handbook record from database
        handbook_response = supabase.table("user_handbooks").select("*").eq("handbook_id", handbook_id).eq("user_id", user_id).execute()

        if not handbook_response.data:
            return {
                "success": False,
                "error": "Handbook not found in database",
                "handbook_id": handbook_id,
                "user_id": user_id
            }

        handbook_record = handbook_response.data[0]
        
        # Try to access the PDF file from storage
        try:
            response = supabase.storage.from_('handbooks').download(handbook_record['storage_path'])
            if not response:
                return {
                    "success": False,
                    "error": "PDF file not accessible from storage",
                    "handbook_id": handbook_id,
                    "storage_path": handbook_record['storage_path']
                }
            
            file_size = len(response)
            
            return {
                "success": True,
                "message": "PDF successfully collected and accessible",
                "handbook_id": handbook_id,
                "user_id": user_id,
                "original_filename": handbook_record['original_filename'],
                "storage_path": handbook_record['storage_path'],
                "file_size_bytes": file_size,
                "database_file_size": handbook_record.get('file_size_bytes'),
                "upload_date": handbook_record['upload_date'],
                "processing_status": handbook_record['processing_status']
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to access PDF from storage: {str(e)}",
                "handbook_id": handbook_id,
                "storage_path": handbook_record['storage_path']
            }

    except Exception as e:
        return {
            "success": False,
            "error": f"Database error: {str(e)}",
            "handbook_id": handbook_id,
            "user_id": user_id
        }

@FunctionTool
async def get_handbook_status(*, tool_context) -> dict:
    """Get the status of user's handbook uploads."""
    user_id, debug_info = get_user_id_from_session_state(tool_context)
    
    if not user_id:
        return {
            "success": False,
            "error": "User ID not found in session state - ensure main agent stores user_id in session.state['user_id']",
            "debug_info": debug_info
        }

    try:
        handbook_response = supabase.table("user_handbooks").select(
            "handbook_id, original_filename, processing_status, upload_date, file_size_bytes, storage_path"
        ).eq("user_id", user_id).order("upload_date", desc=True).execute()

        if not handbook_response.data:
            return {
                "success": True,
                "message": "No handbooks found for this user",
                "handbooks": [],
                "user_id": user_id
            }

        handbooks = handbook_response.data

        return {
            "success": True,
            "message": f"Found {len(handbooks)} handbook(s)",
            "handbooks": handbooks,
            "user_id": user_id,
            "total_count": len(handbooks)
        }

    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to get handbook status: {str(e)}",
            "user_id": user_id
        }

@FunctionTool
async def update_handbook_status(handbook_id: str, status: str, *, tool_context) -> dict:
    """Update the processing status of a handbook."""
    user_id, debug_info = get_user_id_from_session_state(tool_context)
    
    if not user_id:
        return {
            "success": False,
            "error": "User ID not found in session state - ensure main agent stores user_id in session.state['user_id']",
            "handbook_id": handbook_id,
            "debug_info": debug_info
        }

    valid_statuses = ['uploaded', 'processing', 'completed', 'failed']
    if status not in valid_statuses:
        return {
            "success": False,
            "error": f"Invalid status. Must be one of: {valid_statuses}",
            "handbook_id": handbook_id
        }

    try:
        update_data = {
            "processing_status": status,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        if status == 'processing':
            update_data["processing_started_at"] = datetime.utcnow().isoformat()
        elif status == 'completed':
            update_data["processed_date"] = datetime.utcnow().isoformat()

        result = supabase.table("user_handbooks").update(update_data).eq("handbook_id", handbook_id).eq("user_id", user_id).execute()

        if not result.data:
            return {
                "success": False,
                "error": "Handbook not found or not owned by user",
                "handbook_id": handbook_id,
                "user_id": user_id
            }

        return {
            "success": True,
            "message": f"Handbook status updated to '{status}' - PDF READ SUCCESSFULLY!",
            "handbook_id": handbook_id,
            "new_status": status,
            "user_id": user_id
        }

    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to update handbook status: {str(e)}",
            "handbook_id": handbook_id,
            "user_id": user_id
        } 