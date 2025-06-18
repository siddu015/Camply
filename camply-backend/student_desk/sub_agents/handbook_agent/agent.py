"""Handbook Agent: PDF collection verification and processing agent."""

from google.adk.agents import LlmAgent
from . import prompt
from .tools import (
    get_user_handbook_context,
    verify_pdf_collection,
    get_handbook_status,
    update_handbook_status
)

MODEL = "gemini-2.0-flash"

handbook_agent = LlmAgent(
    name="handbook_agent",
    model=MODEL,
    description=(
        "Academic Handbook PDF Processing Agent that verifies upload accessibility, "
        "processes handbook content, and manages handbook-related queries using proper "
        "user context from the root agent system."
    ),
    instruction=prompt.HANDBOOK_AGENT_INSTRUCTION,
    output_key="handbook_response",
    tools=[
        get_user_handbook_context,
        verify_pdf_collection,
        get_handbook_status,
        update_handbook_status
    ],
    disallow_transfer_to_parent=False,
    disallow_transfer_to_peers=False
)

root_agent = handbook_agent 