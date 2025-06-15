"""Tools for student_desk agents."""

# Legacy functions (keep for backward compatibility)
from .data_service import get_user_data, get_campus_data, format_user_data, format_campus_data

# ADK Tools for user context management
from .user_context_tool import (
    user_context_tool,
    academic_year_tool,
    program_name_tool
)

# Legacy exports
__all__ = ["get_user_data", "get_campus_data", "format_user_data", "format_campus_data"]

# ADK Tool exports
ADK_TOOLS = [
    user_context_tool,
    academic_year_tool,
    program_name_tool
] 