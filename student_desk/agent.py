""" Student Desk agent that manages all student-related functionalities. Acts as the central coordinator for the student dashboard."""

from google.adk.agents import LlmAgent
from google.adk.tools.agent_tool import AgentTool

from . import prompt
from .sub_agents.semester.agent import semester_agent
from .sub_agents.course.agent import course_agent

MODEL = "gemini-2.5-flash-preview-05-20"

student_desk = LlmAgent(
    name="student_desk",
    model=MODEL,
    description=(
        "A comprehensive student desk assistant that helps manage "
        "academic information, including semester details, course information, "
        "and academic planning. Acts as the central coordinator for "
        "all student-related queries and tasks."
    ),
    instruction=prompt.STUDENT_DESK_PROMPT,
    output_key="student_response",
    tools=[
        AgentTool(agent=semester_agent),
        AgentTool(agent=course_agent),
    ],
)

root_agent = student_desk
