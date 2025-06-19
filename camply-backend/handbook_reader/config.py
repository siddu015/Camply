"""Configuration settings for Handbook Reader service."""

import os
from typing import Dict, List

class HandbookConfig:
    """Configuration for handbook processing."""
    
    MAX_FILE_SIZE_MB = 100
    SUPPORTED_FORMATS = ['.pdf']
    
    MIN_WORDS_PER_CATEGORY = 200
    MAX_TEXT_LENGTH = 50000  
    
    HANDBOOK_CATEGORIES = {
        'basic_info': {
            'keywords': [
                'institution', 'college', 'university', 'contact', 'address', 'phone',
                'email', 'website', 'established', 'founded', 'mission', 'vision',
                'about', 'overview', 'general information', 'introduction'
            ],
            'description': 'Institution details, contact info, general policies'
        },
        'semester_structure': {
            'keywords': [
                'semester', 'academic year', 'term', 'schedule', 'calendar',
                'duration', 'break', 'vacation', 'structure', 'system'
            ],
            'description': 'Academic calendar, semester breakdown'
        },
        'examination_rules': {
            'keywords': [
                'examination', 'exam', 'test', 'assessment', 'evaluation',
                'rules', 'procedure', 'conduct', 'malpractice', 'cheating'
            ],
            'description': 'Exam procedures, schedules, regulations'
        },
        'evaluation_criteria': {
            'keywords': [
                'grading', 'marking', 'assessment', 'evaluation', 'criteria',
                'scale', 'points', 'percentage', 'grade', 'mark'
            ],
            'description': 'Grading systems, assessment methods'
        },
        'attendance_policies': {
            'keywords': [
                'attendance', 'presence', 'absence', 'leave', 'policy',
                'requirement', 'minimum', 'percentage', 'compulsory'
            ],
            'description': 'Attendance requirements, procedures'
        },
        'academic_calendar': {
            'keywords': [
                'calendar', 'dates', 'schedule', 'timeline', 'deadline',
                'important dates', 'events', 'holidays', 'vacation'
            ],
            'description': 'Important dates, holidays, deadlines'
        },
        'course_details': {
            'keywords': [
                'course', 'subject', 'syllabus', 'curriculum', 'program',
                'module', 'unit', 'credit', 'prerequisite', 'elective'
            ],
            'description': 'Course descriptions, prerequisites, credits'
        },
        'assessment_methods': {
            'keywords': [
                'assessment', 'test', 'assignment', 'project', 'practical',
                'lab', 'viva', 'presentation', 'internal', 'external'
            ],
            'description': 'Testing formats, project guidelines'
        },
        'disciplinary_rules': {
            'keywords': [
                'discipline', 'conduct', 'behavior', 'rules', 'regulations',
                'violation', 'punishment', 'penalty', 'suspension', 'ragging'
            ],
            'description': 'Conduct policies, disciplinary procedures'
        },
        'graduation_requirements': {
            'keywords': [
                'graduation', 'degree', 'diploma', 'certificate', 'completion',
                'requirement', 'criteria', 'eligibility', 'minimum'
            ],
            'description': 'Degree requirements, prerequisites'
        },
        'fee_structure': {
            'keywords': [
                'fee', 'fees', 'tuition', 'cost', 'payment', 'scholarship',
                'financial', 'installment', 'refund', 'due date'
            ],
            'description': 'Tuition, fees, payment policies'
        },
        'facilities_rules': {
            'keywords': [
                'library', 'hostel', 'cafeteria', 'laboratory', 'computer',
                'facility', 'infrastructure', 'equipment', 'rules', 'usage'
            ],
            'description': 'Library, lab, hostel regulations'
        }
    }
    
    SPACY_MODEL = "en_core_web_sm"
    
    CHUNK_SIZE = 1000  
    OVERLAP_SIZE = 200  
    
    @classmethod
    def get_category_keywords(cls, category: str) -> List[str]:
        """Get keywords for a specific category."""
        return cls.HANDBOOK_CATEGORIES.get(category, {}).get('keywords', [])
    
    @classmethod
    def get_all_categories(cls) -> List[str]:
        """Get all available categories."""
        return list(cls.HANDBOOK_CATEGORIES.keys())
    
    @classmethod
    def validate_category(cls, category: str) -> bool:
        """Validate if category exists."""
        return category in cls.HANDBOOK_CATEGORIES 