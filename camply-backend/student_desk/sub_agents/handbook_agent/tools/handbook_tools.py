import asyncio
from datetime import datetime
from typing import Optional
from google.adk.tools import FunctionTool
from shared.database import supabase

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
from shared import UserDataService


@FunctionTool
async def verify_pdf_collection(handbook_id: str, *, tool_context) -> dict:
    try:
        session_state = getattr(tool_context, 'state', None)
        if not session_state:
            return {
                "success": False,
                "error": "session_unavailable",
                "message": "Session state not available in tool context"
            }
        
        user_id = session_state.get('user_id') if hasattr(session_state, 'get') else getattr(session_state, 'user_id', None)
        
        if not user_id:
            return {
                "success": False,
                "error": "missing_user_id",
                "message": "User ID not found in session state"
            }

        user_context = await UserDataService.get_user_context(user_id)
        
        if not user_context:
            return {
                "success": False,
                "error": "user_profile_not_found",
                "message": "User profile not found. Please complete your profile setup.",
                "user_id": user_id
            }

        student_name = user_context.get("user", {}).get("name", "Student")
        college_name = user_context.get("college", {}).get("name", "Your College")
        department_name = user_context.get("academic_details", {}).get("department_name", "Unknown Department")

        response = supabase.table('user_handbooks') \
            .select('*') \
            .eq('handbook_id', handbook_id) \
            .eq('user_id', user_id) \
            .execute()

        if not response.data:
            return {
                "success": False,
                "error": "handbook_not_found",
                "message": f"Handbook with ID {handbook_id} not found for user {student_name}",
                "user_id": user_id,
                "handbook_id": handbook_id
            }

        handbook = response.data[0]
        
        try:
            storage_path = handbook['storage_path']
            
            download_response = supabase.storage.from_('handbooks').download(storage_path)
            
            if download_response:
                file_size_mb = len(download_response) / (1024 * 1024)
                
                return {
                    "success": True,
                    "message": f"Handbook verification completed for {student_name} from {college_name}",
                    "handbook_details": {
                        "handbook_id": handbook_id,
                        "original_filename": handbook['original_filename'],
                        "file_size_mb": round(file_size_mb, 2),
                        "upload_date": handbook['upload_date'],
                        "storage_path": storage_path,
                        "processing_status": handbook['processing_status'],
                        "department": department_name
                    },
                    "verification_status": "accessible",
                    "user_context": {
                        "student_name": student_name,
                        "college_name": college_name,
                        "department": department_name
                    }
                }
            else:
                return {
                    "success": False,
                    "error": "file_access_failed",
                    "message": f"Could not access PDF file for handbook {handbook_id}",
                    "handbook_id": handbook_id,
                    "storage_path": storage_path
                }
                
        except Exception as download_error:
            return {
                "success": False,
                "error": "storage_access_error",
                "message": f"Error accessing file from storage: {str(download_error)}",
                "handbook_id": handbook_id,
                "storage_path": handbook.get('storage_path', 'unknown')
            }

    except Exception as e:
        return {
            "success": False,
            "error": "system_error",
            "message": f"System error during handbook verification: {str(e)}",
            "handbook_id": handbook_id
        }


@FunctionTool
async def get_handbook_status(*, tool_context) -> dict:
    try:
        session_state = getattr(tool_context, 'state', None)
        if not session_state:
            return {
                "success": False,
                "error": "session_unavailable",
                "message": "Session state not available in tool context"
            }
        
        user_id = session_state.get('user_id') if hasattr(session_state, 'get') else getattr(session_state, 'user_id', None)
        
        if not user_id:
            return {
                "success": False,
                "error": "missing_user_id",
                "message": "User ID not found in session state"
            }

        user_context = await UserDataService.get_user_context(user_id)
        
        if not user_context:
            return {
                "success": False,
                "error": "user_profile_not_found",
                "message": "User profile not found.",
                "user_id": user_id
            }

        student_name = user_context.get("user", {}).get("name", "Student")

        response = supabase.table('user_handbooks') \
            .select('*') \
            .eq('user_id', user_id) \
            .order('upload_date', desc=True) \
            .execute()

        handbooks = response.data if response.data else []
        
        return {
            "success": True,
            "user_id": user_id,
            "student_name": student_name,
            "handbook_count": len(handbooks),
            "handbooks": handbooks,
            "message": f"Found {len(handbooks)} handbook(s) for {student_name}"
        }

    except Exception as e:
        return {
            "success": False,
            "error": "system_error",
            "message": f"Error fetching handbook status: {str(e)}"
        }


@FunctionTool
async def update_handbook_status(handbook_id: str, new_status: str, processing_data: Optional[dict] = None, *, tool_context) -> dict:
    try:
        session_state = getattr(tool_context, 'state', None)
        if not session_state:
            return {
                "success": False,
                "error": "session_unavailable",
                "message": "Session state not available in tool context"
            }
        
        user_id = session_state.get('user_id') if hasattr(session_state, 'get') else getattr(session_state, 'user_id', None)
        
        if not user_id:
            return {
                "success": False,
                "error": "missing_user_id",
                "message": "User ID not found in session state"
            }

        valid_statuses = ['uploaded', 'processing', 'completed', 'failed']
        if new_status not in valid_statuses:
            return {
                "success": False,
                "error": "invalid_status",
                "message": f"Status must be one of: {', '.join(valid_statuses)}"
            }

        update_data = {
            'processing_status': new_status,
            'updated_at': datetime.utcnow().isoformat()
        }

        if new_status == 'processing':
            update_data['processing_started_at'] = datetime.utcnow().isoformat()
        elif new_status == 'completed':
            update_data['processed_date'] = datetime.utcnow().isoformat()
            
            if processing_data:
                for key, value in processing_data.items():
                    if key in ['basic_info', 'semester_structure', 'examination_rules', 
                              'evaluation_criteria', 'attendance_policies', 'academic_calendar',
                              'course_details', 'assessment_methods', 'disciplinary_rules',
                              'graduation_requirements', 'fee_structure', 'facilities_rules']:
                        update_data[key] = value

        response = supabase.table('user_handbooks') \
            .update(update_data) \
            .eq('handbook_id', handbook_id) \
            .eq('user_id', user_id) \
            .execute()

        if response.data:
            return {
                "success": True,
                "handbook_id": handbook_id,
                "new_status": new_status,
                "updated_fields": list(update_data.keys()),
                "message": f"Handbook status updated to '{new_status}'"
            }
        else:
            return {
                "success": False,
                "error": "update_failed",
                "message": "Failed to update handbook status"
            }

    except Exception as e:
        return {
            "success": False,
            "error": "system_error",
            "message": f"Error updating handbook status: {str(e)}"
        } 