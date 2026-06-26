"""
Handbook Agent Tools - Updated for new architecture
- Use direct docling imports
- Use consolidated database operations from student_desk/tools
- Handle handbook_id based file fetching and processing
"""

import asyncio
import json
import tempfile
from pathlib import Path
from typing import Dict, Any, Optional, List, Union
from google.adk.tools import FunctionTool

# Direct docling imports as requested
from docling_service.docling_client import DoclingClient
from docling_service.document_processor import DocumentProcessor

# Use consolidated database operations from student_desk/tools
from student_desk.tools.database_operations import db_operations


@FunctionTool
async def process_handbook_for_user(handbook_id: str, *, tool_context) -> Dict[str, Any]:
    """
    Process handbook for a specific handbook_id - handles everything:
    1. Fetch handbook details from database using handbook_id
    2. Download handbook file from storage
    3. Process with docling service
    4. Analyze and structure response
    5. Update database with processed JSON
    """
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
        
        # Step 1: Get handbook details including storage path
        handbook_result = await db_operations.get_handbook_by_id(handbook_id)
        if not handbook_result["success"]:
            return {
                "success": False,
                "error": "handbook_not_found",
                "message": f"Could not find handbook with ID: {handbook_id}",
                "handbook_id": handbook_id
            }
        
        handbook_data = handbook_result["handbook"]
        
        # Verify user ownership
        if handbook_data.get("user_id") != user_id:
            return {
                "success": False,
                "error": "unauthorized",
                "message": "You don't have permission to access this handbook",
                "handbook_id": handbook_id
            }
        
        storage_path = handbook_data.get("storage_path")
        if not storage_path:
            return {
                "success": False,
                "error": "no_storage_path",
                "message": f"No storage path found for handbook: {handbook_data.get('original_filename', handbook_id)}",
                "handbook_id": handbook_id
            }
        
        # Step 2: Update status to processing
        await db_operations.update_handbook_processing_status(handbook_id, "processing")
        
        # Step 3: Download file from storage
        file_data = await db_operations.download_file_from_storage(
            storage_path,
            bucket_name="handbooks"
        )
        
        if not file_data:
            await db_operations.update_handbook_processing_status(
                handbook_id, "failed", "Could not download file from storage"
            )
            return {
                "success": False,
                "error": "file_download_failed",
                "message": f"Could not download handbook file from storage: {storage_path}",
                "handbook_id": handbook_id
            }
        
        # Step 4: Process with docling service
        processing_result = await process_handbook_with_docling(file_data, handbook_data)
        
        if not processing_result["success"]:
            await db_operations.update_handbook_processing_status(
                handbook_id, "failed", processing_result.get("message", "Docling processing failed")
            )
            return {
                "success": False,
                "error": "docling_processing_failed",
                "message": processing_result.get("message", "Docling processing failed"),
                "handbook_id": handbook_id
            }
        
        # Step 5: Analyze docling response and create structured handbook JSON
        structured_handbook = analyze_and_structure_handbook(
            processing_result["docling_response"],
            handbook_data
        )
        
        # Step 6: Update database with processed handbook JSON
        update_result = await db_operations.store_handbook_json(
            handbook_id,
            structured_handbook
        )
        
        if update_result["success"]:
            # Mark as completed
            await db_operations.update_handbook_processing_status(handbook_id, "completed")
            
            return {
                "success": True,
                "message": f"Handbook '{handbook_data.get('original_filename')}' has been successfully processed and all information has been extracted.",
                "handbook_id": handbook_id,
                "filename": handbook_data.get("original_filename"),
                "processing_summary": {
                    "sections_extracted": len([k for k in structured_handbook.keys() if k not in ['processing_metadata', 'raw_content']]),
                    "examination_rules": len(structured_handbook.get("examination_rules", {}).get("rules", [])),
                    "attendance_policies": len(structured_handbook.get("attendance_policies", {}).get("policies", [])),
                    "course_details": len(structured_handbook.get("course_details", {}).get("courses", [])),
                    "assessment_methods": len(structured_handbook.get("assessment_methods", {}).get("methods", []))
                }
            }
        else:
            await db_operations.update_handbook_processing_status(
                handbook_id, "failed", "Failed to store processed data"
            )
            return {
                "success": False,
                "error": "database_update_failed",
                "message": "Handbook processed successfully but failed to update database",
                "handbook_id": handbook_id
            }
        
    except Exception as e:
        # Update status to failed
        await db_operations.update_handbook_processing_status(
            handbook_id, "failed", f"Processing exception: {str(e)}"
        )
        return {
            "success": False,
            "error": "processing_exception",
            "message": f"Error processing handbook {handbook_id}: {str(e)}",
            "handbook_id": handbook_id
        }


