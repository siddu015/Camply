#!/usr/bin/env python3
"""Script to get user's college_id and add sample campus content."""

import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import UserDataService
import config
from supabase import create_client

# Initialize Supabase client with service role key
supabase = create_client(config.SUPABASE_URL, config.SUPABASE_BACKEND_KEY)

async def get_user_college_id(user_id: str):
    """Get user's college_id from their academic details."""
    user_context = await UserDataService.get_user_context(user_id)
    if user_context and user_context.get('academic_details'):
        college_id = user_context['academic_details']['college_id']
        college_name = user_context['college']['name'] if user_context.get('college') else 'Unknown'
        print(f'✅ User college_id: {college_id}')
        print(f'✅ College name: {college_name}')
        return college_id, college_name
    else:
        print('❌ No academic details found for user')
        return None, None

def add_sample_campus_content(college_id: str, college_name: str):
    """Add sample campus content for the college."""
    
    sample_content = {
        "college_overview_content": {
            "founding_year": "2008",
            "vision": "To be a leading institution in technical education and research",
            "mission": "To provide quality education and foster innovation",
            "accreditation": "NAAC A+ Grade, NBA Accredited",
            "ranking": "Top 100 Engineering Colleges in India",
            "campus_size": "45 acres",
            "total_students": "8000+",
            "faculty_strength": "400+",
            "programs_offered": "B.Tech, M.Tech, MBA, MCA, Ph.D"
        },
        "facilities_content": {
            "library": "Central Library with 50,000+ books and digital resources",
            "laboratories": "State-of-the-art labs for all engineering disciplines",
            "hostels": "Separate hostels for boys and girls with modern amenities",
            "sports": "Cricket ground, basketball court, tennis court, gymnasium",
            "cafeteria": "Multiple food courts serving variety of cuisines",
            "transport": "Bus facility covering major areas of the city",
            "wifi": "High-speed WiFi connectivity across campus",
            "medical": "24/7 medical facility with qualified doctors"
        },
        "placements_content": {
            "placement_percentage": "85%",
            "highest_package": "45 LPA",
            "average_package": "6.5 LPA",
            "top_recruiters": "Microsoft, Amazon, Google, TCS, Infosys, Wipro, Accenture",
            "placement_cell": "Dedicated placement cell with industry connections",
            "internship_opportunities": "Mandatory internships with leading companies",
            "career_guidance": "Regular career counseling and skill development programs"
        },
        "departments_content": {
            "computer_science": "AI & Data Science, Cybersecurity, Software Engineering",
            "electronics": "VLSI Design, Embedded Systems, Communication Engineering",
            "mechanical": "Automotive Engineering, Robotics, Manufacturing",
            "civil": "Structural Engineering, Environmental Engineering",
            "management": "MBA with specializations in Finance, Marketing, HR",
            "research_centers": "AI Research Lab, IoT Center, Innovation Hub"
        },
        "admissions_content": {
            "entrance_exams": "JEE Main, KCET, COMEDK",
            "eligibility": "10+2 with Physics, Chemistry, Mathematics",
            "application_process": "Online application through official website",
            "fees_structure": "Competitive fee structure with scholarship opportunities",
            "scholarships": "Merit-based and need-based scholarships available",
            "admission_helpline": "24/7 admission support and guidance"
        }
    }
    
    try:
        # Insert campus content
        result = supabase.table("campus_ai_content").insert({
            "college_id": college_id,
            "college_overview_content": sample_content["college_overview_content"],
            "facilities_content": sample_content["facilities_content"],
            "placements_content": sample_content["placements_content"],
            "departments_content": sample_content["departments_content"],
            "admissions_content": sample_content["admissions_content"],
            "content_version": 1,
            "is_active": True
        }).execute()
        
        print(f'✅ Sample campus content added for {college_name}')
        print(f'✅ Content ID: {result.data[0]["campus_content_id"]}')
        return True
        
    except Exception as e:
        print(f'❌ Error adding campus content: {e}')
        return False

async def main():
    user_id = "b4f908e0-3262-4dd8-b63f-14115c724e7f"
    
    print("🔍 Getting user's college information...")
    college_id, college_name = await get_user_college_id(user_id)
    
    if college_id:
        print(f"\n📝 Adding sample campus content for {college_name}...")
        success = add_sample_campus_content(college_id, college_name)
        
        if success:
            print(f"\n🎉 Sample campus content added successfully!")
            print(f"Now you can test campus queries for {college_name}")
        else:
            print(f"\n❌ Failed to add campus content")
    else:
        print("❌ Cannot proceed without college_id")

if __name__ == "__main__":
    asyncio.run(main()) 