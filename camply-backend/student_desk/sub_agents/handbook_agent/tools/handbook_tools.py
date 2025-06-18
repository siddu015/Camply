"""Handbook Query Tools - Query processed handbook data from database."""

import sys
import os
import json
from datetime import datetime
from typing import Dict, Any, Optional, List
from google.adk.tools import FunctionTool
from shared.database import supabase

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
from shared import UserDataService


@FunctionTool
async def get_user_handbook_context(*, tool_context) -> dict:
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
            .eq('user_id', user_id) \
            .order('upload_date', desc=True) \
            .execute()

        handbooks = response.data if response.data else []

        status_counts = {}
        processed_handbooks = []
        
        for handbook in handbooks:
            status = handbook['processing_status']
            status_counts[status] = status_counts.get(status, 0) + 1
            
            if status == 'completed':
                processed_handbooks.append({
                    "handbook_id": handbook['handbook_id'],
                    "filename": handbook['original_filename'],
                    "upload_date": handbook['upload_date'],
                    "processed_date": handbook.get('processed_date'),
                    "has_basic_info": bool(handbook.get('basic_info')),
                    "has_examination_rules": bool(handbook.get('examination_rules')),
                    "has_attendance_policies": bool(handbook.get('attendance_policies')),
                    "has_course_details": bool(handbook.get('course_details')),
                    "data_sections": [key for key in handbook.keys() if key.endswith('_info') or key.endswith('_rules') or key.endswith('_policies') or key.endswith('_details') or key.endswith('_structure') or key.endswith('_criteria') or key.endswith('_calendar') or key.endswith('_methods') or key.endswith('_requirements') if handbook.get(key)]
                })
        
        return {
            "success": True,
            "user_context": {
                "student_name": student_name,
                "college_name": college_name,
                "department": department_name,
                "user_id": user_id
            },
            "handbook_summary": {
                "total_handbooks": len(handbooks),
                "processed_handbooks": len(processed_handbooks),
                "status_breakdown": status_counts,
                "has_processed_data": len(processed_handbooks) > 0
            },
            "processed_handbooks": processed_handbooks,
            "message": f"Found {len(handbooks)} handbook(s) for {student_name}, {len(processed_handbooks)} fully processed"
        }

    except Exception as e:
        return {
            "success": False,
            "error": "system_error",
            "message": f"Error fetching handbook context: {str(e)}"
        }


@FunctionTool
async def query_handbook_section(section_type: str, query: str = "", *, tool_context) -> dict:
    try:
        session_state = getattr(tool_context, 'state', None)
        if not session_state:
            return {
                "success": False,
                "error": "session_unavailable",
                "message": "Session state not available"
            }
        
        user_id = session_state.get('user_id') if hasattr(session_state, 'get') else getattr(session_state, 'user_id', None)
        
        if not user_id:
            return {
                "success": False,
                "error": "missing_user_id",
                "message": "User ID not found in session state"
            }

        user_context = await UserDataService.get_user_context(user_id)
        student_name = user_context.get("user", {}).get("name", "Student") if user_context else "Student"

        response = supabase.table('user_handbooks') \
            .select(f'handbook_id, original_filename, {section_type}') \
            .eq('user_id', user_id) \
            .eq('processing_status', 'completed') \
            .not_.is_(section_type, 'null') \
            .execute()

        if not response.data:
            return {
                "success": False,
                "error": "no_data_found", 
                "message": f"No processed handbook data found for section '{section_type}'. Please upload and process a handbook first.",
                "section_type": section_type,
                "available_sections": []
            }

        section_data = []
        source_handbooks = []
        
        for handbook in response.data:
            if handbook.get(section_type):
                section_data.append(handbook[section_type])
                source_handbooks.append({
                    "handbook_id": handbook['handbook_id'],
                    "filename": handbook['original_filename']
                })

        if not section_data:
            return {
                "success": False,
                "error": "section_empty",
                "message": f"The '{section_type}' section is empty in your processed handbooks.",
                "section_type": section_type
            }

        formatted_data = format_handbook_section(section_data, section_type, query)
        
        return {
            "success": True,
            "section_type": section_type,
            "query": query,
            "student_name": student_name,
            "data": formatted_data,
            "source_handbooks": source_handbooks,
            "message": f"Retrieved {section_type.replace('_', ' ')} data for {student_name}"
        }

    except Exception as e:
        return {
            "success": False,
            "error": "system_error",
            "message": f"Error querying handbook section: {str(e)}"
        }


