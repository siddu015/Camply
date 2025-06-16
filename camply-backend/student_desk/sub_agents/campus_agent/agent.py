"""Campus Agent: Provides comprehensive information about the university campus with advanced real-time capabilities."""

from google.adk.agents import LlmAgent
from . import prompt
from .tools import (
    # Enhanced ADK-based tools
    fetch_campus_content_by_user_id,
    analyze_comprehensive_campus_intelligence,
    
    # Enhanced specialized tools  
    fetch_comprehensive_campus_news,
    analyze_placement_intelligence,
    generate_campus_facilities_report,
    
    # Original tools
    web_scrape_college_news,
    fetch_campus_content_by_id_tool  # Legacy support
)

MODEL = "gemini-2.0-flash"

campus_agent = LlmAgent(
    name="campus_agent",
    model=MODEL,
    description=(
        "Advanced Campus Intelligence System providing comprehensive, real-time information about colleges and universities. "
        "Specializes in: professional campus analysis, dynamic content aggregation, placement intelligence, "
        "facility assessments, news and achievements monitoring, statistical analysis, and event tracking. "
        "Uses state-of-the-art ADK tools with enhanced web scraping, structured data processing, and professional formatting. "
        "Delivers executive-level campus intelligence reports with actionable insights and comprehensive analysis."
    ),
    instruction=prompt.SYSTEM_PROMPT,
    output_key="campus_response",
    tools=[
        # Enhanced comprehensive tools first
        fetch_campus_content_by_user_id,
        analyze_comprehensive_campus_intelligence,
        
        # Enhanced specialized tools for deep analysis
        fetch_comprehensive_campus_news,
        analyze_placement_intelligence, 
        generate_campus_facilities_report,
        
        # Original tools for compatibility
        web_scrape_college_news,
        
        # Legacy support
        fetch_campus_content_by_id_tool
    ],
)

# Export the agent instance
root_agent = campus_agent 