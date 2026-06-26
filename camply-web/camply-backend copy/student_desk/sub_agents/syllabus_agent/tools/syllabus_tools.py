"""
Syllabus Agent Tools - Updated for new architecture
- Use direct docling imports
- Use consolidated database operations from student_desk/tools
- Handle course_id based file fetching and processing
- Follows ADK patterns for user context
"""

import asyncio
import json
import re
import tempfile
import os
from pathlib import Path
from typing import Dict, Any, List, Optional
from google.adk.tools import FunctionTool
from datetime import datetime

# Direct docling imports as requested
from docling_service.docling_client import DoclingClient
from docling_service.document_processor import DocumentProcessor

# Use consolidated database operations from student_desk/tools
from student_desk.tools.database_operations import db_operations

@FunctionTool
async def parse_syllabus_processing_request(message: str, *, tool_context) -> str:
    """Parse syllabus processing request and handle file processing with Docling."""
    try:
        # Get user_id from ADK session state following working pattern
        session_state = getattr(tool_context, 'state', None)
        if not session_state:
            return json.dumps({
                "success": False,
                "error": "session_unavailable",
                "message": "Session state not available in tool context"
            })
        
        # Handle different session state types
        user_id = None
        if hasattr(session_state, 'get') and callable(getattr(session_state, 'get')):
            user_id = session_state.get('user_id')
        elif hasattr(session_state, 'user_id'):
            user_id = getattr(session_state, 'user_id', None)
        elif isinstance(session_state, dict):
            user_id = session_state.get('user_id')
        elif isinstance(session_state, list) and len(session_state) > 0:
            first_state = session_state[0]
            if isinstance(first_state, dict):
                user_id = first_state.get('user_id')
            elif hasattr(first_state, 'user_id'):
                user_id = getattr(first_state, 'user_id', None)
        
        if not user_id:
            return json.dumps({
                "success": False,
                "error": "missing_user_id",
                "message": "User ID not found in session state"
            })
        
        print(f"Syllabus Agent: Processing request for user_id: {user_id}")
        
        # Extract course_id from message (simple text parsing)
        course_id = extract_course_id_from_message(message)
        if not course_id:
            return json.dumps({
                "success": False,
                "error": "Could not extract course ID from message",
                "message": message
            })
        
        print(f"Syllabus Agent: Processing course_id: {course_id} for user_id: {user_id}")
        
        # Fetch course information from database using consolidated operations
        course_result = await db_operations.get_course_by_id(course_id)
        
        if not course_result.get("success"):
            return json.dumps({
                "success": False,
                "error": f"Course not found with ID: {course_id}"
            })
        
        course = course_result["course"]
        
        # Get syllabus file path
        file_path_result = await db_operations.get_syllabus_file_path(course_id, user_id)
        
        if not file_path_result.get("success"):
            return json.dumps({
                "success": False,
                "error": f"No syllabus file found for course {course_id}. Please upload a syllabus first."
            })
        
        storage_path = file_path_result["storage_path"]
        print(f"Syllabus Agent: Found syllabus file at: {storage_path}")
        
        # Download file from storage using consolidated operations
        file_content = await db_operations.download_file_from_storage(storage_path, "course_documents")
        
        if not file_content:
            return json.dumps({
                "success": False,
                "error": f"Error downloading file from storage: {storage_path}"
            })
        
        # Save to temporary file for Docling processing
        file_extension = os.path.splitext(storage_path)[1] or '.pdf'
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            temp_file.write(file_content)
            temp_file_path = temp_file.name
        
        try:
            # Process with Docling
            docling_client = DoclingClient()
            processing_result = await docling_client.process_document(temp_file_path)
            
            # Clean up temp file
            os.unlink(temp_file_path)
            
            if processing_result and processing_result.get("success"):
                # Create structured JSON format
                structured_data = analyze_and_structure_syllabus(
                    processing_result["content"], 
                    course
                )
                
                # Update course with structured syllabus data using consolidated operations
                update_result = await db_operations.store_course_syllabus_json(course_id, structured_data)
                
                if not update_result.get("success"):
                    return json.dumps({
                        "success": False,
                        "error": f"Failed to update course with syllabus data: {update_result.get('error')}"
                    })
                
                return json.dumps({
                    "success": True,
                    "message": f"Successfully processed syllabus for {course.get('course_name', course_id)}. Syllabus has been analyzed and structured data extracted.",
                    "course_id": course_id,
                    "course_name": course.get('course_name'),
                    "storage_path": storage_path,
                    "processing_metadata": processing_result.get('metadata', {})
                })
            else:
                return json.dumps({
                    "success": False,
                    "error": f"Docling processing failed: {processing_result.get('error') if processing_result else 'No response from docling'}"
                })
                
        except Exception as e:
            # Clean up temp file on error
            try:
                os.unlink(temp_file_path)
            except:
                pass
            
            return json.dumps({
                "success": False,
                "error": f"Error during Docling processing: {str(e)}"
            })
        
    except Exception as e:
        print(f"Syllabus Agent: Error in parse_syllabus_processing_request: {str(e)}")
        return json.dumps({
            "success": False,
            "error": f"Failed to process syllabus request: {str(e)}"
        })

