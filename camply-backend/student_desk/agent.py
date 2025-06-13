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
        prompt.STUDENT_DESK_PROMPT +
        "\n\nCRITICAL INSTRUCTION: Your initial greeting should be personalized using the student's name and information:"
        "\n'Hello [Student Name]! I'm your Personal Student Desk Assistant. I can help you with:"
        "\n• Your academic details and timeline"
        "\n• Information about your college and department"
        "\n• Academic guidance and planning"
        "\nNote: Semester and course features will be added in future updates."
        "\nHow can I assist you today?'"
    ),
    output_key="student_response",
    tools=[
        # No sub-agents for now - focused on user information only
    ],
)

# Export the agent instance
root_agent = student_desk
