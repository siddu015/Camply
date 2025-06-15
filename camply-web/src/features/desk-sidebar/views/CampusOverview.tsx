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
  Clock
} from 'lucide-react';
import { useCampusData } from '../../../hooks/useCampusData';
import { supabase } from '../../../lib/supabase';
import { useTheme } from '../../../lib/theme-provider';

export function CampusOverview() {
  const [session, setSession] = useState<any>(null);
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

  // Feature buttons configuration
  const featureButtons = [
    {
      id: 'campus-news',
      title: 'Campus News',
      description: 'Latest updates and announcements',
      icon: Newspaper,
      color: 'blue',
      gradient: 'from-blue-500 to-indigo-600',
      prompt: `Show latest news headlines about ${college?.name || 'my college'} from the last 30 days.`
    },
    {
      id: 'placements',
      title: 'Top Placements',
      description: 'Placement statistics and opportunities',
      icon: TrendingUp,
      color: 'green',
      gradient: 'from-green-500 to-emerald-600',
      prompt: `Summarize highest placement packages offered in ${college?.name || 'my college'} for 2025, 2024, 2023.`
    },
    {
      id: 'achievements',
      title: 'Recent Achievements',
      description: 'Awards, milestones, and recognition',
      icon: Trophy,
      color: 'yellow',
      gradient: 'from-yellow-500 to-amber-600',
      prompt: `What are the recent achievements, fests, awards or milestones from ${college?.name || 'my college'}?`
    },
    {
      id: 'campus-stats',
      title: 'Campus Stats',
      description: 'Student strength and department info',
      icon: BarChart3,
      color: 'purple',
      gradient: 'from-purple-500 to-violet-600',
      prompt: `Give me an overview of ${college?.name || 'my college'} – total students, departments, faculty, etc.`
    },
    {
      id: 'events',
      title: 'Events',
      description: 'Upcoming fests and activities',
      icon: Calendar,
      color: 'pink',
      gradient: 'from-pink-500 to-rose-600',
      prompt: `List upcoming or ongoing events in ${college?.name || 'my college'} for this semester.`
    },
    {
      id: 'campus-tour',
      title: 'Campus Tour',
      description: 'Explore facilities and infrastructure',
      icon: Map,
      color: 'cyan',
      gradient: 'from-cyan-500 to-teal-600',
      prompt: `Describe the campus layout of ${college?.name || 'my college'}, including hostels, libraries, and labs.`
    }
  ];

  const handleFeatureClick = (button: typeof featureButtons[0]) => {
    // For now, just log the prompt - will connect to backend later
    console.log(`Feature clicked: ${button.title}`);
    console.log(`Prompt: ${button.prompt}`);
    // TODO: Connect to CamplyBot or backend API
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
        {/* Ask About My Campus - Feature Buttons Grid */}
        <div className="bg-background border border-border rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Ask About My Campus</h3>
              <p className="text-sm text-muted-foreground">Explore what your campus has to offer</p>
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
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 bg-accent/30 rounded-lg border border-accent/40">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click any feature above to get AI-powered insights about your campus. More interactive features coming soon!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 