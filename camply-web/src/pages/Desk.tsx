import type { Session } from '@supabase/supabase-js';
import Navbar from '../components/Navbar';

interface DeskProps {
  session: Session;
}

const Desk = ({ session }: DeskProps) => {
  return (
    <div className="min-h-screen bg-secondary">
      <Navbar session={session} />
      <main className="container-padding max-w-7xl mx-auto pt-20">
        {/* Desk content will be implemented in the next phase */}
      </main>
    </div>
  );
};

export default Desk; 