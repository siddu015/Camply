from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import httpx
from contextlib import asynccontextmanager

from shared import Config

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
    print("Bridge service initialized - connecting to ADK server")
    print(f"ADK Server: {Config.ADK_SERVER_URL}")
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
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)