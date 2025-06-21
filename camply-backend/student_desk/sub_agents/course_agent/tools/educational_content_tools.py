"""Educational Content Tools - Learning assistance tools."""

import json
import asyncio
import httpx
import sys
import os
from typing import Dict, Any, Optional, List
from google.adk.tools import FunctionTool
from shared.database import supabase

# Import root agent's working user context tool (ADK pattern)
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
from student_desk.tools.user_context_tool import get_user_context

@FunctionTool
async def get_user_course_context(course_id: str = None, *, tool_context) -> str:
    """Get user and course context for educational content generation."""
    try:
        user_context_result = await get_user_context(tool_context=tool_context)
        user_context = json.loads(user_context_result)
        
        result = {
            "user_context": user_context,
            "course_context": None,
            "status": "success"
        }
        
        if course_id and user_context.get("success"):
            try:
                user_id = user_context.get("user_id")
                course_response = supabase.table('courses').select(
                    "course_id, course_name, course_code, course_type, credits, syllabus_json"
                ).eq('course_id', course_id).execute()
                
                if course_response.data:
                    result["course_context"] = course_response.data[0]
                else:
                    result["course_context"] = {"error": "Course not found"}
                    
            except Exception as e:
                result["course_context"] = {"error": f"Failed to fetch course: {str(e)}"}
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

@FunctionTool
async def search_educational_resources(topic: str, course_context: str = None, *, tool_context) -> str:
    """Search for educational resources about a topic."""
    try:
        search_queries = [
            f"{topic} tutorial explanation examples",
            f"{topic} educational resources learning materials"
        ]
        
        if course_context:
            search_queries.insert(0, f"{topic} {course_context} educational guide")
        
        search_results = []
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            for query in search_queries[:2]:  # Limit to 2 queries
                try:
                    response = await client.get(
                        "https://api.duckduckgo.com/",
                        params={"q": query, "format": "json", "no_html": "1"}
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        if data.get("Abstract"):
                            search_results.append({
                                "source": "DuckDuckGo",
                                "content": data["Abstract"],
                                "url": data.get("AbstractURL", "")
                            })
                
                except Exception:
                    continue
                
                await asyncio.sleep(0.5)
        
        if not search_results:
            search_results = [{
                "source": "Educational Framework",
                "content": f"To learn {topic}, start with fundamental concepts, then explore practical applications and examples.",
                "suggestions": ["Check course materials", "Look for tutorials", "Practice exercises"]
            }]
        
        return json.dumps({
            "success": True,
            "topic": topic,
            "resources": search_results,
            "resource_count": len(search_results)
        }, indent=2)
        
    except Exception as e:
        return json.dumps({"success": False, "error": str(e), "resources": []})

@FunctionTool
async def generate_educational_content(
    topic: str,
    course_name: str = None,
    unit_number: int = None,
    prompt_options: List[str] = None,
    custom_requirements: str = None,
    *, tool_context
) -> str:
    """Generate educational content for a specific topic."""
    try:
        # Get resources first
        context_string = f"{course_name}" if course_name else ""
        if unit_number:
            context_string += f" Unit {unit_number}"
            
        resource_result = await search_educational_resources(
            topic=topic, course_context=context_string, tool_context=tool_context
        )
        resources_data = json.loads(resource_result)
        
        # Process preferences
        is_brief = prompt_options and "brief" in prompt_options
        include_examples = not prompt_options or "examples" in prompt_options
        include_practice = prompt_options and "practice" in prompt_options
        include_real_world = prompt_options and "realWorld" in prompt_options
        
        # Build content
        content = f"# {topic}\n\n"
        
        # Overview
        content += f"## Overview\n{topic} is an important concept in {course_name or 'this subject'}. "
        content += "Understanding this topic helps build a foundation for advanced concepts.\n\n"
        
        # Core concepts
        content += "## Core Concepts\n"
        content += "- **Definition**: Clear understanding of the concept\n"
        content += "- **Key Properties**: Important characteristics\n"
        content += "- **Applications**: Where it's used in practice\n\n"
        
        # Add resource content
        if resources_data.get("success") and resources_data.get("resources"):
            content += "## Detailed Explanation\n"
            for resource in resources_data["resources"][:2]:
                if resource.get("content"):
                    content += f"{resource['content']}\n\n"
        
        # Optional sections based on preferences
        if include_examples:
            content += "## Examples\n"
            content += f"Here are practical examples of {topic}:\n"
            content += "1. **Basic Example**: Simple demonstration\n"
            content += "2. **Real-world Application**: Practical scenario\n"
            content += "3. **Step-by-step Process**: Implementation guide\n\n"
        
        if include_practice:
            content += "## Practice Questions\n"
            content += f"Test your understanding of {topic}:\n"
            content += f"1. What is the main purpose of {topic}?\n"
            content += f"2. How does {topic} relate to other concepts?\n"
            content += "3. What are the key benefits and limitations?\n\n"
        
        if include_real_world:
            content += "## Real-world Applications\n"
            content += f"{topic} is used in various industries:\n"
            content += "- Technology and software development\n"
            content += "- Business and management\n"
            content += "- Research and academia\n\n"
        
        # Custom requirements
        if custom_requirements:
            content += "## Additional Focus\n"
            content += f"Based on your requirements: {custom_requirements}\n\n"
        
        # Key takeaways
        content += "## Key Takeaways\n"
        content += f"- {topic} is fundamental to understanding the subject\n"
        content += "- Core concepts provide foundation for advanced topics\n"
        content += "- Practice and application reinforce learning\n"
        content += "- Regular review improves retention\n\n"
        
        # Trim content if brief requested
        if is_brief:
            # Keep only overview, core concepts, and takeaways
            sections = content.split("##")
            brief_content = f"# {topic}\n\n"
            for section in sections:
                if any(keyword in section.lower() for keyword in ["overview", "core concepts", "key takeaways"]):
                    brief_content += f"##{section}"
            content = brief_content
        
        return json.dumps({
            "success": True,
            "topic": topic,
            "course_name": course_name,
            "unit_number": unit_number,
            "content": content.strip(),
            "word_count": len(content.split()),
            "resources_used": len(resources_data.get("resources", []))
        }, indent=2)
        
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": str(e),
            "content": f"Unable to generate content for {topic}. Please check your course materials."
        })

