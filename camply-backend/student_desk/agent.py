""" Student Desk agent that manages all student-related functionalities. Acts as a personal academic assistant for individual students."""

from google.adk.agents import LlmAgent
from google.adk.tools.agent_tool import AgentTool
from .sub_agents import campus_agent, handbook_agent, syllabus_agent
from .tools import ADK_TOOLS

from . import prompt

MODEL = "gemini-2.0-flash"

student_desk = LlmAgent(
    name="student_desk",
    model=MODEL,
    description=(
        "A comprehensive personal student assistant that provides: "
        "1. Personal academic information (roll number, timeline, progress, study guidance) "
        "2. Campus information through specialized campus agent (facilities, placements, college details) "
        "3. Academic planning and course guidance "
        "4. Handbook processing and queries through specialized handbook agent "
        "5. Syllabus processing and content generation through specialized syllabus agent "
        "6. Personalized recommendations based on student profile "
        "7. Memory management for context persistence across conversations "
        "\nUses ADK tools to fetch user data, manage memory, and route campus/handbook/syllabus queries to specialist agents."
    ),
    instruction=(
        prompt.STUDENT_DESK_PROMPT
    ),
    output_key="student_response",
    tools=[
        AgentTool(agent=campus_agent),
        AgentTool(agent=handbook_agent),
        AgentTool(agent=syllabus_agent),
        *ADK_TOOLS
    ],
)

# Export the agent instance
root_agent = student_desk
