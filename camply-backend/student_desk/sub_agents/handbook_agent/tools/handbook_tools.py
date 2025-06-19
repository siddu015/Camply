"""Handbook Intelligence Tools - Specialized tools for each handbook section with intelligent query routing."""

import sys
import os
import json
from datetime import datetime
from typing import Dict, Any, Optional, List, Union
from google.adk.tools import FunctionTool
from shared.database import supabase

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
from shared import UserDataService


@FunctionTool
async def get_handbook_intelligence_context(*, tool_context) -> dict:
    """Get comprehensive handbook context with intelligent section analysis."""
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
        branch_name = user_context.get("academic_details", {}).get("branch_name", "Unknown Branch")

        response = supabase.table('user_handbooks') \
            .select('*') \
            .eq('user_id', user_id) \
            .eq('processing_status', 'completed') \
            .order('upload_date', desc=True) \
            .execute()

        handbooks = response.data if response.data else []

        if not handbooks:
            return {
                "success": False,
                "error": "no_handbook_found",
                "message": "No processed handbook found. Please upload and process your college handbook first.",
                "user_context": {
                    "student_name": student_name,
                    "college_name": college_name,
                    "department": department_name,
                    "branch": branch_name
                }
            }

        latest_handbook = handbooks[0]
        section_analysis = analyze_handbook_sections(latest_handbook)
        
        return {
            "success": True,
            "user_context": {
                "student_name": student_name,
                "college_name": college_name,
                "department": department_name,
                "branch": branch_name,
                "user_id": user_id,
                "program_name": f"{department_name} - {branch_name}"
            },
            "handbook_info": {
                "handbook_id": latest_handbook['handbook_id'],
                "filename": latest_handbook['original_filename'],
                "processed_date": latest_handbook.get('processed_date'),
                "total_sections": len(section_analysis['available_sections']),
                "sections_summary": section_analysis
            },
            "intelligence_guidance": generate_intelligence_guidance(student_name, college_name, section_analysis)
        }

    except Exception as e:
        return {
            "success": False,
            "error": "system_error",
            "message": f"Error fetching handbook context: {str(e)}"
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
    """Core function to get data from a specific handbook section."""
    try:
        session_state = getattr(tool_context, 'state', None)
        if not session_state:
            return {"success": False, "error": "session_unavailable"}
        
        user_id = session_state.get('user_id') if hasattr(session_state, 'get') else getattr(session_state, 'user_id', None)
        if not user_id:
            return {"success": False, "error": "missing_user_id"}

        user_context = await UserDataService.get_user_context(user_id)
        student_name = user_context.get("user", {}).get("name", "Student") if user_context else "Student"
        college_name = user_context.get("college", {}).get("name", "Your College") if user_context else "Your College"

        response = supabase.table('user_handbooks') \
            .select(f'handbook_id, original_filename, processed_date, {section_type}') \
            .eq('user_id', user_id) \
            .eq('processing_status', 'completed') \
            .not_.is_(section_type, 'null') \
            .order('upload_date', desc=True) \
            .execute()

        if not response.data:
            return {
                "success": False,
                "error": "no_section_data",
                "message": f"No {section_title.lower()} data found in your processed handbooks. Please ensure your handbook contains this information.",
                "section": section_type,
                "student_name": student_name
            }

        latest_handbook = response.data[0]
        section_data = latest_handbook.get(section_type)
        
        if not section_data:
            return {
                "success": False,
                "error": "section_empty",
                "message": f"The {section_title.lower()} section is empty in your handbook.",
                "section": section_type
            }

        formatted_data = format_section_data(section_data, section_type, query)
        key_insights = extract_key_insights(section_data, section_type, query)
        
        return {
            "success": True,
            "section": section_type,
            "section_title": section_title,
            "query": query,
            "student_name": student_name,
            "college_name": college_name,
            "handbook_filename": latest_handbook['original_filename'],
            "processed_date": latest_handbook.get('processed_date'),
            "data": formatted_data,
            "key_insights": key_insights,
            "related_sections": get_related_sections(section_type),
            "metadata": {
                "section_description": description,
                "data_length": len(str(section_data)),
                "contains_query_terms": query.lower() in str(section_data).lower() if query else False
            }
        }

    except Exception as e:
        return {
            "success": False,
            "error": "system_error",
            "message": f"Error retrieving {section_title.lower()} data: {str(e)}"
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