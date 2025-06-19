"""Core PDF processing using PyMuPDF for handbook text extraction."""

import pymupdf
import logging
import re
from typing import Dict, List, Optional, Tuple
from pathlib import Path
from dataclasses import dataclass
from .config import HandbookConfig

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class PageContent:
    """Structure for page content data."""
    page_number: int
    text: str
    images: List[Dict]
    tables: List[Dict]
    headers: List[str]
    metadata: Dict

@dataclass 
class DocumentMetadata:
    """Structure for document metadata."""
    title: str
    author: str
    subject: str
    creator: str
    producer: str
    creation_date: str
    modification_date: str
    page_count: int
    file_size: int

class HandbookProcessor:
    """Advanced PDF processor for academic handbooks using PyMuPDF."""
    
    def __init__(self, pdf_path: str):
        """Initialize processor with PDF path."""
        self.pdf_path = Path(pdf_path)
        self.doc = None
        self.metadata = None
        self.pages_content = []
        
        if not self.pdf_path.exists():
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")
        
        file_size_mb = self.pdf_path.stat().st_size / (1024 * 1024)
        if file_size_mb > HandbookConfig.MAX_FILE_SIZE_MB:
            raise ValueError(f"File size {file_size_mb:.1f}MB exceeds limit of {HandbookConfig.MAX_FILE_SIZE_MB}MB")
    
    def open_document(self) -> bool:
        """Open and validate the PDF document."""
        try:
            self.doc = pymupdf.open(str(self.pdf_path))
            logger.info(f"Opened PDF: {self.pdf_path.name} with {len(self.doc)} pages")
            return True
        except Exception as e:
            logger.error(f"Failed to open PDF {self.pdf_path}: {e}")
            return False
    
    def extract_metadata(self) -> DocumentMetadata:
        """Extract document metadata."""
        if not self.doc:
            raise ValueError("Document not opened")
        
        metadata = self.doc.metadata
        
        self.metadata = DocumentMetadata(
            title=metadata.get('title', self.pdf_path.stem),
            author=metadata.get('author', ''),
            subject=metadata.get('subject', ''),
            creator=metadata.get('creator', ''),
            producer=metadata.get('producer', ''),
            creation_date=metadata.get('creationDate', ''),
            modification_date=metadata.get('modDate', ''),
            page_count=len(self.doc),
            file_size=self.pdf_path.stat().st_size
        )
        
        return self.metadata
    
    def extract_text_from_page(self, page) -> Tuple[str, List[str]]:
        """Extract text and headers from a single page."""
        text = page.get_text()
        
        headers = []
        blocks = page.get_text("dict")["blocks"]
        
        for block in blocks:
            if "lines" in block:
                for line in block["lines"]:
                    for span in line["spans"]:
                        if span["size"] > 12 and span["flags"] & 2**4:  
                            header_text = span["text"].strip()
                            if len(header_text) > 3 and header_text not in headers:
                                headers.append(header_text)
        
        return text, headers
    
    def extract_tables_from_page(self, page) -> List[Dict]:
        """Extract tables from a page."""
        tables = []
        try:
            table_finder = page.find_tables()
            
            for table in table_finder:
                table_data = table.extract()
                if table_data and len(table_data) > 1:  
                    tables.append({
                        "data": table_data,
                        "bbox": table.bbox,
                        "rows": len(table_data),
                        "cols": len(table_data[0]) if table_data else 0
                    })
        except Exception as e:
            logger.warning(f"Table extraction failed for page {page.number}: {e}")
        
        return tables
    
    def extract_images_from_page(self, page) -> List[Dict]:
        """Extract image information from a page."""
        images = []
        
        try:
            image_list = page.get_images()
            
            for img_index, img in enumerate(image_list):
                img_dict = {
                    "index": img_index,
                    "xref": img[0],
                    "smask": img[1],
                    "width": img[2],
                    "height": img[3],
                    "bpc": img[4],
                    "colorspace": img[5],
                    "alt": img[6],
                    "name": img[7],
                    "filter": img[8]
                }
                images.append(img_dict)
                
        except Exception as e:
            logger.warning(f"Image extraction failed for page {page.number}: {e}")
        
        return images
    
    def process_page(self, page_num: int) -> PageContent:
        """Process a single page and extract all content."""
        page = self.doc[page_num]
        
        text, headers = self.extract_text_from_page(page)
        
        tables = self.extract_tables_from_page(page)
        
        images = self.extract_images_from_page(page)
        
        metadata = {
            "rotation": page.rotation,
            "mediabox": list(page.mediabox),
            "cropbox": list(page.cropbox),
            "word_count": len(text.split()),
            "char_count": len(text)
        }
        
        return PageContent(
            page_number=page_num + 1,  
            text=text,
            images=images,
            tables=tables,
            headers=headers,
            metadata=metadata
        )
    
    def extract_all_content(self) -> Dict:
        """Extract content from all pages."""
        if not self.doc:
            if not self.open_document():
                raise ValueError("Failed to open document")
        
        doc_metadata = self.extract_metadata()
        
        all_content = []
        total_text = ""
        all_headers = []
        all_tables = []
        
        logger.info(f"Processing {len(self.doc)} pages...")
        
        for page_num in range(len(self.doc)):
            try:
                page_content = self.process_page(page_num)
                all_content.append(page_content)
                
                total_text += page_content.text + "\n"
                all_headers.extend(page_content.headers)
                all_tables.extend(page_content.tables)
                
                if (page_num + 1) % 10 == 0:
                    logger.info(f"Processed {page_num + 1}/{len(self.doc)} pages")
                    
            except Exception as e:
                logger.error(f"Failed to process page {page_num + 1}: {e}")
                continue
        
        total_text = self.clean_text(total_text)
        
        return {
            "metadata": doc_metadata,
            "total_text": total_text,
            "total_pages": len(all_content),
            "total_words": len(total_text.split()),
            "total_chars": len(total_text),
            "headers": list(set(all_headers)),  
            "tables": all_tables,
            "pages": all_content,
            "processing_stats": {
                "processed_pages": len(all_content),
                "total_pages": len(self.doc),
                "success_rate": len(all_content) / len(self.doc) * 100
            }
        }
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize extracted text."""
        text = re.sub(r'\s+', ' ', text)
        
        text = re.sub(r'\b\d+\s*$', '', text, flags=re.MULTILINE)
        
        text = re.sub(r'\n\s*\n\s*\n', '\n\n', text)
        
        text = text.replace('|', 'l')  
        text = text.replace('0', 'O')  
        
        return text.strip()
    
    def get_document_structure(self) -> Dict:
        """Analyze document structure using headers and content."""
        if not self.pages_content:
            content = self.extract_all_content()
            headers = content.get("headers", [])
        else:
            headers = []
            for page in self.pages_content:
                headers.extend(page.headers)
        
        structure = {
            "chapters": [],
            "sections": [],
            "subsections": []
        }
        
        for header in headers:
            header_len = len(header.split())
            if header_len <= 3:
                structure["chapters"].append(header)
            elif header_len <= 6:
                structure["sections"].append(header)
            else:
                structure["subsections"].append(header)
        
        return structure
    
    def close(self):
        """Close the document."""
        if self.doc:
            self.doc.close()
            self.doc = None

def validate_pdf(pdf_path: str) -> bool:
    """Validate if file is a readable PDF."""
    try:
        doc = pymupdf.open(pdf_path)
        is_valid = len(doc) > 0
        doc.close()
        return is_valid
    except Exception:
        return False

def get_pdf_info(pdf_path: str) -> Dict:
    """Get basic PDF information without full processing."""
    try:
        doc = pymupdf.open(pdf_path)
        metadata = doc.metadata
        
        info = {
            "page_count": len(doc),
            "title": metadata.get('title', Path(pdf_path).stem),
            "author": metadata.get('author', ''),
            "file_size": Path(pdf_path).stat().st_size,
            "is_encrypted": doc.needs_pass,
            "is_valid": True
        }
        
        doc.close()
        return info
    except Exception as e:
        return {
            "is_valid": False,
            "error": str(e)
        } 