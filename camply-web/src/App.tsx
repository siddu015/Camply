import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { useUserData } from './hooks/useUserData';
import Onboarding from './pages/Onboarding';
import LandingPage from './pages/LandingPage';
import { withSidebar } from './features/desk-sidebar/views/WithSidebar';
import { AcademicOverview } from './features/desk-sidebar/views/AcademicOverview';
import { CurrentSemester } from './features/desk-sidebar/views/CurrentSemester';
import { Courses } from './features/desk-sidebar/views/Courses';
import { Dashboard } from './features/desk-sidebar/views/Dashboard';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {!session ? (
          // Unauthenticated routes
          <>
            <Route path="/" element={<LandingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          // Authenticated routes with onboarding check
          <>
            <Route path="/onboarding" element={<Onboarding session={session} />} />
            <Route path="/" element={<ProtectedRoute session={session} component={withSidebar(Dashboard)} />} />
            <Route path="/home" element={<ProtectedRoute session={session} component={withSidebar(Dashboard)} />} />
            <Route path="/dashboard" element={<ProtectedRoute session={session} component={withSidebar(Dashboard)} />} />
            <Route path="/academic-overview" element={<ProtectedRoute session={session} component={withSidebar(AcademicOverview)} />} />
            <Route path="/campus-resources" element={<ProtectedRoute session={session} component={withSidebar(Dashboard)} />} />
            <Route path="/current-semester" element={<ProtectedRoute session={session} component={withSidebar(CurrentSemester)} />} />
            <Route path="/courses" element={<ProtectedRoute session={session} component={withSidebar(Courses)} />} />
            <Route path="/timetable" element={<ProtectedRoute session={session} component={withSidebar(Dashboard)} />} />
            <Route path="/assignments" element={<ProtectedRoute session={session} component={withSidebar(Dashboard)} />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

// Protected route component that checks user onboarding status
interface ProtectedRouteProps {
  session: Session;
  component: React.ComponentType<{ session: Session }>;
}

const ProtectedRoute = ({ session, component: Component }: ProtectedRouteProps) => {
  const { userStatus, loading } = useUserData(session);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If user doesn't exist or doesn't have academic details, redirect to onboarding
  if (!userStatus.exists || !userStatus.hasAcademicDetails) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Component session={session} />;
};

export default App;
