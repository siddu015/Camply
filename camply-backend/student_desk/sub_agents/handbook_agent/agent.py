"""Handbook Agent: Query processed handbook data and assist with academic policies."""

from google.adk.agents import LlmAgent
from . import prompt
from .tools import (
    get_user_handbook_context,
    query_handbook_section,
    search_all_handbook_data,
    get_handbook_overview
)

MODEL = "gemini-2.0-flash"

handbook_agent = LlmAgent(
    name="handbook_agent",
    model=MODEL,
    description=(
        "Academic Handbook Assistant that helps students find information from their "
        "uploaded and processed academic handbooks. Queries structured data from database "
        "to answer questions about examination rules, attendance policies, course details, "
        "fee structures, and other academic policies specific to the student's college."
    ),
    instruction=prompt.HANDBOOK_AGENT_PROMPT,
    output_key="handbook_response",
    tools=[
        get_user_handbook_context,
        query_handbook_section,
        search_all_handbook_data,
        get_handbook_overview
    ],
    disallow_transfer_to_parent=False,
    disallow_transfer_to_peers=False
)

root_agent = handbook_agent 