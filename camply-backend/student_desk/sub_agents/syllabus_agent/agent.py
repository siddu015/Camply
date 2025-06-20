"""Syllabus agent that processes and analyzes course syllabus documents."""

from google.adk.agents import LlmAgent
from .tools import parse_syllabus_processing_request, process_syllabus_upload, fetch_syllabus_content
from . import prompt

MODEL = "gemini-2.0-flash"

syllabus_agent = LlmAgent(
    name="syllabus_agent",
    model=MODEL,
    description=(
        "A specialized agent for processing course syllabus documents. "
        "Handles PDF extraction, content analysis, and structured data creation. "
        "Capabilities include: "
        "1. Fetching syllabus PDFs from storage "
        "2. Extracting text content from PDF documents "
        "3. Parsing and structuring syllabus content into units and topics "
        "4. Creating JSON representations of course content "
        "5. Updating database with processed syllabus data "
        "6. Answering questions about syllabus content and course structure"
    ),
    instruction=prompt.SYLLABUS_AGENT_PROMPT,
    output_key="syllabus_response",
    tools=[
        parse_syllabus_processing_request,
        process_syllabus_upload,
        fetch_syllabus_content,
    ],
) 