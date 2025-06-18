import os
import sys
from datetime import datetime
from typing import Optional, Dict, Any
from google.adk.tools import FunctionTool

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))))

from student_desk.tools.user_context_tool import get_user_context as root_get_user_context
from shared import UserDataService

CONTENT_TYPE_MAPPING = {
    "campus-news": "college_overview_content",
    "placements": "placements_content",
    "achievements": "college_overview_content",
    "campus-stats": "college_overview_content",
    "events": "college_overview_content",
    "tour": "facilities_content",
    "facilities": "facilities_content",
    "departments": "departments_content",
    "admissions": "admissions_content"
}

@FunctionTool
async def analyze_prompt_based_intelligence(prompt_id: str, user_id: str = "", custom_prompt: str = "", *, tool_context) -> Dict[str, Any]:
    """
    Analyze campus intelligence using predefined prompts with data from campus_ai_content table.
    Uses cached content when available, provides guidance when no data exists.
    
    Args:
        prompt_id: ID of predefined prompt (campus-news, placements, etc.) or "custom"
        user_id: User ID to get college context
        custom_prompt: Custom prompt text when prompt_id is "custom"
        
    Returns:
        Comprehensive structured intelligence report from database or helpful guidance
    """
    try:
        session_user_id = getattr(tool_context, 'user_id', None)
        effective_user_id = user_id or session_user_id
        
        if not effective_user_id:
            return {
                "success": False,
                "error": "missing_user_id",
                "message": "User ID is required for campus intelligence analysis"
            }
        
        user_context_result = await root_get_user_context(tool_context=tool_context)
        
        if not user_context_result.get("success"):
            return {
                "success": False,
                "error": user_context_result.get("error", "Failed to get user context"),
                "message": "Could not retrieve user context for prompt analysis"
            }
        
        college_name = user_context_result.get("college_name")
        college_id = user_context_result.get("college_id")
        
        if not college_name or not college_id:
            return {
                "success": False,
                "error": "missing_college_info",
                "message": "College information not found in user profile"
            }
        
        campus_content = await UserDataService.get_campus_ai_content(college_id)
        
        content_type = CONTENT_TYPE_MAPPING.get(prompt_id, "college_overview_content")
        cached_content = None
        
        if campus_content and content_type in campus_content:
            cached_content = campus_content[content_type]
        
        if prompt_id == "custom" and custom_prompt:
            analysis_result = await analyze_custom_prompt(
                custom_prompt, college_name, user_context_result, cached_content
            )
        elif prompt_id in CONTENT_TYPE_MAPPING:
            analysis_result = await analyze_predefined_prompt(
                prompt_id, college_name, user_context_result, cached_content
            )
        else:
            return {
                "success": False,
                "error": "invalid_prompt_id",
                "message": f"Unknown prompt ID: {prompt_id}",
                "available_prompts": list(CONTENT_TYPE_MAPPING.keys())
            }
        
        return {
            "success": True,
            "college_name": college_name,
            "college_id": college_id,
            "prompt_id": prompt_id,
            "data": analysis_result,
            "data_source": "database" if cached_content else "guidance",
            "metadata": {
                "analysis_timestamp": datetime.now().isoformat(),
                "user_personalized": bool(user_context_result.get("branch_name")),
                "analysis_type": "prompt_based_intelligence",
                "cache_hit": bool(cached_content),
                "last_updated": campus_content.get('updated_at') if campus_content else None
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": "prompt_analysis_failed",
            "message": f"Prompt-based campus intelligence analysis failed: {str(e)}",
            "data": {
                "prompt_id": prompt_id,
                "fallback_message": "Please try again or use web search for current information"
            }
        }

async def analyze_predefined_prompt(prompt_id: str, college_name: str, user_context: Dict[str, Any], cached_content: Optional[Dict] = None) -> Dict[str, Any]:
    """Analyze predefined campus prompt using cached content or generating structured response."""
    
    department = user_context.get("department_name", "")
    branch = user_context.get("branch_name", "")
    current_year = user_context.get("current_year", "")
    
    if cached_content:
        return {
            "title": get_prompt_title(prompt_id),
            "content": format_cached_content_for_prompt(cached_content, prompt_id, college_name, department, branch),
            "sections": extract_sections_from_content(cached_content, prompt_id),
            "source": "database",
            "personalized_context": {
                "department": department,
                "branch": branch,
                "current_year": current_year
            }
        }

    return generate_prompt_guidance(prompt_id, college_name, department, branch, current_year)

async def analyze_custom_prompt(custom_prompt: str, college_name: str, user_context: Dict[str, Any], cached_content: Optional[Dict] = None) -> Dict[str, Any]:
    """Analyze custom user prompt using available cached content as context."""
    
    department = user_context.get("department_name", "")
    branch = user_context.get("branch_name", "")
    
    relevant_content = find_relevant_cached_content(custom_prompt, cached_content) if cached_content else None
    
    return {
        "title": "Custom Campus Inquiry",
        "content": generate_custom_response(custom_prompt, college_name, department, branch, relevant_content),
        "source": "database" if relevant_content else "guidance",
        "query": custom_prompt,
        "personalized_context": {
            "department": department,
            "branch": branch
        }
    }

def get_prompt_title(prompt_id: str) -> str:
    """Get user-friendly title for prompt ID."""
    titles = {
        "campus-news": "Campus News & Updates",
        "placements": "Placement Analytics", 
        "achievements": "Recent Achievements",
        "campus-stats": "Campus Statistics",
        "events": "Campus Events & Fests",
        "tour": "Virtual Campus Tour",
        "facilities": "Campus Facilities",
        "departments": "Academic Departments",
        "admissions": "Admissions Information"
    }
    return titles.get(prompt_id, "Campus Information")

def format_cached_content_for_prompt(cached_content: Dict, prompt_id: str, college_name: str, department: str, branch: str) -> str:
    """Format cached content for specific prompt type with personalization."""
    
    if not cached_content:
        return f"No specific information available for {college_name} at this time."
    
    content_text = ""
    if isinstance(cached_content, dict):
        if 'content' in cached_content:
            content_text = str(cached_content['content'])
        elif 'data' in cached_content:
            content_text = str(cached_content['data'])
        else:
            content_text = format_dict_content(cached_content)
    else:
        content_text = str(cached_content)
    
    personalization = ""
    if department and branch:
        if prompt_id == "placements":
            personalization = f"\n\n**Specific to {department} - {branch}:**\nAs a {branch} student, you should focus on the placement opportunities and companies that specifically recruit from your department."
        elif prompt_id == "facilities":
            personalization = f"\n\n**Relevant to {department}:**\nPay special attention to laboratory facilities and equipment specific to {department}."
        elif prompt_id == "events":
            personalization = f"\n\n**For {department} Students:**\nLook out for technical events, symposiums, and competitions related to {branch}."
    
    return f"# {get_prompt_title(prompt_id)} - {college_name}\n\n{content_text}{personalization}"

def format_dict_content(content_dict: Dict) -> str:
    """Format dictionary content into readable text."""
    formatted_parts = []
    
    for key, value in content_dict.items():
        if key in ['created_at', 'updated_at', 'id', 'college_id']:
            continue
            
        section_title = key.replace('_', ' ').title()
        
        if isinstance(value, (dict, list)):
            if isinstance(value, list) and value:
                formatted_value = '\n'.join([f"• {item}" for item in value])
            elif isinstance(value, dict):
                formatted_value = '\n'.join([f"**{k.replace('_', ' ').title()}:** {v}" for k, v in value.items()])
            else:
                formatted_value = str(value)
        else:
            formatted_value = str(value)
        
        if formatted_value.strip():
            formatted_parts.append(f"## {section_title}\n\n{formatted_value}")
    
    return '\n\n'.join(formatted_parts) if formatted_parts else "Content available - please contact administration for details."

def extract_sections_from_content(cached_content: Dict, prompt_id: str) -> list:
    """Extract key sections from cached content."""
    if not cached_content or not isinstance(cached_content, dict):
        return []
    
    sections = []
    for key in cached_content.keys():
        if key not in ['created_at', 'updated_at', 'id', 'college_id']:
            sections.append(key.replace('_', ' ').title())
    
    return sections

def find_relevant_cached_content(custom_prompt: str, cached_content: Dict) -> Optional[str]:
    """Find relevant cached content based on custom prompt keywords."""
    if not cached_content or not isinstance(cached_content, dict):
        return None
    
    prompt_lower = custom_prompt.lower()
    
    keyword_mapping = {
        'placement': ['placements_content', 'placement'],
        'facility': ['facilities_content', 'facility', 'infrastructure'],
        'department': ['departments_content', 'academic'],
        'admission': ['admissions_content', 'admission'],
        'overview': ['college_overview_content', 'general']
    }
    
    for keyword, content_keys in keyword_mapping.items():
        if keyword in prompt_lower:
            for content_key in content_keys:
                if content_key in cached_content and cached_content[content_key]:
                    return str(cached_content[content_key])
    
    if 'college_overview_content' in cached_content:
        return str(cached_content['college_overview_content'])
    
    return None

def generate_custom_response(custom_prompt: str, college_name: str, department: str, branch: str, relevant_content: Optional[str] = None) -> str:
    """Generate response for custom prompt using available content."""
    
    if relevant_content:
        return f"Based on available information about {college_name}:\n\n{relevant_content}\n\n**Query Context:** {custom_prompt}\n\n**Personalized for:** {department} - {branch}" if department and branch else f"Based on available information about {college_name}:\n\n{relevant_content}"
    
    return f"""I understand you're asking about: "{custom_prompt}"

For {college_name}, I recommend:

1. **Contact the Administration**: Reach out to the college administration office for specific details
2. **Visit the Official Website**: Check {college_name}'s official website for the most current information  
3. **Student Services**: Contact student services for academic or campus-related queries
4. **Department Office**: For department-specific questions, contact the {department} department directly

Would you like me to search the web for current information about this topic?"""

def generate_prompt_guidance(prompt_id: str, college_name: str, department: str, branch: str, current_year: str) -> Dict[str, Any]:
    """Generate helpful guidance when no cached content is available."""
    
    guidance_map = {
        "campus-news": f"""For the latest campus news and updates about {college_name}, I recommend:

• **Official Website**: Check {college_name}'s official website news section
• **Student Portal**: Access your student portal for announcements  
• **Department Notices**: Visit the {department} department notice board
• **Social Media**: Follow {college_name}'s official social media accounts
• **Student Council**: Contact student representatives for campus updates

**What to look for:**
- Academic calendar updates
- Examination schedules  
- Cultural and technical events
- Placement drives and company visits
- Infrastructure developments
- Faculty announcements

*Would you like me to search the web for current news about {college_name}?*""",

        "placements": f"""For comprehensive placement information at {college_name} for {department} - {branch}:

• **Placement Cell**: Contact the college placement office directly
• **Department Placement Coordinator**: Speak with {department} placement coordinator  
• **Alumni Network**: Connect with {branch} alumni for insights
• **Career Services**: Utilize college career guidance services
• **Company Visits**: Attend placement drives and career fairs

**Key Information to Gather:**
- Department-wise placement statistics
- Average and highest package details
- Top recruiting companies for {branch}
- Skill development programs available
- Internship opportunities
- Industry partnerships

*I can search for current placement trends for {branch} students if you'd like.*""",

        "facilities": f"""For detailed facilities information at {college_name}:

• **Campus Tour**: Schedule a guided campus tour
• **Department Labs**: Visit {department} laboratory facilities
• **Student Services**: Inquire about recreational facilities
• **Library Services**: Explore library resources and timings
• **Hostel Office**: Get accommodation facility details

**Facilities to Explore:**
- Academic buildings and classrooms
- {department} specialized laboratories  
- Library and study spaces
- Sports and recreation facilities
- Hostel accommodation
- Medical and wellness facilities

*Shall I search for detailed facility information about {college_name}?*"""
    }
    
    content = guidance_map.get(prompt_id, f"For information about {college_name}, please contact the college administration or visit the official website.\n\n*Would you like me to search the web for current information about this topic?*")
    
    return {
        "title": get_prompt_title(prompt_id),
        "content": content,
        "source": "guidance",
        "actionable": True,
        "web_search_suggested": True,
        "personalized_context": {
            "department": department,
            "branch": branch,
            "current_year": current_year
        }
    } 