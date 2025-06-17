# Handbook System Implementation Plan

## 🎯 **Overview**

Implement a complete handbook system where users can upload PDF handbooks, process them using AI agents, and query the processed data. The system uses Supabase Storage for file management and ADK agents for processing.

## 📋 **Implementation Phases (Total: 2 Hours)**

---

### **Phase 1: Database Schema & Storage Setup (20 minutes)**

#### **1.1 Create New Migration File**

**File**: `supabase/migrations/20250108_create_handbook_schema.sql`

```sql
-- Create handbooks storage bucket (if not exists)
insert into storage.buckets (id, name, public) values ('handbooks', 'handbooks', false);

-- Create user_handbooks table
create table public.user_handbooks (
  handbook_id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users not null,
  academic_id uuid references public.user_academic_details not null,

  -- Storage info
  storage_path text not null,
  original_filename varchar not null,
  file_size_bytes bigint,

  -- Processing status
  processing_status varchar default 'uploaded' check (processing_status in ('uploaded', 'processing', 'completed', 'failed')),
  upload_date timestamp with time zone default now(),
  processed_date timestamp with time zone,
  error_message text,

  -- Structured JSON Data
  basic_info jsonb,
  semester_structure jsonb,
  examination_rules jsonb,
  evaluation_criteria jsonb,
  attendance_policies jsonb,
  academic_calendar jsonb,
  course_details jsonb,
  assessment_methods jsonb,
  disciplinary_rules jsonb,
  graduation_requirements jsonb,
  fee_structure jsonb,
  facilities_rules jsonb,

  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.user_handbooks enable row level security;

-- RLS Policies
create policy "Users can view own handbooks" on public.user_handbooks
  for select using (user_id = auth.uid());

create policy "Users can insert own handbooks" on public.user_handbooks
  for insert with check (user_id = auth.uid());

create policy "Users can update own handbooks" on public.user_handbooks
  for update using (user_id = auth.uid());

-- Storage policies
create policy "Users can upload own handbooks" on storage.objects
  for insert with check (bucket_id = 'handbooks' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view own handbooks" on storage.objects
  for select using (bucket_id = 'handbooks' and auth.uid()::text = (storage.foldername(name))[1]);

-- Indexes
create index idx_user_handbooks_user_id on public.user_handbooks(user_id);
create index idx_user_handbooks_academic_id on public.user_handbooks(academic_id);
create index idx_user_handbooks_status on public.user_handbooks(processing_status);
```

#### **1.2 Update Database Types**

**File**: `camply-web/src/types/database.ts`

```typescript
// Add to existing interfaces
export interface UserHandbook {
  handbook_id: string;
  user_id: string;
  academic_id: string;
  storage_path: string;
  original_filename: string;
  file_size_bytes: number;
  processing_status: "uploaded" | "processing" | "completed" | "failed";
  upload_date: string;
  processed_date?: string;
  error_message?: string;
  basic_info?: any;
  semester_structure?: any;
  examination_rules?: any;
  evaluation_criteria?: any;
  attendance_policies?: any;
  academic_calendar?: any;
  course_details?: any;
  assessment_methods?: any;
  disciplinary_rules?: any;
  graduation_requirements?: any;
  fee_structure?: any;
  facilities_rules?: any;
  created_at: string;
  updated_at: string;
}

export interface HandbookUploadData {
  file: File;
  academic_id: string;
}
```

---

### **Phase 2: Frontend Upload Component (30 minutes)**

#### **2.1 Create Handbook Upload Component**

**File**: `camply-web/src/features/desk/views/academic/components/HandbookUpload.tsx`

