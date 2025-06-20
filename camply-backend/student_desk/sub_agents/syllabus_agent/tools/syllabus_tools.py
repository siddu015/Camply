"""Syllabus Agent Tools - Enhanced tools for fetching and parsing syllabus PDFs with PyMuPDF."""

import json
import re
from typing import Dict, Any, Optional, List
from google.adk.tools import FunctionTool
from shared.database import supabase
import fitz
from io import BytesIO
import uuid

@FunctionTool
async def parse_syllabus_processing_request(message: str, *, tool_context) -> str:
    """
    Parse a syllabus processing request from user message to extract course ID.
    
    Args:
        message: User message containing course ID
        
    Returns:
        JSON string with extracted course ID and processing status
    """
    try:
        import re
        
        course_id = None
        user_id = None
        
    
        uuid_pattern = r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
        matches = re.findall(uuid_pattern, message, re.IGNORECASE)
        
        # Try to identify course ID and user ID based on context
        if len(matches) >= 2:
            # Look for explicit patterns
            course_id_pattern = r'course[_\s]*id[:\s]+([0-9a-f-]{36})'
            user_id_pattern = r'user[_\s]*id[:\s]+([0-9a-f-]{36})'
            
            course_match = re.search(course_id_pattern, message, re.IGNORECASE)
            user_match = re.search(user_id_pattern, message, re.IGNORECASE)
            
            if course_match:
                course_id = course_match.group(1)
            if user_match:
                user_id = user_match.group(1)
        elif len(matches) == 1:
            # Only one UUID found, assume it's the course ID and try to get user_id from session
            course_id = matches[0]
            # Try to get user_id from session state as fallback
            session_state = getattr(tool_context, 'state', None)
            if session_state:
                user_id = session_state.get('user_id') if hasattr(session_state, 'get') else getattr(session_state, 'user_id', None)
        
        # Fallback: look for explicit patterns if UUID approach didn't work
        if not course_id:
            course_id_pattern = r'course[_\s]*id[:\s]+([0-9a-f-]{36})'
            match = re.search(course_id_pattern, message, re.IGNORECASE)
            if match:
                course_id = match.group(1)
        
        if not user_id:
            user_id_pattern = r'user[_\s]*id[:\s]+([0-9a-f-]{36})'
            match = re.search(user_id_pattern, message, re.IGNORECASE)
            if match:
                user_id = match.group(1)
        
        if not course_id:
            return json.dumps({
                "success": False,
                "error": "Could not extract course ID from message",
                "message": message
            })
            
        if not user_id:
            return json.dumps({
                "success": False,
                "error": "Could not extract user ID from message or session",
                "message": message
            })
        
        # Validate course ID exists and user has access
        course_response = supabase.table('courses').select('*').eq('course_id', course_id).execute()
        
        if not course_response.data:
            return json.dumps({
                "success": False,
                "error": f"Course with ID {course_id} not found",
                "course_id": course_id
            })
        
        course = course_response.data[0]
        
        # Verify user access
        access_check = await verify_user_course_access(user_id, course['semester_id'])
        if not access_check["success"]:
            return json.dumps({
                "success": False,
                "error": access_check["error"],
                "course_id": course_id
            })
        
        # Now process the syllabus with the extracted user_id and course_id
        # Create a mock context with the user_id for the processing function
        class MockToolContext:
            def __init__(self, user_id):
                self.user_id = user_id
                
        mock_context = MockToolContext(user_id)
        return await process_syllabus_upload_direct(course_id, user_id, tool_context=mock_context)
        
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": f"Error parsing syllabus request: {str(e)}"
        })

