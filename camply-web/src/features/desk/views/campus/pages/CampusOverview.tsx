import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Newspaper,
  TrendingUp,
  Trophy,
  BarChart3,
  Calendar,
  Map,
} from 'lucide-react';
import { useCampusData } from '../hooks/useCampusData';
import { supabase } from '@/lib/supabase';
import { CampusHeader } from '../components/CampusHeader';
import { CampusFeatureCard } from '../components/CampusFeatureCard';
import SimpleLoader from '@/components/SimpleLoader';

const CAMPUS_FEATURES = [
  {
    id: 'campus-news',
    title: 'Campus Insights & Updates',
    description: 'Stay informed with the latest campus developments, announcements, and key institutional updates.',
    icon: Newspaper,
    gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    route: '/profile/campus/news'
  },
  {
    id: 'placements',
    title: 'Career Analytics',
    description: 'Explore comprehensive placement statistics, industry trends, and career opportunities.',
    icon: TrendingUp,
    gradient: 'bg-gradient-to-br from-emerald-500 to-green-600',
    route: '/profile/campus/placements'
  },
  {
    id: 'achievements',
    title: 'Institutional Excellence',
    description: 'Discover notable achievements, awards, and recognition across academic and research domains.',
    icon: Trophy,
    gradient: 'bg-gradient-to-br from-amber-500 to-yellow-600',
    route: '/profile/campus/achievements'
  },
  {
    id: 'campus-stats',
    title: 'Analytics Dashboard',
    description: 'Access key metrics, demographics, and performance indicators for data-driven insights.',
    icon: BarChart3,
    gradient: 'bg-gradient-to-br from-violet-500 to-purple-600',
    route: '/profile/campus/statistics'
  },
  {
    id: 'events',
    title: 'Campus Life & Events',
    description: 'Track upcoming events, cultural activities, and academic gatherings in real-time.',
    icon: Calendar,
    gradient: 'bg-gradient-to-br from-rose-500 to-pink-600',
    route: '/profile/campus/events'
  },
  {
    id: 'campus-tour',
    title: 'Infrastructure Overview',
    description: 'Explore campus facilities, infrastructure, and resources through an interactive guide.',
    icon: Map,
    gradient: 'bg-gradient-to-br from-teal-500 to-cyan-600',
    route: '/profile/campus/tour'
  }
];

export function CampusOverview() {
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();
  
  const { user, academicDetails, college, loading, error } = useCampusData(session?.user?.id);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleFeatureClick = (route: string) => {
    if (!session?.user?.id || !user) {
      console.error('User session not available');
      return;
    }
    navigate(route);
  };

  if (loading) {
    return <SimpleLoader />;
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
    return <SimpleLoader />;
  }

  const headerCollege = college ? {
    name: college.name,
    city: college.city,
    state: college.state,
    college_website_url: college.college_website_url,
    college_icon: college.college_icon
  } : undefined;

  const headerAcademicDetails = {
    department_name: academicDetails.department_name
  };

  return (
    <div className="animate-in fade-in-50 duration-300 slide-in-from-bottom-2 w-full">
      <CampusHeader 
        college={headerCollege}
        academicDetails={headerAcademicDetails} 
      />

      <div className="space-y-12 px-4 max-w-7xl mx-auto">
        <div className="relative">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold text-foreground">Campus Insights</h2>
            </div>
          </div>
    
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CAMPUS_FEATURES.map((feature) => (
              <CampusFeatureCard
                key={feature.id}
                {...feature}
                onClick={() => handleFeatureClick(feature.route)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 