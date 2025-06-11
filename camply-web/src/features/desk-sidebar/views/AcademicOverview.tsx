import { useEffect, useState } from 'react';
import { BookOpen, Calendar, GraduationCap, Trophy, Clock, FileText } from 'lucide-react';
import { useCampusData } from '../../../hooks/useCampusData';
import { supabase } from '../../../lib/supabase';

export function AcademicOverview() {
  const [session, setSession] = useState<any>(null);
  const { user, academicDetails, college, currentSemester, loading, error } = useCampusData(session?.user?.id);

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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-in fade-in-50 duration-300 slide-in-from-bottom-2 w-full">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-md">
          <h3 className="font-medium mb-2">Unable to load academic data</h3>
          <p className="text-sm">There was an issue connecting to the database. Please try refreshing the page.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-3 px-3 py-1 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded text-sm hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
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
          <BookOpen className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Academic details not found</h3>
          <p className="text-gray-600 dark:text-gray-400">Your academic information could not be retrieved. Please contact support if this issue persists.</p>
        </div>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const academicYear = currentYear - academicDetails.admission_year + 1;
  const progressPercentage = ((academicYear - 1) / (academicDetails.graduation_year - academicDetails.admission_year)) * 100;

  return (
    <div className="animate-in fade-in-50 duration-300 slide-in-from-bottom-2 w-full">
      {/* Academic Header - No gaps, attached to top */}
      <div 
        className="relative h-80 -mt-6 mb-6 overflow-hidden rounded-b-2xl bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-800 dark:to-blue-800"
        style={{ width: 'calc(100% + 20px)', marginLeft: '-10px' }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-800 dark:to-blue-800" />
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Blur overlay for text visibility */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="backdrop-blur-sm bg-black/20 rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-2 text-white">Academic Progress</h1>
                <p className="text-white/90">
                  {academicDetails.department_name} • {academicDetails.branch_name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">{Math.round(progressPercentage)}%</p>
                <p className="text-sm text-white/80">Complete</p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="bg-white/20 rounded-full h-3">
              <div 
                className="bg-white rounded-full h-3 transition-all duration-500"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Academic Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current Status */}
          <div className="bg-sidebar dark:bg-sidebar rounded-lg p-6 border-l-4 border-blue-500 dark:border-blue-400">
            <div className="flex items-center space-x-3 mb-4">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-sidebar-foreground">Current Status</h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Academic Year</p>
                <p className="text-2xl font-bold text-sidebar-foreground">{academicYear}</p>
              </div>
              {currentSemester ? (
                <div className="border-t border-blue-200 dark:border-blue-800 pt-3">
                  <p className="text-sm text-muted-foreground">Current Semester</p>
                  <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">Semester {currentSemester}</p>
                </div>
              ) : (
                <div className="border-t border-blue-200 dark:border-blue-800 pt-3">
                  <button className="w-full px-4 py-2 bg-sidebar-accent text-sidebar-accent-foreground rounded-md hover:bg-sidebar-accent/80 transition-colors">
                    Add Current Semester
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-sidebar dark:bg-sidebar rounded-lg p-6 border-l-4 border-green-500 dark:border-green-400">
            <div className="flex items-center space-x-3 mb-4">
              <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h3 className="text-lg font-semibold text-sidebar-foreground">Timeline</h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Started</p>
                <p className="text-lg font-semibold text-sidebar-foreground">{academicDetails.admission_year}</p>
              </div>
              <div className="border-t border-green-200 dark:border-green-800 pt-3">
                <p className="text-sm text-muted-foreground">Graduation</p>
                <p className="text-lg font-semibold text-sidebar-foreground">{academicDetails.graduation_year}</p>
              </div>
              <div className="border-t border-green-200 dark:border-green-800 pt-3">
                <p className="text-sm text-muted-foreground">Time Remaining</p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {Math.max(0, academicDetails.graduation_year - currentYear)} years
                </p>
              </div>
            </div>
          </div>

          {/* Performance Placeholder */}
          <div className="bg-sidebar dark:bg-sidebar rounded-lg p-6 border-l-4 border-yellow-500 dark:border-yellow-400">
            <div className="flex items-center space-x-3 mb-4">
              <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <h3 className="text-lg font-semibold text-sidebar-foreground">Performance</h3>
            </div>
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm mb-3">
                Add semester details to track your academic performance
              </p>
              <button className="px-4 py-2 bg-sidebar-accent text-sidebar-accent-foreground rounded-md hover:bg-sidebar-accent/80 transition-colors">
                Start Tracking
              </button>
            </div>
          </div>
        </div>

        {/* Academic Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Program Information */}
          <div className="bg-sidebar dark:bg-sidebar rounded-lg p-6 border-l-4 border-purple-500 dark:border-purple-400">
            <div className="flex items-center space-x-3 mb-4">
              <GraduationCap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-semibold text-sidebar-foreground">Program Details</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Institution</p>
                <p className="text-sidebar-foreground">{college?.name || 'Institution details loading...'}</p>
              </div>
              <div className="border-t border-purple-200 dark:border-purple-800 pt-3">
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="text-sidebar-foreground">{academicDetails.department_name}</p>
              </div>
              <div className="border-t border-purple-200 dark:border-purple-800 pt-3">
                <p className="text-sm text-muted-foreground">Specialization</p>
                <p className="text-sidebar-foreground">{academicDetails.branch_name}</p>
              </div>
              <div className="border-t border-purple-200 dark:border-purple-800 pt-3">
                <p className="text-sm text-muted-foreground">Roll Number</p>
                <p className="text-sidebar-foreground">{academicDetails.roll_number}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-sidebar dark:bg-sidebar rounded-lg p-6 border-l-4 border-orange-500 dark:border-orange-400">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <h3 className="text-lg font-semibold text-sidebar-foreground">Quick Actions</h3>
            </div>
            <div className="space-y-3">
              <button className="w-full px-4 py-3 bg-sidebar-accent text-sidebar-accent-foreground rounded-md hover:bg-sidebar-accent/80 transition-colors text-left">
                <div className="flex items-center justify-between">
                  <span>View Syllabus</span>
                  <span className="text-xs text-muted-foreground">Coming Soon</span>
                </div>
              </button>
              <div className="border-t border-orange-200 dark:border-orange-800 pt-3">
                <button className="w-full px-4 py-3 bg-sidebar-accent text-sidebar-accent-foreground rounded-md hover:bg-sidebar-accent/80 transition-colors text-left">
                  <div className="flex items-center justify-between">
                    <span>Upload Timetable</span>
                    <span className="text-xs text-muted-foreground">Coming Soon</span>
                  </div>
                </button>
              </div>
              <div className="border-t border-orange-200 dark:border-orange-800 pt-3">
                <button className="w-full px-4 py-3 bg-sidebar-accent text-sidebar-accent-foreground rounded-md hover:bg-sidebar-accent/80 transition-colors text-left">
                  <div className="flex items-center justify-between">
                    <span>Add Courses</span>
                    <span className="text-xs text-muted-foreground">Coming Soon</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Semester Overview Placeholder */}
        <div className="bg-sidebar dark:bg-sidebar rounded-lg p-6 border-l-4 border-indigo-500 dark:border-indigo-400">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-sidebar-foreground">Semester Overview</h3>
            <button className="px-3 py-1 text-sm bg-sidebar-accent text-sidebar-accent-foreground rounded-md hover:bg-sidebar-accent/80 transition-colors">
              Manage Semesters
            </button>
          </div>
          <div className="text-center py-8">
            <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              {currentSemester ? 
                `You're currently in Semester ${currentSemester}. Add courses and track your progress.` :
                'Start by adding your current semester and courses to track your academic journey.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
