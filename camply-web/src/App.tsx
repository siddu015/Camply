import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useUserData } from '@/hooks/useUserData';
import { ThemeProvider } from '@/lib/theme-provider';
import Onboarding from '@/pages/Onboarding';
import LandingPage from '@/pages/LandingPage';
import { CampusOverview, CampusFeaturePage, AcademicOverview, CurrentSemester, Layout, Desk, Courses, CourseDetail } from '@/features/desk';
import { OfflinePage } from '@/pages/OfflinePage';
import { SimpleLoader } from '@/components';
import '@/lib/route-config';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <ThemeProvider defaultTheme="dark" storageKey="camply-ui-theme">
        <SimpleLoader />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="camply-ui-theme">
      <Router>
        <Routes>
          {!session ? (
            <>
              <Route path="/" element={<LandingPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <Route path="/*" element={<AuthenticatedRoutes session={session} />} />
          )}
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

const AuthenticatedRoutes = ({ session }: { session: Session }) => {
  const { userStatus, loading, error, initialized, refreshUser } = useUserData(session);

  const handleOnboardingComplete = async () => {
    await refreshUser();
  };

  // Show loader until we've completed at least one load cycle
  if (loading || !initialized) {
    return <SimpleLoader />;
  }

  if (error && !window.location.pathname.includes('/onboarding')) {
    return <OfflinePage onRetry={refreshUser} error={error} />;
  }

  if (!userStatus.exists || !userStatus.hasAcademicDetails) {
    return (
      <Routes>
        <Route 
          path="/onboarding" 
          element={
            <Onboarding 
              session={session} 
              onOnboardingComplete={handleOnboardingComplete}
            />
          } 
        />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  const user = {
    name: userStatus.userData?.name || session.user.user_metadata?.full_name || "Student",
    email: userStatus.userData?.email || session.user.email || "",
    avatar: session.user.user_metadata?.avatar_url || "/placeholder.svg",
  };

  const deskConfig = { homeRoute: "/desk" }

  return (
    <Layout user={user} appConfig={deskConfig} key={`user-${userStatus.exists}-${userStatus.hasAcademicDetails}`}>
      <Routes>
        {/* Course detail route should come before wildcard routes */}
        <Route path="/courses/:courseId" element={<CourseDetail />} />
        <Route path="/desk" element={<Desk />} />
        <Route path="/profile/campus" element={<CampusOverview />} />
        <Route path="/profile/campus/:feature" element={<CampusFeaturePage />} />
        <Route path="/profile/academics" element={<AcademicOverview />} />
        <Route path="/semester/overview" element={<CurrentSemester />} />
        <Route path="/semester/courses" element={<Courses />} />
        <Route path="/" element={<Navigate to="/desk" replace />} />
        <Route path="*" element={<Navigate to="/desk" replace />} />
      </Routes>
    </Layout>
  );
};

export default App;
