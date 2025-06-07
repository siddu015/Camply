import type { Session } from '@supabase/supabase-js';
import Navbar from '../components/Navbar';

interface CampusProps {
  session: Session;
}

const Campus = ({ session }: CampusProps) => {
  return (
    <div className="min-h-screen bg-secondary">
      <Navbar session={session} />
      <main className="container-padding max-w-7xl mx-auto flex items-center justify-center min-h-screen">
        <h1>Your Campus is shit & you know that</h1>
      </main>
    </div>
  );
};

export default Campus;  