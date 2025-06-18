"""Advanced Handbook Intelligence Agent: Comprehensive academic policy analysis with specialized tools."""

from google.adk.agents import LlmAgent
from . import prompt
from .tools import (
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

MODEL = "gemini-2.0-flash"

handbook_agent = LlmAgent(
    name="handbook_agent",
    model=MODEL,
    description=(
        "ADVANCED HANDBOOK INTELLIGENCE SPECIALIST with comprehensive analytical capabilities for academic policy queries. "
        "Features 12 specialized tools for individual handbook sections (examination_rules, attendance_policies, evaluation_criteria, "
        "academic_calendar, course_details, assessment_methods, graduation_requirements, disciplinary_rules, fee_structure, "
        "facilities_rules, semester_structure, basic_info) plus intelligent multi-section analysis and comprehensive search tools. "
        "Provides authoritative answers with exact policy citations from processed college handbook JSON data. "
        "Uses intelligent query routing to select optimal tools based on query complexity and scope. "
        "Validates query relevance and redirects non-handbook queries to appropriate assistants. "
        "Delivers professional, data-backed responses with academic context integration and cross-sectional policy analysis."
    ),
    instruction=prompt.HANDBOOK_AGENT_PROMPT,
    output_key="handbook_intelligence_response",
    tools=[
        # Core tools - ALWAYS use these first
        get_handbook_intelligence_context,
        validate_and_route_handbook_query,
        
        # Specialized section tools - Use based on routing recommendations
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
        
        # Advanced analysis tools - Use for complex queries
        get_comprehensive_handbook_search,
        get_multi_section_analysis
    ],
    disallow_transfer_to_parent=False,
    disallow_transfer_to_peers=False
)

root_agent = handbook_agent 