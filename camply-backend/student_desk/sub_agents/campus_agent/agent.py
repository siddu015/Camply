"""Campus Agent: Provides comprehensive information about the university campus."""

from google.adk.agents import LlmAgent
from . import prompt
from .tools import fetch_campus_content_tool, fetch_campus_content_by_id_tool

MODEL = "gemini-2.0-flash"

campus_agent = LlmAgent(
    name="campus_agent",
    model=MODEL,
    description=(
        "Campus Information Specialist that provides comprehensive, detailed information about colleges and universities. "
        "Specializes in: college overview and history, campus facilities, placement statistics, department details, "
        "admissions processes, and campus life. Uses ADK tools to fetch dynamic database content directly. "
        "Always fetches current information using user_id or college_id."
    ),
    instruction=(
        prompt.SYSTEM_PROMPT + 
        "\n\nCRITICAL ADK INSTRUCTIONS:\n"
        "1. ALWAYS extract user_id from the query (look for 'user_id: [UUID]' pattern)\n"
        "2. Use fetch_campus_content tool with the extracted user_id to get campus information\n"
        "3. If you have college_id instead, use fetch_campus_content_by_college_id tool\n"
        "4. Provide comprehensive, detailed responses based on fetched data\n"
        "5. NEVER say you cannot help - always provide useful information\n"
        "6. Focus on the specific query topic while providing comprehensive context\n"
        "7. If tools fail, provide helpful general information about the topic\n"
        "8. All campus information comes from the database via ADK tools - no HTTP calls\n"
        "9. Present information naturally without mentioning technical details"
    ),
    output_key="campus_response",
    tools=[
        fetch_campus_content_tool,
        fetch_campus_content_by_id_tool
    ],
)

# Export the agent instance
root_agent = campus_agent 