async def process_syllabus_upload_direct(course_id: str, user_id: str, *, tool_context) -> str:
    """
    Process uploaded syllabus PDF for a specific course.
    This is the main entry point triggered when a PDF is uploaded.
    
    Args:
        course_id: UUID of the course
        
    Returns:
        JSON string with processed syllabus content or error message
    """
    try:
        # User ID is provided as parameter
        # Get course details and verify access
        course_response = supabase.table('courses').select('*').eq('course_id', course_id).execute()
        
        if not course_response.data:
            return json.dumps({
                "success": False,
                "error": f"Course with ID {course_id} not found.",
                "course_id": course_id
            })
            
        course = course_response.data[0]
        syllabus_path = course.get('syllabus_storage_path')
        
        if not syllabus_path:
            return json.dumps({
                "success": False,
                "error": f"No syllabus uploaded for course {course.get('course_name', 'Unknown Course')}.",
                "course_id": course_id
            })
            
        # Verify user has access to this course
        access_check = await verify_user_course_access(user_id, course['semester_id'])
        if not access_check["success"]:
            return json.dumps({
                "success": False,
                "error": access_check["error"],
                "course_id": course_id
            })
            
        # Extract text content from PDF
        pdf_text = await extract_pdf_content(syllabus_path)
        if not pdf_text["success"]:
            return json.dumps({
                "success": False,
                "error": pdf_text["error"],
                "course_id": course_id
            })
        
        # Parse syllabus content into structured JSON
        parsed_content = await parse_syllabus_content(pdf_text["content"], course.get('course_name', ''))
        
        # Update course in database with parsed JSON
        update_result = await update_course_syllabus(course_id, parsed_content)
        
        if update_result["success"]:
            return json.dumps({
                "success": True,
                "message": "Syllabus processed successfully",
                "course_id": course_id,
                "course_name": course.get('course_name'),
                "syllabus_data": parsed_content
            })
        else:
            return json.dumps({
                "success": False,
                "error": f"Failed to update course: {update_result['error']}",
                "course_id": course_id
            })
        
    except Exception as e:
        error_response = {
            "success": False,
            "error": f"Error processing syllabus: {str(e)}",
            "course_id": course_id
        }
        return json.dumps(error_response)

@FunctionTool
async def process_syllabus_upload(course_id: str, *, tool_context) -> str:
    """
    Process uploaded syllabus PDF for a specific course (with session state user lookup).
    
    Args:
        course_id: UUID of the course
        
    Returns:
        JSON string with processed syllabus content or error message
    """
    try:
        # Try to get user_id from session state (standard ADK way)
        session_state = getattr(tool_context, 'state', None)
        user_id = None
        
        if session_state:
            user_id = session_state.get('user_id') if hasattr(session_state, 'get') else getattr(session_state, 'user_id', None)
        
        if not user_id:
            return json.dumps({
                "success": False,
                "error": "User ID not found in session state - please ensure proper session initialization"
            })
        
        # Call the direct processing function
        return await process_syllabus_upload_direct(course_id, user_id, tool_context=tool_context)
        
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": f"Error processing syllabus: {str(e)}",
            "course_id": course_id
        })

@FunctionTool
async def fetch_syllabus_content(course_id: str, *, tool_context) -> str:
    """
    Fetch processed syllabus content for a specific course.
    
    Args:
        course_id: UUID of the course
        
    Returns:
        JSON string with syllabus content or error message
    """
    try:
        # Get user_id from tool context session state
        session_state = getattr(tool_context, 'state', None)
        if not session_state:
            return json.dumps({
                "success": False,
                "error": "Session state not available in tool context"
            })
        
        user_id = session_state.get('user_id') if hasattr(session_state, 'get') else getattr(session_state, 'user_id', None)
        
        if not user_id:
            return json.dumps({
                "success": False,
                "error": "User ID not found in session state"
            })
            
        # Get course details
        course_response = supabase.table('courses').select('*').eq('course_id', course_id).execute()
        
        if not course_response.data:
            return json.dumps({
                "success": False,
                "error": f"Course with ID {course_id} not found."
            })
            
        course = course_response.data[0]
        
        # Verify user access
        access_check = await verify_user_course_access(user_id, course['semester_id'])
        if not access_check["success"]:
            return json.dumps({
                "success": False,
                "error": access_check["error"]
            })
        
        # Return syllabus JSON if available
        if course.get('syllabus_json'):
            return json.dumps({
                "success": True,
                "course_id": course_id,
                "course_name": course.get('course_name'),
                "syllabus_data": course['syllabus_json']
            })
        else:
            return json.dumps({
                "success": False,
                "error": "Syllabus not yet processed for this course."
            })
        
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": f"Error fetching syllabus: {str(e)}"
        })

