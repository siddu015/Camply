import { MapPin, Globe, ExternalLink } from 'lucide-react';
import { useTheme } from '@/lib/theme-provider';

interface CampusHeaderProps {
  college?: {
    name: string;
    city?: string;
    state?: string;
    college_website_url?: string;
    college_icon?: string;
  };
  academicDetails?: {
    department_name: string;
  };
}

export function CampusHeader({ college, academicDetails }: CampusHeaderProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div 
      className="relative h-96 -mt-6 mb-6 overflow-hidden"
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
          {college?.name || `${academicDetails?.department_name} Campus`}
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
  );
} 