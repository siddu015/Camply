# CAMPLY

## Camply-web

- Connected to Supabase for PostgreSQL database
- Created a login system via Google authentication with Supabase integration
- Implemented an academic form section where new users must complete onboarding to provide basic details about themselves and their academic life
  - Several colleges are currently available for users to select during testing
  - College data is manually added and users simply select their college
  - Users can only enter the main app after completing this section

### Current Features

**Sidebar Implementation**

- Currently used only for the desk section (home and campus sidebars will be built later)
- Available in both white and dark themes
- Sidebar includes a footer with user profile, name, and email that functions as a button for profile, settings, and logout options
- Logout functionality works with a confirmation dialog

**Desk Sidebar Structure**

- Contains two main sections: Profile and Semester
- Profile section includes Campus and Academics components
- Semester section includes Overview and Courses components
- Features a Camply AI bot connected to the backend as a bridge with ADK, which will be used for future agent connections in the app

**Profile/Campus Component**

- Campus component displays basic college details
- Includes prompt buttons connected to the backend for generating responses

### Next Phase (Camply-web)

**Campus Component Enhancements**

<!-- - Button prompts in the campus-content section should open dedicated pages
- These pages should display responses as clear, well-formatted markdown
- Pages should professionally render markdown responses for optimal readability
- Generated responses should be saved and not updated on every click;cached for one day -->
- Create defined prompt files for each button with clear specifications including:
  - What the response should include
  - Whether images are needed
  - Complete page layout requirements from top to bottom
- Implement contextual help: when users select specific text in responses, they can click "Explain More Clearly" to display additional clarification in a dialog above or below the selected text
etails
**Academic Component Development**

- Display comprehensive user academic d
- Show academic timeline for each semester
- Implement department/branch handbook collection system:
  - Store handbooks in Supabase
  - Create 10-20 columns to store JSON data extracted from handbooks
  - Each column should contain specific departmental data (basics, exams, evaluations, semesters, attendance, etc.)
  - Develop agent or backend functionality to analyze/parse handbooks using Python parsing libraries
  - Store collected handbook data in Supabase for ADK response generation
- Enable users to ask questions about their rulebook through Camply AI and a specialized component
- Create analytical actions for student insights:
  - Performance metrics tracking
  - GPA analysis and trends
  - Career path analysis
  - Semester break activity recommendations
  - Specific semester or course analysis
- Display information about past semesters and current semester briefs
- Route to semester/overview component for detailed views
- Design professional UI/UX for user-friendly experience in both themes

**Semester/Overview Enhancements**

- Display comprehensive semester details including timeline
- Show all courses with routing to semester/courses for detailed views
- Individual course pages accessible through semester/courses
- Implement score tracking systems
- Provide performance improvement suggestions:
  - "How to perform better in IA-1" recommendations
  - IA-2 improvement analysis based on IA-1 scores
  - Semester-end performance optimization based on IA scores

**Semester/Courses Development**

- Display all current semester courses with detailed information:
  - Complete course details
  - All course units breakdown
  - Individual course scores tracking
  - "Study for IA-1" feature with unit-based learning:
    - Start with first two units
    - Complete unit study functionality
    - Topic-by-topic learning system
    - Unit progress bars and topic management
    - Customizable explanation preferences
    - Note-saving functionality with future modification options
    - Personalized response preferences for cross-course application
    - Unit-wise important question generation
  - "Study for IA-2" feature analyzing IA-1 scores for improvement
  - "Study for SEM End" feature with comprehensive IA score analysis
  - Assignment tracking and notification system

**Navigation and User Management**

<!-- - Implement clickable breadcrumbs for easy page navigation -->

- Create comprehensive profile page for user detail display and updates
- Develop settings page (features to be determined)

**Additional Recommended Features**

- Study group formation and management
- Peer comparison and benchmarking (anonymous)
- Calendar integration for exam schedules and deadlines
- Mobile-responsive design optimization
- Offline mode for saved notes and study materials
- Progress tracking with achievement badges
- Parent/guardian portal for performance monitoring
- Integration with college LMS systems
- Real-time notifications for important updates
- Study session time tracking and analytics
- Collaborative note-sharing within courses
- AI-powered study schedule optimization
- Integration with popular productivity tools (Google Calendar, Notion, etc.)

---

## Camply-Backend

- Features a basic FastAPI that serves as a bridge between frontend and backend
- FastAPI collects requests from frontend and passes queries and user_id to ADK
- Student_desk (root agent) responds to basic questions about user data
- Campus questions are routed to the campus agent for specialized responses
- Data is fetched by ADK tools from Supabase based on user_id for response generation

### Next Phase (Camply-Backend)

**Infrastructure Improvements**

- Connect MCP server integration (such as Supabase) for advanced database operations

**Campus Agent Enhancement**

- Improve response quality for all campus button prompts
- Implement advanced tools for college website and external source searches
- Add social media scraping for latest events and updates
- Create MCP server for Supabase connection to update campus_ai_content table with approved latest data

**Handbook Agent Development**

- Parse uploaded handbooks and store data in Supabase handbook table
- Respond to handbook queries by fetching data from Supabase
- Provide clear and concise responses
- Implement proper error handling: respond with "The information you are asking about is not available in your handbook" when data is unavailable

**Semester Agent Implementation**

- Handle all semester overview component tasks
- Perform comprehensive score analysis
- Implement reminder and notification agents
- Predictive analytics for academic performance

**Course Agent Development**

- Generate comprehensive study notes with:
  - Relevant images and diagrams
  - Clear explanations and examples
  - Web-sourced best resources for topics
  - Curated YouTube video recommendations
  - Interactive flowcharts and mind maps
- Create complete course flowcharts showing topic interconnections
- Develop unit flowcharts displaying topic relationships and dependencies

**Additional Backend Recommendations**

- Implement caching system for frequently accessed data
- Add rate limiting and API security measures
- Create backup and disaster recovery systems
- Implement audit logging for user actions
- Add performance monitoring and analytics
- Create automated testing suite for all agents
- Implement version control for AI model updates
- Add support for multiple languages
- Create admin dashboard for system monitoring
- Implement data export functionality for users
- Add integration APIs for third-party services
- Create webhook system for real-time updates