async def verify_user_course_access(user_id: str, semester_id: str) -> Dict[str, Any]:
    """Verify user has access to the course."""
    try:
        semester_response = supabase.table('semesters').select('academic_id').eq('semester_id', semester_id).execute()
        if not semester_response.data:
            return {"success": False, "error": "Course semester not found."}
            
        academic_response = supabase.table('user_academic_details').select('user_id').eq('academic_id', semester_response.data[0]['academic_id']).execute()
        if not academic_response.data or academic_response.data[0]['user_id'] != user_id:
            return {"success": False, "error": "Access denied: You don't have permission to access this course."}
            
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": f"Access verification failed: {str(e)}"}

async def extract_pdf_content(syllabus_path: str) -> Dict[str, Any]:
    """Extract text content from PDF using PyMuPDF for better text extraction."""
    try:
        # Download PDF from Supabase Storage
        pdf_response = supabase.storage.from_('course_documents').download(syllabus_path)
        
        if not pdf_response:
            return {"success": False, "error": f"Failed to download syllabus PDF from storage path: {syllabus_path}"}
            
        # Extract text using PyMuPDF (better than PyPDF2)
        pdf_document = fitz.open(stream=pdf_response, filetype="pdf")
        
        text_content = ""
        metadata = {
            "page_count": pdf_document.page_count,
            "pages": []
        }
        
        for page_num in range(pdf_document.page_count):
            page = pdf_document.load_page(page_num)
            page_text = page.get_text()
            text_content += page_text + "\n"
            
            # Store page-level metadata
            metadata["pages"].append({
                "page_number": page_num + 1,
                "char_count": len(page_text),
                "line_count": len(page_text.split('\n'))
            })
        
        pdf_document.close()
        
        if not text_content.strip():
            return {"success": False, "error": "No text content found in PDF. The PDF might be image-based or corrupted."}
            
        return {
            "success": True,
            "content": text_content,
            "metadata": metadata
        }
        
    except Exception as e:
        return {"success": False, "error": f"Error extracting PDF content: {str(e)}"}

async def parse_syllabus_content(syllabus_text: str, course_name: str) -> Dict[str, Any]:
    """Parse syllabus text into structured JSON with enhanced pattern matching."""
    try:
        print(f"[DEBUG] Starting syllabus parsing for course: {course_name}")
        print(f"[DEBUG] Input text length: {len(syllabus_text)} characters")
        
        # Clean and normalize text but preserve structure
        clean_text = re.sub(r'\s+', ' ', syllabus_text.strip())
        print(f"[DEBUG] Cleaned text length: {len(clean_text)} characters")
        
        # Show first 500 characters for debugging
        print(f"[DEBUG] Text preview: {syllabus_text[:500]}...")
        
        # Enhanced unit extraction with multiple patterns
        units = extract_units_advanced(syllabus_text)  # Use original text for better structure
        print(f"[DEBUG] Extracted {len(units)} units")
        for i, unit in enumerate(units):
            print(f"[DEBUG] Unit {i+1}: {unit.get('title', 'No Title')} - {len(unit.get('topics', []))} topics")
        
        # Extract learning outcomes with improved patterns
        learning_outcomes = extract_learning_outcomes_advanced(clean_text)
        print(f"[DEBUG] Extracted {len(learning_outcomes)} learning outcomes")
        
        # Extract course description with context awareness
        course_description = extract_course_description_advanced(clean_text, course_name)
        print(f"[DEBUG] Course description length: {len(course_description)} characters")
        
        # Extract additional metadata
        metadata = extract_syllabus_metadata(clean_text)
        print(f"[DEBUG] Extracted metadata: {metadata}")
        
        # Add processing debug info to metadata
        metadata["processing_debug"] = {
            "original_text_length": len(syllabus_text),
            "units_found": len(units),
            "outcomes_found": len(learning_outcomes)
        }
        
        # Create comprehensive syllabus structure
        from datetime import datetime
        syllabus_json = {
            "course_name": course_name,
            "units": units,
            "learning_outcomes": learning_outcomes,
            "course_description": course_description,
            "metadata": metadata,
            "processing_timestamp": datetime.now().isoformat(),
            "version": "2.0"
        }
        
        print(f"[DEBUG] Final syllabus structure created with {len(units)} units and {len(learning_outcomes)} outcomes")
        
        return syllabus_json
        
    except Exception as e:
        # Fallback structure on parsing error
        fallback_structure = {
            "course_name": course_name,
            "units": [
                {
                    "unit": 1,
                    "title": "Course Content",
                    "topics": ["Content will be available after successful processing"],
                    "description": "Syllabus processing encountered an error"
                }
            ],
            "learning_outcomes": ["Content will be available after successful processing"],
            "course_description": f"Syllabus processing encountered an error: {str(e)}",
            "metadata": {
                "processing_error": str(e),
                "needs_reprocessing": True
            },
            "processing_timestamp": "",
            "version": "1.0"
        }
        return fallback_structure

