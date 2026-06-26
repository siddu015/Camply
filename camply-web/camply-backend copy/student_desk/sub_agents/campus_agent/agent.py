"""Campus Agent: Consolidated campus intelligence system with 2 comprehensive tools."""

from google.adk.agents import LlmAgent
from . import prompt
from .tools import (
    get_user_college_context,
    fetch_campus_content_by_user_id,
    analyze_prompt_based_intelligence,  
    search_campus_intelligence,
)

MODEL = "gemini-2.0-flash"

campus_agent = LlmAgent(
    name="campus_agent",
    model=MODEL,
    description=(
        "Consolidated Campus Intelligence System with streamlined architecture. "
        "Handles both predefined frontend prompts (news, placements, achievements, stats, events, tours) "
        "and custom user queries through web search capabilities. Uses 2 comprehensive tools: "
        "1) Prompt-based intelligence for structured campus insights "
        "2) Web search intelligence for real-time information gathering. "
        "Maintains proper user context management following database schema: user_id -> college_id. "
        "Optimized for both CamplyBot chat queries and frontend button interactions."
    ),
    instruction=prompt.SYSTEM_PROMPT,
    output_key="campus_response",
    tools=[
        get_user_college_context,
        fetch_campus_content_by_user_id,
        
        analyze_prompt_based_intelligence,
        search_campus_intelligence,
    ],
)

root_agent = campus_agent 