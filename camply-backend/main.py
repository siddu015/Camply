from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
import sys
import asyncio
import httpx
from contextlib import asynccontextmanager

# Import our modules
import config
from database import UserDataService

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

class CampusContentRequest(BaseModel):
    user_id: str

class CampusContentResponse(BaseModel):
    content: Optional[Dict[str, Any]]
    success: bool
    error: Optional[str] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("✅ Bridge service initialized - connecting to ADK server and Supabase")
    print(f"🔗 Supabase URL: {config.SUPABASE_URL[:50]}...")
    print(f"🤖 ADK Server: {config.ADK_SERVER_URL}")
    yield
    # Shutdown
    print("🔄 Shutting down bridge service...")

# Create FastAPI app
app = FastAPI(
    title="Camply Agent Bridge",
    description="Bridge service connecting Camply frontend to ADK agents with Supabase integration",
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
            response = await client.get(f"{config.ADK_SERVER_URL}/")
            adk_status = "ready" if response.status_code == 200 else "error"
    except:
        adk_status = "not_connected"
    
    # Check Supabase connection
    try:
        # Simple test query to check Supabase connection
        test_result = await UserDataService.get_user_context("test-connection")
        supabase_status = "connected"
    except:
        supabase_status = "connection_error"
    
    return {
        "status": "healthy",
        "adk_server_status": adk_status,
        "adk_server_url": config.ADK_SERVER_URL,
        "supabase_status": supabase_status
    }

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        # Validate user_id
        if not request.user_id:
            return ChatResponse(
                response="I need to know who you are to provide personalized assistance. Please log in.",
                agent_used="student_desk",
                success=False,
                error="user_id_required"
            )
        
        # Fetch user context from Supabase
        print(f"🔍 Fetching user context for: {request.user_id}")
        user_context = await UserDataService.get_user_context(request.user_id)
        
        if not user_context:
            return ChatResponse(
                response="I couldn't find your profile information. Please make sure you've completed your profile setup.",
                agent_used="student_desk",
                success=False,
                error="user_not_found"
            )
        
        # Format user context for the agent
        formatted_context = UserDataService.format_user_context_for_agent(user_context)
        print(f"📋 User context loaded for: {user_context['user']['name']}")
        
        # Generate unique session ID for this conversation
        session_id = f"session_{request.user_id}_{hash(request.message) % 10000}"
        
        # Prepare the message with user context
        user_message = f"""STUDENT CONTEXT:
{formatted_context}

USER QUESTION: {request.message}"""
        
        print(f"🤖 Processing message from {user_context['user']['name']}: {request.message[:100]}...")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Prepare session state with user context variables for template substitution
            import datetime
            current_calendar_year = datetime.datetime.now().year
            
            # Calculate academic year (which year of study the student is in)
            academic_year = "N/A"
            if user_context['academic_details'] and user_context['academic_details']['admission_year']:
                academic_year = str(current_calendar_year - user_context['academic_details']['admission_year'] + 1)
            
            # Create program name from department and branch
            program_name = "Your Program"
            if user_context['academic_details']:
                dept = user_context['academic_details']['department_name']
                branch = user_context['academic_details']['branch_name']
                if dept and branch:
                    program_name = f"{branch} in {dept}"
                elif branch:
                    program_name = branch
                elif dept:
                    program_name = dept
            
            session_state = {
                "student_name": user_context['user']['name'],
                "college_name": user_context['college']['name'] if user_context['college'] else "Your College",
                "department_name": user_context['academic_details']['department_name'] if user_context['academic_details'] else "Your Department",
                "branch_name": user_context['academic_details']['branch_name'] if user_context['academic_details'] else "Your Branch",
                "roll_number": user_context['academic_details']['roll_number'] if user_context['academic_details'] else "Your Roll Number",
                "admission_year": str(user_context['academic_details']['admission_year']) if user_context['academic_details'] else "N/A",
                "graduation_year": str(user_context['academic_details']['graduation_year']) if user_context['academic_details'] else "N/A",
                "current_year": academic_year,
                "program_name": program_name,
                "key_aspects": "core concepts and practical applications",
                "relevant_areas": "your field of study and career preparation"
            }
            
            # Create session if it doesn't exist
            try:
                session_response = await client.post(
                    f"{config.ADK_SERVER_URL}/apps/{config.ADK_APP_NAME}/users/{request.user_id}/sessions/{session_id}",
                    json=session_state,
                    headers={"Content-Type": "application/json"}
                )
                print(f"📝 Session created: {session_response.status_code}")
                print(f"📋 Session state: {session_state}")
            except Exception as e:
                print(f"⚠️ Session creation failed (might already exist): {e}")
                pass  # Session might already exist
            
            # Send message to ADK agent
            adk_response = await client.post(
                f"{config.ADK_SERVER_URL}/run",
                json={
                    "appName": config.ADK_APP_NAME,
                    "userId": request.user_id,
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
            agent_response = f"Hello {user_context['user']['name']}! I'm your Student Desk Assistant. How can I help you today?"
            
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
                        if "Hello" not in agent_response or len(agent_response) > 100:
                            break
        
        print(f"✅ Agent response to {user_context['user']['name']}: {agent_response[:100]}...")
        
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

@app.post("/campus-content", response_model=CampusContentResponse)
async def get_campus_content(request: CampusContentRequest):
    """
    Fetch campus AI content for a user's college.
    This endpoint is used by the campus agent to get dynamic content.
    """
    try:
        print(f"🏫 Fetching campus content for user ID: {request.user_id}")
        
        # First get user context to find their college_id
        user_context = await UserDataService.get_user_context(request.user_id)
        
        if not user_context or not user_context.get('academic_details'):
            return CampusContentResponse(
                content=None,
                success=False,
                error="user_academic_details_not_found"
            )
        
        college_id = user_context['academic_details']['college_id']
        college_name = user_context['college']['name'] if user_context.get('college') else 'Unknown'
        
        print(f"🏫 Found college ID: {college_id} ({college_name})")
        
        # Fetch campus AI content from database
        campus_content = await UserDataService.get_campus_ai_content(college_id)
        
        if not campus_content:
            return CampusContentResponse(
                content=None,
                success=False,
                error="campus_content_not_found"
            )
        
        print(f"✅ Campus content found for {college_name}")
        
        return CampusContentResponse(
            content=campus_content,
            success=True
        )
        
    except Exception as e:
        print(f"❌ Error fetching campus content: {e}")
        return CampusContentResponse(
            content=None,
            success=False,
            error=str(e)
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=True) 