from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import httpx
from contextlib import asynccontextmanager

# Import our shared modules for configuration only
from shared import Config

# Request/Response models
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

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Bridge service initialized - connecting to ADK server")
    print(f"ADK Server: {Config.ADK_SERVER_URL}")
    yield
    # Shutdown
    print("Shutting down bridge service...")

# Create FastAPI app
app = FastAPI(
    title="Camply Agent Bridge",
    description="Bridge service connecting Camply frontend to ADK agents",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Camply Agent Bridge is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    # Check if ADK server is running
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
    All data fetching, context management, and business logic is handled by the agent using ADK tools.
    """
    try:
        # Validate user_id
        if not request.user_id:
            return ChatResponse(
                response="I need to know who you are to provide personalized assistance. Please log in.",
                agent_used="student_desk",
                success=False,
                error="user_id_required"
            )
        
        # Generate session ID for this conversation
        session_id = request.session_id or f"session_{request.user_id}_{hash(request.message) % 10000}"
        
        print(f"Processing chat request for user: {request.user_id}")
        print(f"Message: {request.message[:100]}...")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Create session if it doesn't exist (empty state - agent will populate it)
            try:
                session_response = await client.post(
                    f"{Config.ADK_SERVER_URL}/apps/{Config.ADK_APP_NAME}/users/{request.user_id}/sessions/{session_id}",
                    json={"user_id": request.user_id},  # Minimal session state - agent handles the rest
                    headers={"Content-Type": "application/json"}
                )
                print(f"Session created/accessed: {session_response.status_code}")
            except Exception as e:
                print(f"Session handling (might already exist): {e}")
                pass  # Session might already exist
            
            # Send message to ADK agent - let the agent handle all context fetching and processing
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
            
            # Parse ADK response
            adk_data = adk_response.json()
            print(f"ADK Data Type: {type(adk_data)}, Length: {len(adk_data) if isinstance(adk_data, list) else 'N/A'}")
            
            # Extract the agent's response from the events
            agent_response = "Hello! I'm your Student Desk Assistant. How can I help you today?"
            
            if isinstance(adk_data, list) and len(adk_data) > 0:
                # Find the last model response
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

# Handbook processing endpoints
@app.post("/process-handbook")
async def process_handbook_endpoint(request: dict):
    """Process a handbook PDF."""
    try:
        print(f"Processing handbook request: {request}")
        handbook_id = request.get("handbook_id")
        user_id = request.get("user_id")

        if not handbook_id or not user_id:
            raise HTTPException(status_code=400, detail="Missing handbook_id or user_id")

        print(f"Processing handbook {handbook_id} for user {user_id}")

        # Import handbook tools
        from student_desk.sub_agents.handbook_agent.tools import process_handbook_pdf

        # Create mock tool context
        class MockToolContext:
            def __init__(self, user_id):
                self.user_id = user_id

        tool_context = MockToolContext(user_id)

        print("Calling process_handbook_pdf...")
        # Process handbook - access the underlying function from the FunctionTool
        result = await process_handbook_pdf.func(handbook_id, tool_context=tool_context)
        print(f"Process result: {result}")

        return result

    except Exception as e:
        print(f"Error in process_handbook_endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query-handbook")
async def query_handbook_endpoint(request: dict):
    """Query handbook data."""
    try:
        question = request.get("question")
        user_id = request.get("user_id")

        if not question or not user_id:
            raise HTTPException(status_code=400, detail="Missing question or user_id")

        # Import handbook tools
        from student_desk.sub_agents.handbook_agent.tools import query_handbook_data

        # Create mock tool context
        class MockToolContext:
            def __init__(self, user_id):
                self.user_id = user_id

        tool_context = MockToolContext(user_id)

        # Query handbook - access the underlying function from the FunctionTool
        result = await query_handbook_data.func(question, tool_context=tool_context)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)