def extract_units_advanced(text: str) -> List[Dict[str, Any]]:
    """Extract units with comprehensive pattern matching and content analysis."""
    units = []
    
    print(f"[DEBUG] Starting unit extraction from {len(text)} characters")
    
    # Try table-based extraction first (common in syllabus documents)
    table_units = extract_table_based_units(text)
    if table_units:
        print(f"[DEBUG] Found {len(table_units)} units from table-based extraction")
        return table_units
    
    # Enhanced unit patterns for various syllabus formats
    unit_patterns = [
        # Standard "UNIT 1", "Unit-1", "UNIT I" patterns
        r'(?:UNIT|Unit)[:\s\-]*([IVXLCDM\d]+)[:\s\-]*([^\n]+?)(?:\n|$)(.*?)(?=(?:UNIT|Unit)[:\s\-]*[IVXLCDM\d]+|$)',
        # Module patterns
        r'(?:MODULE|Module)[:\s\-]*([IVXLCDM\d]+)[:\s\-]*([^\n]+?)(?:\n|$)(.*?)(?=(?:MODULE|Module)[:\s\-]*[IVXLCDM\d]+|$)',
        # Chapter patterns
        r'(?:CHAPTER|Chapter)[:\s\-]*([IVXLCDM\d]+)[:\s\-]*([^\n]+?)(?:\n|$)(.*?)(?=(?:CHAPTER|Chapter)[:\s\-]*[IVXLCDM\d]+|$)',
        # Numbered patterns "1.", "2)", etc.
        r'^(\d+)[\.\)]\s*([^\n]+?)(?:\n|$)(.*?)(?=^\d+[\.\)]|$)',
        # Roman numeral patterns
        r'^([IVXLCDM]+)[\.\)]\s*([^\n]+?)(?:\n|$)(.*?)(?=^[IVXLCDM]+[\.\)]|$)',
    ]
    
    for i, pattern in enumerate(unit_patterns):
        print(f"[DEBUG] Trying pattern {i+1}: {pattern[:50]}...")
        matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE | re.DOTALL)
        print(f"[DEBUG] Pattern {i+1} found {len(matches)} matches")
        
        for match in matches:
            unit_identifier = match[0].strip()
            unit_title = match[1].strip()
            unit_content = match[2].strip() if len(match) > 2 else ""
            
            # Convert roman numerals and clean identifiers
            unit_num = convert_to_number(unit_identifier)
            
            # Skip if title is too short or looks like noise
            if len(unit_title) < 3 or unit_num == 0:
                continue
                
            # Clean unit title
            unit_title = clean_unit_title(unit_title)
            
            # Extract detailed topics from unit content
            topics = extract_comprehensive_topics(unit_content, unit_title)
            
            # Extract subtopics and detailed content
            subtopics = extract_subtopics(unit_content)
            
            unit_data = {
                "unit": unit_num,
                "title": unit_title,
                "topics": topics,
                "subtopics": subtopics,
                "description": clean_description(unit_content[:300])
            }
            
            # Avoid duplicates
            if not any(u['unit'] == unit_num for u in units):
                units.append(unit_data)
    
    # Sort units by number
    units = sorted(units, key=lambda x: x['unit'])
    
    # If still no units found, try different approach
    if not units:
        units = fallback_unit_extraction(text)
    
    return units

