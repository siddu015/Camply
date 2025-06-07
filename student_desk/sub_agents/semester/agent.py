"""Semester Agent: Manages and provides access to semester-related information."""

import os
import json
from google.adk.agents import Agent
from . import prompt

MODEL = "gemini-2.5-flash-preview-05-20"

def load_semester_data():
    """Load semester data from JSON file."""
    data_file = os.path.join(os.path.dirname(__file__), "semester_data.json")
    try:
        with open(data_file, 'r') as f:
            semester_data = json.load(f)
            # Add the data to the instruction for context
            return f"\nCurrent Semester Data:\n{json.dumps(semester_data, indent=2)}"
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading semester data: {e}")
        return "\nError: Semester data is not available."

# Create and configure the semester agent
semester_agent = Agent(
    model=MODEL,
    name="semester_agent",
    description="Manages and provides access to semester information including subjects, timetable, and scores.",
    instruction=prompt.SEMESTER_AGENT_PROMPT + load_semester_data(),
    output_key="semester_response",
)

# Export the agent instance
root_agent = semester_agent