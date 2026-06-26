"""Document processor for handling syllabus and other document types with Docling."""

import logging
from typing import Dict, Any, Optional
from datetime import datetime
from .docling_client import DoclingClient

logger = logging.getLogger(__name__)

class DocumentProcessor:
    """Processor for handling document conversion and data extraction only."""
    
    def __init__(self, docling_base_url: str = "http://localhost:5001"):
        """Initialize document processor.
        
        Args:
            docling_base_url: Base URL for Docling service
        """
        self.docling_base_url = docling_base_url
    
    async def process_syllabus(
        self, 
        course_id: str, 
        user_id: str, 
        file_path: str
    ) -> Dict[str, Any]:
        """Process syllabus document using Docling and extract structured data.
        
        NOTE: This method ONLY processes and returns data. Database updates
        are handled by the ADK syllabus agent.
        
        Args:
            course_id: Course ID
            user_id: User ID
            file_path: Path to the syllabus file
            
        Returns:
            Dict containing processing results (NO database updates)
        """
        try:
            logger.info(f"Starting syllabus processing for course {course_id}")
            
            # Step 1: Convert document using Docling
            async with DoclingClient(self.docling_base_url) as docling:
                conversion_result = await docling.convert_document_from_path(
                    file_path=file_path,
                    output_format="markdown"
                )
            
            if not conversion_result["success"]:
                return {
                    "success": False,
                    "error": f"Docling conversion failed: {conversion_result.get('error')}",
                    "stage": "docling_conversion"
                }
            
            # Step 2: Extract structured syllabus data from markdown
            md_content = conversion_result.get("md_content", "")
            structured_data = await self._extract_syllabus_structure(md_content)
            
            # Step 3: Return structured data for ADK agent to handle
            return {
                "success": True,
                "course_id": course_id,
                "user_id": user_id,
                "md_content": md_content,
                "structured_data": structured_data,
                "processing_metadata": conversion_result.get("metadata", {}),
                "units_extracted": len(structured_data.get("units", [])),
                "topics_extracted": sum(len(unit.get("topics", [])) for unit in structured_data.get("units", [])),
                "docling_processed": True,
                "processed_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error processing syllabus: {e}")
            return {
                "success": False,
                "error": str(e),
                "stage": "general_error"
            }
    
    async def _extract_syllabus_structure(self, md_content: str) -> Dict[str, Any]:
        """Extract structured data from markdown content.
        
        Args:
            md_content: Markdown content from Docling
            
        Returns:
            Dict containing structured syllabus data
        """
        try:
            # Parse the markdown content to extract units and topics
            units = []
            lines = md_content.split('\n')
            
            current_unit = None
            current_topics = []
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # Detect unit headers (## Unit N or # Unit N)
                if self._is_unit_header(line):
                    # Save previous unit if exists
                    if current_unit:
                        current_unit["topics"] = current_topics
                        units.append(current_unit)
                    
                    # Start new unit
                    unit_info = self._parse_unit_header(line)
                    current_unit = {
                        "unit_number": unit_info["number"],
                        "unit_name": unit_info["name"],
                        "unit_title": unit_info["title"],
                        "topics": []
                    }
                    current_topics = []
                
                # Detect topics within units
                elif current_unit and self._is_topic_line(line):
                    topic = self._parse_topic_line(line)
                    if topic:
                        current_topics.append(topic)
            
            # Save last unit
            if current_unit:
                current_unit["topics"] = current_topics
                units.append(current_unit)
            
            # Extract additional metadata
            metadata = self._extract_course_metadata(md_content)
            
            return {
                "units": units,
                "total_units": len(units),
                "total_topics": sum(len(unit.get("topics", [])) for unit in units),
                "course_metadata": metadata,
                "processing_method": "docling_markdown_extraction",
                "extracted_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error extracting syllabus structure: {e}")
            return {
                "units": [],
                "total_units": 0,
                "total_topics": 0,
                "error": str(e),
                "processing_method": "docling_markdown_extraction",
                "extracted_at": datetime.utcnow().isoformat()
            }
    
    def _is_unit_header(self, line: str) -> bool:
        """Check if line is a unit header."""
        line_lower = line.lower()
        return (
            (line.startswith('##') or line.startswith('#')) and
            ('unit' in line_lower or 'module' in line_lower or 'chapter' in line_lower)
        )
    
    def _parse_unit_header(self, line: str) -> Dict[str, Any]:
        """Parse unit header to extract unit information."""
        import re
        
        # Remove markdown headers
        clean_line = re.sub(r'^#+\s*', '', line).strip()
        
        # Extract unit number
        unit_match = re.search(r'(?:unit|module|chapter)\s*(\d+)', clean_line, re.IGNORECASE)
        unit_number = int(unit_match.group(1)) if unit_match else 0
        
        # Extract unit name/title (everything after the unit number)
        name_match = re.search(r'(?:unit|module|chapter)\s*\d+[:\-\s]*(.+)', clean_line, re.IGNORECASE)
        unit_name = name_match.group(1).strip() if name_match else clean_line
        
        return {
            "number": unit_number,
            "name": unit_name,
            "title": clean_line
        }
    
    def _is_topic_line(self, line: str) -> bool:
        """Check if line represents a topic."""
        return (
            line.startswith('-') or 
            line.startswith('*') or 
            line.startswith('•') or
            (line.startswith(('1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.')))
        )
    
    def _parse_topic_line(self, line: str) -> Optional[str]:
        """Parse topic line to extract topic text."""
        import re
        
        # Remove list markers and numbers
        clean_line = re.sub(r'^[\-\*\•]\s*', '', line)
        clean_line = re.sub(r'^\d+\.\s*', '', clean_line)
        clean_line = clean_line.strip()
        
        if len(clean_line) > 3:  # Only consider meaningful topics
            return clean_line
        return None
    
    def _extract_course_metadata(self, content: str) -> Dict[str, Any]:
        """Extract course metadata from content."""
        import re
        
        metadata = {}
        
        # Extract course name/title
        title_match = re.search(r'^#\s*([^#\n]+)', content, re.MULTILINE)
        if title_match:
            metadata['course_title'] = title_match.group(1).strip()
        
        # Extract credits/hours
        credits_match = re.search(r'(\d+)\s*(?:credits?|hours?|units?)', content, re.IGNORECASE)
        if credits_match:
            metadata['credits'] = int(credits_match.group(1))
        
        # Extract prerequisites
        prereq_match = re.search(r'prerequisite[s]?[:\-\s]*([^\n]+)', content, re.IGNORECASE)
        if prereq_match:
            metadata['prerequisites'] = prereq_match.group(1).strip()
        
        # Extract objectives
        objectives_match = re.search(r'(?:objectives?|outcomes?)[:\-\s]*([^\n]+(?:\n[^#\n]+)*)', content, re.IGNORECASE)
        if objectives_match:
            metadata['objectives'] = objectives_match.group(1).strip()
        
        return metadata
    
    async def get_processing_status(self) -> Dict[str, Any]:
        """Get status of document processing services.
        
        Returns:
            Dict containing service status
        """
        try:
            async with DoclingClient(self.docling_base_url) as docling:
                docling_status = await docling.get_service_status()
            
            return {
                "docling_service": docling_status,
                "processor_status": "ready",
                "checked_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {
                "docling_service": {"healthy": False, "error": str(e)},
                "processor_status": "error",
                "checked_at": datetime.utcnow().isoformat()
            } 