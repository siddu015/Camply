import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import Home from './pages/Home';
import Campus from './pages/Campus';
import Desk from './pages/Desk';
import Login from './pages/Login';
import './App.css';

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
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          // Authenticated routes
          <>
            <Route path="/home" element={<Home session={session} />} />
            <Route path="/campus" element={<Campus session={session} />} />
            <Route path="/desk" element={<Desk session={session} />} />
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/login" element={<Navigate to="/home" replace />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
