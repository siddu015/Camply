# JSON Data Approach for Student Desk Agents

## Overview

This document outlines the hybrid approach for storing and accessing college and handbook data for the student_desk agents. We combine structured JSONB in Supabase tables with optional JSON file storage for complex scenarios.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Supabase      │    │   Supabase      │    │   Agent         │
│   Tables        │    │   Storage       │    │   System        │
│   (JSONB)       │◄──►│   (JSON Files)  │◄──►│                 │
│                 │    │                 │    │                 │
│ - Fast Queries  │    │ - Raw Documents │    │ - Query Engine  │
│ - Structured    │    │ - Large Files   │    │ - File Processor│
│ - RLS Security  │    │ - Backups       │    │ - Cache Layer   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 1. College Data (campus_ai_content)

### Table Structure (Primary)

```sql
campus_ai_content:
- campus_content_id (UUID)
- college_id (UUID)
- college_overview_content (JSONB)
- facilities_content (JSONB)
- placements_content (JSONB)
- departments_content (JSONB)
- admissions_content (JSONB)
- source_documents (JSONB) -- NEW: references to JSON files
```

### JSON File Structure for College Data

#### Location: `supabase/storage/campus-data/{college_id}/`

```
campus-data/
├── {college_id}/
│   ├── overview.json
│   ├── facilities.json
│   ├── placements.json
│   ├── departments.json
│   ├── admissions.json
│   └── raw/
│       ├── placement-reports/
│       ├── news-articles/
│       └── official-documents/
```

#### Example: `overview.json`

```json
{
  "version": "1.0",
  "last_updated": "2024-01-15T10:30:00Z",
  "college_info": {
    "established_year": 1995,
    "type": "Engineering College",
    "affiliation": "Anna University",
    "accreditation": {
      "naac_grade": "A+",
      "nba_accredited": true,
      "iso_certified": true
    },
    "campus_size": "50 acres",
    "student_strength": 3500
  },
  "leadership": {
    "principal": {
      "name": "Dr. Rajesh Kumar",
      "qualification": "Ph.D in Computer Science",
      "experience": "20 years"
    },
    "vice_principal": {
      "name": "Dr. Priya Sharma",
      "qualification": "Ph.D in Electronics",
      "experience": "15 years"
    }
  },
  "vision_mission": {
    "vision": "To be a premier institution...",
    "mission": "To provide quality education..."
  },
  "achievements": [
    {
      "year": 2023,
      "title": "Best Engineering College Award",
      "awarded_by": "State Government"
    }
  ]
}
```

#### Example: `placements.json`

```json
{
  "version": "1.0",
  "last_updated": "2024-01-15T10:30:00Z",
  "placement_statistics": {
    "2023": {
      "total_students": 800,
      "placed_students": 720,
      "placement_percentage": 90,
      "highest_package": 2500000,
      "average_package": 450000,
      "median_package": 400000
    },
    "2022": {
      "total_students": 750,
      "placed_students": 675,
      "placement_percentage": 90,
      "highest_package": 2200000,
      "average_package": 420000,
      "median_package": 380000
    }
  },
  "top_recruiters": [
    {
      "company": "TCS",
      "students_hired": 120,
      "package_range": "300000-800000",
      "roles": ["Software Engineer", "Business Analyst"]
    },
    {
      "company": "Infosys",
      "students_hired": 85,
      "package_range": "350000-900000",
      "roles": ["Software Developer", "System Engineer"]
    }
  ],
  "department_wise": {
    "Computer Science": {
      "placement_percentage": 95,
      "average_package": 550000,
      "top_companies": ["Google", "Microsoft", "Amazon"]
    },
    "Electronics": {
      "placement_percentage": 88,
      "average_package": 480000,
      "top_companies": ["Intel", "Qualcomm", "Broadcom"]
    }
  }
}
```

## 2. Handbook Data (user_handbooks)

### Table Structure (Primary)

```sql
user_handbooks:
- handbook_id (UUID)
- user_id (UUID)
- academic_id (UUID)
- basic_info (JSONB)
- semester_structure (JSONB)
- examination_rules (JSONB)
- evaluation_criteria (JSONB)
- attendance_policies (JSONB)
- academic_calendar (JSONB)
- course_details (JSONB)
- assessment_methods (JSONB)
- disciplinary_rules (JSONB)
- graduation_requirements (JSONB)
- fee_structure (JSONB)
- facilities_rules (JSONB)
- source_document_path (TEXT) -- NEW: reference to original PDF
```

