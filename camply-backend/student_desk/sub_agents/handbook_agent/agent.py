from google.adk.agents import LlmAgent
from .tools import process_handbook_pdf, query_handbook_data, get_handbook_status
from .prompt import HANDBOOK_AGENT_INSTRUCTION

handbook_agent = LlmAgent(
    name="handbook_agent",
    description="Processes and answers questions about academic handbooks",
    instruction=HANDBOOK_AGENT_INSTRUCTION,
    tools=[
        process_handbook_pdf,
        query_handbook_data,
        get_handbook_status,
    ],
    model="gemini-2.0-flash",
    disallow_transfer_to_parent=False,
    disallow_transfer_to_peers=False
) 