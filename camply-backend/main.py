from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
import httpx
from contextlib import asynccontextmanager
import tempfile
from pathlib import Path

from shared import Config

try:
    from handbook_reader.config import HandbookConfig
    from handbook_reader.pdf_processor import HandbookProcessor, validate_pdf, get_pdf_info
    from handbook_reader.content_extractor import ContentExtractor
    from handbook_reader.json_generator import HandbookJSONGenerator
    from handbook_reader.database_updater import HandbookDatabaseUpdater
    HANDBOOK_AVAILABLE = True
except ImportError as e:
    print(f"Handbook reader not available: {e}")
    HANDBOOK_AVAILABLE = False

class ChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    response: str
    agent_used: str
    success: bool
    error: Optional[str] = None

class HandbookProcessRequest(BaseModel):
    user_id: str
    academic_id: str
    storage_path: str
    original_filename: str
    file_size_bytes: int

class ProcessingStatus(BaseModel):
    status: str
    message: str
    handbook_id: Optional[str] = None
    progress: Optional[int] = None
    error: Optional[str] = None

class ValidationResult(BaseModel):
    is_valid: bool
    message: str
    info: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Bridge service initialized - connecting to ADK server")
    print(f"ADK Server: {Config.ADK_SERVER_URL}")
    
    if HANDBOOK_AVAILABLE:
        print("Handbook processing service enabled")
        app.state.content_extractor = ContentExtractor()
        app.state.json_generator = HandbookJSONGenerator()
        app.state.database_updater = HandbookDatabaseUpdater()
        
        if app.state.database_updater.validate_database_connection():
            print("Handbook database connection validated")
        else:
            print("WARNING: Handbook database connection failed")
    else:
        print("Handbook processing service disabled")
    
    yield
    print("Shutting down bridge service...")