### JSON File Structure for Handbook Data

#### Location: `supabase/storage/handbooks/{user_id}/`

```
handbooks/
├── {user_id}/
│   ├── {handbook_id}/
│   │   ├── original.pdf
│   │   ├── processed/
│   │   │   ├── basic_info.json
│   │   │   ├── examination_rules.json
│   │   │   ├── attendance_policies.json
│   │   │   └── full_processed.json
│   │   └── metadata.json
```

#### Example: `basic_info.json`

```json
{
  "version": "1.0",
  "extracted_from": "handbook.pdf",
  "extraction_date": "2024-01-15T10:30:00Z",
  "college_details": {
    "name": "ABC Engineering College",
    "code": "ABC001",
    "established": 1995,
    "affiliation": "Anna University",
    "address": {
      "street": "123 College Road",
      "city": "Chennai",
      "state": "Tamil Nadu",
      "pincode": "600001"
    }
  },
  "academic_structure": {
    "total_semesters": 8,
    "duration": "4 years",
    "semester_pattern": "Choice Based Credit System (CBCS)",
    "academic_year": "June to May"
  },
  "contact_information": {
    "phone": "+91-44-12345678",
    "email": "info@abc.edu.in",
    "website": "https://abc.edu.in",
    "emergency_contact": "+91-44-87654321"
  }
}
```

#### Example: `examination_rules.json`

```json
{
  "version": "1.0",
  "extracted_from": "handbook.pdf",
  "extraction_date": "2024-01-15T10:30:00Z",
  "internal_assessments": {
    "frequency": "3 per semester",
    "weightage": {
      "ia1": 15,
      "ia2": 15,
      "ia3": 20
    },
    "total_marks": 50,
    "passing_criteria": "Minimum 50% in each IA"
  },
  "semester_exams": {
    "weightage": 50,
    "duration": "3 hours",
    "total_marks": 100,
    "passing_criteria": "Minimum 50% in semester exam and 50% overall"
  },
  "grace_marks": {
    "maximum_allowed": 5,
    "conditions": "Only for final semester students",
    "subjects_limit": 2
  },
  "supplementary_exams": {
    "eligibility": "Failed in not more than 5 subjects",
    "fee": 500,
    "timeline": "Within 6 months of result declaration"
  },
  "malpractice_rules": [
    {
      "offense": "Copying from another student",
      "penalty": "Cancellation of that subject",
      "repeat_offense": "Cancellation of entire semester"
    },
    {
      "offense": "Use of unauthorized material",
      "penalty": "Zero marks in that subject",
      "repeat_offense": "Debarred from next semester"
    }
  ]
}
```

## 3. Agent Implementation

### Data Service for Agents

```python
# camply-backend/student_desk/tools/json_data_service.py

import json
from typing import Dict, Any, Optional
from supabase import Client

class JSONDataService:
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client

    async def get_college_data(self, college_id: str, section: Optional[str] = None) -> Dict[str, Any]:
        """Get college data - first from table, fallback to JSON files"""
        try:
            # Primary: Get from table (fast)
            query = self.supabase.from('campus_ai_content')
            if section:
                query = query.select(f'{section}_content')
            else:
                query = query.select('*')

            result = query.eq('college_id', college_id).single()
            if result.data:
                return result.data

        except Exception as e:
            print(f"Table query failed: {e}")

        # Fallback: Get from JSON files
        return await self._get_college_json_files(college_id, section)

    async def get_handbook_data(self, user_id: str, handbook_id: str, section: Optional[str] = None) -> Dict[str, Any]:
        """Get handbook data - first from table, fallback to JSON files"""
        try:
            # Primary: Get from table (fast)
            query = self.supabase.from('user_handbooks')
            if section:
                query = query.select(section)
            else:
                query = query.select('*')

            result = query.eq('handbook_id', handbook_id).eq('user_id', user_id).single()
            if result.data:
                return result.data

        except Exception as e:
            print(f"Table query failed: {e}")

        # Fallback: Get from JSON files
        return await self._get_handbook_json_files(user_id, handbook_id, section)

    async def _get_college_json_files(self, college_id: str, section: Optional[str] = None) -> Dict[str, Any]:
        """Load college data from JSON files"""
        if section:
            file_path = f'campus-data/{college_id}/{section}.json'
            response = await self.supabase.storage.from_('campus-data').download(file_path)
            return json.loads(response)
        else:
            # Load all sections
            sections = ['overview', 'facilities', 'placements', 'departments', 'admissions']
            data = {}
            for section in sections:
                try:
                    file_path = f'campus-data/{college_id}/{section}.json'
                    response = await self.supabase.storage.from_('campus-data').download(file_path)
                    data[f'{section}_content'] = json.loads(response)
                except Exception as e:
                    print(f"Failed to load {section}: {e}")
            return data

    async def _get_handbook_json_files(self, user_id: str, handbook_id: str, section: Optional[str] = None) -> Dict[str, Any]:
        """Load handbook data from JSON files"""
        if section:
            file_path = f'handbooks/{user_id}/{handbook_id}/processed/{section}.json'
            response = await self.supabase.storage.from_('handbooks').download(file_path)
            return json.loads(response)
        else:
            # Load full processed handbook
            file_path = f'handbooks/{user_id}/{handbook_id}/processed/full_processed.json'
            response = await self.supabase.storage.from_('handbooks').download(file_path)
            return json.loads(response)
```