def extract_table_based_units(text: str) -> List[Dict[str, Any]]:
    """Extract units from table-based syllabus format."""
    units = []
    
    print(f"[DEBUG] Attempting table-based extraction")
    
    # Pattern for table rows with unit number, content, and marks/weightage
    # This handles formats like: "1 | Unit content... | 25 Marks"
    table_pattern = r'(\d+)\s+(.+?)\s+(\d+)\s*Marks?'
    matches = re.findall(table_pattern, text, re.IGNORECASE | re.DOTALL)
    
    print(f"[DEBUG] Table pattern found {len(matches)} matches")
    
    for match in matches:
        unit_num = int(match[0])
        unit_content = match[1].strip()
        marks = match[2]
        
        # Skip if this looks like the "Marks" column header itself
        if "Marks" in unit_content or len(unit_content) < 20:
            continue
            
        # Extract title from the content (usually the first line or sentence)
        content_lines = [line.strip() for line in unit_content.split('\n') if line.strip()]
        
        # Find the actual unit title
        unit_title = ""
        remaining_content = unit_content
        
        for i, line in enumerate(content_lines):
            if any(keyword in line.lower() for keyword in ['unit', 'introduction', 'javascript', 'reactjs', 'forms', 'style']):
                # This looks like a title
                unit_title = line.strip()
                # Remove title from content for topic extraction
                remaining_content = '\n'.join(content_lines[i+1:])
                break
        
        if not unit_title and content_lines:
            # Use first substantial line as title
            unit_title = content_lines[0]
            remaining_content = '\n'.join(content_lines[1:])
        
        # Clean the title
        unit_title = clean_unit_title(unit_title)
        
        # Extract topics from the remaining content
        topics = extract_comprehensive_topics(remaining_content, unit_title)
        subtopics = extract_subtopics(remaining_content)
        
        unit_data = {
            "unit": unit_num,
            "title": unit_title,
            "topics": topics,
            "subtopics": subtopics,
            "description": clean_description(remaining_content[:300]),
            "marks": int(marks) if marks.isdigit() else None
        }
        
        units.append(unit_data)
        print(f"[DEBUG] Extracted unit {unit_num}: {unit_title} with {len(topics)} topics")
    
    return sorted(units, key=lambda x: x['unit'])

