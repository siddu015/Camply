"""Handbook Agent: Simplified agent for PDF collection verification testing."""

from google.adk.agents import LlmAgent
from . import prompt
from .tools import (
    verify_pdf_collection,
    get_handbook_status,
    update_handbook_status
)

MODEL = "gemini-2.0-flash"

handbook_agent = LlmAgent(
    name="handbook_agent",
    model=MODEL,
    description=(
        "Simplified Handbook PDF Collection Verification Agent for testing file upload and storage accessibility. "
        "Verifies that uploaded PDFs can be accessed from storage and provides basic file information. "
        "Focused on testing the upload pipeline before adding content processing capabilities."
    ),
    instruction=prompt.HANDBOOK_AGENT_INSTRUCTION,
    output_key="handbook_response",
    tools=[
        verify_pdf_collection,
        get_handbook_status,
        update_handbook_status
    ],
    disallow_transfer_to_parent=False,
    disallow_transfer_to_peers=False
)

root_agent = handbook_agent 