@FunctionTool
async def get_course_information(course_id: str, *, tool_context) -> str:
    """Get detailed course information including syllabus."""
    try:
        user_context_result = await get_user_context(tool_context=tool_context)
        user_context = json.loads(user_context_result)
        
        if not user_context.get("success"):
            return json.dumps({"success": False, "error": "User context not available"})
        
        course_response = supabase.table('courses').select(
            "course_id, course_name, course_code, course_type, credits, syllabus_json, created_at"
        ).eq('course_id', course_id).execute()
        
        if not course_response.data:
            return json.dumps({"success": False, "error": "Course not found"})
        
        course_data = course_response.data[0]
        
        syllabus_info = None
        if course_data.get("syllabus_json"):
            syllabus_info = {
                "available": True,
                "units": course_data["syllabus_json"].get("units", []),
                "learning_outcomes": course_data["syllabus_json"].get("learning_outcomes", []),
                "course_description": course_data["syllabus_json"].get("course_description", "")
            }
        else:
            syllabus_info = {"available": False, "message": "Syllabus not processed"}
        
        return json.dumps({
            "success": True,
            "course": {
                "course_id": course_data["course_id"],
                "course_name": course_data["course_name"],
                "course_code": course_data.get("course_code"),
                "course_type": course_data.get("course_type"),
                "credits": course_data.get("credits")
            },
            "syllabus": syllabus_info
        }, indent=2)
        
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)}) 