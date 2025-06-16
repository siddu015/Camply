export interface CampusPromptConfig {
  id: string;
  title: string;
  prompt: string;
  expectedSections: string[];
  includeImages: boolean;
  estimatedLength: 'short' | 'medium' | 'long';
  priority: 'high' | 'medium' | 'low';
}

export const CAMPUS_PROMPTS: Record<string, CampusPromptConfig> = {
  'campus-news': {
    id: 'campus-news',
    title: 'Campus News & Updates',
    prompt: `Provide comprehensive latest news headlines and major announcements about {college_name} from the last 30 days. 

REQUIRED SECTIONS:
1. **Breaking News & Major Announcements** - Most recent and impactful news
2. **Academic Updates** - New programs, policy changes, academic achievements
3. **Administrative News** - Leadership changes, new facilities, institutional updates
4. **Student Achievements** - Recent awards, competitions, recognitions
5. **Upcoming Events** - Important dates and events to watch
6. **Research & Innovation** - New research projects, publications, grants

FORMAT REQUIREMENTS:
- Use clear markdown headers (##, ###)
- Include dates when available
- Use bullet points for multiple items
- Add source links where possible
- Group related news items together
- Prioritize most recent and relevant news

STYLE:
- Professional news briefing tone
- Factual and concise
- Include impact and significance
- Use active voice
- Keep each news item to 2-3 sentences maximum`,
    expectedSections: [
      'Breaking News & Major Announcements',
      'Academic Updates', 
      'Administrative News',
      'Student Achievements',
      'Upcoming Events',
      'Research & Innovation'
    ],
    includeImages: false,
    estimatedLength: 'long',
    priority: 'high'
  },

  'placements': {
    id: 'placements',
    title: 'Placement Analytics',
    prompt: `Analyze and summarize comprehensive placement statistics for {college_name} for the years 2023, 2024, and 2025.

REQUIRED SECTIONS:
1. **Executive Summary** - Key highlights and overall performance
2. **Placement Statistics by Year** - Year-over-year comparison with percentages
3. **Salary Analytics** - Highest, average, median packages with trends
4. **Top Recruiting Companies** - List of major recruiters with package ranges
5. **Department-wise Performance** - Breakdown by engineering/non-engineering streams
6. **Industry Distribution** - Sector-wise placement analysis (IT, Core, Finance, etc.)
7. **Notable Achievements** - Record packages, special recognitions
8. **Future Outlook** - Trends and predictions for upcoming placement seasons

DATA REQUIREMENTS:
- Placement percentages for each year
- Package statistics (highest, average, median)
- Company names and sectors
- Department-wise breakdown
- Historical comparisons
- Growth trends

FORMAT:
- Use tables for statistical data
- Include percentage changes year-over-year
- Use charts/graphs descriptions where applicable
- Highlight key metrics in **bold**
- Use bullet points for company lists`,
    expectedSections: [
      'Executive Summary',
      'Placement Statistics by Year',
      'Salary Analytics',
      'Top Recruiting Companies',
      'Department-wise Performance',
      'Industry Distribution',
      'Notable Achievements',
      'Future Outlook'
    ],
    includeImages: true,
    estimatedLength: 'long',
    priority: 'high'
  },

  'achievements': {
    id: 'achievements',
    title: 'Recent Achievements',
    prompt: `Compile a comprehensive report on recent achievements, awards, recognitions, and significant milestones of {college_name}.

REQUIRED SECTIONS:
1. **Institutional Rankings & Accreditations** - NAAC, NIRF, NBA, AICTE recognitions
2. **Research Excellence** - Publications, patents, research awards, grants received
3. **Faculty Achievements** - Awards, recognitions, promotions, publications
4. **Student Accomplishments** - Competition wins, scholarships, national/international recognition
5. **Infrastructure Milestones** - New buildings, labs, equipment, campus improvements
6. **Industry Partnerships** - New collaborations, MoUs, industry tie-ups
7. **Social Impact Initiatives** - Community service, sustainability projects, social responsibility
8. **Alumni Success Stories** - Notable alumni achievements and contributions

CONTENT REQUIREMENTS:
- Include specific dates and details
- Mention award amounts/values where applicable
- Highlight national vs international recognition
- Include competition names and rankings
- Mention specific departments/individuals
- Add impact and significance of each achievement

FORMAT:
- Chronological ordering within sections
- Use ### for sub-categories
- Include achievement dates
- Bold highlight key metrics and awards
- Use numbered lists for rankings`,
    expectedSections: [
      'Institutional Rankings & Accreditations',
      'Research Excellence',
      'Faculty Achievements', 
      'Student Accomplishments',
      'Infrastructure Milestones',
      'Industry Partnerships',
      'Social Impact Initiatives',
      'Alumni Success Stories'
    ],
    includeImages: true,
    estimatedLength: 'long',
    priority: 'medium'
  },

  'campus-stats': {
    id: 'campus-stats',
    title: 'Campus Statistics',
    prompt: `Provide a detailed statistical overview of {college_name} including comprehensive institutional metrics and demographics.

REQUIRED SECTIONS:
1. **Student Demographics** - Total enrollment, gender ratio, state/country distribution
2. **Faculty & Staff Statistics** - Faculty strength, PhD holders, faculty-student ratio
3. **Academic Programs** - Number of departments, UG/PG programs, specialized courses
4. **Infrastructure Metrics** - Campus area, buildings, classrooms, laboratories
5. **Library & Resources** - Books, journals, digital resources, study spaces
6. **Hostel & Accommodation** - Capacity, occupancy, facilities available
7. **Sports & Recreation** - Facilities, courts, gymnasium, activities offered
8. **Research Statistics** - Active projects, publications, patents, funding

DATA REQUIREMENTS:
- Specific numbers and percentages
- Capacity vs utilization statistics
- Growth trends over years
- Comparative metrics where relevant
- Resource per student ratios
- Geographic distribution data

FORMAT:
- Use tables for statistical data
- Include comparison metrics
- Percentage breakdowns where applicable
- Bold key statistics
- Use bullet points for facility lists
- Include year-over-year growth where available`,
    expectedSections: [
      'Student Demographics',
      'Faculty & Staff Statistics',
      'Academic Programs',
      'Infrastructure Metrics',
      'Library & Resources',
      'Hostel & Accommodation', 
      'Sports & Recreation',
      'Research Statistics'
    ],
    includeImages: true,
    estimatedLength: 'medium',
    priority: 'medium'
  },

  'events': {
    id: 'events',
    title: 'Campus Events & Fests',
    prompt: `Provide a comprehensive calendar and analysis of events, fests, and activities at {college_name} for this academic year.

REQUIRED SECTIONS:
1. **Major Annual Events** - Flagship fests and celebrations with dates
2. **Technical Events** - Symposiums, hackathons, technical competitions
3. **Cultural Activities** - Cultural fests, competitions, performances
4. **Academic Events** - Conferences, seminars, guest lectures, workshops
5. **Sports & Recreation** - Sports events, tournaments, fitness activities
6. **Club Activities** - Student club events, meetings, special programs
7. **Industry Interactions** - Corporate visits, placement drives, career fairs
8. **Community Outreach** - Social service events, awareness programs

EVENT DETAILS REQUIRED:
- Event names and themes
- Scheduled dates and duration
- Venue/location information
- Expected participation numbers
- Registration requirements
- Prize money/recognition
- Historical significance

FORMAT:
- Organize by event category
- Include event dates prominently
- Use bullet points for event lists
- Bold event names and dates
- Include brief descriptions
- Mention participation eligibility
- Add contact information where relevant`,
    expectedSections: [
      'Major Annual Events',
      'Technical Events',
      'Cultural Activities',
      'Academic Events',
      'Sports & Recreation',
      'Club Activities',
      'Industry Interactions',
      'Community Outreach'
    ],
    includeImages: false,
    estimatedLength: 'long',
    priority: 'medium'
  },

  'campus-tour': {
    id: 'campus-tour',
    title: 'Virtual Campus Tour',
    prompt: `Provide a comprehensive virtual tour and detailed description of {college_name} campus layout, infrastructure, and facilities.

REQUIRED SECTIONS:
1. **Campus Overview** - Total area, layout, architectural highlights
2. **Academic Buildings** - Departments, classrooms, lecture halls, capacity
3. **Laboratory Facilities** - Specialized labs, equipment, research facilities
4. **Library Complex** - Reading halls, digital resources, study spaces
5. **Hostel Accommodation** - Boys/girls hostels, capacity, amenities, mess facilities
6. **Sports Complex** - Playgrounds, gymnasium, courts, swimming pool
7. **Administrative Buildings** - Office locations, services available
8. **Recreation & Amenities** - Cafeteria, medical center, bank, shopping
9. **Transportation & Connectivity** - Bus services, parking, accessibility

FACILITY DESCRIPTIONS REQUIRED:
- Specific locations and directions
- Capacity and specifications
- Operating hours and access rules
- Equipment and technology available
- Special features and amenities
- Accessibility features
- Recent upgrades or renovations

FORMAT:
- Organize as a guided tour route
- Include building/facility names
- Mention key features and highlights
- Use descriptive language for ambiance
- Include practical information (timings, access)
- Bold facility names and key features
- Create logical flow from entrance to facilities`,
    expectedSections: [
      'Campus Overview',
      'Academic Buildings',
      'Laboratory Facilities',
      'Library Complex',
      'Hostel Accommodation',
      'Sports Complex',
      'Administrative Buildings',
      'Recreation & Amenities',
      'Transportation & Connectivity'
    ],
    includeImages: true,
    estimatedLength: 'long',
    priority: 'low'
  }
};

export function getCampusPrompt(featureId: string): CampusPromptConfig | null {
  return CAMPUS_PROMPTS[featureId] || null;
}

export function generatePromptText(featureId: string, collegeName: string): string {
  const config = getCampusPrompt(featureId);
  if (!config) {
    throw new Error(`No prompt configuration found for feature: ${featureId}`);
  }
  
  return config.prompt.replace(/\{college_name\}/g, collegeName || 'the college');
}

export function getAllCampusPrompts(): CampusPromptConfig[] {
  return Object.values(CAMPUS_PROMPTS);
} 