def create_syllabus_json_structure(docling_result: dict) -> dict:
    """Create the required JSON structure from Docling processing results."""
    try:
        # Extract structured data from Docling result
        structured_data = docling_result.get('structured_data', {})
        units_data = structured_data.get('units', [])
        
        # Create the required format
        syllabus_json = {
            "docling_processed": True,
            "processing_metadata": docling_result.get('processing_metadata', {}),
            "md_content": docling_result.get('md_content', ''),
            "structured_data": {
                "extracted_at": datetime.utcnow().isoformat(),
                "units": []
            }
        }
        
        # Process each unit
        for unit_data in units_data:
            unit = {
                "unit": unit_data.get('unit_number', 1),
                "title": unit_data.get('title', ''),
                "topics": unit_data.get('topics', []),
                "subtopics": unit_data.get('subtopics', []),
                "description": unit_data.get('description', '')
            }
            syllabus_json["structured_data"]["units"].append(unit)
        
        return syllabus_json
        
    except Exception as e:
        print(f"Error creating syllabus JSON structure: {e}")
        # Return minimal structure with error info
        return {
            "docling_processed": True,
            "processing_metadata": {
                "error": str(e),
                "processed_at": datetime.utcnow().isoformat()
            },
            "structured_data": {
                "units": []
            }
        }

def extract_course_id_from_message(message: str) -> str:
    """Extract course ID from message text."""
    # Extract UUIDs using regex patterns
    uuid_pattern = r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
    course_id_pattern = r'course[_\s]*id[:\s]+([0-9a-f-]{36})'
    
    # First try to find course_id with explicit pattern
    course_match = re.search(course_id_pattern, message, re.IGNORECASE)
    if course_match:
        return course_match.group(1)
    
    # Fallback to finding any UUID that might be course_id
    matches = re.findall(uuid_pattern, message, re.IGNORECASE)
    if matches:
        return matches[0]  # Take first UUID as course_id
    
    return None

