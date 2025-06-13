"""Campus Agent: Provides comprehensive information about the university campus."""

import os
import json
from google.adk.agents import LlmAgent
from . import prompt

MODEL = "gemini-2.5-flash-preview-05-20"

def load_campus_data():
    """Load campus data from JSON file."""
    data_file = os.path.join(os.path.dirname(__file__), "data/college.json")
    try:
        with open(data_file, 'r') as f:
            campus_data = json.load(f)
            # Format data for better readability in the prompt
            return "\n\nCAMPUS DATA:\n" + json.dumps(campus_data, indent=2)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading campus data: {e}")
        return "\nError: Campus data is not available."

# Create and configure the campus agent
campus_agent = LlmAgent(
    model=MODEL,
    name="campus_agent",
    description="Provides comprehensive information about REVA University including overview, academics, placements, facilities, and more.",
    instruction=prompt.SYSTEM_PROMPT + load_campus_data(),
    output_key="campus_response",
)

# Export the agent instance
root_agent = campus_agent 