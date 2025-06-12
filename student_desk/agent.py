""" Student Desk agent that manages all student-related functionalities. Acts as the central coordinator for the student dashboard."""

from google.adk.agents import LlmAgent
from google.adk.tools.agent_tool import AgentTool

from . import prompt
from .sub_agents.semester.agent import semester_agent
from .sub_agents.course.agent import course_agent
from .sub_agents.campus_agent.agent import campus_agent

MODEL = "gemini-2.5-flash-preview-05-20"

student_desk = LlmAgent(
    name="student_desk",
    model=MODEL,
    description=(
        "A comprehensive student desk assistant that provides immediate information about: "
        "1. Your university/campus (facilities, achievements, placements, etc.) "
        "2. Your academic progress (semester details, scores) "
        "3. Your course details (syllabi, materials) "
        "\nPRIORITY: For ANY university/campus related query, provide immediate campus information."
    ),
    instruction=(
        prompt.STUDENT_DESK_PROMPT +
        "\n\nCRITICAL INSTRUCTION: Your initial greeting MUST be:"
        "\n'Hello! I'm your Student Desk Assistant. I can provide comprehensive information about:"
        "\n• Your university and campus (facilities, achievements, placements)"
        "\n• Your academic progress (semester details, scores)"
        "\n• Your course details (syllabi, materials)"
        "\nHow can I help you today?'"
    ),
    output_key="student_response",
    tools=[
        # List campus agent first to give it precedence
        AgentTool(agent=campus_agent),
        AgentTool(agent=semester_agent),
        AgentTool(agent=course_agent),
    ],
)

# Export the agent instance
root_agent = student_desk
