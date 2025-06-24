import { useParams, Navigate, useLocation } from 'react-router-dom';
import { 
  Newspaper, 
  TrendingUp, 
  Trophy, 
  BarChart3, 
  Calendar, 
  MapPin as Map 
} from 'lucide-react';
import { BaseCampusPage } from './BaseCampusPage';
import { useEffect } from 'react';
import { deskRouteConfig } from '@/lib/route-config';

const CAMPUS_FEATURES = {
  'news': {
    id: 'campus-news',
    title: 'News',
    icon: Newspaper,
    gradient: 'from-blue-500 to-indigo-600'
  },
  'placements': {
    id: 'placements',
    title: 'Placements',
    icon: TrendingUp,
    gradient: 'from-green-500 to-emerald-600'
  },
  'achievements': {
    id: 'achievements',
    title: 'Achievements',
    icon: Trophy,
    gradient: 'from-yellow-500 to-amber-600'
  },
  'statistics': {
    id: 'campus-stats',
    title: 'Statistics',
    icon: BarChart3,
    gradient: 'from-purple-500 to-violet-600'
  },
  'events': {
    id: 'events',
    title: 'Events',
    icon: Calendar,
    gradient: 'from-pink-500 to-rose-600'
  },
  'tour': {
    id: 'campus-tour',
    title: 'Campus Tour',
    icon: Map,
    gradient: 'from-cyan-500 to-teal-600'
  }
} as const;

type FeatureKey = keyof typeof CAMPUS_FEATURES;

const updateBreadcrumbConfig = (feature: string) => {
  if (feature && feature in CAMPUS_FEATURES) {
    const featureKey = feature as FeatureKey;
    const featureTitle = CAMPUS_FEATURES[featureKey].title;
    
    if (deskRouteConfig[`/profile/campus/${feature}`]) {
      deskRouteConfig[`/profile/campus/${feature}`].title = featureTitle;
    } else if (deskRouteConfig['/profile/campus/:feature']) {
      deskRouteConfig['/profile/campus/:feature'].title = featureTitle;
    }
  }
};

export function CampusFeaturePage() {
  const { feature } = useParams<{ feature: string }>();
  const location = useLocation();
  
  useEffect(() => {
    if (feature) {
      updateBreadcrumbConfig(feature);
    }
  }, [feature, location.pathname]);
  
  if (!feature || !(feature in CAMPUS_FEATURES)) {
    return <Navigate to="/profile/campus" replace />;
  }
  
  const featureConfig = CAMPUS_FEATURES[feature as FeatureKey];
  
  return (
    <BaseCampusPage
      featureId={featureConfig.id}
      icon={featureConfig.icon}
      gradient={featureConfig.gradient}
    />
  );
} 