def convert_to_number(identifier: str) -> int:
    """Convert roman numerals or clean numeric identifiers to integers."""
    identifier = identifier.strip().upper()
    
    # Roman numeral conversion
    roman_map = {'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10}
    if identifier in roman_map:
        return roman_map[identifier]
    
    # Extract numeric part
    numeric_match = re.search(r'(\d+)', identifier)
    if numeric_match:
        return int(numeric_match.group(1))
    
    return 0

def clean_unit_title(title: str) -> str:
    """Clean and format unit titles."""
    # Remove extra whitespace and special characters
    title = re.sub(r'\s+', ' ', title).strip()
    # Remove common prefixes that might be noise
    title = re.sub(r'^(?:unit|module|chapter|topic|section)[:\s]*', '', title, flags=re.IGNORECASE)
    # Capitalize properly
    title = title.title() if title.islower() else title
    return title

def extract_comprehensive_topics(content: str, unit_title: str) -> List[str]:
    """Extract topics with comprehensive pattern matching."""
    topics = []
    
    print(f"[DEBUG] Extracting topics from content: {content[:200]}...")
    
    # Enhanced topic extraction patterns
    topic_patterns = [
        # Bulleted lists
        r'(?:^|\n)\s*[•·▪▫◦‣⁃]\s*([^\n•·▪▫◦‣⁃]+)',
        # Numbered lists
        r'(?:^|\n)\s*\d+[\.\)]\s*([^\n\d]+?)(?=\n|$)',
        # Lettered lists  
        r'(?:^|\n)\s*[a-z][\.\)]\s*([^\n]+?)(?=\n|$)',
        # Dash/hyphen lists
        r'(?:^|\n)\s*[-–—]\s*([^\n\-–—]+)',
        # Colon-separated topics
        r'(?:topics?|includes?|covers?|contents?)[:\s]*([^\n]+)',
        # Comma-separated inline topics
        r'(?:such as|including|like)[:\s]*([^\n\.]+)',
    ]
    
    for pattern in topic_patterns:
        matches = re.findall(pattern, content, re.IGNORECASE | re.MULTILINE)
        for match in matches:
            if isinstance(match, tuple):
                match = match[0] if match else ""
            
            topic = clean_topic(match)
            if is_valid_topic(topic) and topic not in topics:
                topics.append(topic)
    
    # If no structured topics found, try to break down content by commas and periods
    if not topics:
        topics = extract_topics_by_parsing_content(content)
    
    print(f"[DEBUG] Extracted {len(topics)} topics: {topics[:3]}...")
    return topics[:15]  # Limit to reasonable number

def extract_topics_by_parsing_content(content: str) -> List[str]:
    """Parse content to extract meaningful topics when no structured format is found."""
    topics = []
    
    # Clean content and split by various delimiters
    content = re.sub(r'\s+', ' ', content.strip())
    
    # Split by common delimiters and extract meaningful phrases
    delimiters = [',', ';', '.', '-', '–', '—']
    
    # First try comma separation (most common)
    parts = content.split(',')
    for part in parts:
        part = part.strip()
        # Remove leading conjunctions and articles
        part = re.sub(r'^(?:and|or|the|a|an|in|on|at|by|for|with|to)\s+', '', part, flags=re.IGNORECASE)
        
        if is_valid_topic(part):
            topics.append(clean_topic(part))
    
    # If comma separation didn't work well, try period separation
    if len(topics) < 3:
        topics = []
        sentences = re.split(r'[.!?]+', content)
        for sentence in sentences:
            sentence = sentence.strip()
            if 10 <= len(sentence) <= 150:  # Reasonable topic length
                sentence = re.sub(r'^(?:and|or|the|a|an|in|on|at|by|for|with|to)\s+', '', sentence, flags=re.IGNORECASE)
                if is_valid_topic(sentence):
                    topics.append(clean_topic(sentence))
    
    # Extract technical terms and key phrases
    if len(topics) < 5:
        tech_topics = extract_technical_terms(content)
        for topic in tech_topics:
            if topic not in topics:
                topics.append(topic)
    
    return topics[:12]

def extract_technical_terms(content: str) -> List[str]:
    """Extract technical terms and important phrases from content."""
    topics = []
    
    # Common technical patterns for web technology
    tech_patterns = [
        r'\b(?:HTML?|CSS|JavaScript|React|XHTML|HTTP|DOM|Redux|Node|NMP)\b[^,\.]*?(?:[,\.]|$)',
        r'\b(?:client|server|protocol|framework|component|element|property|method|function)\w*[^,\.]*?(?:[,\.]|$)',
        r'\b(?:introduction to|basics? of|fundamentals? of|concepts? of)\s+([^,\.]+)',
        r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Language|Technology|Framework|Library|System)',
    ]
    
    for pattern in tech_patterns:
        matches = re.findall(pattern, content, re.IGNORECASE)
        for match in matches:
            if isinstance(match, tuple):
                match = match[0] if match else ""
            
            topic = clean_topic(match.strip())
            if is_valid_topic(topic) and len(topic) > 8:
                topics.append(topic)
    
    return topics[:8]

def extract_subtopics(content: str) -> List[str]:
    """Extract subtopics or detailed breakdown."""
    subtopics = []
    
    # Look for indented or sub-numbered content
    subtopic_patterns = [
        r'(?:^|\n)\s{2,}[•·▪▫◦‣⁃]\s*([^\n•·▪▫◦‣⁃]+)',
        r'(?:^|\n)\s+\d+\.\d+\s*([^\n]+)',
        r'(?:^|\n)\s+[a-z]\)\s*([^\n]+)',
        r'(?:^|\n)\s{4,}([^\n]+)',
    ]
    
    for pattern in subtopic_patterns:
        matches = re.findall(pattern, content, re.MULTILINE)
        for match in matches:
            subtopic = clean_topic(match)
            if is_valid_topic(subtopic) and subtopic not in subtopics:
                subtopics.append(subtopic)
    
    return subtopics[:8]  # Limit subtopics

