from fastapi import FastAPI, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import httpx
from contextlib import asynccontextmanager

# Use config from student_desk tools instead of shared
from student_desk.tools.config import Config

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

class ProcessingResponse(BaseModel):
    success: bool
    message: str
    processing_id: Optional[str] = None
    error: Optional[str] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Camply Bridge Service - Pure ADK Bridge Architecture")
    print(f"ADK Server: {Config.ADK_SERVER_URL}")
    print("All processing handled by ADK agents with docling service")
    
    # Test ADK connection on startup
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{Config.ADK_SERVER_URL}/", timeout=5.0)
            print(f"ADK Server Connection: {response.status_code}")
    except Exception as e:
        print(f"⚠️  WARNING: Cannot connect to ADK server: {e}")
        print("⚠️  Make sure ADK server is running on http://localhost:8000")
    
    yield
    print("Shutting down bridge service...")

app = FastAPI(
    title="Camply Agent Bridge",
    description="Pure bridge service connecting Camply frontend to ADK agents",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Camply Agent Bridge - Pure ADK Architecture", "status": "healthy"}

@app.get("/health")
async def health_check():
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{Config.ADK_SERVER_URL}/", timeout=5.0)
            adk_status = "ready" if response.status_code == 200 else f"error_{response.status_code}"
    except Exception as e:
        adk_status = f"not_connected_{str(e)[:50]}"
    
    return {
        "status": "healthy",
        "adk_server_status": adk_status,
        "adk_server_url": Config.ADK_SERVER_URL,
        "architecture": "pure_bridge_to_adk"
    }

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Bridge endpoint that forwards chat requests to the ADK student_desk agent.
    Properly handles session state with user_id for ADK agents.
    """
    try:
        if not request.user_id:
            return ChatResponse(
                response="I need to know who you are to provide personalized assistance. Please log in.",
                agent_used="student_desk",
                success=False,
                error="user_id_required"
            )
        
        session_id = request.session_id or f"chat_{request.user_id}_{hash(request.message) % 10000}"
        
        print(f"Processing chat request for user: {request.user_id}")
        print(f"Message: {request.message[:100]}...")
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            # CRITICAL: Create session with user_id in initial state for ADK agents
            try:
                session_response = await client.post(
                    f"{Config.ADK_SERVER_URL}/apps/{Config.ADK_APP_NAME}/users/{request.user_id}/sessions/{session_id}",
                    json={
                        "initial_state": {
                            "user_id": request.user_id  # CRITICAL: This is what ADK agents need
                        },
                        "session_type": "chat",
                        "created_from": "main_bridge"
                    },
                    headers={"Content-Type": "application/json"}
                )
                print(f"Session created/accessed: {session_response.status_code}")
                if session_response.status_code not in [200, 201]:
                    print(f"Session response: {session_response.text}")
            except Exception as e:
                print(f"Session handling error: {e}")
                # Continue anyway - session might already exist
            
            # Send message to ADK with proper session state
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
                
                # Return helpful error based on status code
                if adk_response.status_code == 404:
                    return ChatResponse(
                        response="The AI assistant is not available right now. Please make sure the ADK server is running.",
                        agent_used="student_desk",
                        success=False,
                        error="adk_server_not_found"
                    )
                elif adk_response.status_code == 500:
                    return ChatResponse(
                        response="The AI assistant encountered an internal error. This might be due to missing user context or database issues.",
                        agent_used="student_desk", 
                        success=False,
                        error="adk_internal_error"
                    )
                else:
                    return ChatResponse(
                        response=f"The AI assistant is having technical difficulties (Error {adk_response.status_code}). Please try again.",
                        agent_used="student_desk",
                        success=False,
                        error=f"adk_error_{adk_response.status_code}"
                    )
            
            adk_data = adk_response.json()
            
            # Extract response from ADK events
            agent_response = "Hello! I'm your Student Desk Assistant. How can I help you today?"
            
            if isinstance(adk_data, list) and len(adk_data) > 0:
                for event in reversed(adk_data):
                    if (event.get("content", {}).get("role") == "model" and 
                        event.get("content", {}).get("parts")):
                        parts = event["content"]["parts"]
                        for part in parts:
                            if "text" in part:
                                agent_response = part["text"]
                                break
                        if "Hello!" not in agent_response or len(agent_response) > 100:
                            break
        
        return ChatResponse(
            response=agent_response,
            agent_used="student_desk",
            success=True
        )
        
    except Exception as e:
        print(f"Chat endpoint error: {e}")
        return ChatResponse(
            response="I'm having trouble connecting to my systems right now. Please try again in a moment.",
            agent_used="student_desk",
            success=False,
            error=str(e)
        )

@app.post("/process-handbook", response_model=ProcessingResponse)
async def process_handbook_endpoint(
    user_id: str = Form(...),
    handbook_id: str = Form(...)
):
    """
    SPECIFIC ENDPOINT FOR HANDBOOK PROCESSING
    Triggers ADK handbook_agent with specific message format
    """
    try:
        # Special session for handbook processing
        session_id = f"handbook_processing_{user_id}_{handbook_id}"
        
        # Specific message format for handbook processing
        processing_message = f"Process handbook for handbook_id: {handbook_id}"
        
        async with httpx.AsyncClient(timeout=180.0) as client:
            # Create special session for handbook processing with user_id in state
            try:
                session_response = await client.post(
                    f"{Config.ADK_SERVER_URL}/apps/{Config.ADK_APP_NAME}/users/{user_id}/sessions/{session_id}",
                    json={
                        "initial_state": {
                            "user_id": user_id  # CRITICAL: ADK agents need this
                        },
                        "session_type": "handbook_processing",
                        "processing_type": "handbook",
                        "handbook_id": handbook_id,
                        "created_from": "handbook_processing_bridge"
                    },
                    headers={"Content-Type": "application/json"}
                )
                print(f"Handbook processing session: {session_response.status_code}")
            except Exception as e:
                print(f"Session creation (might exist): {e}")
                pass
            
            # Send handbook processing request to ADK
            adk_response = await client.post(
                f"{Config.ADK_SERVER_URL}/run",
                json={
                    "appName": Config.ADK_APP_NAME,
                    "userId": user_id,
                    "sessionId": session_id,
                    "newMessage": {
                        "role": "user",
                        "parts": [{"text": processing_message}]
                    }
                },
                headers={"Content-Type": "application/json"}
            )
            
            print(f"ADK Handbook Response: {adk_response.status_code}")
            
            if adk_response.status_code == 200:
                adk_data = adk_response.json()
                
                # Extract agent response
                agent_response = "Handbook processing request has been sent to the processing agent."
                if isinstance(adk_data, list) and len(adk_data) > 0:
                    for event in reversed(adk_data):
                        if (event.get("content", {}).get("role") == "model" and 
                            event.get("content", {}).get("parts")):
                            parts = event["content"]["parts"]
                            for part in parts:
                                if "text" in part:
                                    agent_response = part["text"]
                                    break
                            break
                
                return ProcessingResponse(
                    success=True,
                    message=agent_response,
                    processing_id=handbook_id
                )
            else:
                return ProcessingResponse(
                    success=False,
                    error=f"ADK agent error: {adk_response.status_code}",
                    message="Failed to trigger handbook processing agent"
                )
                
    except Exception as e:
        print(f"Handbook processing error: {e}")
        return ProcessingResponse(
            success=False,
            error=str(e),
            message="Failed to initiate handbook processing"
        )

@app.post("/process-syllabus", response_model=ProcessingResponse)
async def process_syllabus_endpoint(
    user_id: str = Form(...),
    course_id: str = Form(...)
):
    """
    SPECIFIC ENDPOINT FOR SYLLABUS PROCESSING  
    Triggers ADK syllabus_agent with specific message format
    """
    try:
        # Special session for syllabus processing
        session_id = f"syllabus_processing_{user_id}_{course_id}"
        
        # Specific message format for syllabus processing
        processing_message = f"Process syllabus for course_id: {course_id}"
        
        async with httpx.AsyncClient(timeout=180.0) as client:
            # Create special session for syllabus processing with user_id in state
            try:
                session_response = await client.post(
                    f"{Config.ADK_SERVER_URL}/apps/{Config.ADK_APP_NAME}/users/{user_id}/sessions/{session_id}",
                    json={
                        "initial_state": {
                            "user_id": user_id  # CRITICAL: ADK agents need this
                        },
                        "session_type": "syllabus_processing",
                        "processing_type": "syllabus", 
                        "course_id": course_id,
                        "created_from": "syllabus_processing_bridge"
                    },
                    headers={"Content-Type": "application/json"}
                )
                print(f"Syllabus processing session: {session_response.status_code}")
            except Exception as e:
                print(f"Session creation (might exist): {e}")
                pass
            
            # Send syllabus processing request to ADK
            adk_response = await client.post(
                f"{Config.ADK_SERVER_URL}/run",
                json={
                    "appName": Config.ADK_APP_NAME,
                    "userId": user_id,
                    "sessionId": session_id,
                    "newMessage": {
                        "role": "user",
                        "parts": [{"text": processing_message}]
                    }
                },
                headers={"Content-Type": "application/json"}
            )
            
            print(f"ADK Syllabus Response: {adk_response.status_code}")
            
            if adk_response.status_code == 200:
                adk_data = adk_response.json()
                
                # Extract agent response
                agent_response = "Syllabus processing request has been sent to the processing agent."
                if isinstance(adk_data, list) and len(adk_data) > 0:
                    for event in reversed(adk_data):
                        if (event.get("content", {}).get("role") == "model" and 
                            event.get("content", {}).get("parts")):
                            parts = event["content"]["parts"]
                            for part in parts:
                                if "text" in part:
                                    agent_response = part["text"]
                                    break
                            break
                
                return ProcessingResponse(
                    success=True,
                    message=agent_response,
                    processing_id=course_id
                )
            else:
                return ProcessingResponse(
                    success=False,
                    error=f"ADK agent error: {adk_response.status_code}",
                    message="Failed to trigger syllabus processing agent"
                )
                
    except Exception as e:
        print(f"Syllabus processing error: {e}")
        return ProcessingResponse(
            success=False,
            error=str(e),
            message="Failed to initiate syllabus processing"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)