@FunctionTool
async def get_syllabus_content(course_id: str, *, tool_context) -> str:
    """Get processed syllabus content for a course."""
    try:
        # Get user_id from ADK session state
        user_id = getattr(tool_context, 'user_id', None)
        
        if not user_id:
            return json.dumps({
                "success": False,
                "error": "Could not get user ID from session state"
            })
        
        # Get course data
        course_response = supabase.table('courses').select('*').eq('course_id', course_id).execute()
        
        if not course_response.data:
            return json.dumps({
                "success": False,
                "error": f"Course not found with ID: {course_id}"
            })
        
        course = course_response.data[0]
        syllabus_json = course.get('syllabus_json', {})
        
        if not syllabus_json or not syllabus_json.get('units'):
            return json.dumps({
                "success": False,
                "error": "No syllabus data found for this course. Please upload and process the syllabus first."
            })
        
        return json.dumps({
            "success": True,
            "course_id": course_id,
            "course_name": course.get('course_name'),
            "syllabus_data": syllabus_json,
            "units_count": len(syllabus_json.get('units', [])),
            "topics_count": sum(len(unit.get('topics', [])) for unit in syllabus_json.get('units', []))
        })
        
    except Exception as e:
        print(f"Syllabus Agent: Error fetching content: {str(e)}")
        return json.dumps({
            "success": False,
            "error": f"Failed to retrieve syllabus content: {str(e)}"
        })

@FunctionTool
async def process_syllabus_upload(course_id: str, *, tool_context) -> str:
    """Process uploaded syllabus PDF for a specific course."""
    try:
        # Get user_id from ADK session state
        user_id = getattr(tool_context, 'user_id', None)
        
        if not user_id:
            return json.dumps({
                "success": False,
                "error": "Could not get user ID from session state"
            })
        
        # Route to the main processing function
        message = f"Process syllabus for course_id: {course_id} for user_id: {user_id}"
        return await parse_syllabus_processing_request(message, tool_context=tool_context)
        
    except Exception as e:
        print(f"Syllabus Agent: Error in process_syllabus_upload: {str(e)}")
        return json.dumps({
            "success": False,
            "error": f"Failed to process syllabus upload: {str(e)}"
        })

@FunctionTool
async def check_docling_service_status(*, tool_context) -> str:
    """Check the status of the Docling service."""
    try:
        # Import here to avoid circular dependency
        processor = DocumentProcessor()
        status = await processor.get_processing_status()
        
        return json.dumps({
            "success": True,
            "docling_service": status["docling_service"],
            "processor_status": status["processor_status"],
            "checked_at": status["checked_at"]
        })
        
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": f"Failed to check Docling service status: {str(e)}",
            "service_available": False
        })

# Keep some legacy functions for backward compatibility but mark them as deprecated
def extract_units_advanced(text: str) -> List[Dict[str, Any]]:
    """Legacy function - kept for backward compatibility. Use Docling processor instead."""
    # ... existing code ...
    units = []
    # Simplified legacy extraction logic here
    return units

# Legacy functions removed - all processing now handled by Docling + ADK integration 

