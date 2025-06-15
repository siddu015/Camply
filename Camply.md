# _`CAMPLY`_

## Camply-web

- Connected to supabase for postgre sql database
- Created a login system via google authentication with help of Supabase
- Implmented a academic form section where new users should fill while unboarding to know basic details about a user and his academic life.

  - Few colleges are there right now for users to select for testing
  - And colleges data is added manually and user had to just select the college
  - After completing this section only user will enter the main app

- **Create a sidebar**

  - The side currently is used for only desk section(The home & campus sidebars will be built later)
  - Available in white theme and dark theme
  - Sidebar consists of a footer with user profile, name and email which also acts as a button to (profile, settings, logout)
  - The logout functionality works for logging out user with a confirm dailog.

- **Desk Sidebar**
  - It had mainly 2 main sections Profile and Semester
  - The profile section(rename it) have two components Campus & Academics.
  - The Semester Section had Overview and courses components
  - It also has a camply-ai bot which is connected to backend as a bridge with adk which will be used the same connection in future for next agent connections in app.

- **Profile section**
  - Campus component is built to display basic college details.
  - It also has the Prompt Buttons which are connected to a backend to give responses

### Next phase(Camply-web)

- **Campus Component**
  - The button prompts in campus-content section should open new pages 
  - This pages should be displaying responses as clear markdown
  - The prompt of each button should be clear and create defined files for each button prompt
  - The prompt should be clear on what to be display on that specific page that includes
    - What should be response including
    - It need images?
    - Everything from top to bottom that needs to be displayed on this page should be clearly mentioned in the prompt
  - Now the page should be able to clearly markdown the response professionally so user can read
  - The Response generated should also be save and should not be updated on every click(Until One day)
  - Inside response if user had a additional query he can select the specific part in response he had doubt and click explain more clearly button to display a dailog below or above the selected text to explain clearly about it. 


- **Academic Component**
  - Display user academic details 
  - Academic timeline of each semester
  - Collect user branch/department hand book
    - Then store this hand book in supabase
    - Along with book we should create few columns(10-20) to store json data about hand book
    - Each column should hold specific data about his department which we collected from hand book(Basic, Exams, Evaluations, Semesters, Attendance, etc which we usually have in a handbook)
    - For this first we should create an agent or backend funtionality which will be analyze the book/ or parse the book using python parsing libraries and then the collected data in handbook to supabase which will be used by adk to give response
  - User can ask any question on his rule book once he uploaded both on camply-ai and special component to be built so user can use to ask questions
  - Create Some Actions to perform analysis on student insights
    - Performance metrics
    - GPA Analysis
    - Career analysis
    - things to do in semester breaks
    - Analysis on specific semester or course
  - think about something that should be displayed here such as past semesters etc.
  - Can display about current semester a brief and to see more route to semester/overview component
  - Create a professional UI/UX design for this component to be user friendly with both themes


- **Semester/Overview**
  - Display semester details 
    - semester timeline
  - Show all Courses 
    - To see all course in detail route to semester/courses
    - To see more about a course route to that course page which will be in semester/courses
  - Score trackers
  - How to perform better in IA-1
  - Analysis to improve IA-2 score based on IA-1 score
  - Analysis to improve SEM-end performance on IA-scores


- **Semester/Courses**
  - Display all current semester courses
  - Each courses should display
    - Course details 
    - All course units
    - Scores of this course
    - Study for IA-1 button (Analyze the best way to score high marks)
      - Should start with first 2 units
      - Study a complete unit by on click
      - Study topic by topic
        - Each unit we display all the topics
        - click on topic and click on a button to study this topic in detail
        - The course agent will analyze the course, scores, any previous saved notes and create a perfect answer for this topic and user can save it.
        - So by end he likes the response he can save
        - or else give him option on how he like the explanation should be by giving few options to select and a custom prompt option.
        - He clicks save and the response of that topic is saved to supabase.
      - After saving all responses of each topic the unit progress bar will be completed and all notes is saved in supabase.
      - He can also modify the topic responses in future.
      - His one topic saved metrics on how he wants response to be will be used for other topics response(used for other courses & units too)
      - Generate important questions on unit wise
    - Study for IA-2 button (Analyze IA-1 scores to improve IA-2 score)
    - Study for SEM End (Analyze IA score and suggestions)
    - Also assignments tracker for course and notification agents 


- **Desk Sidebar**
  - The breadcrumbs should have ability to move to specific pages by clicking on breadcrumb


- **Sidebar** 
  - Creating a profile page to display user basic details and option to update details
  - Setting page(Not sure what to include in this yet)

  
---


## Camply-Backend

- It had a basic fast api which acts as a bridge between frontend and backend 
- This fast api collects request from frontend and pass query and user_id to ADK
- We have a student_desk(root agent) which responds for basic questions on user data
- The campus questions will go to campus agent to answer.
- The data is fetched by adk tools from supabase based on user_id and use this data to respond

### Next phase (Camply-Backend)
- Connect **MCP server** such as Supabase for advance database operations more smoothly
- **Campus Agent**
  - Improve it to respond properly to all of the campus button prompts clearly
  - Implement advance tools to search even the college website and other sources to answer better
  - For latest events collect one additional source (like social media) and use them to scrape and answer
  - Also create a MCP server to connect to supabase and update the campus_ai_content table with latest data by replacing old data if it is approved.
- **Handbook agent**
  - First parse the handbook uploaded and store that handbook data into supabase handbook table
  - Then should respond to queries on hand book by fetching data from supabase.
  - The responses should be clear and concise
  - Don't respons if you don't know something- just say "The information you are asking about is not there in your handbook"
- **Semester agent**
  - Ability to perform all semester overview component tasks
  - Analysis on scores
  - Agents for reminders
- **Course agent**
  - Ability to generate notes
    - With images
    - Clear explanation
    - Search web for best resources on topic
    - Youtube videos
    - Clear flowcharts
  - Create a complete course flowchart
  - Create a flow chart for unit on how topics are connected
