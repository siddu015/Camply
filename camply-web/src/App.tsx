import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { useUserData } from './hooks/useUserData';
import Onboarding from './pages/Onboarding';
import LandingPage from './pages/LandingPage';
import { Layout } from './features/desk-sidebar/components/Layout';
import { Desk } from './features/desk-sidebar/views/Desk';
import { AcademicOverview } from './features/desk-sidebar/views/AcademicOverview';
import { CurrentSemester } from './features/desk-sidebar/views/CurrentSemester';
import { Courses } from './features/desk-sidebar/views/Courses';

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
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-neutral-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
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
          // Authenticated routes with shared user data
          <Route path="/*" element={<AuthenticatedRoutes session={session} />} />
        )}
      </Routes>
    </Router>
  );
}

// Shared authenticated routes with single user data fetch
const AuthenticatedRoutes = ({ session }: { session: Session }) => {
  const { userStatus, loading } = useUserData(session);

  // Show loading only during initial user data fetch
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-neutral-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // If user doesn't exist or doesn't have academic details, redirect to onboarding
  if (!userStatus.exists || !userStatus.hasAcademicDetails) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding session={session} />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  // Extract user data for the sidebar
  const user = {
    name: userStatus.userData?.name || session.user.user_metadata?.full_name || "Student",
    email: userStatus.userData?.email || session.user.email || "",
    avatar: session.user.user_metadata?.avatar_url || "/placeholder.svg",
  };

  // User is fully set up, show main app with persistent sidebar
  return (
    <Layout user={user}>
      <Routes>
        <Route path="/desk" element={<Desk />} />
        <Route path="/academic-overview" element={<AcademicOverview />} />
        <Route path="/current-semester" element={<CurrentSemester />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/" element={<Navigate to="/desk" replace />} />
        <Route path="*" element={<Navigate to="/desk" replace />} />
      </Routes>
    </Layout>
  );
};

export default App;