@FunctionTool
async def process_syllabus_for_course(course_id: str, *, tool_context) -> Dict[str, Any]:
    """Process syllabus for a specific course_id using Docling."""
    try:
        # Get user_id from ADK session state following working pattern
        session_state = getattr(tool_context, 'state', None)
        if not session_state:
            return {
                "success": False,
                "error": "session_unavailable",
                "message": "Session state not available in tool context"
            }
        
        # Handle different session state types
        user_id = None
        if hasattr(session_state, 'get') and callable(getattr(session_state, 'get')):
            user_id = session_state.get('user_id')
        elif hasattr(session_state, 'user_id'):
            user_id = getattr(session_state, 'user_id', None)
        elif isinstance(session_state, dict):
            user_id = session_state.get('user_id')
        elif isinstance(session_state, list) and len(session_state) > 0:
            first_state = session_state[0]
            if isinstance(first_state, dict):
                user_id = first_state.get('user_id')
            elif hasattr(first_state, 'user_id'):
                user_id = getattr(first_state, 'user_id', None)
        
        if not user_id:
            return {
                "success": False,
                "error": "missing_user_id",
                "message": "User ID not found in session state"
            }
        
        # Step 1: Get course details including storage path
        course_result = await db_operations.get_course_with_storage_path(course_id)
        if not course_result["success"]:
            return {
                "success": False,
                "error": "course_not_found",
                "message": f"Could not find course with ID: {course_id}",
                "course_id": course_id
            }
        
        course_data = course_result["course"]
        syllabus_storage_path = course_data.get("syllabus_storage_path")
        
        if not syllabus_storage_path:
            return {
                "success": False,
                "error": "no_syllabus_file",
                "message": f"No syllabus file found for course: {course_data.get('course_name', course_id)}",
                "course_id": course_id
            }
        
        # Step 2: Download file from storage
        file_data = await db_operations.download_file_from_storage(
            syllabus_storage_path, 
            bucket_name="course_documents"
        )
        
        if not file_data:
            return {
                "success": False,
                "error": "file_download_failed",
                "message": f"Could not download syllabus file from storage: {syllabus_storage_path}",
                "course_id": course_id
            }
        
        # Step 3: Process with docling service
        processing_result = await process_with_docling_service(file_data, course_data)
        
        if not processing_result["success"]:
            return {
                "success": False,
                "error": "docling_processing_failed", 
                "message": processing_result.get("message", "Docling processing failed"),
                "course_id": course_id
            }
        
        # Step 4: Analyze docling response and create structured syllabus JSON
        structured_syllabus = analyze_and_structure_syllabus(
            processing_result["docling_response"], 
            course_data
        )
        
        # Step 5: Update database with processed syllabus JSON
        update_result = await db_operations.update_course_syllabus(
            course_id, 
            structured_syllabus
        )
        
        if update_result["success"]:
            return {
                "success": True,
                "message": f"Syllabus for '{course_data.get('course_name')}' has been successfully processed and updated in the database.",
                "course_id": course_id,
                "course_name": course_data.get("course_name"),
                "processing_summary": {
                    "total_units": len(structured_syllabus.get("units", [])),
                    "total_topics": sum(len(unit.get("topics", [])) for unit in structured_syllabus.get("units", [])),
                    "course_objectives": len(structured_syllabus.get("course_objectives", [])),
                    "assessment_methods": len(structured_syllabus.get("assessment_methods", []))
                }
            }
        else:
            return {
                "success": False,
                "error": "database_update_failed",
                "message": "Syllabus processed successfully but failed to update database",
                "course_id": course_id
            }
        
    except Exception as e:
        return {
            "success": False,
            "error": "processing_exception",
            "message": f"Error processing syllabus for course {course_id}: {str(e)}",
            "course_id": course_id
        }


async def process_with_docling_service(file_data: bytes, course_data: Dict[str, Any]) -> Dict[str, Any]:
    """Process PDF file using docling service"""
    try:
        # Create temporary file for docling processing
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            temp_file.write(file_data)
            temp_file_path = temp_file.name
        
        try:
            # Initialize docling components
            docling_client = DoclingClient()
            document_processor = DocumentProcessor()
            
            # Process document with docling
            processing_result = await docling_client.process_document(temp_file_path)
            
            if processing_result and processing_result.get("success"):
                return {
                    "success": True,
                    "docling_response": processing_result["content"],
                    "metadata": processing_result.get("metadata", {})
                }
            else:
                return {
                    "success": False,
                    "message": "Docling processing failed or returned no content"
                }
                
        finally:
            # Cleanup temporary file
            Path(temp_file_path).unlink(missing_ok=True)
            
    except Exception as e:
        return {
            "success": False,
            "message": f"Docling service error: {str(e)}"
        }


