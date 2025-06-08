import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { useUserData } from './hooks/useUserData';
import Home from './pages/Home';
import Campus from './pages/Campus';
import Desk from './pages/Desk';
import Onboarding from './pages/Onboarding';
import LandingPage from './pages/LandingPage';

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
            <Route path="/home" element={<ProtectedRoute session={session} component={Home} />} />
            <Route path="/campus" element={<ProtectedRoute session={session} component={Campus} />} />
            <Route path="/desk" element={<ProtectedRoute session={session} component={Desk} />} />
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/login" element={<Navigate to="/home" replace />} />
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
