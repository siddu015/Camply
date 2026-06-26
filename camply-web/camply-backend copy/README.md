# Camply Backend Services

## Architecture Overview

The Camply backend consists of **2 main servers**:

1. **ADK Server** - Google Agent Development Kit server running AI agents
2. **Main Bridge Server** (`main.py`) - FastAPI service on port 8001 that:
   - Bridges frontend to ADK agents
   - Provides handbook PDF processing (integrated)
   - Handles chat requests and routing

## Quick Start

### 1. Start ADK Server

```bash
# Start the ADK server (Google's agent runtime)
adk server start
```

### 2. Start Main Bridge Server

```bash
# Navigate to backend directory
cd camply-backend

# Install dependencies
pip install -r requirements.txt

# Start the integrated bridge + handbook service
python main.py
```

The system will be running on:

- **ADK Server**: Default ADK port (varies)
- **Main Bridge + Handbook Service**: http://localhost:8001

## Integrated Services

### Chat API

- `POST /chat` - Send messages to ADK agents
- `GET /health` - Check system health

### Handbook Processing API

- `POST /handbook/process` - Start PDF processing
- `GET /handbook/status/{handbook_id}` - Check processing status
- `POST /handbook/validate` - Validate PDF before upload
- `GET /handbook/search` - Search processed handbook content

## Architecture Benefits

### Simplified Deployment

- Only 2 servers instead of 3
- No inter-service HTTP calls for handbook processing
- Shared database connections and configuration

### Performance

- Direct database access from handbook processing
- No network overhead between services
- Background processing with status tracking

### Development

- Single point of configuration
- Easier debugging and logging
- Simpler dependency management

## File Structure

```
camply-backend/
├── main.py                 # Integrated FastAPI bridge + handbook service
├── requirements.txt        # All dependencies including PyMuPDF, spaCy
├── shared/                 # Shared database and config utilities
│   ├── config.py
│   └── database.py
├── student_desk/           # ADK agent system
│   ├── agent.py           # Main student desk agent
│   └── sub_agents/        # Specialized agents (campus, handbook, etc.)
└── handbook_reader/        # PDF processing modules (imported by main.py)
    ├── __init__.py        # Package exports
    ├── config.py          # Processing configuration
    ├── pdf_processor.py   # PyMuPDF-based PDF processing
    ├── content_extractor.py # NLP categorization
    ├── json_generator.py  # Structured JSON formatting
    └── database_updater.py # Database integration
```

## Environment Setup

### Required Environment Variables

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# ADK Configuration
ADK_SERVER_URL=http://localhost:your_adk_port
ADK_APP_NAME=camply_student_desk
```

### Python Dependencies

The system requires advanced NLP and PDF processing libraries:

- PyMuPDF (fitz) - Fast PDF processing
- spaCy - NLP for content categorization
- scikit-learn - Text analysis and classification
- pdfplumber - Additional PDF parsing
- FastAPI - Web service framework
- And more (see requirements.txt)

## Database Integration

The handbook processing system directly integrates with the existing Supabase database:

- **user_handbooks** table - Stores processed handbook data in 12 JSON columns
- **Direct database access** - No additional APIs or services required
- **Real-time status tracking** - Processing status updates in database

## Production Deployment

### Single Service Deployment

1. Deploy the integrated main.py service
2. Set up ADK server separately
3. Configure environment variables
4. Monitor both services

### Scaling Considerations

- Handbook processing runs in background tasks
- Database connection pooling for concurrent requests
- Horizontal scaling possible for main.py service
- ADK server scales independently

## Development Workflow

1. **Start Development Servers**:

   ```bash
   # Terminal 1: Start ADK
   adk server start

   # Terminal 2: Start integrated bridge
   python main.py
   ```

2. **Test Handbook Processing**:

   ```bash
   # Upload and process a PDF
   curl -X POST "http://localhost:8001/handbook/process" \
     -H "Content-Type: application/json" \
     -d '{"user_id": "...", "academic_id": "...", "storage_path": "...", "original_filename": "...", "file_size_bytes": 1024}'
   ```

3. **Monitor Processing**:
   ```bash
   # Check status
   curl "http://localhost:8001/handbook/status/{handbook_id}"
   ```

This integrated architecture provides a robust, scalable, and maintainable solution for the Camply handbook processing system.
