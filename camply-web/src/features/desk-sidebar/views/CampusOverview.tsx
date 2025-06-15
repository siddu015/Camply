import { useEffect, useState } from 'react';
import { 
  MapPin, 
  GraduationCap, 
  Calendar, 
  BookOpen, 
  User, 
  Building2, 
  Upload,
  Globe,
  Newspaper,
  TrendingUp,
  Trophy,
  BarChart3,
  MapPin as Map,
  ExternalLink,
  Users,
  Clock,
  X,
  Bot,
  Loader2
} from 'lucide-react';
import { useCampusData } from '../../../hooks/useCampusData';
import { supabase } from '../../../lib/supabase';
import { useTheme } from '../../../lib/theme-provider';
import { CamplyBotService } from '../../../lib/camply-bot';
import type { ChatRequest, ChatResponse } from '../../../lib/camply-bot';

// Initialize CamplyBot service
const camplyBot = CamplyBotService.getInstance();

interface FeatureButtonResponse {
  isOpen: boolean;
  loading: boolean;
  title: string;
  content: string;
  error?: string;
}

export function CampusOverview() {
  const [session, setSession] = useState<any>(null);
  const [responseModal, setResponseModal] = useState<FeatureButtonResponse>({
    isOpen: false,
    loading: false,
    title: '',
    content: '',
  });
  
  const { user, academicDetails, college, currentSemester, loading, error } = useCampusData(session?.user?.id);
  const { theme } = useTheme();
  
  // Determine if dark mode (considering system preference)
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Enhanced feature buttons configuration with more professional prompts
  const featureButtons = [
    {
      id: 'campus-news',
      title: 'Campus News & Updates',
      description: 'Latest news, announcements, and achievements',
      icon: Newspaper,
      color: 'blue',
      gradient: 'from-blue-500 to-indigo-600',
      prompt: `Provide comprehensive latest news headlines and major announcements about ${college?.name || 'my college'} from the last 30 days. Include recent achievements, policy updates, important notices, and any significant developments that would be relevant to current students. Format this as a professional news briefing with dates and sources where available.`
    },
    {
      id: 'placements',
      title: 'Placement Analytics',
      description: 'Comprehensive placement statistics and trends',
      icon: TrendingUp,
      color: 'green',
      gradient: 'from-green-500 to-emerald-600',
      prompt: `Analyze and summarize comprehensive placement statistics for ${college?.name || 'my college'} for the years 2023, 2024, and 2025. Include highest packages offered, average salary trends, top recruiting companies, department-wise placement percentages, industry distribution, and any notable placement achievements. Present this as a detailed placement intelligence report with year-over-year comparisons.`
    },
    {
      id: 'achievements',
      title: 'Recent Achievements',
      description: 'Awards, recognitions, and institutional milestones',
      icon: Trophy,
      color: 'yellow',
      gradient: 'from-yellow-500 to-amber-600',
      prompt: `Compile a comprehensive report on recent achievements, awards, recognitions, and significant milestones of ${college?.name || 'my college'}. Include NAAC grades, NIRF rankings, NBA accreditations, research achievements, student accomplishments, faculty recognitions, and any other notable institutional achievements from the past year. Format this as an achievements showcase with specific dates and impact.`
    },
    {
      id: 'campus-stats',
      title: 'Campus Statistics',
      description: 'Comprehensive institutional metrics and demographics',
      icon: BarChart3,
      color: 'purple',
      gradient: 'from-purple-500 to-violet-600',
      prompt: `Provide a detailed statistical overview of ${college?.name || 'my college'} including total student enrollment, faculty strength, faculty-to-student ratio, number of departments and programs offered, infrastructure metrics, campus size, hostel capacity, library resources, laboratory facilities, and any other relevant institutional statistics. Present this as a comprehensive institutional profile with quantitative analysis.`
    },
    {
      id: 'events',
      title: 'Campus Events & Fests',
      description: 'Upcoming events, festivals, and cultural activities',
      icon: Calendar,
      color: 'pink',
      gradient: 'from-pink-500 to-rose-600',
      prompt: `Provide a comprehensive calendar and analysis of upcoming events, fests, and activities at ${college?.name || 'my college'} for this academic year. Include technical festivals, cultural events, workshops, seminars, guest lectures, competitions, annual celebrations, and club activities. Present this as an events guide with dates, descriptions, participation details, and historical significance of major annual events.`
    },
    {
      id: 'campus-tour',
      title: 'Virtual Campus Tour',
      description: 'Detailed exploration of facilities and infrastructure',
      icon: Map,
      color: 'cyan',
      gradient: 'from-cyan-500 to-teal-600',
      prompt: `Provide a comprehensive virtual tour and detailed description of ${college?.name || 'my college'} campus layout, infrastructure, and facilities. Include academic buildings, laboratories, libraries, hostels, recreational facilities, sports complex, dining facilities, auditoriums, research centers, administrative buildings, transportation facilities, and any unique campus features. Present this as a detailed campus infrastructure guide with facility descriptions and amenities available.`
    }
  ];

  const handleFeatureClick = async (button: typeof featureButtons[0]) => {
    if (!session?.user?.id || !user) {
      console.error('User session not available');
      return;
    }

    setResponseModal({
      isOpen: true,
      loading: true,
      title: button.title,
      content: '',
    });

    try {
      // Prepare the chat request with enhanced context
      const chatRequest: ChatRequest = {
        message: button.prompt,
        user_id: session.user.id,
        context: {
          college_name: college?.name,
          college_website: college?.college_website_url,
          department: academicDetails?.department_name,
          branch: academicDetails?.branch_name,
          query_type: button.id,
          feature_button: true
        }
      };

      // Send request to CamplyBot
      const response: ChatResponse = await camplyBot.sendMessage(chatRequest);

      if (response.success) {
        setResponseModal(prev => ({
          ...prev,
          loading: false,
          content: response.response,
        }));
      } else {
        setResponseModal(prev => ({
          ...prev,
          loading: false,
          content: `I apologize, but I'm having trouble accessing the latest information about ${college?.name || 'your college'} right now. This could be due to:

• Temporary connectivity issues with our data sources
• The college website may be temporarily unavailable
• Our AI service is currently being updated

Please try again in a few moments, or you can:
• Visit the official college website directly
• Contact the college administration for specific information
• Try a different query type

The system is designed to provide real-time campus intelligence, and we're working to restore full functionality.`,
          error: response.error || 'Failed to get response'
        }));
      }
    } catch (error) {
      console.error('Error fetching campus information:', error);
      setResponseModal(prev => ({
        ...prev,
        loading: false,
        content: `I encountered an issue while gathering information about ${college?.name || 'your college'}. Please check your internet connection and try again.`,
        error: 'Network error'
      }));
    }
  };

  const closeModal = () => {
    setResponseModal({
      isOpen: false,
      loading: false,
      title: '',
      content: '',
    });
  };

  if (loading) {
    return (
      <div className="animate-in fade-in-50 duration-300 slide-in-from-bottom-2 w-full">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-in fade-in-50 duration-300 slide-in-from-bottom-2 w-full">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
          <h3 className="font-medium mb-2">Unable to load campus data</h3>
          <p className="text-sm opacity-90">There was an issue connecting to the database. Please try refreshing the page.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-3 px-3 py-1 bg-destructive/20 hover:bg-destructive/30 text-destructive rounded text-sm transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (!user || !academicDetails) {
    return (
      <div className="animate-in fade-in-50 duration-300 slide-in-from-bottom-2 w-full">
        <div className="text-center py-12">
          <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Academic details not found</h3>
          <p className="text-muted-foreground">Your academic information could not be retrieved. Please contact support if this issue persists.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in-50 duration-300 slide-in-from-bottom-2 w-full">
      {/* Campus Header with proper theme support */}
      <div 
        className="relative h-80 -mt-6 mb-6 overflow-hidden border-b border-border"
        style={{ 
          width: 'calc(100% + 50px)', 
          marginLeft: '-25px',
        }}
      >
        {/* Dynamic theme background */}
        <div 
          className="absolute inset-0"
          style={{
            background: isDark 
              ? 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)'
              : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #cbd5e1 100%)',
          }}
        />
        {/* Background pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.foreground/0.1)_1px,transparent_0)] bg-[length:20px_20px] opacity-30" />
        
        {/* Content container */}
        <div className="relative z-10 flex flex-col justify-center h-full p-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            {college?.name || `${academicDetails.department_name} Campus`}
          </h1>
          
          <div className="text-xl text-muted-foreground space-y-2">
            {college?.city && college?.state ? (
              <div className="flex items-center space-x-2">
                <MapPin className="h-6 w-6" />
                <span>{college.city}, {college.state}</span>
              </div>
            ) : college?.city ? (
              <div className="flex items-center space-x-2">
                <MapPin className="h-6 w-6" />
                <span>{college.city}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <MapPin className="h-6 w-6" />
                <span>Location not specified</span>
              </div>
            )}
            
            {college?.college_website_url && (
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <a 
                  href={college.college_website_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-lg hover:text-primary transition-colors flex items-center space-x-1 group"
                >
                  <span>Visit Website</span>
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>
            )}
          </div>
        </div>
        
        {/* Campus image */}
        {college?.college_icon && (
          <div className="absolute bottom-6 right-6 z-10">
            <div className="w-32 h-20 md:w-40 md:h-24 rounded-xl overflow-hidden shadow-lg border border-border/50 bg-white">
              <img 
                src={college.college_icon} 
                alt={`${college.name} campus`}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {/* Ask About My Campus - Enhanced Feature Buttons Grid */}
        <div className="bg-background border border-border rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg">
              <Bot className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">AI-Powered Campus Intelligence</h3>
              <p className="text-sm text-muted-foreground">Get comprehensive, real-time insights about your campus</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featureButtons.map((button) => {
              const IconComponent = button.icon;
              return (
                <button
                  key={button.id}
                  onClick={() => handleFeatureClick(button)}
                  className="group relative p-6 bg-background hover:bg-accent/50 border border-border hover:border-border/60 rounded-xl transition-all duration-300 hover:shadow-md hover:scale-[1.02] text-left"
                >
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${button.gradient} opacity-0 group-hover:opacity-5 rounded-xl transition-opacity duration-300`} />
                  
                  {/* Content */}
                  <div className="relative">
                    <div className={`w-12 h-12 bg-gradient-to-br ${button.gradient} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    
                    <h4 className="text-base font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {button.title}
                    </h4>
                    
                    <p className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors">
                      {button.description}
                    </p>
                    
                    {/* Arrow indicator */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Bot className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 bg-accent/30 rounded-lg border border-accent/40">
            <div className="flex items-center space-x-2">
              <Bot className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click any feature above to get AI-powered insights about {college?.name || 'your campus'} with real-time data analysis and professional formatting.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Response Modal */}
      {responseModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-accent/20">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Bot className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{responseModal.title}</h2>
                  <p className="text-sm text-muted-foreground">AI Analysis for {college?.name}</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {responseModal.loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">Analyzing campus data and generating comprehensive insights...</p>
                    <p className="text-sm text-muted-foreground mt-2">This may take a few moments for real-time analysis</p>
                  </div>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                    {responseModal.content}
                  </div>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            {!responseModal.loading && (
              <div className="flex items-center justify-between p-6 border-t border-border bg-accent/10">
                <p className="text-xs text-muted-foreground">
                  Data source: Campus database + Real-time web analysis
                </p>
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 