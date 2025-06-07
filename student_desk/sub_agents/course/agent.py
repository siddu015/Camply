"""Course Agent: Manages and provides access to course-related information."""

import os
import json
from google.adk.agents import Agent
from . import prompt

MODEL = "gemini-2.5-flash-preview-05-20"

def load_course_data():
    """Load all course syllabi from the syllabi directory."""
    syllabi_dir = os.path.join(os.path.dirname(__file__), "syllabi")
    course_data = {}
    
    try:
        for filename in os.listdir(syllabi_dir):
            if filename.endswith('.json'):
                file_path = os.path.join(syllabi_dir, filename)
                with open(file_path, 'r') as f:
                    course_data[filename[:-5]] = json.load(f)
        return f"\nAvailable Course Data:\n{json.dumps(course_data, indent=2)}"
    except Exception as e:
        print(f"Error loading course data: {e}")
        return "\nError: Course data is not available."

# Create and configure the course agent
course_agent = Agent(
    model=MODEL,
    name="course_agent",
    description="Manages and provides access to course information including syllabi, units, and evaluation patterns.",
    instruction=prompt.COURSE_AGENT_PROMPT + load_course_data(),
    output_key="course_response",
)

# Export the agent instance
root_agent = course_agent 