def clean_topic(topic: str) -> str:
    """Clean and format individual topics."""
    if not topic:
        return ""
    
    # Remove extra whitespace
    topic = re.sub(r'\s+', ' ', topic).strip()
    # Remove trailing punctuation except meaningful ones
    topic = re.sub(r'[,;]+$', '', topic)
    # Capitalize first letter
    if topic:
        topic = topic[0].upper() + topic[1:]
    
    return topic

def is_valid_topic(topic: str) -> bool:
    """Validate if a string is a meaningful topic."""
    if not topic or len(topic.strip()) < 3:  # More lenient length requirement
        return False
    
    topic = topic.strip()
    
    # Filter out obvious noise
    noise_patterns = [
        r'^\s*page\s*\d+',
        r'^\s*\d+\s*$',
        r'^\s*[^\w\s]*\s*$',
        r'^\s*(?:and|or|the|a|an|in|on|at|by|for|with|to)\s*$',
        r'^\s*(?:marks?|weightage)\s*$',
        r'^\s*\d+\s*marks?\s*$',
    ]
    
    for pattern in noise_patterns:
        if re.match(pattern, topic.lower()):
            return False
    
    # Must contain at least some letters
    if not re.search(r'[a-zA-Z]', topic):
        return False
    
    return True

def extract_topics_from_sentences(content: str) -> List[str]:
    """Extract topics by analyzing sentence structure."""
    topics = []
    sentences = re.split(r'[.!?]+', content)
    
    for sentence in sentences:
        sentence = sentence.strip()
        if 30 <= len(sentence) <= 200:
            # Look for sentences that describe topics
            if any(keyword in sentence.lower() for keyword in ['include', 'cover', 'discuss', 'explain', 'introduce', 'examine']):
                topics.append(sentence)
    
    return topics[:6]

def clean_description(description: str) -> str:
    """Clean unit description text."""
    if not description:
        return "Content as per syllabus"
    
    # Clean up the description
    description = re.sub(r'\s+', ' ', description).strip()
    description = re.sub(r'^[^\w]*', '', description)
    
    if len(description) < 10:
        return "Content as per syllabus"
    
    return description

def fallback_unit_extraction(text: str) -> List[Dict[str, Any]]:
    """Fallback method when standard patterns don't work."""
    # Try to find any numbered content sections
    sections = re.split(r'\n\s*\n', text)
    units = []
    unit_counter = 1
    
    for section in sections:
        section = section.strip()
        if len(section) > 100:  # Substantial content
            lines = section.split('\n')
            title = lines[0][:100] if lines else f"Unit {unit_counter}"
            content = ' '.join(lines[1:]) if len(lines) > 1 else section
            
            topics = extract_comprehensive_topics(content, title)
            
            if topics:  # Only add if we found meaningful topics
                units.append({
                    "unit": unit_counter,
                    "title": clean_unit_title(title),
                    "topics": topics,
                    "subtopics": [],
                    "description": clean_description(content[:200])
                })
                unit_counter += 1
    
    # Final fallback
    if not units:
        units = [{
            "unit": 1,
            "title": "Course Content",
            "topics": ["Content to be determined from syllabus"],
            "subtopics": [],
            "description": "Syllabus content requires manual review"
        }]
    
    return units

def extract_topics_from_content(content: str) -> List[str]:
    """Extract topics from unit content using comprehensive patterns (legacy function)."""
    # Delegate to the more comprehensive function
    return extract_comprehensive_topics(content, "")[:8]

