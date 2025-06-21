"""Course agent for educational content generation and learning assistance."""

from google.adk.agents import LlmAgent
from .tools import (
    get_user_course_context,
    generate_educational_content,
    search_educational_resources,
    get_course_information
)
from . import prompt

MODEL = "gemini-2.0-flash"

course_agent = LlmAgent(
    name="course_agent",
    model=MODEL,
    description=(
        "Specialized educational content generator and learning assistant. "
        "Provides personalized learning experiences for course topics with: "
        "1. Comprehensive topic explanations with examples and practice materials "
        "2. Customizable learning preferences (brief/detailed, examples, practice questions, etc.) "
        "3. Real-world applications and practical use cases "
        "4. Progressive learning paths and prerequisite guidance "
        "5. Web-sourced educational resources and current information "
        "6. Course-specific context integration with syllabus data "
        "Uses web search for current information and adapts content based on user learning preferences."
    ),
    instruction=prompt.COURSE_AGENT_PROMPT,
    output_key="educational_content_response",
    tools=[
        get_user_course_context,
        search_educational_resources,
        generate_educational_content,
        get_course_information,
    ],
) 