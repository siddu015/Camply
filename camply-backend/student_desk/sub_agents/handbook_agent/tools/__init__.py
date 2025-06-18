"""Handbook Intelligence Tools - Specialized tools for academic policy analysis."""

from .handbook_tools import (
    # Core context and validation tools
    get_handbook_intelligence_context,
    validate_and_route_handbook_query,
    
    # Specialized section tools (12 tools for 12 JSON columns)
    get_basic_info_data,
    get_examination_rules_data,
    get_attendance_policies_data,
    get_evaluation_criteria_data,
    get_academic_calendar_data,
    get_course_details_data,
    get_assessment_methods_data,
    get_graduation_requirements_data,
    get_disciplinary_rules_data,
    get_fee_structure_data,
    get_facilities_rules_data,
    get_semester_structure_data,
    
    # Multi-section intelligence tools
    get_comprehensive_handbook_search,
    get_multi_section_analysis
)

__all__ = [
    # Core context and validation tools
    "get_handbook_intelligence_context",
    "validate_and_route_handbook_query",
    
    # Specialized section tools
    "get_basic_info_data",
    "get_examination_rules_data",
    "get_attendance_policies_data", 
    "get_evaluation_criteria_data",
    "get_academic_calendar_data",
    "get_course_details_data",
    "get_assessment_methods_data",
    "get_graduation_requirements_data",
    "get_disciplinary_rules_data",
    "get_fee_structure_data",
    "get_facilities_rules_data",
    "get_semester_structure_data",
    
    # Multi-section intelligence tools
    "get_comprehensive_handbook_search",
    "get_multi_section_analysis"
] 