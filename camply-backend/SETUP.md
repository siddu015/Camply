# Camply Backend Setup

## Environment Variables

Create a `.env` file in the `camply-backend` directory with the following variables:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here

# ADK Server Configuration
ADK_SERVER_URL=http://localhost:8000
ADK_APP_NAME=student_desk
```

## ⚠️ Important: Service Role Key Required

The backend **requires the service role key** to access user data due to Row Level Security (RLS) policies.

- **SUPABASE_ANON_KEY**: Used by frontend for authenticated user operations
- **SUPABASE_SERVICE_ROLE_KEY**: Used by backend to bypass RLS for system operations

Find your service role key in your Supabase project settings under "API" section.

## Installation

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Set up environment variables (create `.env` file with above variables)

3. Start the server:

```bash
python main.py
```

## Features

- **User Context Loading**: Automatically fetches user data from Supabase based on user_id
- **Personalized Responses**: Agent receives complete user context (name, college, academic details)
- **Session Management**: Maintains conversation sessions per user
- **Health Checks**: Monitors both ADK server and Supabase connections
- **RLS Bypass**: Uses service role key to access user data from backend

## API Endpoints

- `GET /` - Health check
- `GET /health` - Detailed health status
- `POST /chat` - Chat with the student desk agent

### Chat Request Format

```json
{
  "message": "What's my college name?",
  "user_id": "user-uuid-here",
  "session_id": "optional-session-id",
  "context": {}
}
```

### Chat Response Format

```json
{
  "response": "Based on your profile, you attend REVA University...",
  "agent_used": "student_desk",
  "success": true,
  "error": null
}
```

## User Context Structure

The agent receives formatted user context including:

- Student name, email, phone
- College name, location, university
- Department, branch, roll number
- Academic timeline (admission year, graduation year)

## Troubleshooting

### "No user found" Error

- **Cause**: RLS policies blocking access or user not in database
- **Solution**: Ensure SUPABASE_SERVICE_ROLE_KEY is set correctly
- **Check**: Verify user exists in Supabase Auth and `users` table

### RLS Policy Violations

- **Cause**: Using anon key instead of service role key
- **Solution**: Set SUPABASE_SERVICE_ROLE_KEY in .env file
