""" Student Desk agent that manages all student-related functionalities. Acts as the central coordinator for the student dashboard."""

from google.adk.agents import LlmAgent
from google.adk.tools.agent_tool import AgentTool

from . import prompt
from .sub_agents.campus_agent.agent import campus_agent

MODEL = "gemini-2.5-flash-preview-05-20"

student_desk = LlmAgent(
    name="student_desk",
    model=MODEL,
    description=(
        "A comprehensive student desk assistant that provides immediate information about: "
        "1. Your university/campus (facilities, achievements, placements, etc.) "
        "\nPRIORITY: For ANY university/campus related query, provide immediate campus information."
        "\nNote: Course and semester information will be added in future updates."
    ),
    instruction=(
        prompt.STUDENT_DESK_PROMPT +
        "\n\nCRITICAL INSTRUCTION: Your initial greeting MUST be:"
        "\n'Hello! I'm your Student Desk Assistant. I can provide comprehensive information about:"
        "\n• Your university and campus (facilities, achievements, placements)"
        "\nNote: Course and semester information will be added in future updates."
        "\nHow can I help you today?'"
    ),
    output_key="student_response",
    tools=[
        # Campus agent is the primary tool for now
        AgentTool(agent=campus_agent),
    ],
)

# Export the agent instance
root_agent = student_desk
