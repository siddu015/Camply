""" Student Desk agent that manages all student-related functionalities. Acts as a personal academic assistant for individual students."""

from google.adk.agents import LlmAgent
from google.adk.tools.agent_tool import AgentTool
from .sub_agents.campus_agent.agent import root_agent as campus_agent
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
        "4. Personalized recommendations based on student profile "
        "5. Memory management for context persistence across conversations "
        "\nUses ADK tools to fetch user data, manage memory, and route campus queries to specialist agents."
    ),
    instruction=(
        prompt.STUDENT_DESK_PROMPT
    ),
    output_key="student_response",
    tools=[
        # Campus agent for college-specific information
        AgentTool(agent=campus_agent),
        # ADK tools for user context and memory management
        *ADK_TOOLS
    ],
)

# Export the agent instance
root_agent = student_desk
