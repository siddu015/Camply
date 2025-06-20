import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';
import { BookOpen, Plus, Search, Filter, GraduationCap, Calendar, Award } from 'lucide-react';
import { SimpleLoader } from '@/components';
import { CourseCard } from '../components/CourseCard';
import { useAllCourses } from '../hooks/useAllCourses';
import type { Course } from '../types';

export function Courses() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const { courses, loading, error, refreshCourses } = useAllCourses();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');

  // Get unique semesters from courses
  const semesters = Array.from(new Set(courses.map(course => course.semester_number)))
    .sort((a, b) => a - b);

  // Filter courses based on search and semester
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (course.course_code?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSemester = selectedSemester === 'all' || course.semester_number.toString() === selectedSemester;
    return matchesSearch && matchesSemester;
  });

  const handleCourseClick = (course: Course) => {
    console.log('Navigating to course:', course.course_id); // Debug log
    console.log('Current location:', window.location.pathname); // Debug log
    navigate(`/courses/${course.course_id}`);
    console.log('Navigate called with:', `/courses/${course.course_id}`); // Debug log
  };

  if (loading) {
    return <SimpleLoader fullScreen={false} text="Loading your courses..." />;
  }

  if (error) {
    return (
      <div className="w-full pt-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="text-destructive text-center">
            <h3 className="text-lg font-semibold mb-2">Failed to load courses</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <button
              onClick={refreshCourses}
              className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/80 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in-50 duration-300 slide-in-from-bottom-2 w-full">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              Courses
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage all your Semester courses
            </p>
          </div>
          
          {/* Course Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <span>{courses.length} Course{courses.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{semesters.length} Semester{semesters.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <span>{courses.reduce((sum, course) => sum + (course.credits || 0), 0)} Credits</span>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "w-full pl-10 pr-4 py-2 rounded-lg border transition-all",
                "bg-background border-border text-foreground",
                "placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
              )}
            />
          </div>
        </div>

        {/* Courses Grid */}
        <div className="mt-6">
        {filteredCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
            <div className={cn(
              "p-6 rounded-full",
              isDark ? "bg-muted/50" : "bg-muted/30"
            )}>
              <BookOpen className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {courses.length === 0 ? "No courses found" : "No matching courses"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {courses.length === 0 
                  ? "You haven't added any courses yet. Start by registering a semester and adding courses."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
              {courses.length === 0 && (
                <button
                  onClick={() => navigate('/semester/overview')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                    "bg-accent text-accent-foreground hover:bg-accent/80"
                  )}
                >
                  <Plus className="h-4 w-4" />
                  Get Started
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {/* Group courses by semester */}
            {semesters.map(semesterNumber => {
              const semesterCourses = filteredCourses.filter(
                course => course.semester_number === semesterNumber
              );
              
              if (semesterCourses.length === 0) return null;

              return (
                <div key={semesterNumber} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-foreground">
                      Semester {semesterNumber}
                    </h2>
                    <div className="flex-1 h-px bg-border"></div>
                    <span className="text-sm text-muted-foreground">
                      {semesterCourses.length} course{semesterCourses.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="grid gap-3">
                    {semesterCourses.map(course => (
                      <CourseCard
                        key={course.course_id}
                        course={course}
                        onClick={handleCourseClick}
                        showSemester={false} // Don't show semester since it's grouped
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

export default Courses; 