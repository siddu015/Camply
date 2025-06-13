from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
import sys
import asyncio
import httpx
from contextlib import asynccontextmanager

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

# ADK Server Configuration
ADK_SERVER_URL = "http://localhost:8000"
ADK_APP_NAME = "student_desk"

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("✅ Bridge service initialized - connecting to ADK server")
    yield
    # Shutdown
    print("🔄 Shutting down bridge service...")

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
            response = await client.get(f"{ADK_SERVER_URL}/")
            adk_status = "ready" if response.status_code == 200 else "error"
    except:
        adk_status = "not_connected"
    
    return {
        "status": "healthy",
        "adk_server_status": adk_status,
        "adk_server_url": ADK_SERVER_URL
    }

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        # Generate unique session ID for this conversation
        session_id = f"session_{request.user_id or 'anonymous'}_{hash(request.message) % 10000}"
        user_id = request.user_id or "anonymous_user"
        
        # Prepare the message for the agent
        user_message = request.message
        
        # Add context if provided
        if request.context:
            context_info = []
            if request.context.get("college_name"):
                context_info.append(f"College: {request.context['college_name']}")
            if request.context.get("department"):
                context_info.append(f"Department: {request.context['department']}")
            if request.context.get("branch"):
                context_info.append(f"Branch: {request.context['branch']}")
            
            if context_info:
                user_message = f"Context: {', '.join(context_info)}\n\nUser Question: {user_message}"
        
        print(f"🤖 Processing message: {user_message[:100]}...")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Create session if it doesn't exist
            try:
                session_response = await client.post(
                    f"{ADK_SERVER_URL}/apps/{ADK_APP_NAME}/users/{user_id}/sessions/{session_id}",
                    json={"state": {}},
                    headers={"Content-Type": "application/json"}
                )
                print(f"📝 Session created: {session_response.status_code}")
            except Exception as e:
                print(f"⚠️ Session creation failed (might already exist): {e}")
                pass  # Session might already exist
            
            # Send message to ADK agent
            adk_response = await client.post(
                f"{ADK_SERVER_URL}/run",
                json={
                    "appName": ADK_APP_NAME,
                    "userId": user_id,
                    "sessionId": session_id,
                    "newMessage": {
                        "role": "user",
                        "parts": [{"text": user_message}]
                    }
                },
                headers={"Content-Type": "application/json"}
            )
            
            print(f"📡 ADK Response Status: {adk_response.status_code}")
            
            if adk_response.status_code != 200:
                error_text = adk_response.text
                print(f"❌ ADK Error Response: {error_text}")
                raise HTTPException(status_code=500, detail=f"ADK server error: {adk_response.status_code}")
            
            # Parse ADK response
            adk_data = adk_response.json()
            print(f"📊 ADK Data Type: {type(adk_data)}, Length: {len(adk_data) if isinstance(adk_data, list) else 'N/A'}")
            
            # Extract the agent's response from the events
            agent_response = "I'm here to help with your campus questions!"
            
            if isinstance(adk_data, list) and len(adk_data) > 0:
                # Find the last model response
                for event in reversed(adk_data):
                    if (event.get("content", {}).get("role") == "model" and 
                        event.get("content", {}).get("parts")):
                        parts = event["content"]["parts"]
                        for part in parts:
                            if "text" in part:
                                agent_response = part["text"]
                                print(f"✅ Found agent response: {agent_response[:100]}...")
                                break
                        if agent_response != "I'm here to help with your campus questions!":
                            break
        
        print(f"✅ Agent response: {agent_response[:100]}...")
        
        return ChatResponse(
            response=agent_response,
            agent_used="student_desk",
            success=True
        )
        
    except Exception as e:
        print(f"❌ Error processing chat: {e}")
        return ChatResponse(
            response="I apologize, but I'm having trouble processing your request right now. Please try again.",
            agent_used="student_desk",
            success=False,
            error=str(e)
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=True) 