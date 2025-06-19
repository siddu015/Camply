"""Database integration for storing processed handbook data in Supabase."""

import logging
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from pathlib import Path

import sys
sys.path.append(str(Path(__file__).parent.parent))
from shared.database import supabase, UserDataService
from shared.config import Config

logger = logging.getLogger(__name__)

class HandbookDatabaseUpdater:
    """Handle database operations for handbook processing."""
    
    def __init__(self):
        """Initialize the database updater."""
        self.supabase = supabase
        self.current_timestamp = datetime.utcnow().isoformat()
    
    async def get_user_handbook_record(self, user_id: str, academic_id: str) -> Optional[Dict]:
        """Get existing handbook record for user."""
        try:
            response = self.supabase.table("user_handbooks").select("*").eq(
                "user_id", user_id
            ).eq("academic_id", academic_id).execute()
            
            if response.data:
                return response.data[0]
            return None
            
        except Exception as e:
            logger.error(f"Error fetching user handbook record: {e}")
            return None
    
    def update_processing_status(self, handbook_id: str, status: str, error_message: str = None) -> bool:
        """Update processing status for a handbook."""
        try:
            update_data = {
                "processing_status": status,
                "updated_at": self.current_timestamp
            }
            
            if status == "processing":
                update_data["processing_started_at"] = self.current_timestamp
            elif status == "completed":
                update_data["processed_date"] = self.current_timestamp
                update_data["error_message"] = None
            elif status == "failed":
                update_data["error_message"] = error_message
            
            response = self.supabase.table("user_handbooks").update(update_data).eq(
                "handbook_id", handbook_id
            ).execute()
            
            logger.info(f"Updated handbook {handbook_id} status to {status}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating processing status: {e}")
            return False
    
    def create_handbook_record(self, user_id: str, academic_id: str, storage_path: str, 
                             original_filename: str, file_size: int) -> Optional[str]:
        """Create new handbook record and return handbook_id."""
        try:
            insert_data = {
                "user_id": user_id,
                "academic_id": academic_id,
                "storage_path": storage_path,
                "original_filename": original_filename,
                "file_size_bytes": file_size,
                "processing_status": "uploaded",
                "upload_date": self.current_timestamp,
                "created_at": self.current_timestamp,
                "updated_at": self.current_timestamp
            }
            
            response = self.supabase.table("user_handbooks").insert(insert_data).execute()
            
            if response.data:
                handbook_id = response.data[0]["handbook_id"]
                logger.info(f"Created handbook record {handbook_id}")
                return handbook_id
            
            return None
            
        except Exception as e:
            logger.error(f"Error creating handbook record: {e}")
            return None
    
    def store_processed_content(self, handbook_id: str, database_format: Dict) -> bool:
        """Store processed content in the handbook record."""
        try:
            logger.info(f"Storing processed content for handbook {handbook_id}")
            
            update_data = {
                "processing_status": "completed",
                "processed_date": self.current_timestamp,
                "updated_at": self.current_timestamp,
                "error_message": None
            }
            
            categories = [
                'basic_info', 'semester_structure', 'examination_rules', 'evaluation_criteria',
                'attendance_policies', 'academic_calendar', 'course_details', 'assessment_methods',
                'disciplinary_rules', 'graduation_requirements', 'fee_structure', 'facilities_rules'
            ]
            
            for category in categories:
                category_data = database_format.get(category, {})
                if category_data and category_data.get("content"):
                    update_data[category] = category_data
                else:
                    update_data[category] = {
                        "title": self.format_category_title(category),
                        "content": "",
                        "summary": "No content found for this section in the handbook.",
                        "key_points": [],
                        "metadata": {
                            "word_count": 0,
                            "confidence_score": 0.0,
                            "quality_score": 0.0,
                            "last_updated": self.current_timestamp
                        },
                        "searchable_text": "",
                        "content_hash": ""
                    }
            
            response = self.supabase.table("user_handbooks").update(update_data).eq(
                "handbook_id", handbook_id
            ).execute()
            
            if response.data:
                logger.info(f"Successfully stored processed content for handbook {handbook_id}")
                return True
            else:
                logger.error(f"No data returned when updating handbook {handbook_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error storing processed content: {e}")
            self.update_processing_status(handbook_id, "failed", str(e))
            return False
    
    def format_category_title(self, category: str) -> str:
        """Format category name into a readable title."""
        title_mapping = {
            'basic_info': 'Basic Information',
            'semester_structure': 'Semester Structure',
            'examination_rules': 'Examination Rules and Procedures',
            'evaluation_criteria': 'Evaluation and Grading Criteria',
            'attendance_policies': 'Attendance Policies',
            'academic_calendar': 'Academic Calendar',
            'course_details': 'Course Details and Curriculum',
            'assessment_methods': 'Assessment Methods',
            'disciplinary_rules': 'Disciplinary Rules and Conduct',
            'graduation_requirements': 'Graduation Requirements',
            'fee_structure': 'Fee Structure and Financial Information',
            'facilities_rules': 'Facilities and Infrastructure Rules'
        }
        
        return title_mapping.get(category, category.replace('_', ' ').title())
    
    def get_user_handbook_data(self, user_id: str, academic_id: str) -> Optional[Dict]:
        """Get processed handbook data for a user."""
        try:
            response = self.supabase.table("user_handbooks").select("*").eq(
                "user_id", user_id
            ).eq("academic_id", academic_id).eq("processing_status", "completed").execute()
            
            if response.data:
                return response.data[0]
            return None
            
        except Exception as e:
            logger.error(f"Error fetching handbook data: {e}")
            return None
    
    def search_handbook_content(self, user_id: str, academic_id: str, query: str, 
                              categories: List[str] = None) -> List[Dict]:
        """Search through processed handbook content."""
        try:
            handbook_data = self.get_user_handbook_data(user_id, academic_id)
            if not handbook_data:
                return []
            
            results = []
            search_categories = categories or [
                'basic_info', 'semester_structure', 'examination_rules', 'evaluation_criteria',
                'attendance_policies', 'academic_calendar', 'course_details', 'assessment_methods',
                'disciplinary_rules', 'graduation_requirements', 'fee_structure', 'facilities_rules'
            ]
            
            query_lower = query.lower()
            
            for category in search_categories:
                category_data = handbook_data.get(category, {})
                if not category_data:
                    continue
                
                searchable_text = category_data.get("searchable_text", "").lower()
                content = category_data.get("content", "").lower()
                summary = category_data.get("summary", "").lower()
                
                relevance_score = 0
                if query_lower in searchable_text:
                    relevance_score += 10
                if query_lower in summary:
                    relevance_score += 5
                if query_lower in content:
                    relevance_score += 3
                
                query_words = query_lower.split()
                for word in query_words:
                    if word in searchable_text:
                        relevance_score += 2
                    if word in summary:
                        relevance_score += 1
                
                if relevance_score > 0:
                    results.append({
                        "category": category,
                        "title": category_data.get("title", ""),
                        "summary": category_data.get("summary", ""),
                        "relevance_score": relevance_score,
                        "content_preview": content[:300] + "..." if len(content) > 300 else content,
                        "key_points": category_data.get("key_points", [])
                    })
            
            results.sort(key=lambda x: x["relevance_score"], reverse=True)
            return results
            
        except Exception as e:
            logger.error(f"Error searching handbook content: {e}")
            return []
    
    def get_handbook_section(self, user_id: str, academic_id: str, category: str) -> Optional[Dict]:
        """Get specific handbook section."""
        try:
            handbook_data = self.get_user_handbook_data(user_id, academic_id)
            if not handbook_data:
                return None
            
            return handbook_data.get(category, {})
            
        except Exception as e:
            logger.error(f"Error fetching handbook section: {e}")
            return None
    
    def get_processing_status(self, user_id: str, academic_id: str) -> Dict:
        """Get current processing status for user's handbook."""
        try:
            response = self.supabase.table("user_handbooks").select(
                "handbook_id, processing_status, upload_date, processed_date, processing_started_at, error_message, original_filename"
            ).eq("user_id", user_id).eq("academic_id", academic_id).order("upload_date", desc=True).limit(1).execute()
            
            if response.data:
                data = response.data[0]
                return {
                    "status": data["processing_status"],
                    "handbook_id": data["handbook_id"],
                    "uploaded_at": data["upload_date"],
                    "processed_at": data["processed_date"],
                    "processing_started_at": data["processing_started_at"],
                    "error_message": data["error_message"],
                    "filename": data["original_filename"]
                }
            else:
                return {"status": "not_found"}
                
        except Exception as e:
            logger.error(f"Error getting processing status: {e}")
            return {"status": "error", "error": str(e)}
    
    def delete_handbook_record(self, handbook_id: str) -> bool:
        """Delete a handbook record (for cleanup or reprocessing)."""
        try:
            response = self.supabase.table("user_handbooks").delete().eq(
                "handbook_id", handbook_id
            ).execute()
            
            logger.info(f"Deleted handbook record {handbook_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting handbook record: {e}")
            return False
    
    def get_handbook_statistics(self, user_id: str, academic_id: str) -> Dict:
        """Get statistics about processed handbook."""
        try:
            handbook_data = self.get_user_handbook_data(user_id, academic_id)
            if not handbook_data:
                return {"status": "not_found"}
            
            categories = [
                'basic_info', 'semester_structure', 'examination_rules', 'evaluation_criteria',
                'attendance_policies', 'academic_calendar', 'course_details', 'assessment_methods',
                'disciplinary_rules', 'graduation_requirements', 'fee_structure', 'facilities_rules'
            ]
            
            stats = {
                "total_categories": len(categories),
                "categories_with_content": 0,
                "total_words": 0,
                "average_quality_score": 0.0,
                "processed_date": handbook_data.get("processed_date"),
                "original_filename": handbook_data.get("original_filename"),
                "category_breakdown": {}
            }
            
            quality_scores = []
            
            for category in categories:
                category_data = handbook_data.get(category, {})
                metadata = category_data.get("metadata", {})
                
                word_count = metadata.get("word_count", 0)
                quality_score = metadata.get("quality_score", 0.0)
                
                if word_count > 0:
                    stats["categories_with_content"] += 1
                    stats["total_words"] += word_count
                    quality_scores.append(quality_score)
                
                stats["category_breakdown"][category] = {
                    "title": category_data.get("title", ""),
                    "word_count": word_count,
                    "quality_score": quality_score,
                    "has_content": word_count > 0
                }
            
            if quality_scores:
                stats["average_quality_score"] = sum(quality_scores) / len(quality_scores)
            
            stats["completeness_percentage"] = (stats["categories_with_content"] / stats["total_categories"]) * 100
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting handbook statistics: {e}")
            return {"status": "error", "error": str(e)}
    
    def validate_database_connection(self) -> bool:
        """Validate database connection and required tables."""
        try:
            response = self.supabase.table("user_handbooks").select("handbook_id").limit(1).execute()
            logger.info("Database connection validated successfully")
            return True
            
        except Exception as e:
            logger.error(f"Database connection validation failed: {e}")
            return False 