@FunctionTool
async def search_all_handbook_data(search_query: str, *, tool_context) -> dict:
    try:
        session_state = getattr(tool_context, 'state', None)
        if not session_state:
            return {
                "success": False,
                "error": "session_unavailable",
                "message": "Session state not available"
            }
        
        user_id = session_state.get('user_id') if hasattr(session_state, 'get') else getattr(session_state, 'user_id', None)
        
        if not user_id:
            return {
                "success": False,
                "error": "missing_user_id", 
                "message": "User ID not found in session state"
            }

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
                "message": f"No processed handbooks found for {student_name}. Please upload and process a handbook first.",
                "search_query": search_query
            }

        search_results = []
        handbooks_searched = []
        
        section_names = [
            'basic_info', 'semester_structure', 'examination_rules', 
            'evaluation_criteria', 'attendance_policies', 'academic_calendar',
            'course_details', 'assessment_methods', 'disciplinary_rules',
            'graduation_requirements', 'fee_structure', 'facilities_rules'
        ]
        
        for handbook in response.data:
            handbooks_searched.append(handbook['original_filename'])
            
            for section_name in section_names:
                section_data = handbook.get(section_name)
                if section_data:
                    matches = search_in_json_data(section_data, search_query)
                    if matches:
                        search_results.append({
                            "section": section_name,
                            "handbook_filename": handbook['original_filename'],
                            "matches": matches,
                            "relevance_score": calculate_relevance_score(matches, search_query)
                        })

        search_results.sort(key=lambda x: x['relevance_score'], reverse=True)
        
        if not search_results:
            return {
                "success": True,
                "search_query": search_query,
                "student_name": student_name,
                "results": [],
                "handbooks_searched": handbooks_searched,
                "message": f"No matches found for '{search_query}' in your handbook data. Try different keywords or ask a more general question."
            }

        return {
            "success": True,
            "search_query": search_query,
            "student_name": student_name,
            "results": search_results[:10],  
            "total_matches": len(search_results),
            "handbooks_searched": handbooks_searched,
            "message": f"Found {len(search_results)} relevant matches for '{search_query}' in {student_name}'s handbook data"
        }

    except Exception as e:
        return {
            "success": False,
            "error": "system_error",
            "message": f"Error searching handbook data: {str(e)}"
        }


@FunctionTool
async def get_handbook_overview(*, tool_context) -> dict:
    try:
        session_state = getattr(tool_context, 'state', None)
        if not session_state:
            return {
                "success": False,
                "error": "session_unavailable",
                "message": "Session state not available"
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
                "message": "User profile not found"
            }

        student_name = user_context.get("user", {}).get("name", "Student")
        college_name = user_context.get("college", {}).get("name", "Your College")

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

        overview = generate_handbook_overview(response.data, student_name, college_name)
        
        return {
            "success": True,
            "student_name": student_name,
            "college_name": college_name,
            "overview": overview,
            "handbooks_count": len(response.data),
            "message": f"Generated overview of handbook data for {student_name}"
        }

    except Exception as e:
        return {
            "success": False,
            "error": "system_error",
            "message": f"Error generating handbook overview: {str(e)}"
        }


