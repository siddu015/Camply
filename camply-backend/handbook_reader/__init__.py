"""
Handbook Reader - PDF Processing for Camply

Core components for processing academic handbooks into structured JSON data.
Integrated into main.py FastAPI service.
"""

from .config import HandbookConfig
from .pdf_processor import HandbookProcessor, validate_pdf, get_pdf_info
from .content_extractor import ContentExtractor
from .json_generator import HandbookJSONGenerator
from .database_updater import HandbookDatabaseUpdater

__all__ = [
    'HandbookConfig',
    'HandbookProcessor',
    'validate_pdf',
    'get_pdf_info',
    'ContentExtractor',
    'HandbookJSONGenerator',
    'HandbookDatabaseUpdater'
] 