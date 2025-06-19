"""Content extraction and categorization for handbook processing."""

import re
import logging
from typing import Dict, List, Tuple, Optional
from collections import defaultdict, Counter
from dataclasses import dataclass
import string

try:
    import spacy
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    ADVANCED_NLP_AVAILABLE = True
except ImportError:
    ADVANCED_NLP_AVAILABLE = False
    logging.warning("Advanced NLP libraries not available. Using basic text processing.")

from .config import HandbookConfig

logger = logging.getLogger(__name__)

@dataclass
class CategoryMatch:
    """Structure for category matching results."""
    category: str
    content: str
    confidence: float
    keyword_matches: List[str]
    context: str

class ContentExtractor:
    """Advanced content extraction and categorization system."""
    
    def __init__(self):
        """Initialize the content extractor."""
        self.categories = HandbookConfig.get_all_categories()
        self.category_keywords = {
            cat: HandbookConfig.get_category_keywords(cat) 
            for cat in self.categories
        }
        
        self.nlp = None
        self.vectorizer = None
        
        if ADVANCED_NLP_AVAILABLE:
            try:
                self.nlp = spacy.load(HandbookConfig.SPACY_MODEL)
                logger.info("Loaded spaCy model for advanced text processing")
            except OSError:
                logger.warning(f"spaCy model '{HandbookConfig.SPACY_MODEL}' not found. Using basic processing.")
                # Don't modify global variable, use instance variable instead
                self.advanced_nlp_available = False
        else:
            self.advanced_nlp_available = ADVANCED_NLP_AVAILABLE
    
    def preprocess_text(self, text: str) -> str:
        """Clean and preprocess text for analysis."""
        text = text.lower()
        
        text = re.sub(r'\s+', ' ', text)
        
        text = re.sub(r'[^\w\s\.\!\?]', ' ', text)
        
        text = re.sub(r'\bpage\s+\d+\b', '', text)
        text = re.sub(r'\b\d+\s*$', '', text, flags=re.MULTILINE)
        
        return text.strip()
    
    def extract_sentences(self, text: str) -> List[str]:
        """Extract sentences from text."""
        if self.nlp and getattr(self, 'advanced_nlp_available', ADVANCED_NLP_AVAILABLE):
            doc = self.nlp(text)
            return [sent.text.strip() for sent in doc.sents if len(sent.text.strip()) > 10]
        else:
            sentences = re.split(r'[.!?]+', text)
            return [s.strip() for s in sentences if len(s.strip()) > 10]
    
    def extract_chunks(self, text: str) -> List[str]:
        """Extract meaningful chunks from text for processing."""
        chunks = []
        
        paragraphs = text.split('\n\n')
        
        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if len(paragraph) < 50:  
                continue
            
            if len(paragraph) > HandbookConfig.CHUNK_SIZE:
                sentences = self.extract_sentences(paragraph)
                current_chunk = ""
                
                for sentence in sentences:
                    if len(current_chunk + sentence) > HandbookConfig.CHUNK_SIZE:
                        if current_chunk:
                            chunks.append(current_chunk.strip())
                        current_chunk = sentence
                    else:
                        current_chunk += " " + sentence
                
                if current_chunk:
                    chunks.append(current_chunk.strip())
            else:
                chunks.append(paragraph)
        
        return chunks
    
    def calculate_keyword_score(self, text: str, keywords: List[str]) -> Tuple[float, List[str]]:
        """Calculate keyword-based relevance score for a category."""
        text_lower = text.lower()
        matched_keywords = []
        total_matches = 0
        
        for keyword in keywords:
            keyword_lower = keyword.lower()
            matches = len(re.findall(r'\b' + re.escape(keyword_lower) + r'\b', text_lower))
            if matches > 0:
                matched_keywords.append(keyword)
                total_matches += matches
        
        text_words = len(text_lower.split())
        score = (total_matches * len(matched_keywords)) / max(text_words, 1)
        
        return score, matched_keywords
    
    def calculate_context_score(self, text: str, category: str) -> float:
        """Calculate contextual relevance score using pattern matching."""
        context_patterns = {
            'basic_info': [
                r'contact.*information', r'about.*college', r'mission.*vision',
                r'established.*in', r'founded.*in', r'college.*overview'
            ],
            'semester_structure': [
                r'semester.*system', r'academic.*year', r'semester.*breakdown',
                r'academic.*structure', r'term.*duration'
            ],
            'examination_rules': [
                r'examination.*rules', r'exam.*conduct', r'test.*procedures',
                r'examination.*malpractice', r'exam.*guidelines'
            ],
            'evaluation_criteria': [
                r'grading.*system', r'marking.*scheme', r'assessment.*criteria',
                r'evaluation.*method', r'grade.*calculation'
            ],
            'attendance_policies': [
                r'attendance.*policy', r'attendance.*requirement', r'minimum.*attendance',
                r'attendance.*percentage', r'leave.*policy'
            ],
            'academic_calendar': [
                r'academic.*calendar', r'important.*dates', r'examination.*schedule',
                r'semester.*dates', r'academic.*schedule'
            ],
            'course_details': [
                r'course.*structure', r'syllabus.*details', r'curriculum.*overview',
                r'course.*description', r'subject.*details'
            ],
            'assessment_methods': [
                r'assessment.*method', r'internal.*assessment', r'external.*examination',
                r'continuous.*assessment', r'project.*evaluation'
            ],
            'disciplinary_rules': [
                r'disciplinary.*action', r'code.*of.*conduct', r'student.*behavior',
                r'disciplinary.*committee', r'misconduct.*penalties'
            ],
            'graduation_requirements': [
                r'graduation.*requirement', r'degree.*completion', r'minimum.*credits',
                r'eligibility.*criteria', r'completion.*requirements'
            ],
            'fee_structure': [
                r'fee.*structure', r'tuition.*fees', r'payment.*schedule',
                r'fee.*payment', r'scholarship.*details'
            ],
            'facilities_rules': [
                r'library.*rules', r'hostel.*regulations', r'laboratory.*guidelines',
                r'facility.*usage', r'infrastructure.*rules'
            ]
        }
        
        patterns = context_patterns.get(category, [])
        score = 0
        text_lower = text.lower()
        
        for pattern in patterns:
            matches = len(re.findall(pattern, text_lower))
            score += matches * 2  
        
        return score
    
    def categorize_chunk(self, chunk: str) -> List[CategoryMatch]:
        """Categorize a text chunk into relevant categories."""
        chunk_preprocessed = self.preprocess_text(chunk)
        matches = []
        
        for category in self.categories:
            keywords = self.category_keywords[category]
            
            keyword_score, matched_keywords = self.calculate_keyword_score(
                chunk_preprocessed, keywords
            )
            
            context_score = self.calculate_context_score(chunk_preprocessed, category)
            
            total_score = keyword_score + (context_score * 0.5)
            
            if total_score > 0:  
                matches.append(CategoryMatch(
                    category=category,
                    content=chunk,
                    confidence=total_score,
                    keyword_matches=matched_keywords,
                    context=chunk[:200] + "..." if len(chunk) > 200 else chunk
                ))
        
        matches.sort(key=lambda x: x.confidence, reverse=True)
        return matches[:3]  
    
    def extract_categorized_content(self, text: str) -> Dict[str, Dict]:
        """Extract and categorize content from handbook text."""
        logger.info(f"Starting content categorization for {len(text)} characters of text")
        
        categorized_content = {category: {
            'content': [],
            'total_words': 0,
            'confidence_scores': [],
            'keyword_matches': set(),
            'sources': []
        } for category in self.categories}
        
        chunks = self.extract_chunks(text)
        logger.info(f"Extracted {len(chunks)} chunks for processing")
        
        for i, chunk in enumerate(chunks):
            matches = self.categorize_chunk(chunk)
            
            for match in matches:
                cat_data = categorized_content[match.category]
                cat_data['content'].append(match.content)
                cat_data['total_words'] += len(match.content.split())
                cat_data['confidence_scores'].append(match.confidence)
                cat_data['keyword_matches'].update(match.keyword_matches)
                cat_data['sources'].append(f"chunk_{i}")
            
            if (i + 1) % 50 == 0:
                logger.info(f"Processed {i + 1}/{len(chunks)} chunks")
        
        final_content = {}
        
        for category, data in categorized_content.items():
            if data['content']:
                combined_content = '\n\n'.join(data['content'])
                
                avg_confidence = sum(data['confidence_scores']) / len(data['confidence_scores'])
                
                final_content[category] = {
                    'content': combined_content,
                    'word_count': data['total_words'],
                    'avg_confidence': avg_confidence,
                    'keyword_matches': list(data['keyword_matches']),
                    'chunk_count': len(data['content']),
                    'quality_score': self.calculate_quality_score(
                        combined_content, data['total_words'], avg_confidence
                    )
                }
            else:
                final_content[category] = {
                    'content': '',
                    'word_count': 0,
                    'avg_confidence': 0.0,
                    'keyword_matches': [],
                    'chunk_count': 0,
                    'quality_score': 0.0
                }
        
        logger.info("Content categorization completed")
        return final_content
    
    def calculate_quality_score(self, content: str, word_count: int, confidence: float) -> float:
        """Calculate overall quality score for categorized content."""
        if word_count == 0:
            return 0.0
        
        score = confidence * 10
        
        if word_count >= HandbookConfig.MIN_WORDS_PER_CATEGORY:
            score += 20
        elif word_count >= HandbookConfig.MIN_WORDS_PER_CATEGORY * 0.5:
            score += 10
        
        sentences = len(self.extract_sentences(content))
        if sentences > 5:
            score += 10
        elif sentences > 2:
            score += 5
        
        return min(score, 100.0)
    
    def validate_categorization(self, categorized_content: Dict) -> Dict:
        """Validate and provide feedback on categorization quality."""
        validation_report = {
            'total_categories': len(self.categories),
            'categories_with_content': 0,
            'categories_meeting_minimum': 0,
            'average_quality_score': 0.0,
            'recommendations': []
        }
        
        quality_scores = []
        
        for category, data in categorized_content.items():
            if data['word_count'] > 0:
                validation_report['categories_with_content'] += 1
                quality_scores.append(data['quality_score'])
                
                if data['word_count'] >= HandbookConfig.MIN_WORDS_PER_CATEGORY:
                    validation_report['categories_meeting_minimum'] += 1
                else:
                    validation_report['recommendations'].append(
                        f"Category '{category}' has only {data['word_count']} words "
                        f"(minimum: {HandbookConfig.MIN_WORDS_PER_CATEGORY})"
                    )
        
        if quality_scores:
            validation_report['average_quality_score'] = sum(quality_scores) / len(quality_scores)
        
        if validation_report['categories_with_content'] < len(self.categories) * 0.8:
            validation_report['recommendations'].append(
                "Consider reviewing the handbook for more comprehensive content coverage"
            )
        
        return validation_report 