app = FastAPI(
    title="Camply Agent Bridge",
    description="Bridge service connecting Camply frontend to ADK agents",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Camply Agent Bridge is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{Config.ADK_SERVER_URL}/")
            adk_status = "ready" if response.status_code == 200 else "error"
    except:
        adk_status = "not_connected"
    
    return {
        "status": "healthy",
        "adk_server_status": adk_status,
        "adk_server_url": Config.ADK_SERVER_URL
    }

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Bridge endpoint that forwards chat requests to the ADK student_desk agent.
    """
    try:
        if not request.user_id:
            return ChatResponse(
                response="I need to know who you are to provide personalized assistance. Please log in.",
                agent_used="student_desk",
                success=False,
                error="user_id_required"
            )
        
        if (request.context and 
            request.context.get('type') == 'handbook_processing' and 
            request.context.get('action') == 'process' and
            request.context.get('handbook_id')):
            
            return await handle_handbook_processing_request(request)
        
        session_id = request.session_id or f"session_{request.user_id}_{hash(request.message) % 10000}"
        
        print(f"Processing chat request for user: {request.user_id}")
        print(f"Message: {request.message[:100]}...")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                session_response = await client.post(
                    f"{Config.ADK_SERVER_URL}/apps/{Config.ADK_APP_NAME}/users/{request.user_id}/sessions/{session_id}",
                    json={
                        "user_id": request.user_id,
                        "session_type": "chat",
                        "created_from": "main_bridge"
                    },
                    headers={"Content-Type": "application/json"}
                )
                print(f"Session created/accessed: {session_response.status_code}")
            except Exception as e:
                print(f"Session handling (might already exist): {e}")
                pass
            
            adk_response = await client.post(
                f"{Config.ADK_SERVER_URL}/run",
                json={
                    "appName": Config.ADK_APP_NAME,
                    "userId": request.user_id,
                    "sessionId": session_id,
                    "newMessage": {
                        "role": "user",
                        "parts": [{"text": request.message}]
                    }
                },
                headers={"Content-Type": "application/json"}
            )
            
            print(f"ADK Response Status: {adk_response.status_code}")
            
            if adk_response.status_code != 200:
                error_text = adk_response.text
                print(f"ADK Error Response: {error_text}")
                raise HTTPException(status_code=500, detail=f"ADK server error: {adk_response.status_code}")
            
            adk_data = adk_response.json()
            print(f"ADK Data Type: {type(adk_data)}, Length: {len(adk_data) if isinstance(adk_data, list) else 'N/A'}")
            
            agent_response = "Hello! I'm your Student Desk Assistant. How can I help you today?"
            
            if isinstance(adk_data, list) and len(adk_data) > 0:
                for event in reversed(adk_data):
                    if (event.get("content", {}).get("role") == "model" and 
                        event.get("content", {}).get("parts")):
                        parts = event["content"]["parts"]
                        for part in parts:
                            if "text" in part:
                                agent_response = part["text"]
                                print(f"Found agent response: {agent_response[:100]}...")
                                break
                        if "Hello!" not in agent_response or len(agent_response) > 100:
                            break
        
        print(f"Agent response: {agent_response[:100]}...")
        
        return ChatResponse(
            response=agent_response,
            agent_used="student_desk",
            success=True
        )
        
    except Exception as e:
        print(f"Error processing chat: {e}")
        return ChatResponse(
            response="I apologize, but I'm having trouble processing your request right now. Please try again.",
            agent_used="student_desk",
            success=False,
            error=str(e)
        )

async def handle_handbook_processing_request(request: ChatRequest) -> ChatResponse:
    """Handle handbook processing requests triggered from frontend upload."""
    try:
        if not HANDBOOK_AVAILABLE:
            return ChatResponse(
                response="I apologize, but handbook processing is currently unavailable. Please try again later.",
                agent_used="handbook_processor", 
                success=False,
                error="handbook_service_unavailable"
            )
        
        handbook_id = request.context.get('handbook_id')
        user_id = request.user_id
        
        print(f"Processing handbook {handbook_id} for user {user_id}")
        
        from supabase import create_client
        from shared.config import Config
        
        supabase = create_client(Config.SUPABASE_URL, Config.get_supabase_backend_key())
        
        handbook_response = supabase.table('user_handbooks') \
            .select('*') \
            .eq('handbook_id', handbook_id) \
            .eq('user_id', user_id) \
            .single() \
            .execute()
        
        if not handbook_response.data:
            return ChatResponse(
                response="I couldn't find the handbook you uploaded. Please try uploading it again.",
                agent_used="handbook_processor",
                success=False,
                error="handbook_not_found"
            )
        
        handbook = handbook_response.data
           
        from fastapi import BackgroundTasks
        background_tasks = BackgroundTasks()
        background_tasks.add_task(
            process_handbook_background,
            handbook_id,
            handbook['storage_path'],
            app.state.content_extractor,
            app.state.json_generator,
            app.state.database_updater
        )
        
        await process_handbook_background(
            handbook_id,
            handbook['storage_path'],
            app.state.content_extractor,
            app.state.json_generator,
            app.state.database_updater
        )
        
        return ChatResponse(
            response=f"Great! I've started processing your handbook '{handbook['original_filename']}'. This usually takes 1-2 minutes. I'll extract all the important information like examination rules, attendance policies, course details, and more. You can ask me questions about your handbook once processing is complete!",
            agent_used="handbook_processor",
            success=True
        )
        
    except Exception as e:
        print(f"Error in handbook processing request: {e}")
        return ChatResponse(
            response="I encountered an error while processing your handbook. Please try again or contact support if the issue persists.",
            agent_used="handbook_processor",
            success=False,
            error=str(e)
        )

@app.post("/handbook/process", response_model=ProcessingStatus)
async def process_handbook(request: HandbookProcessRequest, background_tasks: BackgroundTasks):
    """Start processing a handbook PDF."""
    if not HANDBOOK_AVAILABLE:
        raise HTTPException(status_code=503, detail="Handbook processing service not available")
    
    try:
        if not app.state.database_updater.validate_database_connection():
            raise HTTPException(
                status_code=503, 
                detail="Database connection unavailable"
            )
        
        # Check if handbook record already exists or create new one
        handbook_id = None
        
        # First try to find existing handbook with same storage path
        from supabase import create_client
        from shared.config import Config
        
        supabase = create_client(Config.SUPABASE_URL, Config.get_supabase_backend_key())
        
        existing_response = supabase.table('user_handbooks') \
            .select('handbook_id') \
            .eq('user_id', request.user_id) \
            .eq('storage_path', request.storage_path) \
            .execute()
        
        if existing_response.data and len(existing_response.data) > 0:
            # Use existing handbook
            handbook_id = existing_response.data[0]['handbook_id']
            print(f"Found existing handbook: {handbook_id}")
        else:
            # Create new handbook record
            handbook_id = app.state.database_updater.create_handbook_record(
                user_id=request.user_id,
                academic_id=request.academic_id,
                storage_path=request.storage_path,
                original_filename=request.original_filename,
                file_size_bytes=request.file_size_bytes
            )
            print(f"Created new handbook: {handbook_id}")
        
        if not handbook_id:
            raise HTTPException(
                status_code=500,
                detail="Failed to get or create handbook record"
            )
        
        background_tasks.add_task(
            process_handbook_background,
            handbook_id,
            request.storage_path,
            app.state.content_extractor,
            app.state.json_generator,
            app.state.database_updater
        )
        
        return ProcessingStatus(
            status="processing",
            message="Handbook processing started",
            handbook_id=handbook_id
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/handbook/process-existing/{handbook_id}", response_model=ProcessingStatus)
async def process_existing_handbook(handbook_id: str, background_tasks: BackgroundTasks):
    """Process an existing handbook that was already uploaded."""
    if not HANDBOOK_AVAILABLE:
        raise HTTPException(status_code=503, detail="Handbook processing service not available")
    
    try:
        # Validate database connection
        if not app.state.database_updater.validate_database_connection():
            raise HTTPException(
                status_code=503, 
                detail="Database connection unavailable"
            )
        
        # Get handbook record from database
        from supabase import create_client
        from shared.config import Config
        
        supabase = create_client(Config.SUPABASE_URL, Config.get_supabase_backend_key())
        
        handbook_response = supabase.table('user_handbooks') \
            .select('*') \
            .eq('handbook_id', handbook_id) \
            .single() \
            .execute()
        
        if not handbook_response.data:
            raise HTTPException(
                status_code=404,
                detail=f"Handbook with ID {handbook_id} not found"
            )
        
        handbook = handbook_response.data
        print(f"Processing existing handbook: {handbook['original_filename']}")
        
        # Start background processing
        background_tasks.add_task(
            process_handbook_background,
            handbook_id,
            handbook['storage_path'],
            app.state.content_extractor,
            app.state.json_generator,
            app.state.database_updater
        )
        
        return ProcessingStatus(
            status="processing",
            message=f"Started processing handbook: {handbook['original_filename']}",
            handbook_id=handbook_id
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/handbook/status/{handbook_id}", response_model=ProcessingStatus)
async def get_processing_status(handbook_id: str):
    """Get processing status for a handbook."""
    if not HANDBOOK_AVAILABLE:
        raise HTTPException(status_code=503, detail="Handbook processing service not available")
    
    try:
        status = app.state.database_updater.get_processing_status(handbook_id)
        return ProcessingStatus(**status)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/handbook/validate", response_model=ValidationResult)
async def validate_handbook(file: UploadFile = File(...)):
    """Validate uploaded PDF before processing."""
    if not HANDBOOK_AVAILABLE:
        raise HTTPException(status_code=503, detail="Handbook processing service not available")
    
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name
        
        is_valid = validate_pdf(temp_path)
        
        if is_valid:
            pdf_info = get_pdf_info(temp_path)
            return ValidationResult(
                is_valid=True,
                message="Valid PDF file",
                info=pdf_info
            )
        else:
            return ValidationResult(
                is_valid=False,
                message="Invalid or corrupted PDF file"
            )
    except Exception as e:
        return ValidationResult(
            is_valid=False,
            message="Validation failed",
            error=str(e)
        )
    finally:
        try:
            Path(temp_path).unlink()
        except:
            pass

async def process_handbook_background(
    handbook_id: str, 
    storage_path: str,
    content_extractor: ContentExtractor,
    json_generator: HandbookJSONGenerator,
    database_updater: HandbookDatabaseUpdater
):
    """Background task for processing handbook PDFs."""
    import logging
    import asyncio
    
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"Starting background processing for handbook {handbook_id}")
        
        database_updater.update_processing_status(handbook_id, "processing")
        
        pdf_path = await download_from_storage(storage_path)
        
        if not pdf_path or not Path(pdf_path).exists():
            raise Exception(f"Failed to download file from storage: {storage_path}")
        
        logger.info(f"Processing PDF: {pdf_path}")
        processor = HandbookProcessor(pdf_path)
        
        if not processor.open_document():
            raise Exception("Failed to open PDF document")

        pdf_content = processor.extract_all_content()
        processor.close()
        
        logger.info(f"Extracted {pdf_content['total_words']} words from {pdf_content['total_pages']} pages")
        
        logger.info("Starting content categorization")
        categorized_content = content_extractor.extract_categorized_content(
            pdf_content['total_text']
        )
        
        validation_report = content_extractor.validate_categorization(categorized_content)
        logger.info(f"Categorization complete. Quality score: {validation_report['average_quality_score']:.1f}")
        
        logger.info("Generating structured JSON")
        handbook_json = json_generator.generate_handbook_json(
            categorized_content,
            processing_metadata={
                "total_pages": pdf_content['total_pages'],
                "total_words": pdf_content['total_words'],
                "validation_score": validation_report['average_quality_score']
            }
        )
        
        database_format = json_generator.format_for_database(handbook_json)
        
        json_validation = json_generator.validate_json_structure(database_format)
        if not json_validation["is_valid"]:
            logger.warning(f"JSON validation warnings: {json_validation['errors']}")
        
        logger.info("Storing processed content in database")
        success = database_updater.store_processed_content(handbook_id, database_format)
        
        if not success:
            raise Exception("Failed to store processed content")
        
        cleanup_temp_file(pdf_path)
        
        logger.info(f"Successfully completed processing for handbook {handbook_id}")
        
    except Exception as e:
        logger.error(f"Error processing handbook {handbook_id}: {e}")
        database_updater.update_processing_status(handbook_id, "failed", str(e))
        
        if 'pdf_path' in locals():
            cleanup_temp_file(pdf_path)

async def download_from_storage(storage_path: str) -> Optional[str]:
    """Download file from Supabase storage to local temp file."""
    try:
        from supabase import create_client
        from shared.config import Config
        
        supabase = create_client(Config.SUPABASE_URL, Config.get_supabase_backend_key())
        
        response = supabase.storage.from_("handbooks").download(storage_path)
        
        if response:
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                temp_file.write(response)
                return temp_file.name
                
        return None
    except Exception as e:
        print(f"Error downloading from storage: {e}")
        return None

def cleanup_temp_file(file_path: str):
    """Cleanup temporary files."""
    try:
        Path(file_path).unlink()
    except Exception as e:
        print(f"Failed to cleanup temp file {file_path}: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=Config.PORT, reload=True)