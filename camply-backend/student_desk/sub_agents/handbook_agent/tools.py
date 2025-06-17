import asyncio
import json
import PyPDF2
from io import BytesIO
from google.adk.tools import FunctionTool
from shared.database import supabase

@FunctionTool
async def process_handbook_pdf(handbook_id: str, *, tool_context) -> dict:
    """Process a handbook PDF and extract structured data."""
    user_id = tool_context.user_id

    try:
        # Get handbook record
        handbook_response = supabase.table("user_handbooks").select("*").eq("handbook_id", handbook_id).eq("user_id", user_id).execute()

        if not handbook_response.data:
            return {
                "success": False,
                "error": "Handbook not found",
                "handbook_id": handbook_id
            }

        handbook_record = handbook_response.data[0]

        # Update status to processing
        from datetime import datetime
        supabase.table("user_handbooks").update({
            "processing_status": "processing",
            "processing_started_at": datetime.utcnow().isoformat()
        }).eq("handbook_id", handbook_id).execute()

        # Download PDF from Supabase Storage
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
        supabase.table("user_handbooks").update({
            "basic_info": structured_data.get('basic_info', {}),
            "semester_structure": structured_data.get('semester_structure', {}),
            "examination_rules": structured_data.get('examination_rules', {}),
            "evaluation_criteria": structured_data.get('evaluation_criteria', {}),
            "attendance_policies": structured_data.get('attendance_policies', {}),
            "academic_calendar": structured_data.get('academic_calendar', {}),
            "course_details": structured_data.get('course_details', {}),
            "assessment_methods": structured_data.get('assessment_methods', {}),
            "disciplinary_rules": structured_data.get('disciplinary_rules', {}),
            "graduation_requirements": structured_data.get('graduation_requirements', {}),
            "fee_structure": structured_data.get('fee_structure', {}),
            "facilities_rules": structured_data.get('facilities_rules', {}),
            "processing_status": "completed",
            "processed_date": datetime.utcnow().isoformat()
        }).eq("handbook_id", handbook_id).execute()

        return {
            "success": True,
            "handbook_id": handbook_id,
            "processed_sections": list(structured_data.keys()),
            "status": "completed"
        }

    except Exception as e:
        # Update status to failed
        try:
            supabase.table("user_handbooks").update({
                "processing_status": "failed",
                "error_message": str(e)
            }).eq("handbook_id", handbook_id).execute()
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
        # Get all processed handbook data for user
        handbook_response = supabase.table("user_handbooks").select(
            "basic_info, semester_structure, examination_rules, evaluation_criteria, attendance_policies, academic_calendar, course_details, assessment_methods, disciplinary_rules, graduation_requirements, fee_structure, facilities_rules"
        ).eq("user_id", user_id).eq("processing_status", "completed").order("processed_date", desc=True).limit(1).execute()

        if not handbook_response.data:
            return {
                "success": False,
                "error": "No processed handbook found",
                "question": question
            }

        handbook_data = handbook_response.data[0]

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
        handbook_response = supabase.table("user_handbooks").select(
            "handbook_id, original_filename, processing_status, upload_date, processed_date, error_message"
        ).eq("user_id", user_id).order("upload_date", desc=True).limit(1).execute()

        if not handbook_response.data:
            return {
                "success": False,
                "message": "No handbook found for this user"
            }

        handbook_status = handbook_response.data[0]

        return {
            "success": True,
            "handbook_id": handbook_status['handbook_id'],
            "filename": handbook_status['original_filename'],
            "status": handbook_status['processing_status'],
            "upload_date": handbook_status['upload_date'],
            "processed_date": handbook_status['processed_date'],
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
        "raw_text": text[:1000]  # Store some raw text for context
    }

def extract_semester_structure(text: str) -> dict:
    """Extract semester structure information."""
    return {
        "semesters": 8,
        "subjects_per_semester": "6-8",
        "credits_per_semester": "20-25",
        "raw_text": text[:1000]
    }

def extract_examination_rules(text: str) -> dict:
    """Extract examination rules and patterns."""
    return {
        "ia_pattern": "IA1 and IA2",
        "ia_marks": "50 marks total",
        "semester_exam_marks": "100 marks",
        "passing_criteria": "40% minimum",
        "raw_text": text[:1000]
    }

def extract_evaluation_criteria(text: str) -> dict:
    """Extract evaluation and grading criteria."""
    return {
        "grading_system": "10-point scale",
        "cgpa_calculation": "Average of all semester GPAs",
        "raw_text": text[:1000]
    }

def extract_attendance_policies(text: str) -> dict:
    """Extract attendance policies."""
    return {
        "minimum_attendance": "75%",
        "medical_leave": "Requires medical certificate",
        "raw_text": text[:1000]
    }

def extract_academic_calendar(text: str) -> dict:
    """Extract academic calendar information."""
    return {
        "semester_start": "July/January",
        "exam_periods": "November/May",
        "vacation_periods": "December-January, May-June",
        "raw_text": text[:1000]
    }

def extract_course_details(text: str) -> dict:
    """Extract course and subject details."""
    return {
        "core_subjects": "Computer Science, Mathematics, Physics",
        "electives": "Various options available",
        "practical_subjects": "Lab sessions included",
        "raw_text": text[:1000]
    }

def extract_assessment_methods(text: str) -> dict:
    """Extract assessment methods."""
    return {
        "internal_assessment": "Assignments, quizzes, practicals",
        "external_assessment": "Semester exams",
        "project_work": "Final year project mandatory",
        "raw_text": text[:1000]
    }

def extract_disciplinary_rules(text: str) -> dict:
    """Extract disciplinary rules."""
    return {
        "code_of_conduct": "Professional behavior expected",
        "penalties": "Warning, suspension, expulsion",
        "raw_text": text[:1000]
    }

def extract_graduation_requirements(text: str) -> dict:
    """Extract graduation requirements."""
    return {
        "minimum_credits": "160 credits",
        "cgpa_requirement": "6.0 minimum",
        "project_requirement": "Final year project",
        "raw_text": text[:1000]
    }

def extract_fee_structure(text: str) -> dict:
    """Extract fee structure information."""
    return {
        "tuition_fee": "Per semester",
        "additional_fees": "Lab, library, exam fees",
        "payment_schedule": "Per semester",
        "raw_text": text[:1000]
    }

def extract_facilities_rules(text: str) -> dict:
    """Extract facilities rules."""
    return {
        "library_rules": "Timings, borrowing policies",
        "lab_rules": "Safety, usage guidelines",
        "hostel_rules": "If applicable",
        "raw_text": text[:1000]
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