### Agent Usage Example

```python
# camply-backend/student_desk/sub_agents/campus_agent/agent.py

from student_desk.tools.json_data_service import JSONDataService

class CampusAgent:
    def __init__(self, supabase_client):
        self.data_service = JSONDataService(supabase_client)

    async def get_placement_info(self, college_id: str, query: str) -> str:
        """Get placement information for campus queries"""
        # Get placement data (tries table first, then JSON files)
        placement_data = await self.data_service.get_college_data(college_id, 'placements')

        # Process query against the data
        if 'average package' in query.lower():
            stats = placement_data.get('placement_statistics', {})
            latest_year = max(stats.keys()) if stats else None
            if latest_year:
                avg_package = stats[latest_year].get('average_package', 0)
                return f"The average package for {latest_year} was ₹{avg_package:,}"

        # More query processing logic...
        return "Information not found"
```

## 4. Data Migration Strategy

### Step 1: Update Database Schema

```sql
-- Add source document references
ALTER TABLE campus_ai_content ADD COLUMN source_documents JSONB DEFAULT '{}';
ALTER TABLE user_handbooks ADD COLUMN source_document_path TEXT;
```

### Step 2: Create Storage Buckets

```sql
-- Create buckets for JSON files
INSERT INTO storage.buckets (id, name, public, file_size_limit) VALUES
('campus-data', 'campus-data', false, 104857600),
('handbooks', 'handbooks', false, 104857600);
```

### Step 3: Migration Script

```python
# migration_script.py
async def migrate_to_hybrid_approach():
    """Migrate existing data to hybrid approach"""

    # For each college, create JSON files from existing JSONB
    colleges = await supabase.from('campus_ai_content').select('*').execute()

    for college in colleges.data:
        college_id = college['college_id']

        # Create overview.json
        overview_data = {
            "version": "1.0",
            "last_updated": datetime.now().isoformat(),
            "college_info": college.get('college_overview_content', {})
        }

        # Upload to storage
        await supabase.storage.from_('campus-data').upload(
            f'{college_id}/overview.json',
            json.dumps(overview_data, indent=2)
        )

        # Update table with reference
        await supabase.from('campus_ai_content').update({
            'source_documents': {
                'overview': f'{college_id}/overview.json'
            }
        }).eq('college_id', college_id).execute()
```

## 5. Best Practices

### For Agents:

1. **Always try table query first** (faster)
2. **Use JSON files for complex analysis** only
3. **Cache frequently accessed data**
4. **Handle both data sources gracefully**

### For Data Management:

1. **Keep tables in sync with JSON files**
2. **Version your JSON schemas**
3. **Use structured logging for data access**
4. **Implement data validation**

### Performance Guidelines:

- **Table queries**: 10-50ms (use for 90% of cases)
- **JSON file reads**: 100-500ms (use for detailed analysis)
- **Hybrid caching**: Best of both worlds

This approach gives you the flexibility to use structured database queries for most agent operations while having the option to access raw JSON files for complex scenarios.