def format_handbook_section(section_data_list: List[Dict], section_type: str, query: str = "") -> str:
    if not section_data_list:
        return f"No data available for {section_type.replace('_', ' ')}"
    
    formatted_sections = []
    
    for i, section_data in enumerate(section_data_list):
        if isinstance(section_data, dict):
            section_text = json_to_readable_text(section_data, query)
        else:
            section_text = str(section_data)
        
        if len(section_data_list) > 1:
            formatted_sections.append(f"## Handbook {i+1}\n{section_text}")
        else:
            formatted_sections.append(section_text)
    
    return "\n\n".join(formatted_sections)


def json_to_readable_text(data: Dict, query: str = "") -> str:
    if not data:
        return "No data available"
    
    text_parts = []
    
    for key, value in data.items():
        if value:
            readable_key = key.replace('_', ' ').title()
            if isinstance(value, dict):
                nested_text = json_to_readable_text(value, query)
                text_parts.append(f"**{readable_key}:**\n{nested_text}")
            elif isinstance(value, list):
                if value:
                    list_text = "\n".join([f"• {item}" for item in value if item])
                    text_parts.append(f"**{readable_key}:**\n{list_text}")
            else:
                text_parts.append(f"**{readable_key}:** {value}")
    
    return "\n\n".join(text_parts)


def search_in_json_data(data: Dict, query: str) -> List[str]:
    matches = []
    query_lower = query.lower()
    
    def search_recursive(obj, path=""):
        if isinstance(obj, dict):
            for key, value in obj.items():
                current_path = f"{path}.{key}" if path else key
                search_recursive(value, current_path)
        elif isinstance(obj, list):
            for i, item in enumerate(obj):
                search_recursive(item, f"{path}[{i}]")
        elif isinstance(obj, str) and query_lower in obj.lower():
            start = max(0, obj.lower().find(query_lower) - 50)
            end = min(len(obj), obj.lower().find(query_lower) + len(query) + 50)
            snippet = obj[start:end].strip()
            matches.append(f"{path}: ...{snippet}...")
    
    search_recursive(data)
    return matches


def calculate_relevance_score(matches: List[str], query: str) -> float:
    if not matches:
        return 0.0
    
    score = len(matches) * 0.1
    query_words = query.lower().split()
    
    for match in matches:
        match_lower = match.lower()
        word_matches = sum(1 for word in query_words if word in match_lower)
        score += word_matches * 0.2
    
    return min(score, 1.0)


def generate_handbook_overview(handbooks: List[Dict], student_name: str, college_name: str) -> str:
    overview_parts = []
    
    available_sections = set()
    section_names = [
        'basic_info', 'semester_structure', 'examination_rules', 
        'evaluation_criteria', 'attendance_policies', 'academic_calendar',
        'course_details', 'assessment_methods', 'disciplinary_rules',
        'graduation_requirements', 'fee_structure', 'facilities_rules'
    ]
    
    for handbook in handbooks:
        for section in section_names:
            if handbook.get(section):
                available_sections.add(section)
    
    overview_parts.append(f"# Handbook Overview for {student_name} at {college_name}")
    overview_parts.append(f"**Processed Handbooks:** {len(handbooks)}")
    overview_parts.append(f"**Available Sections:** {len(available_sections)}")
    
    if available_sections:
        overview_parts.append("\n## Available Information Sections:")
        for section in sorted(available_sections):
            readable_section = section.replace('_', ' ').title()
            overview_parts.append(f"• {readable_section}")
    
    overview_parts.append("\n## What You Can Ask Me:")
    overview_parts.append("• Questions about examination rules and policies")
    overview_parts.append("• Attendance requirements and policies") 
    overview_parts.append("• Course details and assessment methods")
    overview_parts.append("• Academic calendar and important dates")
    overview_parts.append("• Graduation requirements and criteria")
    overview_parts.append("• Fee structure and payment policies")
    overview_parts.append("• Disciplinary rules and regulations")
    overview_parts.append("• Campus facilities and usage rules")
    
    overview_parts.append("\n*Just ask me any question about your academic handbook and I'll search through your processed data to provide accurate answers!*")
    
    return "\n".join(overview_parts) 