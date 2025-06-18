"""JSON generation for structured handbook data storage."""

import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict

from .config import HandbookConfig

logger = logging.getLogger(__name__)

@dataclass
class ContentMetadata:
    """Metadata for content sections."""
    word_count: int
    confidence_score: float
    keyword_matches: List[str]
    chunk_count: int
    quality_score: float
    last_updated: str
    extraction_method: str

@dataclass
class HandbookSection:
    """Structure for handbook section data."""
    title: str
    content: str
    summary: str
    key_points: List[str]
    metadata: ContentMetadata
    
class HandbookJSONGenerator:
    """Generate structured JSON data for handbook storage."""
    
    def __init__(self):
        """Initialize the JSON generator."""
        self.categories = HandbookConfig.get_all_categories()
        self.current_timestamp = datetime.utcnow().isoformat()
    
    def extract_key_points(self, content: str, max_points: int = 5) -> List[str]:
        """Extract key points from content."""
        if not content.strip():
            return []
        
        sentences = content.split('.')
        key_points = []
        
        important_keywords = [
            'must', 'required', 'mandatory', 'shall', 'will', 'important',
            'note', 'warning', 'caution', 'procedure', 'process', 'policy'
        ]
        
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) < 20 or len(sentence) > 200:  # Skip very short/long sentences
                continue
                
            sentence_lower = sentence.lower()
            if any(keyword in sentence_lower for keyword in important_keywords):
                key_points.append(sentence + '.')
                if len(key_points) >= max_points:
                    break
        
        if not key_points:
            for sentence in sentences[:max_points]:
                sentence = sentence.strip()
                if len(sentence) > 20:
                    key_points.append(sentence + '.')
        
        return key_points
    
    def generate_summary(self, content: str, max_length: int = 300) -> str:
        """Generate a summary of the content."""
        if not content.strip():
            return "No content available for this section."
        
        sentences = content.split('.')
        summary_sentences = []
        current_length = 0
        
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) < 10:  
                continue
                
            if current_length + len(sentence) > max_length:
                break
                
            summary_sentences.append(sentence)
            current_length += len(sentence)
        
        summary = '. '.join(summary_sentences)
        if summary and not summary.endswith('.'):
            summary += '.'
        
        return summary if summary else "Content available but requires review for summarization."
    
    def create_handbook_section(self, category: str, category_data: Dict) -> HandbookSection:
        """Create a structured handbook section."""
        content = category_data.get('content', '')
        
        title = self.format_category_title(category)
        
        summary = self.generate_summary(content)
        key_points = self.extract_key_points(content)
        
        metadata = ContentMetadata(
            word_count=category_data.get('word_count', 0),
            confidence_score=category_data.get('avg_confidence', 0.0),
            keyword_matches=category_data.get('keyword_matches', []),
            chunk_count=category_data.get('chunk_count', 0),
            quality_score=category_data.get('quality_score', 0.0),
            last_updated=self.current_timestamp,
            extraction_method="PyMuPDF + NLP Categorization"
        )
        
        return HandbookSection(
            title=title,
            content=content,
            summary=summary,
            key_points=key_points,
            metadata=metadata
        )
    
    def format_category_title(self, category: str) -> str:
        """Format category name into a readable title."""
        title_mapping = {
            'basic_info': 'Basic Information',
            'semester_structure': 'Semester Structure',
            'examination_rules': 'Examination Rules and Procedures',
            'evaluation_criteria': 'Evaluation and Grading Criteria',
            'attendance_policies': 'Attendance Policies',
            'academic_calendar': 'Academic Calendar',
            'course_details': 'Course Details and Curriculum',
            'assessment_methods': 'Assessment Methods',
            'disciplinary_rules': 'Disciplinary Rules and Conduct',
            'graduation_requirements': 'Graduation Requirements',
            'fee_structure': 'Fee Structure and Financial Information',
            'facilities_rules': 'Facilities and Infrastructure Rules'
        }
        
        return title_mapping.get(category, category.replace('_', ' ').title())
    
    def generate_handbook_json(self, categorized_content: Dict, processing_metadata: Dict = None) -> Dict:
        """Generate complete JSON structure for handbook storage."""
        logger.info("Generating structured JSON for handbook storage")
        
        handbook_sections = {}
        
        for category in self.categories:
            category_data = categorized_content.get(category, {})
            section = self.create_handbook_section(category, category_data)
            handbook_sections[category] = asdict(section)
        
        processing_summary = self.generate_processing_summary(categorized_content, processing_metadata)
        
        handbook_json = {
            "processing_info": {
                "processed_at": self.current_timestamp,
                "processing_version": "1.0",
                "extractor": "PyMuPDF + ContentExtractor",
                "total_categories": len(self.categories),
                "categories_with_content": sum(1 for cat in categorized_content.values() if cat.get('word_count', 0) > 0)
            },
            "processing_summary": processing_summary,
            "sections": handbook_sections
        }
        
        logger.info(f"Generated JSON structure with {len(handbook_sections)} sections")
        return handbook_json
    
    def generate_processing_summary(self, categorized_content: Dict, processing_metadata: Dict = None) -> Dict:
        """Generate summary of processing results."""
        total_words = sum(cat.get('word_count', 0) for cat in categorized_content.values())
        avg_quality = sum(cat.get('quality_score', 0) for cat in categorized_content.values()) / len(categorized_content)
        
        categories_with_content = [
            cat for cat, data in categorized_content.items() 
            if data.get('word_count', 0) >= HandbookConfig.MIN_WORDS_PER_CATEGORY
        ]
        
        summary = {
            "total_words_extracted": total_words,
            "average_quality_score": round(avg_quality, 2),
            "categories_meeting_minimum": len(categories_with_content),
            "overall_completeness": round(len(categories_with_content) / len(self.categories) * 100, 1),
            "categories_with_sufficient_content": categories_with_content,
            "processing_recommendations": []
        }
        
        if summary["overall_completeness"] < 70:
            summary["processing_recommendations"].append(
                "Consider reviewing handbook for missing sections or re-processing with different parameters"
            )
        
        if avg_quality < 50:
            summary["processing_recommendations"].append(
                "Content quality scores are low. Manual review recommended"
            )
        
        if processing_metadata:
            summary.update({
                "pdf_metadata": processing_metadata.get("metadata", {}),
                "processing_stats": processing_metadata.get("processing_stats", {})
            })
        
        return summary
    
    def format_for_database(self, handbook_json: Dict) -> Dict:
        """Format JSON for database storage according to schema."""
        logger.info("Formatting JSON for database storage")
        
        database_format = {}
        
        for category in self.categories:
            section_data = handbook_json["sections"].get(category, {})
            
            if section_data and section_data.get("content"):
                database_format[category] = {
                    "title": section_data.get("title", ""),
                    "content": section_data.get("content", ""),
                    "summary": section_data.get("summary", ""),
                    "key_points": section_data.get("key_points", []),
                    "metadata": section_data.get("metadata", {}),
                    "searchable_text": self.create_searchable_text(section_data),
                    "content_hash": self.generate_content_hash(section_data.get("content", ""))
                }
            else:
                database_format[category] = {
                    "title": self.format_category_title(category),
                    "content": "",
                    "summary": "No content found for this section in the handbook.",
                    "key_points": [],
                    "metadata": {
                        "word_count": 0,
                        "confidence_score": 0.0,
                        "quality_score": 0.0,
                        "last_updated": self.current_timestamp
                    },
                    "searchable_text": "",
                    "content_hash": ""
                }
        
        database_format["_processing_info"] = handbook_json.get("processing_info", {})
        database_format["_processing_summary"] = handbook_json.get("processing_summary", {})
        
        logger.info("Database formatting completed")
        return database_format
    
    def create_searchable_text(self, section_data: Dict) -> str:
        """Create searchable text combining all relevant content."""
        searchable_parts = []
        
        if section_data.get("title"):
            searchable_parts.append(section_data["title"])
        
        if section_data.get("summary"):
            searchable_parts.append(section_data["summary"])
        
        if section_data.get("key_points"):
            searchable_parts.extend(section_data["key_points"])
        
        if section_data.get("content"):
            content = section_data["content"][:1000]  
            searchable_parts.append(content)
        
        return " ".join(searchable_parts)
    
    def generate_content_hash(self, content: str) -> str:
        """Generate a simple hash for content change detection."""
        import hashlib
        return hashlib.md5(content.encode()).hexdigest()[:16]
    
    def validate_json_structure(self, database_format: Dict) -> Dict:
        """Validate the generated JSON structure."""
        validation_result = {
            "is_valid": True,
            "errors": [],
            "warnings": [],
            "statistics": {}
        }
        
        missing_categories = []
        for category in self.categories:
            if category not in database_format:
                missing_categories.append(category)
                validation_result["errors"].append(f"Missing category: {category}")
        
        if missing_categories:
            validation_result["is_valid"] = False
        
        empty_categories = []
        low_quality_categories = []
        
        for category in self.categories:
            if category in database_format:
                cat_data = database_format[category]
                metadata = cat_data.get("metadata", {})
                
                if metadata.get("word_count", 0) == 0:
                    empty_categories.append(category)
                elif metadata.get("quality_score", 0) < 30:
                    low_quality_categories.append(category)
        
        if empty_categories:
            validation_result["warnings"].append(
                f"Empty categories: {', '.join(empty_categories)}"
            )
        
        if low_quality_categories:
            validation_result["warnings"].append(
                f"Low quality categories: {', '.join(low_quality_categories)}"
            )
        
        total_words = sum(
            database_format.get(cat, {}).get("metadata", {}).get("word_count", 0)
            for cat in self.categories
        )
        
        validation_result["statistics"] = {
            "total_categories": len(self.categories),
            "categories_with_content": len(self.categories) - len(empty_categories),
            "total_words": total_words,
            "empty_categories": len(empty_categories),
            "low_quality_categories": len(low_quality_categories)
        }
        
        return validation_result
    
    def export_json_file(self, database_format: Dict, output_path: str) -> bool:
        """Export the JSON to a file for debugging/review."""
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(database_format, f, indent=2, ensure_ascii=False)
            logger.info(f"JSON exported to {output_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to export JSON: {e}")
            return False 