async def process_handbook_with_docling(file_data: bytes, handbook_data: Dict[str, Any]) -> Dict[str, Any]:
    """Process handbook PDF file using docling service"""
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


def analyze_and_structure_handbook(docling_content: str, handbook_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze docling response and create structured handbook JSON
    This is where we intelligently parse the docling output and structure it
    """
    try:
        # Basic handbook structure
        structured_handbook = {
            "basic_info": {
                "filename": handbook_data.get("original_filename", ""),
                "file_size": handbook_data.get("file_size_bytes", 0),
                "processed_at": "now()"
            },
            "semester_structure": {},
            "examination_rules": {"rules": []},
            "evaluation_criteria": {"criteria": []},
            "attendance_policies": {"policies": []},
            "academic_calendar": {"events": []},
            "course_details": {"courses": []},
            "assessment_methods": {"methods": []},
            "disciplinary_rules": {"rules": []},
            "graduation_requirements": {"requirements": []},
            "fee_structure": {"fees": []},
            "facilities_rules": {"rules": []},
            "processing_metadata": {
                "content_length": len(docling_content),
                "sections_detected": 0
            },
            "raw_content": docling_content[:10000]  # Store first 10000 chars for debugging
        }
        
        # Intelligent parsing of docling content
        content_lines = docling_content.split('\n')
        current_section = None
        section_content = []
        
        for line in content_lines:
            line = line.strip()
            if not line:
                continue
            
            # Detect examination rules
            if any(keyword in line.lower() for keyword in ['examination', 'exam', 'test', 'assessment']):
                if current_section and section_content:
                    _add_content_to_section(structured_handbook, current_section, section_content)
                current_section = 'examination_rules'
                section_content = [line]
                continue
            
            # Detect attendance policies
            if any(keyword in line.lower() for keyword in ['attendance', 'absent', 'present', 'minimum']):
                if current_section and section_content:
                    _add_content_to_section(structured_handbook, current_section, section_content)
                current_section = 'attendance_policies'
                section_content = [line]
                continue
            
            # Detect academic calendar
            if any(keyword in line.lower() for keyword in ['calendar', 'schedule', 'semester', 'vacation']):
                if current_section and section_content:
                    _add_content_to_section(structured_handbook, current_section, section_content)
                current_section = 'academic_calendar'
                section_content = [line]
                continue
            
            # Detect course details
            if any(keyword in line.lower() for keyword in ['course', 'subject', 'curriculum', 'syllabus']):
                if current_section and section_content:
                    _add_content_to_section(structured_handbook, current_section, section_content)
                current_section = 'course_details'
                section_content = [line]
                continue
            
            # Detect fee structure
            if any(keyword in line.lower() for keyword in ['fee', 'cost', 'payment', 'tuition']):
                if current_section and section_content:
                    _add_content_to_section(structured_handbook, current_section, section_content)
                current_section = 'fee_structure'
                section_content = [line]
                continue
            
            # Detect graduation requirements
            if any(keyword in line.lower() for keyword in ['graduation', 'degree', 'requirement', 'credit']):
                if current_section and section_content:
                    _add_content_to_section(structured_handbook, current_section, section_content)
                current_section = 'graduation_requirements'
                section_content = [line]
                continue
            
            # Add content to current section
            if current_section and len(line) > 5:
                section_content.append(line)
        
        # Process last section
        if current_section and section_content:
            _add_content_to_section(structured_handbook, current_section, section_content)
        
        # Update metadata
        structured_handbook["processing_metadata"]["sections_detected"] = len([
            k for k in structured_handbook.keys() 
            if k not in ['basic_info', 'processing_metadata', 'raw_content'] 
            and structured_handbook[k]
        ])
        
        return structured_handbook
        
    except Exception as e:
        # Fallback structure if parsing fails
        return {
            "basic_info": {
                "filename": handbook_data.get("original_filename", ""),
                "file_size": handbook_data.get("file_size_bytes", 0),
                "processed_at": "now()"
            },
            "examination_rules": {"rules": ["Content processed but detailed parsing failed"]},
            "attendance_policies": {"policies": ["Basic structure created"]},
            "course_details": {"courses": ["Handbook content available"]},
            "processing_metadata": {
                "content_length": len(docling_content),
                "parsing_error": str(e)
            },
            "raw_content": docling_content[:5000]
        }


def _add_content_to_section(structured_handbook: Dict[str, Any], section: str, content: list):
    """Helper to add parsed content to appropriate section"""
    if section == 'examination_rules':
        structured_handbook["examination_rules"]["rules"].extend(content)
    elif section == 'attendance_policies':
        structured_handbook["attendance_policies"]["policies"].extend(content)
    elif section == 'academic_calendar':
        structured_handbook["academic_calendar"]["events"].extend(content)
    elif section == 'course_details':
        structured_handbook["course_details"]["courses"].extend(content)
    elif section == 'fee_structure':
        structured_handbook["fee_structure"]["fees"].extend(content)
    elif section == 'graduation_requirements':
        structured_handbook["graduation_requirements"]["requirements"].extend(content)


@FunctionTool
async def get_handbook_processing_status(handbook_id: str, *, tool_context) -> Dict[str, Any]:
    """Get processing status for a specific handbook"""
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
        
        # Get handbook details
        handbook_result = await db_operations.get_handbook_by_id(handbook_id)
        
        if not handbook_result["success"]:
            return {
                "success": False,
                "error": "handbook_not_found",
                "message": f"Could not find handbook with ID: {handbook_id}",
                "handbook_id": handbook_id
            }
        
        handbook_data = handbook_result["handbook"]
        
        # Verify user ownership
        if handbook_data.get("user_id") != user_id:
            return {
                "success": False,
                "error": "unauthorized",
                "message": "You don't have permission to access this handbook",
                "handbook_id": handbook_id
            }
        
        processing_status = handbook_data.get("processing_status", "unknown")
        
        status_messages = {
            "uploaded": "Handbook uploaded successfully and waiting for processing",
            "processing": "Handbook is currently being processed. Please wait...",
            "completed": "Handbook processing completed successfully",
            "failed": f"Handbook processing failed: {handbook_data.get('error_message', 'Unknown error')}"
        }
        
        return {
            "success": True,
            "handbook_id": handbook_id,
            "filename": handbook_data.get("original_filename"),
            "processing_status": processing_status,
            "message": status_messages.get(processing_status, f"Unknown status: {processing_status}"),
            "upload_date": handbook_data.get("upload_date"),
            "processed_date": handbook_data.get("processed_date"),
            "error_message": handbook_data.get("error_message") if processing_status == "failed" else None
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": "status_check_failed",
            "message": f"Failed to check handbook status: {str(e)}",
            "handbook_id": handbook_id
        }


@FunctionTool
async def validate_and_route_handbook_query(query: str, *, tool_context) -> dict:
    """Intelligent query validation and tool routing recommendation."""
    try:
        query_lower = query.lower()
        routing_recommendations = []
        
        section_mappings = {
            "basic_info": ["basic", "overview", "handbook", "general", "information", "about"],
            "examination_rules": ["exam", "examination", "test", "ia", "internal", "assessment", "midterm", "final", "rules", "procedure"],
            "attendance_policies": ["attendance", "present", "absent", "leave", "policy", "minimum", "percentage"],
            "evaluation_criteria": ["cgpa", "gpa", "grade", "grading", "evaluation", "marking", "criteria", "calculation"],
            "academic_calendar": ["calendar", "schedule", "dates", "deadline", "semester", "exam dates", "holiday"],
            "course_details": ["course", "subject", "curriculum", "syllabus", "credit", "structure"],
            "assessment_methods": ["assignment", "project", "assessment", "method", "evaluation", "submission"],
            "graduation_requirements": ["graduation", "degree", "requirement", "completion", "eligibility", "criteria"],
            "disciplinary_rules": ["disciplinary", "conduct", "behavior", "rules", "violation", "penalty"],
            "fee_structure": ["fee", "payment", "cost", "charges", "financial", "tuition"],
            "facilities_rules": ["facility", "library", "lab", "hostel", "mess", "infrastructure"],
            "semester_structure": ["semester", "structure", "organization", "timeline", "progression"]
        }
        
        for section, keywords in section_mappings.items():
            score = sum(1 for keyword in keywords if keyword in query_lower)
            if score > 0:
                routing_recommendations.append({
                    "section": section,
                    "relevance_score": score,
                    "matched_keywords": [kw for kw in keywords if kw in query_lower]
                })
        
        routing_recommendations.sort(key=lambda x: x["relevance_score"], reverse=True)
        
        is_valid_handbook_query = len(routing_recommendations) > 0
        primary_section = routing_recommendations[0]["section"] if routing_recommendations else None
        
        return {
            "success": True,
            "query": query,
            "is_valid_handbook_query": is_valid_handbook_query,
            "routing_recommendations": routing_recommendations[:3],
            "primary_section": primary_section,
            "multi_section_query": len(routing_recommendations) > 1 and routing_recommendations[1]["relevance_score"] > 0,
            "suggested_tools": [f"get_{rec['section']}_data" for rec in routing_recommendations[:2]]
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": "validation_error",
            "message": f"Error validating query: {str(e)}"
        }


@FunctionTool
async def get_basic_info_data(query: str = "", *, tool_context) -> dict:
    """Get basic handbook information and college overview."""
    return await _get_section_data("basic_info", query, tool_context, 
                                  "Basic Information", 
                                  "college overview, handbook structure, general information")


@FunctionTool
async def get_examination_rules_data(query: str = "", *, tool_context) -> dict:
    """Get examination rules, IA patterns, exam procedures, and testing policies."""
    return await _get_section_data("examination_rules", query, tool_context,
                                  "Examination Rules", 
                                  "exam procedures, IA patterns, testing policies, examination schedule")


@FunctionTool
async def get_attendance_policies_data(query: str = "", *, tool_context) -> dict:
    """Get attendance requirements, leave policies, and presence rules."""
    return await _get_section_data("attendance_policies", query, tool_context,
                                  "Attendance Policies",
                                  "attendance requirements, minimum percentage, leave policies, absence rules")


@FunctionTool
async def get_evaluation_criteria_data(query: str = "", *, tool_context) -> dict:
    """Get CGPA calculation, grading systems, and evaluation standards."""
    return await _get_section_data("evaluation_criteria", query, tool_context,
                                  "Evaluation Criteria",
                                  "CGPA calculation, grading systems, marking schemes, evaluation standards")


@FunctionTool
async def get_academic_calendar_data(query: str = "", *, tool_context) -> dict:
    """Get academic calendar, important dates, deadlines, and schedules."""
    return await _get_section_data("academic_calendar", query, tool_context,
                                  "Academic Calendar",
                                  "important dates, deadlines, semester schedule, exam dates, holidays")


@FunctionTool
async def get_course_details_data(query: str = "", *, tool_context) -> dict:
    """Get course structure, curriculum details, and credit requirements."""
    return await _get_section_data("course_details", query, tool_context,
                                  "Course Details",
                                  "course structure, curriculum, syllabus, credit requirements, subject details")


@FunctionTool
async def get_assessment_methods_data(query: str = "", *, tool_context) -> dict:
    """Get assessment methods, assignment policies, and evaluation procedures."""
    return await _get_section_data("assessment_methods", query, tool_context,
                                  "Assessment Methods",
                                  "assignment policies, project guidelines, evaluation methods, submission procedures")


@FunctionTool
async def get_graduation_requirements_data(query: str = "", *, tool_context) -> dict:
    """Get graduation requirements, degree completion criteria, and eligibility rules."""
    return await _get_section_data("graduation_requirements", query, tool_context,
                                  "Graduation Requirements",
                                  "degree completion, graduation criteria, eligibility requirements, credit completion")


@FunctionTool
async def get_disciplinary_rules_data(query: str = "", *, tool_context) -> dict:
    """Get disciplinary rules, code of conduct, and behavioral policies."""
    return await _get_section_data("disciplinary_rules", query, tool_context,
                                  "Disciplinary Rules",
                                  "code of conduct, behavioral policies, disciplinary actions, violations, penalties")


@FunctionTool
async def get_fee_structure_data(query: str = "", *, tool_context) -> dict:
    """Get fee structure, payment policies, and financial information."""
    return await _get_section_data("fee_structure", query, tool_context,
                                  "Fee Structure",
                                  "fee details, payment policies, financial information, tuition, charges")


@FunctionTool
async def get_facilities_rules_data(query: str = "", *, tool_context) -> dict:
    """Get facilities rules, library policies, and infrastructure guidelines."""
    return await _get_section_data("facilities_rules", query, tool_context,
                                  "Facilities Rules",
                                  "library policies, lab guidelines, infrastructure usage, facility rules")


@FunctionTool
async def get_semester_structure_data(query: str = "", *, tool_context) -> dict:
    """Get semester structure, academic organization, and program timeline."""
    return await _get_section_data("semester_structure", query, tool_context,
                                  "Semester Structure",
                                  "semester organization, academic timeline, program structure, progression")


@FunctionTool
async def get_comprehensive_handbook_search(search_query: str, *, tool_context) -> dict:
    """Comprehensive search across all handbook sections with intelligent ranking."""
    try:
        session_state = getattr(tool_context, 'state', None)
        if not session_state:
            return {"success": False, "error": "session_unavailable"}
        
        user_id = session_state.get('user_id') if hasattr(session_state, 'get') else getattr(session_state, 'user_id', None)
        if not user_id:
            return {"success": False, "error": "missing_user_id"}

        user_context = await UserDataService.get_user_context(user_id)
        student_name = user_context.get("user", {}).get("name", "Student") if user_context else "Student"

        response = supabase.table('user_handbooks') \
            .select('*') \
            .eq('user_id', user_id) \
            .eq('processing_status', 'completed') \
            .execute()

        if not response.data:
            return {
                "success": False,
                "error": "no_handbooks_found",
                "message": f"No processed handbooks found for {student_name}. Please upload and process a handbook first."
            }

        search_results = []
        section_names = [
            'basic_info', 'semester_structure', 'examination_rules', 
            'evaluation_criteria', 'attendance_policies', 'academic_calendar',
            'course_details', 'assessment_methods', 'disciplinary_rules',
            'graduation_requirements', 'fee_structure', 'facilities_rules'
        ]
        
        for handbook in response.data:
            for section_name in section_names:
                section_data = handbook.get(section_name)
                if section_data:
                    matches = search_in_json_data(section_data, search_query)
                    if matches:
                        search_results.append({
                            "section": section_name,
                            "section_title": format_section_title(section_name),
                            "handbook_filename": handbook['original_filename'],
                            "matches": matches[:3],
                            "relevance_score": calculate_relevance_score(matches, search_query),
                            "match_count": len(matches)
                        })

        search_results.sort(key=lambda x: x['relevance_score'], reverse=True)
        
        return {
            "success": True,
            "search_query": search_query,
            "student_name": student_name,
            "total_sections_searched": len(section_names),
            "sections_with_matches": len(search_results),
            "results": search_results[:8],
            "comprehensive_summary": generate_search_summary(search_results, search_query)
        }

    except Exception as e:
        return {
            "success": False,
            "error": "system_error",
            "message": f"Error in comprehensive search: {str(e)}"
        }


@FunctionTool
async def get_multi_section_analysis(sections: List[str], query: str = "", *, tool_context) -> dict:
    """Analyze multiple handbook sections together for complex queries."""
    try:
        session_state = getattr(tool_context, 'state', None)
        if not session_state:
            return {"success": False, "error": "session_unavailable"}
        
        user_id = session_state.get('user_id') if hasattr(session_state, 'get') else getattr(session_state, 'user_id', None)
        if not user_id:
            return {"success": False, "error": "missing_user_id"}

        valid_sections = [
            'basic_info', 'semester_structure', 'examination_rules', 
            'evaluation_criteria', 'attendance_policies', 'academic_calendar',
            'course_details', 'assessment_methods', 'disciplinary_rules',
            'graduation_requirements', 'fee_structure', 'facilities_rules'
        ]
        
        sections = [s for s in sections if s in valid_sections]
        if not sections:
            return {"success": False, "error": "no_valid_sections", "message": "No valid sections specified"}

        multi_section_data = {}
        for section in sections:
            section_result = await _get_section_data(section, query, tool_context, 
                                                   format_section_title(section), 
                                                   f"{section} related information")
            if section_result["success"]:
                multi_section_data[section] = section_result["data"]

        return {
            "success": True,
            "query": query,
            "sections_analyzed": sections,
            "multi_section_data": multi_section_data,
            "cross_reference_analysis": analyze_cross_references(multi_section_data, query),
            "integrated_summary": generate_integrated_summary(multi_section_data, query)
        }

    except Exception as e:
        return {
            "success": False,
            "error": "system_error",
            "message": f"Error in multi-section analysis: {str(e)}"
        }


async def _get_section_data(section_type: str, query: str, tool_context, section_title: str, description: str) -> dict:
    """Generic function to retrieve section data from handbook"""
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
        
        # Get user context
        user_result = await db_operations.get_user_context(user_id)
        
        if not user_result.get("success") or not user_result.get("user_data"):
            return {
                "success": False,
                "error": "user_profile_incomplete",
                "message": "User profile not found or incomplete"
            }
        
        user_data = user_result["user_data"]
        academic_details = user_data.get("user_academic_details", {})
        
        # Handle case where academic_details might be a list
        if isinstance(academic_details, list) and len(academic_details) > 0:
            academic_details = academic_details[0]
        
        academic_id = academic_details.get('academic_id') if academic_details else None
        
        if not academic_id:
            return {
                "success": False,
                "error": "missing_academic_id",
                "message": "Academic ID not found in user profile"
            }
        
        # Get user handbooks
        handbooks_result = await db_operations.get_user_handbooks(user_id, academic_id)
        handbooks = handbooks_result.get("handbooks", [])
        
        if not handbooks:
            return {
                "success": False,
                "error": "no_handbooks",
                "message": f"No handbooks found. Please upload your college handbook first to get {section_title} information.",
                "section_type": section_type,
                "guidance": f"To access {description}, upload your college handbook in the Academic section."
            }
        
        # Find the most recent processed handbook
        processed_handbooks = [h for h in handbooks if h.get("processing_status") == "completed"]
        
        if not processed_handbooks:
            pending_handbooks = [h for h in handbooks if h.get("processing_status") in ["uploaded", "processing"]]
            if pending_handbooks:
                return {
                    "success": False,
                    "error": "processing_in_progress",
                    "message": f"Your handbook is being processed. Please wait and try again in a few minutes for {section_title} information."
                }
            else:
                return {
                    "success": False,
                    "error": "no_processed_handbooks",
                    "message": f"No processed handbooks found. Please upload and process your college handbook to get {section_title} information."
                }
        
        # Get the most recent handbook data
        latest_handbook = max(processed_handbooks, key=lambda x: x.get('created_at', ''))
        
        # Extract section data from handbook
        section_data = latest_handbook.get(section_type, {})
        
        if not section_data:
            return {
                "success": True,
                "section_type": section_type,
                "message": f"No {section_title} data found in your handbook. This section may not be present or may need manual review.",
                "data": {},
                "handbook_filename": latest_handbook.get('original_filename', 'Unknown'),
                "suggestions": [
                    f"Check if your handbook contains {section_title} information",
                    "Try uploading a more complete handbook document",
                    "Contact your academic office for official policies"
                ]
            }
        
        # Format and return the section data
        formatted_content = format_section_data(section_data, section_type, query)
        key_insights = extract_key_insights(section_data, section_type, query)
        related_sections = get_related_sections(section_type)
        
        return {
            "success": True,
            "section_type": section_type,
            "section_title": section_title,
            "query": query,
            "data": section_data,
            "formatted_content": formatted_content,
            "key_insights": key_insights,
            "related_sections": related_sections,
            "handbook_info": {
                "filename": latest_handbook.get('original_filename', 'Unknown'),
                "processed_date": latest_handbook.get('processed_date'),
                "handbook_id": latest_handbook.get('handbook_id')
            },
            "student_profile": {
                "name": user_data.get('name'),
                "department": academic_details.get('department_name'),
                "branch": academic_details.get('branch_name'),
                "current_year": academic_details.get('current_year')
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": "section_retrieval_failed",
            "message": f"Failed to retrieve {section_title}: {str(e)}",
            "section_type": section_type
        }


def analyze_handbook_sections(handbook: dict) -> dict:
    """Analyze all sections of a handbook for completeness and content quality."""
    sections = [
        'basic_info', 'semester_structure', 'examination_rules', 
        'evaluation_criteria', 'attendance_policies', 'academic_calendar',
        'course_details', 'assessment_methods', 'disciplinary_rules',
        'graduation_requirements', 'fee_structure', 'facilities_rules'
    ]
    
    analysis = {
        "available_sections": [],
        "section_quality": {},
        "total_sections": len(sections),
        "completion_percentage": 0
    }
    
    for section in sections:
        section_data = handbook.get(section)
        if section_data:
            analysis["available_sections"].append({
                "section": section,
                "title": format_section_title(section),
                "content_length": len(str(section_data)),
                "has_structured_data": isinstance(section_data, dict),
                "quality_score": calculate_section_quality(section_data)
            })
    
    analysis["completion_percentage"] = (len(analysis["available_sections"]) / analysis["total_sections"]) * 100
    
    return analysis


def format_section_title(section_name: str) -> str:
    """Format section name into readable title."""
    title_map = {
        'basic_info': 'Basic Information',
        'semester_structure': 'Semester Structure',
        'examination_rules': 'Examination Rules',
        'evaluation_criteria': 'Evaluation Criteria',
        'attendance_policies': 'Attendance Policies',
        'academic_calendar': 'Academic Calendar',
        'course_details': 'Course Details',
        'assessment_methods': 'Assessment Methods',
        'disciplinary_rules': 'Disciplinary Rules',
        'graduation_requirements': 'Graduation Requirements',
        'fee_structure': 'Fee Structure',
        'facilities_rules': 'Facilities Rules'
    }
    return title_map.get(section_name, section_name.replace('_', ' ').title())


def format_section_data(section_data: dict, section_type: str, query: str = "") -> str:
    """Format section data for display with query-specific highlighting."""
    if not isinstance(section_data, dict):
        return str(section_data)
    
    if section_type == "examination_rules":
        return format_examination_rules(section_data, query)
    elif section_type == "attendance_policies":
        return format_attendance_policies(section_data, query)
    elif section_type == "evaluation_criteria":
        return format_evaluation_criteria(section_data, query)
    else:
        return format_generic_section(section_data, query)


def format_examination_rules(data: dict, query: str = "") -> str:
    """Format examination rules with specific structure."""
    formatted = "**Examination Rules and Procedures**\n\n"
    
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, (dict, list)):
                formatted += f"**{key.replace('_', ' ').title()}:**\n"
                formatted += f"{json.dumps(value, indent=2)}\n\n"
            else:
                formatted += f"**{key.replace('_', ' ').title()}:** {value}\n\n"
    
    return formatted


def format_attendance_policies(data: dict, query: str = "") -> str:
    """Format attendance policies with specific structure."""
    formatted = "**Attendance Policies and Requirements**\n\n"
    
    if isinstance(data, dict):
        for key, value in data.items():
            if "percentage" in key.lower() or "minimum" in key.lower():
                formatted += f"🎯 **{key.replace('_', ' ').title()}:** {value}\n\n"
            else:
                formatted += f"**{key.replace('_', ' ').title()}:** {value}\n\n"
    
    return formatted


def format_evaluation_criteria(data: dict, query: str = "") -> str:
    """Format evaluation criteria with specific structure."""
    formatted = "**Evaluation Criteria and Grading System**\n\n"
    
    if isinstance(data, dict):
        for key, value in data.items():
            if "cgpa" in key.lower() or "grade" in key.lower():
                formatted += f"📊 **{key.replace('_', ' ').title()}:** {value}\n\n"
            else:
                formatted += f"**{key.replace('_', ' ').title()}:** {value}\n\n"
    
    return formatted


def format_generic_section(data: dict, query: str = "") -> str:
    """Generic formatter for other sections."""
    if isinstance(data, dict):
        formatted_parts = []
        for key, value in data.items():
            if isinstance(value, (dict, list)):
                formatted_parts.append(f"**{key.replace('_', ' ').title()}:**\n{json.dumps(value, indent=2)}")
            else:
                formatted_parts.append(f"**{key.replace('_', ' ').title()}:** {value}")
        return "\n\n".join(formatted_parts)
    return str(data)


def extract_key_insights(section_data: dict, section_type: str, query: str = "") -> List[str]:
    """Extract key insights from section data."""
    insights = []
    
    if section_type == "examination_rules" and isinstance(section_data, dict):
        insights.extend([
            "📝 Contains examination procedures and policies",
            "⏰ Includes timing and scheduling information",
            "📋 Details assessment patterns and rules"
        ])
    elif section_type == "attendance_policies" and isinstance(section_data, dict):
        insights.extend([
            "📊 Specifies attendance requirements",
            "🎯 Defines minimum attendance percentages",
            "📅 Outlines leave and absence policies"
        ])
    elif section_type == "evaluation_criteria" and isinstance(section_data, dict):
        insights.extend([
            "🎓 Details grading and evaluation systems",
            "📈 Explains CGPA calculation methods",
            "⭐ Defines performance standards"
        ])
    
    return insights


def get_related_sections(section_type: str) -> List[str]:
    """Get sections related to the current section."""
    relations = {
        "examination_rules": ["evaluation_criteria", "academic_calendar", "assessment_methods"],
        "attendance_policies": ["academic_calendar", "disciplinary_rules"],
        "evaluation_criteria": ["examination_rules", "graduation_requirements"],
        "academic_calendar": ["examination_rules", "attendance_policies"],
        "graduation_requirements": ["evaluation_criteria", "course_details"],
        "course_details": ["semester_structure", "graduation_requirements"],
        "assessment_methods": ["examination_rules", "evaluation_criteria"],
        "disciplinary_rules": ["attendance_policies", "facilities_rules"],
        "fee_structure": ["basic_info"],
        "facilities_rules": ["disciplinary_rules"],
        "semester_structure": ["course_details", "academic_calendar"],
        "basic_info": ["fee_structure"]
    }
    return relations.get(section_type, [])


def search_in_json_data(data: dict, query: str) -> List[str]:
    """Search for query terms in JSON data structure."""
    if not query or not data:
        return []
    
    matches = []
    query_lower = query.lower()
    
    def search_recursive(obj, path=""):
        if isinstance(obj, dict):
            for key, value in obj.items():
                current_path = f"{path}.{key}" if path else key
                if query_lower in key.lower():
                    matches.append(f"Key: {current_path}")
                search_recursive(value, current_path)
        elif isinstance(obj, list):
            for i, item in enumerate(obj):
                search_recursive(item, f"{path}[{i}]")
        else:
            text = str(obj).lower()
            if query_lower in text:
                matches.append(f"Value at {path}: {str(obj)[:100]}...")
    
    search_recursive(data)
    return matches[:10]


def calculate_relevance_score(matches: List[str], query: str) -> float:
    """Calculate relevance score for search matches."""
    if not matches or not query:
        return 0.0
    
    score = len(matches) * 10
    
    query_lower = query.lower()
    for match in matches:
        if query_lower in match.lower():
            score += 5
    
    return min(score, 100.0)


def calculate_section_quality(section_data) -> float:
    """Calculate quality score for a section."""
    if not section_data:
        return 0.0
    
    score = 0.0
    data_str = str(section_data)
    
    score += min(len(data_str) / 100, 30)
    
    if isinstance(section_data, dict):
        score += min(len(section_data.keys()) * 5, 40)

    if len(data_str) > 500:
        score += 30
    elif len(data_str) > 200:
        score += 20
    elif len(data_str) > 50:
        score += 10
    
    return min(score, 100.0)


def generate_intelligence_guidance(student_name: str, college_name: str, section_analysis: dict) -> str:
    """Generate intelligent guidance based on handbook analysis."""
    available_count = len(section_analysis["available_sections"])
    total_count = section_analysis["total_sections"]
    completion = section_analysis["completion_percentage"]
    
    if completion >= 80:
        return f"Hi {student_name}! Your {college_name} handbook is comprehensive with {available_count}/{total_count} sections available. I can help with detailed policy questions across all areas."
    elif completion >= 50:
        return f"Hi {student_name}! Your {college_name} handbook has {available_count}/{total_count} sections available. I can help with most policy questions, though some areas may have limited information."
    else:
        return f"Hi {student_name}! Your {college_name} handbook has basic information available ({available_count}/{total_count} sections). I can help with available policies, but you may need to contact your academic office for comprehensive details."


def generate_search_summary(search_results: List[dict], query: str) -> str:
    """Generate a summary of comprehensive search results."""
    if not search_results:
        return f"No specific information found for '{query}' in your handbook. Try using different keywords or ask about general policies."
    
    sections_found = [result["section_title"] for result in search_results[:3]]
    return f"Found relevant information for '{query}' in: {', '.join(sections_found)}. The most relevant section appears to be {search_results[0]['section_title']}."


def analyze_cross_references(multi_section_data: dict, query: str) -> dict:
    """Analyze cross-references between multiple sections."""
    cross_refs = {}
    
    for section1, data1 in multi_section_data.items():
        for section2, data2 in multi_section_data.items():
            if section1 != section2:
                common_terms = find_common_terms(str(data1), str(data2))
                if common_terms:
                    cross_refs[f"{section1}_to_{section2}"] = common_terms[:3]
    
    return cross_refs


def find_common_terms(text1: str, text2: str) -> List[str]:
    """Find common significant terms between two texts."""
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    common = words1.intersection(words2)
                        
    stopwords = {'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'a', 'an'}
    
    significant_terms = [term for term in common if len(term) > 3 and term not in stopwords]
    return sorted(significant_terms)[:5]


def generate_integrated_summary(multi_section_data: dict, query: str) -> str:
    """Generate an integrated summary from multiple sections."""
    if not multi_section_data:
        return "No relevant information found across the requested sections."
    
    sections = list(multi_section_data.keys())
    section_titles = [format_section_title(section) for section in sections]
    
    return f"Analyzed {len(sections)} sections ({', '.join(section_titles)}) for '{query}'. Each section provides complementary information that together gives a comprehensive view of the policy area."


@FunctionTool
async def get_handbook_intelligence_context(*, tool_context) -> Dict[str, Any]:
    """
    Master user context function for handbook agent.
    Follows ADK patterns - uses root user context and gets handbook availability.
    """
    try:
        # Import root agent's working user context tool
        import sys
        import os
        sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
        from student_desk.tools.user_context_tool import get_user_context as root_get_user_context

        # Use root agent's working user context function
        user_context_result = await root_get_user_context(tool_context=tool_context)

        if not user_context_result.get("success"):
            return {
                "success": False,
                "error": user_context_result.get("error"),
                "message": "Could not retrieve user context from root agent tools",
                "debug_info": user_context_result
            }

        user_id = user_context_result.get("user_id")
        college_id = user_context_result.get("college_id")
        academic_id = user_context_result.get("academic_id")

        if not user_id or not academic_id:
            return {
                "success": False,
                "error": "missing_context",
                "message": "User ID or Academic ID not found in user profile"
            }

        # Get available handbooks for the user
        handbooks_result = await db_operations.get_user_handbooks(user_id, academic_id)
        
        return {
            "success": True,
            "user_id": user_id,
            "academic_id": academic_id,
            "college_id": college_id,
            "college_name": user_context_result.get("college_name"),
            "handbooks_available": handbooks_result.get("handbooks", []),
            "handbooks_count": len(handbooks_result.get("handbooks", [])),
            "processed_handbooks": [h for h in handbooks_result.get("handbooks", []) if h.get("processing_status") == "completed"],
            "context_type": "handbook_intelligence"
        }

    except Exception as e:
        return {
            "success": False,
            "error": "system_error",
            "message": f"Failed to retrieve handbook context: {str(e)}"
        } 