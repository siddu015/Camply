""" Student Desk agent that manages all student-related functionalities. Acts as a personal academic assistant for individual students."""

from google.adk.agents import LlmAgent

from . import prompt

MODEL = "gemini-2.5-flash-preview-05-20"

student_desk = LlmAgent(
    name="student_desk",
    model=MODEL,
    description=(
        "A personal student desk assistant that provides immediate, personalized information about: "
        "1. Your academic details (department, branch, roll number, timeline) "
        "2. Your college and university information "
        "3. Academic guidance and planning advice "
        "4. Personal academic progress tracking "
        "\nNote: Semester-specific course information will be added in future updates."
    ),
    instruction=(
        prompt.STUDENT_DESK_PROMPT
    ),
    output_key="student_response",
    tools=[
        # No sub-agents for now - focused on user information only
    ],
)

# Export the agent instance
root_agent = student_desk
