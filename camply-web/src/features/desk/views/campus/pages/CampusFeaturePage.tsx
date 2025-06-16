import { useParams, Navigate } from 'react-router-dom';
import { 
  Newspaper, 
  TrendingUp, 
  Trophy, 
  BarChart3, 
  Calendar, 
  MapPin as Map 
} from 'lucide-react';
import { BaseCampusPage } from './BaseCampusPage';

const CAMPUS_FEATURES = {
  'news': {
    id: 'campus-news',
    icon: Newspaper,
    gradient: 'from-blue-500 to-indigo-600'
  },
  'placements': {
    id: 'placements', 
    icon: TrendingUp,
    gradient: 'from-green-500 to-emerald-600'
  },
  'achievements': {
    id: 'achievements',
    icon: Trophy,
    gradient: 'from-yellow-500 to-amber-600'
  },
  'statistics': {
    id: 'campus-stats',
    icon: BarChart3,
    gradient: 'from-purple-500 to-violet-600'
  },
  'events': {
    id: 'events',
    icon: Calendar,
    gradient: 'from-pink-500 to-rose-600'
  },
  'tour': {
    id: 'campus-tour',
    icon: Map,
    gradient: 'from-cyan-500 to-teal-600'
  }
} as const;

type FeatureKey = keyof typeof CAMPUS_FEATURES;

export function CampusFeaturePage() {
  const { feature } = useParams<{ feature: string }>();
  
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