def extract_learning_outcomes_advanced(text: str) -> List[str]:
    """Extract learning outcomes with enhanced pattern matching."""
    outcomes = []
    
    outcome_patterns = [
        r'(?:learning outcomes?|objectives?|goals?)[:\s]*\n((?:(?:•|\*|\-|\d+\.)\s*[^\n]+\n?)+)',
        r'(?:upon completion|after completion|students? (?:will|shall))[:\s]*([^\n]+(?:\n[^\n]+)*?)(?=\n\n|\n[A-Z]|\Z)',
        r'(?:aims?|purposes?)[:\s]*\n((?:(?:•|\*|\-|\d+\.)\s*[^\n]+\n?)+)',
    ]
    
    for pattern in outcome_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE | re.DOTALL)
        for match in matches:
            # Split by bullet points or numbers
            outcome_items = re.split(r'(?:•|\*|\-|\d+\.)\s*', match)
            for item in outcome_items:
                item = item.strip()
                if len(item) > 20 and item not in outcomes:
                    outcomes.append(item)
    
    # Fallback outcomes
    if not outcomes:
        outcomes = [
            "Students will gain comprehensive understanding of course concepts",
            "Students will be able to apply learned principles in practical scenarios",
            "Students will develop analytical and problem-solving skills",
            "Students will demonstrate proficiency in course-related techniques"
        ]
    
    return outcomes[:6]  # Limit to 6 outcomes

def extract_course_description_advanced(text: str, course_name: str) -> str:
    """Extract course description with context awareness."""
    # Description patterns
    desc_patterns = [
        r'(?:course description|about|overview|introduction)[:\s]*([^\n]+(?:\n[^\n]+)*?)(?=\n\n|\nunits?|\nmodules?|\Z)',
        r'(?:this course|the course)[:\s]*([^\n]+(?:\n[^\n]+)*?)(?=\n\n|\nunits?|\nmodules?|\Z)',
    ]
    
    for pattern in desc_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE | re.DOTALL)
        if matches:
            description = matches[0].strip()
            if len(description) > 50 and len(description) < 800:
                return description[:500]  # Limit description length
    
    # Fallback: first substantial paragraph
    paragraphs = re.split(r'\n\s*\n', text)
    for para in paragraphs:
        para = para.strip()
        if len(para) > 100 and len(para) < 600:
            if not re.match(r'^\s*(?:unit|module|chapter)\s*\d+', para, re.IGNORECASE):
                return para[:400]
    
    return f"This course covers essential concepts and practical applications in {course_name}. Students will learn fundamental principles and develop skills necessary for understanding the subject matter."

def extract_syllabus_metadata(text: str) -> Dict[str, Any]:
    """Extract additional metadata from syllabus."""
    metadata = {}
    
    # Extract credits
    credit_match = re.search(r'credits?[:\s]*(\d+)', text, re.IGNORECASE)
    if credit_match:
        metadata['credits'] = int(credit_match.group(1))
    
    # Extract duration/hours
    duration_match = re.search(r'(?:duration|hours?)[:\s]*(\d+)', text, re.IGNORECASE)
    if duration_match:
        metadata['duration_hours'] = int(duration_match.group(1))
    
    # Extract prerequisites
    prereq_match = re.search(r'prerequisite[s]?[:\s]*([^\n]+)', text, re.IGNORECASE)
    if prereq_match:
        metadata['prerequisites'] = prereq_match.group(1).strip()
    
    # Extract evaluation scheme
    eval_patterns = [
        r'evaluation[:\s]*([^\n]+(?:\n[^\n]+)*?)(?=\n\n|\n[A-Z]|\Z)',
        r'(?:assessment|grading)[:\s]*([^\n]+(?:\n[^\n]+)*?)(?=\n\n|\n[A-Z]|\Z)',
    ]
    
    for pattern in eval_patterns:
        eval_match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if eval_match:
            metadata['evaluation_scheme'] = eval_match.group(1).strip()[:300]
            break
    
    return metadata

async def update_course_syllabus(course_id: str, syllabus_data: Dict[str, Any]) -> Dict[str, Any]:
    """Update course with processed syllabus data."""
    try:
        # Add timestamp
        from datetime import datetime
        syllabus_data['processing_timestamp'] = datetime.utcnow().isoformat()
        
        # Update course in database
        update_response = supabase.table('courses').update({
            'syllabus_json': syllabus_data,
            'updated_at': datetime.utcnow().isoformat()
        }).eq('course_id', course_id).execute()
        
        if update_response.data:
            return {"success": True, "data": update_response.data[0]}
        else:
            return {"success": False, "error": "Failed to update course in database"}
            
    except Exception as e:
        return {"success": False, "error": f"Database update failed: {str(e)}"} 