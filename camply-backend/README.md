# Camply Backend

Bridge service connecting Camply frontend to ADK agents.

## Quick Start

1. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

2. **Start ADK server (Terminal 1):**

   ```bash
   adk api_server
   ```

   This starts the ADK server on port 8000

3. **Start Bridge server (Terminal 2):**

   ```bash
   python3 main.py
   ```

   This starts the bridge server on port 8001

4. **Frontend Integration:**
   - Frontend connects to: http://localhost:8001/chat
   - API docs available at: http://localhost:8001/docs
   - Health check: http://localhost:8001/health

## Project Structure

```
camply-backend/
├── main.py              # FastAPI bridge application
├── requirements.txt     # Python dependencies
├── shared/              # Shared services and configuration
│   ├── config.py        # Configuration management
│   └── database.py      # Database operations
├── student_desk/        # ADK agent directory
│   ├── agent.py         # Main agent definition
│   ├── prompt.py        # Agent prompts
│   ├── tools/           # Agent tools
│   │   └── data_service.py  # Data access functions
│   └── sub_agents/      # Sub-agents (campus_agent)
└── README.md           # This file
```

## API Endpoints

### POST /chat

Send a message to the campus bot.

**Request:**

```json
{
  "message": "What is my campus great for?",
  "user_id": "optional-user-id",
  "context": {
    "college_name": "REVA University",
    "department": "Computer Science",
    "branch": "AI & DS"
  }
}
```

**Response:**

```json
{
  "response": "REVA University is great for...",
  "agent_used": "student_desk",
  "success": true
}
```

### GET /health

Check if the bridge service and ADK server are connected.

## How It Works

1. **ADK Server** (port 8000): Runs the student_desk agent using Google ADK
2. **Bridge Server** (port 8001): FastAPI service that:
   - Receives requests from frontend
   - Creates sessions with ADK server
   - Forwards messages to student_desk agent
   - Extracts and returns agent responses
   - Handles errors gracefully

## Development

- Bridge server runs with auto-reload enabled
- Changes to agent code require ADK server restart
- Changes to bridge code auto-restart the bridge server

## Troubleshooting

1. **ADK Server issues:** Ensure `adk api_server` works independently
2. **Bridge connection errors:** Verify ADK server is running on port 8000
3. **CORS errors:** Frontend URLs are configured in `main.py`
4. **Port conflicts:** Modify port in `main.py` if needed
5. **Agent errors:** Check agent configuration in `student_desk/agent.py`