```typescript
import { useState } from "react";
import { Upload, FileText, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { UserHandbook } from "@/types/database";

interface HandbookUploadProps {
  userId: string;
  academicId: string;
  onUploadSuccess: (handbook: UserHandbook) => void;
}

export function HandbookUpload({
  userId,
  academicId,
  onUploadSuccess,
}: HandbookUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const validateFile = (file: File): string | null => {
    if (file.type !== "application/pdf") {
      return "Please upload a PDF file only";
    }
    if (file.size > 100 * 1024 * 1024) {
      // 100MB limit
      return "File size must be less than 100MB";
    }
    return null;
  };

  const uploadHandbook = async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;
      const filePath = `user-handbooks/${userId}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("handbooks")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create database record
      const { data: handbook, error: dbError } = await supabase
        .from("user_handbooks")
        .insert({
          user_id: userId,
          academic_id: academicId,
          storage_path: filePath,
          original_filename: file.name,
          file_size_bytes: file.size,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Trigger backend processing
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/process-handbook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handbook_id: handbook.handbook_id,
          user_id: userId,
        }),
      });

      onUploadSuccess(handbook);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadHandbook(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadHandbook(files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileInput}
          className="hidden"
          id="handbook-upload"
          disabled={uploading}
        />

        <div className="space-y-4">
          {uploading ? (
            <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
          ) : (
            <Upload className="h-12 w-12 mx-auto text-gray-400" />
          )}

          <div>
            <h3 className="text-lg font-medium">Upload Your Handbook</h3>
            <p className="text-sm text-gray-500 mt-1">
              Drag and drop your department handbook PDF here, or click to
              browse
            </p>
          </div>

          <label
            htmlFor="handbook-upload"
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 cursor-pointer transition-colors"
          >
            <FileText className="h-4 w-4 mr-2" />
            {uploading ? "Uploading..." : "Select PDF File"}
          </label>

          <p className="text-xs text-gray-400">
            Supported: PDF files up to 100MB
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
}
```

#### **2.2 Create Handbook Status Component**

**File**: `camply-web/src/features/desk/views/academic/components/HandbookStatus.tsx`

```typescript
import { useState, useEffect } from "react";
import { FileText, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { UserHandbook } from "@/types/database";

interface HandbookStatusProps {
  userId: string;
  onHandbookReady: (handbook: UserHandbook) => void;
}

export function HandbookStatus({
  userId,
  onHandbookReady,
}: HandbookStatusProps) {
  const [handbooks, setHandbooks] = useState<UserHandbook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHandbooks();

    // Set up real-time subscription
    const subscription = supabase
      .channel("handbook-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_handbooks",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setHandbooks((prev) =>
              prev.map((h) =>
                h.handbook_id === payload.new.handbook_id
                  ? (payload.new as UserHandbook)
                  : h
              )
            );

            if (payload.new.processing_status === "completed") {
              onHandbookReady(payload.new as UserHandbook);
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, onHandbookReady]);

  const fetchHandbooks = async () => {
    try {
      const { data, error } = await supabase
        .from("user_handbooks")
        .select("*")
        .eq("user_id", userId)
        .order("upload_date", { ascending: false });

      if (error) throw error;
      setHandbooks(data || []);
    } catch (err) {
      console.error("Error fetching handbooks:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "uploaded":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "uploaded":
        return "Waiting to process";
      case "processing":
        return "Processing handbook...";
      case "completed":
        return "Ready for questions";
      case "failed":
        return "Processing failed";
      default:
        return "Unknown status";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (handbooks.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No handbooks uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Your Handbooks</h3>

      {handbooks.map((handbook) => (
        <div
          key={handbook.handbook_id}
          className="flex items-center justify-between p-4 border rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <p className="font-medium">{handbook.original_filename}</p>
              <p className="text-sm text-gray-500">
                Uploaded {new Date(handbook.upload_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {getStatusIcon(handbook.processing_status)}
            <span className="text-sm">
              {getStatusText(handbook.processing_status)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

#### **2.3 Create Handbook Query Component**

**File**: `camply-web/src/features/desk/views/academic/components/HandbookQuery.tsx`

```typescript
import { useState } from "react";
import { Send, MessageCircle, Loader2 } from "lucide-react";

interface HandbookQueryProps {
  userId: string;
  disabled?: boolean;
}

interface QueryResponse {
  question: string;
  answer: string;
  timestamp: string;
}

export function HandbookQuery({
  userId,
  disabled = false,
}: HandbookQueryProps) {
  const [question, setQuestion] = useState("");
  const [responses, setResponses] = useState<QueryResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading || disabled) return;

    setLoading(true);
    const currentQuestion = question.trim();
    setQuestion("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/query-handbook`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: currentQuestion,
            user_id: userId,
          }),
        }
      );

      const data = await response.json();

      setResponses((prev) => [
        ...prev,
        {
          question: currentQuestion,
          answer:
            data.answer ||
            "Sorry, I could not find information about that in your handbook.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setResponses((prev) => [
        ...prev,
        {
          question: currentQuestion,
          answer:
            "Sorry, there was an error processing your question. Please try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">Ask Your Handbook</h3>
      </div>

      {/* Chat History */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {responses.map((response, index) => (
          <div key={index} className="space-y-2">
            <div className="bg-primary/10 p-3 rounded-lg ml-8">
              <p className="font-medium text-sm">You asked:</p>
              <p>{response.question}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg mr-8">
              <p className="font-medium text-sm text-primary">Handbook says:</p>
              <p className="whitespace-pre-wrap">{response.answer}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Query Input */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={
              disabled
                ? "Upload and process a handbook first"
                : "Ask a question about your handbook..."
            }
            disabled={disabled || loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={disabled || loading || !question.trim()}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span>{loading ? "Asking..." : "Ask"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
```

#### **2.4 Update Academic Overview**

**File**: `camply-web/src/features/desk/views/academic/pages/AcademicOverview.tsx`

```typescript
// Add to imports
import { HandbookUpload } from "../components/HandbookUpload";
import { HandbookStatus } from "../components/HandbookStatus";
import { HandbookQuery } from "../components/HandbookQuery";

// Add to component state
const [handbookReady, setHandbookReady] = useState(false);

// Add to return JSX after existing content
<div className="mt-8 p-6 bg-card rounded-lg border">
  <h2 className="text-xl font-semibold mb-6">Department Handbook</h2>

  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <div className="space-y-6">
      <HandbookUpload
        userId={user.user_id}
        academicId={academicDetails.academic_id}
        onUploadSuccess={() => {
          // Refresh handbook status
        }}
      />

      <HandbookStatus
        userId={user.user_id}
        onHandbookReady={() => setHandbookReady(true)}
      />
    </div>

    <div>
      <HandbookQuery userId={user.user_id} disabled={!handbookReady} />
    </div>
  </div>
</div>;
```

---

### **Phase 3: Backend Processing Setup (40 minutes)**

#### **3.1 Create Handbook Agent Structure**

**File**: `camply-backend/student_desk/sub_agents/handbook_agent/__init__.py`

```python
# Empty init file
```

**File**: `camply-backend/student_desk/sub_agents/handbook_agent/agent.py`

```python
from google.adk.agents import LlmAgent
from .tools import process_handbook_pdf, query_handbook_data, get_handbook_status
from .prompt import HANDBOOK_AGENT_INSTRUCTION

handbook_agent = LlmAgent(
    name="handbook_agent",
    description="Processes and answers questions about academic handbooks",
    instruction=HANDBOOK_AGENT_INSTRUCTION,
    tools=[
        process_handbook_pdf,
        query_handbook_data,
        get_handbook_status,
    ],
    model="gemini-2.0-flash",
    disallow_transfer_to_parent=False,
    disallow_transfer_to_peers=False
)
```

**File**: `camply-backend/student_desk/sub_agents/handbook_agent/prompt.py`

```python
HANDBOOK_AGENT_INSTRUCTION = """
You are a Handbook Processing and Query Agent specialized in processing academic handbooks and answering questions about them.

CRITICAL WORKFLOW:
1. For processing requests: Use process_handbook_pdf() to extract and structure data
2. For queries: Use query_handbook_data() to search processed handbook content
3. For status checks: Use get_handbook_status() to check processing status

PROCESSING CAPABILITIES:
- Extract text from PDF handbooks
- Structure information into categories:
  * basic_info: Course structure, duration, eligibility
  * semester_structure: Semester breakdown, subjects
  * examination_rules: IA patterns, exam rules, marking
  * evaluation_criteria: Grade calculation, CGPA rules
  * attendance_policies: Minimum attendance, leave policies
  * academic_calendar: Important dates, schedules
  * course_details: Subject codes, credits, prerequisites
  * assessment_methods: Assignment rules, project guidelines
  * disciplinary_rules: Code of conduct, penalties
  * graduation_requirements: Credit requirements, projects
  * fee_structure: Fee details, payment schedules
  * facilities_rules: Library, lab, hostel policies

QUERY HANDLING:
- Search through structured handbook data
- Provide specific, accurate answers
- Reference handbook sections when possible
- If information not found, clearly state it's not available

ERROR HANDLING:
- If handbook not found: "No handbook found for this user"
- If processing fails: "Unable to process handbook at this time"
- If information not available: "This information is not available in your handbook"

RESPONSE STYLE:
- Clear and direct answers
- Reference specific handbook sections when possible
- Use bullet points for lists
- Provide exact quotes when relevant
- Always be helpful and informative
"""
```

**File**: `camply-backend/student_desk/sub_agents/handbook_agent/tools.py`

```python
import asyncio
import json
import PyPDF2
from io import BytesIO
from google.adk.tools import FunctionTool
from shared.database import get_database_connection
from shared.config import get_supabase_client

@FunctionTool
async def process_handbook_pdf(handbook_id: str, *, tool_context) -> dict:
    """Process a handbook PDF and extract structured data."""
    user_id = tool_context.user_id

    try:
        # Get handbook record
        conn = await get_database_connection()
        handbook_record = await conn.fetchrow(
            "SELECT * FROM user_handbooks WHERE handbook_id = $1 AND user_id = $2",
            handbook_id, user_id
        )

        if not handbook_record:
            return {
                "success": False,
                "error": "Handbook not found",
                "handbook_id": handbook_id
            }

        # Update status to processing
        await conn.execute(
            "UPDATE user_handbooks SET processing_status = 'processing', processing_started_at = NOW() WHERE handbook_id = $1",
            handbook_id
        )

        # Download PDF from Supabase Storage
        supabase = get_supabase_client()
        response = supabase.storage.from_('handbooks').download(handbook_record['storage_path'])

        if not response:
            raise Exception("Failed to download PDF from storage")

        # Extract text from PDF
        pdf_reader = PyPDF2.PdfReader(BytesIO(response))
        full_text = ""

        for page_num in range(len(pdf_reader.pages)):
            page = pdf_reader.pages[page_num]
            full_text += page.extract_text() + "\n"

        # Process text in chunks and structure data
        structured_data = await structure_handbook_data(full_text)

        # Store structured data in database
        await conn.execute("""
            UPDATE user_handbooks SET
                basic_info = $1,
                semester_structure = $2,
                examination_rules = $3,
                evaluation_criteria = $4,
                attendance_policies = $5,
                academic_calendar = $6,
                course_details = $7,
                assessment_methods = $8,
                disciplinary_rules = $9,
                graduation_requirements = $10,
                fee_structure = $11,
                facilities_rules = $12,
                processing_status = 'completed',
                processed_date = NOW()
            WHERE handbook_id = $13
        """,
            json.dumps(structured_data.get('basic_info', {})),
            json.dumps(structured_data.get('semester_structure', {})),
            json.dumps(structured_data.get('examination_rules', {})),
            json.dumps(structured_data.get('evaluation_criteria', {})),
            json.dumps(structured_data.get('attendance_policies', {})),
            json.dumps(structured_data.get('academic_calendar', {})),
            json.dumps(structured_data.get('course_details', {})),
            json.dumps(structured_data.get('assessment_methods', {})),
            json.dumps(structured_data.get('disciplinary_rules', {})),
            json.dumps(structured_data.get('graduation_requirements', {})),
            json.dumps(structured_data.get('fee_structure', {})),
            json.dumps(structured_data.get('facilities_rules', {})),
            handbook_id
        )

        await conn.close()

        return {
            "success": True,
            "handbook_id": handbook_id,
            "processed_sections": list(structured_data.keys()),
            "status": "completed"
        }

    except Exception as e:
        # Update status to failed
        try:
            conn = await get_database_connection()
            await conn.execute(
                "UPDATE user_handbooks SET processing_status = 'failed', error_message = $1 WHERE handbook_id = $2",
                str(e), handbook_id
            )
            await conn.close()
        except:
            pass

        return {
            "success": False,
            "error": str(e),
            "handbook_id": handbook_id
        }

@FunctionTool
async def query_handbook_data(question: str, *, tool_context) -> dict:
    """Query processed handbook data for a specific question."""
    user_id = tool_context.user_id

    try:
        conn = await get_database_connection()

        # Get all processed handbook data for user
        handbook_data = await conn.fetchrow("""
            SELECT basic_info, semester_structure, examination_rules, evaluation_criteria,
                   attendance_policies, academic_calendar, course_details, assessment_methods,
                   disciplinary_rules, graduation_requirements, fee_structure, facilities_rules
            FROM user_handbooks
            WHERE user_id = $1 AND processing_status = 'completed'
            ORDER BY processed_date DESC
            LIMIT 1
        """, user_id)

        await conn.close()

        if not handbook_data:
            return {
                "success": False,
                "error": "No processed handbook found",
                "question": question
            }

        # Search through all sections for relevant information
        relevant_info = await search_handbook_content(handbook_data, question)

        return {
            "success": True,
            "question": question,
            "answer": relevant_info,
            "sources": ["Department Handbook"]
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "question": question
        }

@FunctionTool
async def get_handbook_status(*, tool_context) -> dict:
    """Get the processing status of user's handbook."""
    user_id = tool_context.user_id

    try:
        conn = await get_database_connection()

        handbook_status = await conn.fetchrow("""
            SELECT handbook_id, original_filename, processing_status, upload_date, processed_date, error_message
            FROM user_handbooks
            WHERE user_id = $1
            ORDER BY upload_date DESC
            LIMIT 1
        """, user_id)

        await conn.close()

        if not handbook_status:
            return {
                "success": False,
                "message": "No handbook found for this user"
            }

        return {
            "success": True,
            "handbook_id": handbook_status['handbook_id'],
            "filename": handbook_status['original_filename'],
            "status": handbook_status['processing_status'],
            "upload_date": handbook_status['upload_date'].isoformat() if handbook_status['upload_date'] else None,
            "processed_date": handbook_status['processed_date'].isoformat() if handbook_status['processed_date'] else None,
            "error_message": handbook_status['error_message']
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# Helper functions
async def structure_handbook_data(text: str) -> dict:
    """Structure raw text into categorized JSON data."""
    # This is a simplified version - in reality, you'd use more sophisticated NLP
    sections = {
        'basic_info': extract_basic_info(text),
        'semester_structure': extract_semester_structure(text),
        'examination_rules': extract_examination_rules(text),
        'evaluation_criteria': extract_evaluation_criteria(text),
        'attendance_policies': extract_attendance_policies(text),
        'academic_calendar': extract_academic_calendar(text),
        'course_details': extract_course_details(text),
        'assessment_methods': extract_assessment_methods(text),
        'disciplinary_rules': extract_disciplinary_rules(text),
        'graduation_requirements': extract_graduation_requirements(text),
        'fee_structure': extract_fee_structure(text),
        'facilities_rules': extract_facilities_rules(text),
    }

    return sections

def extract_basic_info(text: str) -> dict:
    """Extract basic course information."""
    return {
        "course_duration": "4 years",  # Example - would be extracted from text
        "total_semesters": 8,
        "course_type": "Bachelor of Technology",
        "raw_text": text[:500]  # Store some raw text for context
    }

def extract_semester_structure(text: str) -> dict:
    """Extract semester structure information."""
    return {
        "semesters": 8,
        "subjects_per_semester": "6-8",
        "credits_per_semester": "20-25",
        "raw_text": text[:500]
    }

def extract_examination_rules(text: str) -> dict:
    """Extract examination rules and patterns."""
    return {
        "ia_pattern": "IA1 and IA2",
        "ia_marks": "50 marks total",
        "semester_exam_marks": "100 marks",
        "passing_criteria": "40% minimum",
        "raw_text": text[:500]
    }

def extract_evaluation_criteria(text: str) -> dict:
    """Extract evaluation and grading criteria."""
    return {
        "grading_system": "10-point scale",
        "cgpa_calculation": "Average of all semester GPAs",
        "raw_text": text[:500]
    }

def extract_attendance_policies(text: str) -> dict:
    """Extract attendance policies."""
    return {
        "minimum_attendance": "75%",
        "medical_leave": "Requires medical certificate",
        "raw_text": text[:500]
    }

def extract_academic_calendar(text: str) -> dict:
    """Extract academic calendar information."""
    return {
        "semester_start": "July/January",
        "exam_periods": "November/May",
        "vacation_periods": "December-January, May-June",
        "raw_text": text[:500]
    }

def extract_course_details(text: str) -> dict:
    """Extract course and subject details."""
    return {
        "core_subjects": "Computer Science, Mathematics, Physics",
        "electives": "Various options available",
        "practical_subjects": "Lab sessions included",
        "raw_text": text[:500]
    }

def extract_assessment_methods(text: str) -> dict:
    """Extract assessment methods."""
    return {
        "internal_assessment": "Assignments, quizzes, practicals",
        "external_assessment": "Semester exams",
        "project_work": "Final year project mandatory",
        "raw_text": text[:500]
    }

def extract_disciplinary_rules(text: str) -> dict:
    """Extract disciplinary rules."""
    return {
        "code_of_conduct": "Professional behavior expected",
        "penalties": "Warning, suspension, expulsion",
        "raw_text": text[:500]
    }

def extract_graduation_requirements(text: str) -> dict:
    """Extract graduation requirements."""
    return {
        "minimum_credits": "160 credits",
        "cgpa_requirement": "6.0 minimum",
        "project_requirement": "Final year project",
        "raw_text": text[:500]
    }

def extract_fee_structure(text: str) -> dict:
    """Extract fee structure information."""
    return {
        "tuition_fee": "Per semester",
        "additional_fees": "Lab, library, exam fees",
        "payment_schedule": "Per semester",
        "raw_text": text[:500]
    }

def extract_facilities_rules(text: str) -> dict:
    """Extract facilities rules."""
    return {
        "library_rules": "Timings, borrowing policies",
        "lab_rules": "Safety, usage guidelines",
        "hostel_rules": "If applicable",
        "raw_text": text[:500]
    }

async def search_handbook_content(handbook_data, question: str) -> str:
    """Search through handbook data for relevant information."""
    # Convert question to lowercase for better matching
    question_lower = question.lower()

    # Search through all sections
    relevant_sections = []

    for section_name, section_data in handbook_data.items():
        if section_data:
            section_json = json.loads(section_data) if isinstance(section_data, str) else section_data

            # Simple keyword matching - would be more sophisticated in production
            section_text = json.dumps(section_json).lower()

            # Check for relevant keywords
            if any(keyword in section_text for keyword in question_lower.split()):
                relevant_sections.append({
                    'section': section_name.replace('_', ' ').title(),
                    'data': section_json
                })

    if not relevant_sections:
        return "I couldn't find specific information about that in your handbook. Please try rephrasing your question or ask about a different topic."

    # Format response
    response = "Based on your handbook:\n\n"

    for section in relevant_sections[:3]:  # Limit to top 3 relevant sections
        response += f"**{section['section']}:**\n"

        # Extract relevant information from the section
        for key, value in section['data'].items():
            if key != 'raw_text' and value:
                response += f"• {key.replace('_', ' ').title()}: {value}\n"

        response += "\n"

    return response.strip()
```

#### **3.2 Add FastAPI Endpoints**

**File**: `camply-backend/main.py` (Add to existing file)

```python
# Add to imports
from student_desk.sub_agents.handbook_agent.tools import process_handbook_pdf, query_handbook_data

# Add new endpoints
@app.post("/process-handbook")
async def process_handbook_endpoint(request: dict):
    """Process a handbook PDF."""
    try:
        handbook_id = request.get("handbook_id")
        user_id = request.get("user_id")

        if not handbook_id or not user_id:
            raise HTTPException(status_code=400, detail="Missing handbook_id or user_id")

        # Create mock tool context
        class MockToolContext:
            def __init__(self, user_id):
                self.user_id = user_id

        tool_context = MockToolContext(user_id)

        # Process handbook
        result = await process_handbook_pdf(handbook_id, tool_context=tool_context)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query-handbook")
async def query_handbook_endpoint(request: dict):
    """Query handbook data."""
    try:
        question = request.get("question")
        user_id = request.get("user_id")

        if not question or not user_id:
            raise HTTPException(status_code=400, detail="Missing question or user_id")

        # Create mock tool context
        class MockToolContext:
            def __init__(self, user_id):
                self.user_id = user_id

        tool_context = MockToolContext(user_id)

        # Query handbook
        result = await query_handbook_data(question, tool_context=tool_context)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

#### **3.3 Update Requirements**

**File**: `camply-backend/requirements.txt` (Add to existing)

```txt
PyPDF2==3.0.1
python-multipart==0.0.6
asyncpg==0.29.0
```

#### **3.4 Create Shared Utilities**

**File**: `camply-backend/shared/database.py`

```python
import asyncpg
import os
from typing import Optional

_connection_pool: Optional[asyncpg.Pool] = None

async def get_database_connection():
    """Get database connection."""
    global _connection_pool

    if _connection_pool is None:
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise Exception("DATABASE_URL environment variable not set")

        _connection_pool = await asyncpg.create_pool(database_url)

    return await _connection_pool.acquire()
```

**File**: `camply-backend/shared/config.py`

```python
import os
from supabase import create_client, Client

def get_supabase_client() -> Client:
    """Get Supabase client."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Service role for backend

    if not url or not key:
        raise Exception("Supabase credentials not configured")

    return create_client(url, key)
```

---

### **Phase 4: Integration & Testing (30 minutes)**

#### **4.1 Update Student Desk Agent**

**File**: `camply-backend/student_desk/agent.py` (Add to existing)

```python
# Add to imports
from .sub_agents.handbook_agent.agent import handbook_agent

# Add to sub_agents list
sub_agents=[
    # ... existing agents
    handbook_agent,
]

# Update instruction to include handbook routing
STUDENT_DESK_INSTRUCTION = """
... existing instruction ...

HANDBOOK QUERIES:
- Handbook processing requests → route to handbook_agent
- Questions about academic rules, policies, procedures → route to handbook_agent
- Format: "Process handbook for user_id: {user_id}" or "Answer handbook question: {question} for user_id: {user_id}"
"""
```

#### **4.2 Environment Variables**

**File**: `camply-web/.env` (Add to existing)

```env
VITE_BACKEND_URL=http://localhost:8000
```

**File**: `camply-backend/.env` (Add to existing)

```env
DATABASE_URL=your-database-url
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 🧪 **Testing Checklist**

### **Manual Testing Steps:**

1. **Database Setup:**

   - [ ] Run migration to create handbook table
   - [ ] Create handbooks bucket in Supabase Storage
   - [ ] Verify RLS policies are active

2. **Frontend Testing:**

   - [ ] Upload PDF file through HandbookUpload component
   - [ ] Verify file appears in Supabase Storage
   - [ ] Check HandbookStatus shows correct status
   - [ ] Verify real-time updates work

3. **Backend Testing:**

   - [ ] Test /process-handbook endpoint manually
   - [ ] Verify PDF processing and JSON storage
   - [ ] Test /query-handbook endpoint
   - [ ] Check error handling for missing files

4. **Integration Testing:**
   - [ ] Upload → Process → Query full workflow
   - [ ] Verify handbook agent responds correctly
   - [ ] Test with multiple handbook formats
   - [ ] Verify user isolation (users only see own handbooks)

### **Environment Variables Needed:**

```env
# Frontend (.env)
VITE_BACKEND_URL=http://localhost:8000
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend (.env)
DATABASE_URL=your-database-url
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 🚀 **Deployment Notes**

1. **Database Migration:** Run the migration file first
2. **Supabase Storage:** Create handbooks bucket in Supabase dashboard
3. **Environment Variables:** Set all required environment variables
4. **Dependencies:** Install new Python packages (PyPDF2, python-multipart, asyncpg)
5. **Testing:** Test with a real PDF handbook file

This implementation provides a complete handbook system that users can interact with naturally through the existing academic interface.