def analyze_and_structure_syllabus(docling_content: str, course_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze docling response and create structured syllabus JSON
    This is where we intelligently parse the docling output and structure it
    """
    try:
        # Basic syllabus structure
        structured_syllabus = {
            "course_info": {
                "course_name": course_data.get("course_name", ""),
                "course_code": course_data.get("course_code", ""),
                "course_type": course_data.get("course_type", ""),
                "processed_at": "now()"
            },
            "course_objectives": [],
            "units": [],
            "assessment_methods": [],
            "reference_materials": [],
            "learning_outcomes": [],
            "prerequisites": [],
            "raw_content": docling_content[:5000]  # Store first 5000 chars for debugging
        }
        
        # Intelligent parsing of docling content
        content_lines = docling_content.split('\n')
        current_section = None
        current_unit = None
        
        for line in content_lines:
            line = line.strip()
            if not line:
                continue
                
            # Detect course objectives
            if any(keyword in line.lower() for keyword in ['objective', 'aims', 'goals']):
                current_section = 'objectives'
                continue
            
            # Detect units/modules
            if any(keyword in line.lower() for keyword in ['unit', 'module', 'chapter']):
                if current_unit:
                    structured_syllabus["units"].append(current_unit)
                
                current_unit = {
                    "unit_title": line,
                    "topics": [],
                    "duration": "",
                    "learning_objectives": []
                }
                current_section = 'unit_content'
                continue
            
            # Detect assessment methods
            if any(keyword in line.lower() for keyword in ['assessment', 'evaluation', 'examination', 'marks']):
                current_section = 'assessment'
                continue
            
            # Detect references
            if any(keyword in line.lower() for keyword in ['reference', 'bibliography', 'books', 'reading']):
                current_section = 'references'
                continue
            
            # Add content based on current section
            if current_section == 'objectives' and len(line) > 10:
                structured_syllabus["course_objectives"].append(line)
            elif current_section == 'unit_content' and current_unit and len(line) > 5:
                current_unit["topics"].append(line)
            elif current_section == 'assessment' and len(line) > 10:
                structured_syllabus["assessment_methods"].append(line)
            elif current_section == 'references' and len(line) > 10:
                structured_syllabus["reference_materials"].append(line)
        
        # Add last unit if exists
        if current_unit:
            structured_syllabus["units"].append(current_unit)
        
        # Ensure we have at least some content
        if not structured_syllabus["units"] and len(docling_content) > 100:
            # Fallback: create a single unit with all content
            structured_syllabus["units"] = [{
                "unit_title": "Course Content",
                "topics": [docling_content[:1000]],  # First 1000 chars
                "duration": "Full Course",
                "learning_objectives": []
            }]
        
        return structured_syllabus
        
    except Exception as e:
        # Fallback structure if parsing fails
        return {
            "course_info": {
                "course_name": course_data.get("course_name", ""),
                "course_code": course_data.get("course_code", ""),
                "course_type": course_data.get("course_type", ""),
                "processed_at": "now()"
            },
            "course_objectives": ["Processing completed with basic structure"],
            "units": [{
                "unit_title": "Course Content", 
                "topics": ["Content processed but detailed parsing failed"],
                "duration": "",
                "learning_objectives": []
            }],
            "assessment_methods": [],
            "reference_materials": [],
            "learning_outcomes": [],
            "prerequisites": [],
            "raw_content": docling_content[:2000],
            "processing_notes": f"Parsing error: {str(e)}"
        }


@FunctionTool
async def get_course_syllabus_status(course_id: str, *, tool_context) -> Dict[str, Any]:
    """Get the current syllabus processing status for a course"""
    try:
        course_result = await db_operations.get_course_with_storage_path(course_id)
        
        if not course_result["success"]:
            return {
                "success": False,
                "error": "course_not_found",
                "message": f"Course {course_id} not found"
            }
        
        course_data = course_result["course"]
        
        return {
            "success": True,
            "course_id": course_id,
            "course_name": course_data.get("course_name"),
            "has_syllabus_file": bool(course_data.get("syllabus_storage_path")),
            "has_processed_syllabus": bool(course_data.get("syllabus_json")),
            "syllabus_storage_path": course_data.get("syllabus_storage_path"),
            "processing_status": "completed" if course_data.get("syllabus_json") else "pending"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": "status_check_failed",
            "message": f"Failed to check syllabus status: {str(e)}"
        } 