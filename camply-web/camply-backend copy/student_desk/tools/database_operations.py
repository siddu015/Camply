"""
Database operations for ADK agents - consolidated from shared/database.py
All database operations used by agents should be here for direct ADK access.
"""

import asyncio
import json
from typing import Optional, Dict, Any, List
from supabase import create_client, Client
from .config import Config


class DatabaseOperations:
    """Consolidated database operations for ADK agents"""
    
    def __init__(self):
        self.supabase: Client = create_client(
            Config.SUPABASE_URL, 
            Config.get_supabase_backend_key()
        )
    
    async def get_user_context(self, user_id: str) -> Dict[str, Any]:
        """Get complete user context including college and academic details"""
        try:
            # Get user with academic details using explicit foreign key relationship
            user_query = self.supabase.table('users').select("""
                *,
                user_academic_details!user_academic_details_user_id_fkey (
                    *,
                    colleges (
                        college_id,
                        name,
                        city,
                        state,
                        university_name,
                        college_icon,
                        college_website_url
                    )
                )
            """).eq('user_id', user_id)
            
            user_result = user_query.execute()
            
            # Handle both list and single object returns
            if user_result.data:
                user_data = user_result.data
                
                # If it's a list, get the first element
                if isinstance(user_data, list):
                    if len(user_data) > 0:
                        user_data = user_data[0]
                    else:
                        return {
                            "success": False,
                            "error": "user_not_found"
                        }
                
                return {
                    "success": True,
                    "user_data": user_data
                }
            else:
                return {
                    "success": False,
                    "error": "user_not_found"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_campus_data(self, college_id: str) -> Dict[str, Any]:
        """Get campus AI content data for a specific college"""
        try:
            # Fetch from campus_ai_content table as per database schema
            campus_query = self.supabase.table('campus_ai_content').select("""
                *,
                colleges!inner (
                    college_id,
                    name,
                    city,
                    state,
                    university_name,
                    college_website_url,
                    college_icon
                )
            """).eq('college_id', college_id).eq('is_active', True).order('updated_at', desc=True).limit(1)
            
            result = campus_query.execute()
            
            if result.data and len(result.data) > 0:
                campus_data = result.data[0]
                # Structure the response properly with all sections
                return {
                    "success": True,
                    "college_data": {
                        "college_overview_content": campus_data.get("college_overview_content"),
                        "facilities_content": campus_data.get("facilities_content"),
                        "placements_content": campus_data.get("placements_content"),
                        "departments_content": campus_data.get("departments_content"),
                        "admissions_content": campus_data.get("admissions_content"),
                        "achievements_content": campus_data.get("achievements_content"),
                        "campus_life_content": campus_data.get("campus_life_content"),
                        "research_content": campus_data.get("research_content"),
                        "alumni_content": campus_data.get("alumni_content"),
                        "news_content": campus_data.get("news_content"),
                        "events_content": campus_data.get("events_content"),
                        "infrastructure_content": campus_data.get("infrastructure_content"),
                        "updated_at": campus_data.get("updated_at"),
                        "content_version": campus_data.get("content_version"),
                        "college_info": campus_data.get("colleges", {})
                    }
                }
            else:
                # No campus AI content found - return empty structure but with college info
                college_query = self.supabase.table('colleges').select('*').eq('college_id', college_id).single()
                college_result = college_query.execute()
                
                return {
                    "success": True,
                    "college_data": {
                        "college_overview_content": None,
                        "facilities_content": None,
                        "placements_content": None,
                        "departments_content": None,
                        "admissions_content": None,
                        "achievements_content": None,
                        "campus_life_content": None,
                        "research_content": None,
                        "alumni_content": None,
                        "news_content": None,
                        "events_content": None,
                        "infrastructure_content": None,
                        "updated_at": None,
                        "content_version": None,
                        "college_info": college_result.data if college_result.data else {}
                    },
                    "message": "No campus AI content available yet for this college"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "college_data": {}
            }
    
    # HANDBOOK OPERATIONS
    async def get_handbook_by_id(self, handbook_id: str) -> Dict[str, Any]:
        """Get handbook details by handbook_id"""
        try:
            handbook_query = self.supabase.table('user_handbooks').select('*').eq('handbook_id', handbook_id).single()
            result = handbook_query.execute()
            
            if result.data:
                return {
                    "success": True,
                    "handbook": result.data
                }
            else:
                return {
                    "success": False,
                    "error": "handbook_not_found"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_user_handbooks(self, user_id: str, academic_id: str) -> Dict[str, Any]:
        """Get all handbooks for a user"""
        try:
            handbooks_query = self.supabase.table('user_handbooks').select('*').eq('user_id', user_id).eq('academic_id', academic_id).order('created_at', desc=True)
            result = handbooks_query.execute()
            
            return {
                "success": True,
                "handbooks": result.data or []
            }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "handbooks": []
            }
    
    async def update_handbook_processing_status(self, handbook_id: str, status: str, error_message: str = None) -> Dict[str, Any]:
        """Update handbook processing status"""
        try:
            update_data = {
                "processing_status": status,
                "processed_date": "now()" if status == "completed" else None
            }
            
            if error_message:
                update_data["error_message"] = error_message
            
            result = self.supabase.table('user_handbooks').update(update_data).eq('handbook_id', handbook_id).execute()
            
            return {
                "success": True,
                "updated": bool(result.data)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def store_handbook_json(self, handbook_id: str, structured_handbook: Dict[str, Any]) -> Dict[str, Any]:
        """Store processed handbook JSON in database"""
        try:
            # Update the handbook record with all the structured sections
            update_data = {
                "basic_info": structured_handbook.get("basic_info"),
                "semester_structure": structured_handbook.get("semester_structure"),
                "examination_rules": structured_handbook.get("examination_rules"),
                "evaluation_criteria": structured_handbook.get("evaluation_criteria"),
                "attendance_policies": structured_handbook.get("attendance_policies"),
                "academic_calendar": structured_handbook.get("academic_calendar"),
                "course_details": structured_handbook.get("course_details"),
                "assessment_methods": structured_handbook.get("assessment_methods"),
                "disciplinary_rules": structured_handbook.get("disciplinary_rules"),
                "graduation_requirements": structured_handbook.get("graduation_requirements"),
                "fee_structure": structured_handbook.get("fee_structure"),
                "facilities_rules": structured_handbook.get("facilities_rules"),
                "processing_status": "completed",
                "processed_date": "now()"
            }
            
            result = self.supabase.table('user_handbooks').update(update_data).eq('handbook_id', handbook_id).execute()
            
            return {
                "success": True,
                "updated": bool(result.data)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    # SYLLABUS OPERATIONS
    async def get_course_by_id(self, course_id: str) -> Dict[str, Any]:
        """Get course details by course_id"""
        try:
            course_query = self.supabase.table('courses').select("""
                *,
                semesters!inner (
                    *,
                    user_academic_details!semesters_academic_id_fkey (
                        user_id
                    )
                )
            """).eq('course_id', course_id).single()
            
            result = course_query.execute()
            
            if result.data:
                return {
                    "success": True,
                    "course": result.data
                }
            else:
                return {
                    "success": False,
                    "error": "course_not_found"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_syllabus_file_path(self, course_id: str, user_id: str) -> Dict[str, Any]:
        """Get syllabus file path for course - efficient method using only course_id and user_id"""
        try:
            # Check syllabus storage path in course record first
            course_result = await self.get_course_by_id(course_id)
            
            if not course_result["success"]:
                return course_result
            
            course_data = course_result["course"]
            
            # Verify user ownership through semester->academic_details chain
            course_user_id = course_data.get("semesters", {}).get("user_academic_details", {}).get("user_id")
            if course_user_id != user_id:
                return {
                    "success": False,
                    "error": "unauthorized"
                }
            
            syllabus_path = course_data.get("syllabus_storage_path")
            
            if syllabus_path:
                return {
                    "success": True,
                    "storage_path": syllabus_path,
                    "course_data": course_data
                }
            else:
                # Try to construct path from course info
                semester_id = course_data.get("semester_id")
                course_name = course_data.get("course_name", "").replace(" ", "_")
                
                # Efficient path construction
                constructed_path = f"syllabi/{user_id}/{semester_id}/{course_id}_{course_name}_syllabus.pdf"
                
                return {
                    "success": True,
                    "storage_path": constructed_path,
                    "course_data": course_data,
                    "path_constructed": True
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def update_course_syllabus_status(self, course_id: str, status: str, error_message: str = None) -> Dict[str, Any]:
        """Update course syllabus processing status"""
        try:
            update_data = {
                "syllabus_processing_status": status,
                "syllabus_processed_date": "now()" if status == "completed" else None
            }
            
            if error_message:
                update_data["syllabus_error_message"] = error_message
            
            result = self.supabase.table('courses').update(update_data).eq('course_id', course_id).execute()
            
            return {
                "success": True,
                "updated": bool(result.data)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def store_course_syllabus_json(self, course_id: str, structured_syllabus: Dict[str, Any]) -> Dict[str, Any]:
        """Store processed syllabus JSON in course database"""
        try:
            update_data = {
                "syllabus_json": structured_syllabus,
                "syllabus_processing_status": "completed",
                "syllabus_processed_date": "now()"
            }
            
            result = self.supabase.table('courses').update(update_data).eq('course_id', course_id).execute()
            
            return {
                "success": True,
                "updated": bool(result.data)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    # FILE OPERATIONS
    async def download_file_from_storage(self, storage_path: str, bucket_name: str = "course_documents") -> Optional[bytes]:
        """Download file from Supabase storage - works for both handbooks and syllabi"""
        try:
            response = self.supabase.storage.from_(bucket_name).download(storage_path)
            return response if response else None
            
        except Exception as e:
            print(f"Error downloading from storage: {e}")
            return None
    
    # GENERAL ACADEMIC OPERATIONS
    async def get_semester_courses(self, user_id: str, semester_number: int = None) -> Dict[str, Any]:
        """Get courses for user's semester(s)"""
        try:
            query = self.supabase.table('courses').select("""
                *,
                semesters!inner (
                    semester_number,
                    semester_name,
                    user_academic_details!semesters_academic_id_fkey (
                        user_id
                    )
                )
            """).eq('semesters.user_academic_details.user_id', user_id)
            
            if semester_number:
                query = query.eq('semesters.semester_number', semester_number)
            
            result = query.execute()
            
            return {
                "success": True,
                "courses": result.data or []
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    async def get_course_with_storage_path(self, course_id: str) -> Dict[str, Any]:
        """Get course details with syllabus storage path"""
        try:
            course_result = await self.get_course_by_id(course_id)
            if course_result["success"]:
                course_data = course_result["course"]
                return {
                    "success": True,
                    "course": course_data,
                    "syllabus_storage_path": course_data.get("syllabus_storage_path"),
                    "has_syllabus": bool(course_data.get("syllabus_storage_path"))
                }
            else:
                return course_result
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    async def update_course_syllabus(self, course_id: str, structured_syllabus: Dict[str, Any]) -> Dict[str, Any]:
        """Update course with structured syllabus data - alias for store_course_syllabus_json"""
        return await self.store_course_syllabus_json(course_id, structured_syllabus)


# Create global database operations instance for import by other modules
db_operations = DatabaseOperations()

# Export the global instance for backward compatibility
__all__ = ['DatabaseOperations', 'db_operations'] 