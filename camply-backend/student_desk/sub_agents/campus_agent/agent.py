"""Campus Agent: Provides comprehensive information about the university campus."""

from google.adk.agents import LlmAgent
from . import prompt
from .tools import fetch_campus_content_tool

MODEL = "gemini-2.0-flash"

campus_agent = LlmAgent(
    name="campus_agent",
    model=MODEL,
    description=(
        "Campus Information Specialist that provides comprehensive, detailed information about colleges and universities. "
        "Specializes in: college overview and history, campus facilities, placement statistics, department details, "
        "admissions processes, and campus life. Uses dynamic database content via fetch_campus_content tool. "
        "Always extracts college_id from queries and fetches current information."
    ),
    instruction=(
        prompt.SYSTEM_PROMPT + 
        "\n\nCRITICAL INSTRUCTIONS:\n"
        "1. ALWAYS extract college_id from the query (look for 'college_id: [UUID]' pattern)\n"
        "2. IMMEDIATELY use fetch_campus_content tool with the extracted college_id\n"
        "3. Provide comprehensive, detailed responses based on fetched data\n"
        "4. NEVER say you cannot help - always provide useful information\n"
        "5. Focus on the specific query topic while providing comprehensive context\n"
        "6. If tool fails, provide helpful general information about the topic\n"
        "7. All campus information comes from the database via the fetch_campus_content tool"
    ),
    output_key="campus_response",
    tools=[fetch_campus_content_tool],
)

# Export the agent instance
root_agent = campus_agent 