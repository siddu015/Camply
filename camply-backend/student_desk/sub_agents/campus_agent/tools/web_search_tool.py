import os
import sys
from datetime import datetime
from typing import Optional, Dict, Any
from google.adk.tools import FunctionTool

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))))

from shared import UserDataService

@FunctionTool
async def search_campus_intelligence(query: str, search_type: str = "general", *, tool_context) -> Dict[str, Any]:
    try:
        session_state = getattr(tool_context, 'state', None)
        if not session_state:
            return {
                "success": False,
                "error": "session_unavailable",
                "message": "Session state not available in tool context"
            }
        
        user_id = session_state.get('user_id') if hasattr(session_state, 'get') else getattr(session_state, 'user_id', None)
        
        if not user_id:
            return {
                "success": False,
                "error": "missing_user_id",
                "message": "User ID not found in session state"
            }
        
        user_context = await UserDataService.get_user_context(user_id)
        
        if not user_context:
            return {
                "success": False,
                "error": "user_context_failed",
                "message": "Could not retrieve user context for campus search"
            }
        
        college_name = user_context.get('college', {}).get('name')
        college_id = user_context.get('academic_details', {}).get('college_id')
        
        if not college_name or not college_id:
            return {
                "success": False,
                "error": "missing_college_info", 
                "message": "College information not found in user profile"
            }
        
        campus_content = await UserDataService.get_campus_ai_content(college_id)
        
        query_analysis = analyze_query_intent(query)
        relevant_content = find_relevant_database_content(campus_content, query_analysis) if campus_content else None
        
        formatted_response = generate_intelligent_response(
            query, query_analysis, college_name, relevant_content, user_context
        )
        
        response_data = {
            "analysis_profile": {
                "college_name": college_name,
                "college_id": college_id,
                "query": query,
                "query_intent": query_analysis,
                "analysis_timestamp": datetime.now().isoformat(),
                "user_context": {
                    "department": user_context.get('academic_details', {}).get("department_name"),
                    "branch": user_context.get('academic_details', {}).get("branch_name"),
                    "current_year": user_context.get("current_year")
                }
            },
            "content_sources": {
                "database_content_available": bool(relevant_content),
                "content_types_found": list(relevant_content.keys()) if relevant_content else [],
                "last_updated": campus_content.get('updated_at') if campus_content else None
            },
            "formatted_response": formatted_response,
            "metadata": {
                "search_type": search_type,
                "personalized": bool(user_context.get('academic_details', {}).get("branch_name")),
                "timestamp": datetime.now().isoformat(),
                "response_quality": "high" if relevant_content else "guidance"
            }
        }
        
        return {
            "success": True,
            "college_name": college_name,
            "query": query,
            "data": response_data
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": "campus_search_failed",
            "message": f"Campus intelligence search failed: {str(e)}",
            "data": {
                "query": query,
                "fallback_message": "Please visit the college's official website for current information"
            }
        }

def analyze_query_intent(query: str) -> Dict[str, Any]:    
    query_lower = query.lower()
    
    intent_keywords = {
        "placements": ["placement", "job", "salary", "company", "recruit", "career", "package", "hiring"],
        "facilities": ["facility", "infrastructure", "lab", "library", "hostel", "campus", "building", "equipment"],
        "academics": ["course", "curriculum", "department", "faculty", "program", "degree", "admission"],
        "news": ["news", "update", "announcement", "latest", "recent", "event", "happening"],
        "achievements": ["achievement", "award", "recognition", "ranking", "accreditation", "excellence"],
        "statistics": ["stats", "number", "enrollment", "student", "data", "information", "demographics"]
    }
    
    detected_intents = []
    confidence_scores = {}
    
    for intent, keywords in intent_keywords.items():
        matches = sum(1 for keyword in keywords if keyword in query_lower)
        if matches > 0:
            detected_intents.append(intent)
            confidence_scores[intent] = matches / len(keywords)
    
    primary_intent = max(confidence_scores.keys(), key=confidence_scores.get) if confidence_scores else "general"
    
    return {
        "primary_intent": primary_intent,
        "detected_intents": detected_intents,
        "confidence_scores": confidence_scores,
        "query_type": "specific" if detected_intents else "general"
    }

def find_relevant_database_content(campus_content: Optional[Dict], query_analysis: Dict) -> Optional[Dict]:
    if not campus_content:
        return None
    
    primary_intent = query_analysis.get("primary_intent", "general")
    
    content_mapping = {
        "placements": ["placements_content"],
        "facilities": ["facilities_content"],
        "academics": ["departments_content", "admissions_content"],
        "news": ["college_overview_content"],
        "achievements": ["college_overview_content"],
        "statistics": ["college_overview_content"],
        "general": ["college_overview_content", "facilities_content", "placements_content"]
    }
    
    relevant_content = {}
    content_types = content_mapping.get(primary_intent, ["college_overview_content"])
    
    for content_type in content_types:
        if content_type in campus_content and campus_content[content_type]:
            relevant_content[content_type] = campus_content[content_type]
    
    return relevant_content if relevant_content else None

