import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  GraduationCap, 
  Calendar, 
  Globe,
  Newspaper,
  TrendingUp,
  Trophy,
  BarChart3,
  MapPin as Map,
  ExternalLink,
  Bot,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useCampusData } from './hooks/useCampusData';
import { supabase } from '../../../../lib/supabase';
import { useTheme } from '../../../../lib/theme-provider';

export function CampusOverview() {
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();
  
  const { user, academicDetails, college, loading, error } = useCampusData(session?.user?.id);
  const { theme } = useTheme();
  
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

  const featureButtons = [
    {
      id: 'campus-news',
      title: 'Campus News & Updates',
      description: 'Latest news, announcements, and achievements',
      icon: Newspaper,
      color: 'blue',
      gradient: 'from-blue-500 to-indigo-600',
      route: '/desk/campus/news'
    },
    {
      id: 'placements',
      title: 'Placement Analytics',
      description: 'Comprehensive placement statistics and trends',
      icon: TrendingUp,
      color: 'green',
      gradient: 'from-green-500 to-emerald-600',
      route: '/desk/campus/placements'
    },
    {
      id: 'achievements',
      title: 'Recent Achievements',
      description: 'Awards, recognitions, and institutional milestones',
      icon: Trophy,
      color: 'yellow',
      gradient: 'from-yellow-500 to-amber-600',
      route: '/desk/campus/achievements'
    },
    {
      id: 'campus-stats',
      title: 'Campus Statistics',
      description: 'Comprehensive institutional metrics and demographics',
      icon: BarChart3,
      color: 'purple',
      gradient: 'from-purple-500 to-violet-600',
      route: '/desk/campus/statistics'
    },
    {
      id: 'events',
      title: 'Campus Events & Fests',
      description: 'Upcoming events, festivals, and cultural activities',
      icon: Calendar,
      color: 'pink',
      gradient: 'from-pink-500 to-rose-600',
      route: '/desk/campus/events'
    },
    {
      id: 'campus-tour',
      title: 'Virtual Campus Tour',
      description: 'Detailed exploration of facilities and infrastructure',
      icon: Map,
      color: 'cyan',
      gradient: 'from-cyan-500 to-teal-600',
      route: '/desk/campus/tour'
    }
  ];

  const handleFeatureClick = (button: typeof featureButtons[0]) => {
    if (!session?.user?.id || !user) {
      console.error('User session not available');
      return;
    }
    navigate(button.route);
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
      <div 
        className="relative h-80 -mt-6 mb-6 overflow-hidden border-b border-border"
        style={{ 
          width: 'calc(100% + 50px)', 
          marginLeft: '-25px',
        }}
      >
        <div 
          className="absolute inset-0"
          style={{
            background: isDark 
              ? 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)'
              : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #cbd5e1 100%)',
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.foreground/0.1)_1px,transparent_0)] bg-[length:20px_20px] opacity-30" />
        
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

      <div className="space-y-10">
        <div className="bg-gradient-to-br from-background via-background to-muted/30 border border-border rounded-2xl p-8 shadow-sm">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl border border-blue-500/20">
                  <Bot className="h-7 w-7 text-blue-500" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">AI-Powered Campus Intelligence</h2>
                <p className="text-muted-foreground">Get comprehensive, real-time insights about your campus with advanced analytics</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground bg-muted/50 rounded-full px-3 py-1.5">
              <Sparkles className="h-3 w-3" />
              <span>Real-time Analysis</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureButtons.map((button) => {
              const IconComponent = button.icon;
              return (
                <button
                  key={button.id}
                  onClick={() => handleFeatureClick(button)}
                  className="group relative p-6 bg-background hover:bg-accent/30 border border-border hover:border-primary/30 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.02] text-left overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${button.gradient} opacity-0 group-hover:opacity-[0.03] rounded-2xl transition-opacity duration-500`} />
                  
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${button.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  
                  <div className="relative">
                    <div className={`w-14 h-14 bg-gradient-to-br ${button.gradient} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-all duration-300 shadow-lg`}>
                      <IconComponent className="h-7 w-7 text-white" />
                    </div>
                    
                    <h3 className="text-lg font-semibold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                      {button.title}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300 leading-relaxed mb-4">
                      {button.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground group-hover:text-primary/70 transition-colors duration-300 font-medium">
                        Explore insights
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-200/30 dark:border-blue-800/30">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Bot className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-foreground mb-2">Intelligent Campus Analysis</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Each section provides AI-generated insights about <span className="font-medium text-foreground">{college?.name || 'your campus'}</span> with real-time data analysis, 
                  comprehensive research, and professional formatting. Data is intelligently cached for optimal performance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CampusOverview; 