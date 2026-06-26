"""Docling client for document processing."""

import asyncio
import httpx
import logging
from typing import Dict, Any, List
from pathlib import Path
import aiofiles
from datetime import datetime

logger = logging.getLogger(__name__)

class DoclingClient:
    """Client for communicating with Docling service."""
    
    def __init__(self, base_url: str = "http://localhost:5001"):
        """Initialize Docling client.
        
        Args:
            base_url: Base URL of the Docling service
        """
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=300.0)  # 5 minute timeout for large documents
        self._health_checked = False
    
    async def __aenter__(self):
        """Async context manager entry."""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.client.aclose()
    
    async def health_check(self) -> bool:
        """Check if Docling service is available.
        
        Returns:
            bool: True if service is healthy, False otherwise
        """
        try:
            response = await self.client.get(f"{self.base_url}/health")
            self._health_checked = response.status_code == 200
            return self._health_checked
        except Exception as e:
            logger.error(f"Docling health check failed: {e}")
            return False
    
    async def convert_document_from_path(
        self, 
        file_path: str,
        output_format: str = "markdown"
    ) -> Dict[str, Any]:
        """Convert document from local file path using Docling.
        
        Args:
            file_path: Path to the document file
            output_format: Output format (markdown, json, etc.)
            
        Returns:
            Dict containing conversion result
        """
        try:
            if not self._health_checked:
                if not await self.health_check():
                    raise Exception("Docling service is not available")
            
            # Read file and prepare for upload
            async with aiofiles.open(file_path, 'rb') as f:
                file_content = await f.read()
            
            file_name = Path(file_path).name
            
            # Prepare multipart form data
            files = {
                'file': (file_name, file_content, 'application/pdf')
            }
            
            # Convert using Docling file endpoint  
            response = await self.client.post(
                f"{self.base_url}/v1alpha/convert/file",
                files={'files': (file_name, file_content, 'application/pdf')},
                data={'to_formats': ['md']}
            )
            
            response.raise_for_status()
            result = response.json()
            
            return {
                "success": True,
                "document": result.get("document", {}),
                "md_content": result.get("document", {}).get("md_content", ""),
                "json_content": result.get("document", {}).get("json_content"),
                "metadata": {
                    "source": "docling",
                    "processing_time": result.get("processing_time"),
                    "file_name": file_name,
                    "converted_at": datetime.utcnow().isoformat(),
                    "status": result.get("status")
                }
            }
            
        except httpx.HTTPError as e:
            logger.error(f"HTTP error in Docling conversion: {e}")
            return {
                "success": False,
                "error": f"HTTP error: {str(e)}",
                "error_type": "http_error"
            }
        except Exception as e:
            logger.error(f"Error in Docling document conversion: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "conversion_error"
            }
    
    async def convert_document_from_url(
        self, 
        url: str,
        output_format: str = "markdown"
    ) -> Dict[str, Any]:
        """Convert document from URL using Docling.
        
        Args:
            url: URL of the document to convert
            output_format: Output format (markdown, json, etc.)
            
        Returns:
            Dict containing conversion result
        """
        try:
            if not self._health_checked:
                if not await self.health_check():
                    raise Exception("Docling service is not available")
            
            data = {
                "http_sources": [{"url": url}],
                "output_format": output_format
            }
            
            response = await self.client.post(
                f"{self.base_url}/v1alpha/convert/source",
                json=data,
                headers={"Content-Type": "application/json"}
            )
            
            response.raise_for_status()
            result = response.json()
            
            return {
                "success": True,
                "document": result.get("document", {}),
                "md_content": result.get("document", {}).get("md_content", ""),
                "metadata": {
                    "source": "docling",
                    "processing_time": result.get("processing_time"),
                    "source_url": url,
                    "converted_at": datetime.utcnow().isoformat()
                }
            }
            
        except httpx.HTTPError as e:
            logger.error(f"HTTP error in Docling URL conversion: {e}")
            return {
                "success": False,
                "error": f"HTTP error: {str(e)}",
                "error_type": "http_error"
            }
        except Exception as e:
            logger.error(f"Error in Docling URL conversion: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "conversion_error"
            }
    
    async def batch_convert(
        self, 
        file_paths: List[str],
        output_format: str = "markdown"
    ) -> List[Dict[str, Any]]:
        """Batch convert multiple documents.
        
        Args:
            file_paths: List of file paths to convert
            output_format: Output format for all documents
            
        Returns:
            List of conversion results
        """
        tasks = []
        for file_path in file_paths:
            task = self.convert_document_from_path(file_path, output_format)
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results and handle exceptions
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                processed_results.append({
                    "success": False,
                    "error": str(result),
                    "file_path": file_paths[i],
                    "error_type": "batch_conversion_error"
                })
            else:
                processed_results.append(result)
        
        return processed_results
    
    async def get_service_status(self) -> Dict[str, Any]:
        """Get detailed status of Docling service.
        
        Returns:
            Dict containing service status information
        """
        try:
            # Check health
            health_ok = await self.health_check()
            
            # Try to get service info
            info_response = await self.client.get(f"{self.base_url}/info")
            service_info = info_response.json() if info_response.status_code == 200 else {}
            
            return {
                "healthy": health_ok,
                "base_url": self.base_url,
                "service_info": service_info,
                "checked_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {
                "healthy": False,
                "base_url": self.base_url,
                "error": str(e),
                "checked_at": datetime.utcnow().isoformat()
            } 