def generate_intelligent_response(query: str, query_analysis: Dict, college_name: str, relevant_content: Optional[Dict], user_context: Dict) -> str:
    department = user_context.get("department_name", "")
    branch = user_context.get("branch_name", "")
    primary_intent = query_analysis.get("primary_intent", "general")
    
    response = f"# {college_name} - {query.title()}\n\n"
    
    if relevant_content:
        response += "## Available Information\n\n"
        
        for content_type, content_data in relevant_content.items():
            section_title = content_type.replace('_content', '').replace('_', ' ').title()
            
            if isinstance(content_data, dict):
                formatted_content = format_dict_to_text(content_data)
            else:
                formatted_content = str(content_data)
            
            if formatted_content.strip():
                response += f"### {section_title}\n\n{formatted_content}\n\n"
    
    if department and branch:
        response += f"## Personalized for {department} - {branch}\n\n"
        
        if primary_intent == "placements":
            response += f"As a {branch} student, focus on:\n"
            response += f"• Companies specifically recruiting from {department}\n"
            response += f"• Technical skills relevant to {branch}\n"
            response += f"• Industry connections in your field\n"
            response += f"• Alumni working in {branch} roles\n\n"
        
        elif primary_intent == "facilities":
            response += f"Key facilities for {department} students:\n"
            response += f"• {department} specialized laboratories\n"
            response += f"• Technical equipment for {branch}\n"
            response += f"• Research facilities in your domain\n"
            response += f"• Project development spaces\n\n"
        
        elif primary_intent == "academics":
            response += f"Academic opportunities in {department}:\n"
            response += f"• {branch} curriculum details\n"
            response += f"• Faculty expertise in your field\n"
            response += f"• Research projects and collaborations\n"
            response += f"• Industry-aligned skill development\n\n"
    
    response += "## Next Steps & Recommendations\n\n"
    
    guidance_map = {
        "placements": [
            f"Contact the {college_name} placement cell for detailed statistics",
            "Connect with alumni from your department for insights",
            "Attend career guidance sessions and placement preparation workshops",
            "Build technical skills aligned with industry requirements"
        ],
        "facilities": [
            "Schedule a campus tour to explore facilities firsthand",
            f"Visit {department} laboratory facilities during working hours",
            "Contact facility managers for equipment usage guidelines",
            "Explore research collaboration opportunities"
        ],
        "academics": [
            f"Meet with {department} academic advisors for curriculum details",
            "Attend department orientation and information sessions",
            "Connect with faculty members in your area of interest",
            "Explore research opportunities and project collaborations"
        ],
        "news": [
            f"Check {college_name}'s official website regularly for updates",
            "Follow official social media channels for announcements",
            "Subscribe to college newsletters and notifications",
            "Join student groups for peer-to-peer information sharing"
        ]
    }
    
    guidance = guidance_map.get(primary_intent, [
        f"Visit {college_name}'s official website for comprehensive information",
        "Contact the administration office for specific inquiries",
        "Connect with student services for academic support",
        "Explore official communication channels for updates"
    ])
    
    for item in guidance:
        response += f"• {item}\n"
    
    response += f"\n## Contact Information\n\n"
    response += f"For specific inquiries about {college_name}:\n"
    response += f"• **Administration Office**: Contact main office for general information\n"
    response += f"• **Student Services**: Academic and campus life support\n"
    
    if department:
        response += f"• **{department} Department**: Subject-specific queries\n"
    
    response += f"• **Official Website**: Most current information and announcements\n"
    
    if not relevant_content:
        response += f"\n---\n*This response provides general guidance. For the most current and specific information about {college_name}, please refer to official sources.*"
    
    return response

def format_dict_to_text(data: Dict) -> str:                  
    if not isinstance(data, dict):
        return str(data)
    
    formatted_parts = []
    
    for key, value in data.items():
        if key in ['created_at', 'updated_at', 'id', 'college_id']:
            continue
        
        clean_key = key.replace('_', ' ').title()
        
        if isinstance(value, list):
            if value:
                list_items = '\n'.join([f"  • {item}" for item in value])
                formatted_parts.append(f"**{clean_key}:**\n{list_items}")
        elif isinstance(value, dict):
            nested_items = '\n'.join([f"  • **{k.replace('_', ' ').title()}:** {v}" for k, v in value.items()])
            formatted_parts.append(f"**{clean_key}:**\n{nested_items}")
        else:
            formatted_parts.append(f"**{clean_key}:** {value}")
    
    return '\n\n'.join(formatted_parts) if formatted_parts else "Content available - contact administration for details." 