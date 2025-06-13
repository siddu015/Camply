import { useEffect, useState } from 'react';
import { MapPin, GraduationCap, Calendar, BookOpen, User, Building2, Upload } from 'lucide-react';
import { useCampusData } from '../../../hooks/useCampusData';
import { supabase } from '../../../lib/supabase';
import { useTheme } from '../../../lib/theme-provider';
import { CampusBot } from '../../../components/CampusBot'

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
            
            {college?.university_name && (
              <div className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span className="text-lg">{college.university_name}</span>
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

      <div className="space-y-6">
        {/* Academic Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Department & Branch Card */}
          <div className="bg-background border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Academic Details</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Department</label>
                <p className="text-foreground font-medium">{academicDetails.department_name}</p>
              </div>
              
              <div className="border-t border-border pt-4">
                <label className="text-sm font-medium text-muted-foreground">Branch</label>
                <p className="text-foreground font-medium">{academicDetails.branch_name}</p>
              </div>
              
              <div className="border-t border-border pt-4">
                <button className="w-full px-4 py-3 bg-accent hover:bg-accent/80 text-accent-foreground rounded-md transition-colors flex items-center justify-center space-x-2 group">
                  <Upload className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">Submit Department Rulebook</span>
                </button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Help Camply AI assist you better with your campus
                </p>
              </div>
            </div>
          </div>

          {/* Student Info Card */}
          <div className="bg-background border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <User className="h-5 w-5 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Student Information</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Roll Number</label>
                <p className="text-foreground font-medium">{academicDetails.roll_number}</p>
              </div>
              
              <div className="border-t border-border pt-4">
                <label className="text-sm font-medium text-muted-foreground">Academic Timeline</label>
                <p className="text-foreground font-medium">
                  {academicDetails.admission_year} - {academicDetails.graduation_year}
                </p>
              </div>
              
              {currentSemester ? (
                <div className="border-t border-border pt-4">
                  <label className="text-sm font-medium text-muted-foreground">Current Semester</label>
                  <p className="text-foreground font-medium">Semester {currentSemester}</p>
                </div>
              ) : (
                <div className="border-t border-border pt-4">
                  <button className="w-full px-4 py-3 bg-accent hover:bg-accent/80 text-accent-foreground rounded-md transition-colors flex items-center justify-center space-x-2 group">
                    <Calendar className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">Fill Semester Details</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats Card */}
        <div className="bg-background border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <GraduationCap className="h-5 w-5 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Quick Stats</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="p-4 bg-blue-500/10 rounded-lg mb-2">
                <p className="text-2xl font-bold text-blue-500">
                  {new Date().getFullYear() - academicDetails.admission_year + 1}
                </p>
              </div>
              <p className="text-sm text-muted-foreground font-medium">Current Year</p>
            </div>
            
            <div className="text-center">
              <div className="p-4 bg-green-500/10 rounded-lg mb-2">
                <p className="text-2xl font-bold text-green-500">
                  {academicDetails.graduation_year - new Date().getFullYear()}
                </p>
              </div>
              <p className="text-sm text-muted-foreground font-medium">Years Left</p>
            </div>
            
            <div className="text-center">
              <div className="p-4 bg-purple-500/10 rounded-lg mb-2">
                <p className="text-2xl font-bold text-purple-500">
                  {currentSemester || '-'}
                </p>
              </div>
              <p className="text-sm text-muted-foreground font-medium">Current Sem</p>
            </div>
            
            <div className="text-center">
              <div className="p-4 bg-orange-500/10 rounded-lg mb-2">
                <p className="text-2xl font-bold text-orange-500">
                  {academicDetails.graduation_year - academicDetails.admission_year}
                </p>
              </div>
              <p className="text-sm text-muted-foreground font-medium">Program Years</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add CampusBot */}
      < CampusBot />
    </div>
  );
} 