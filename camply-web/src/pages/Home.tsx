import type { Session } from '@supabase/supabase-js';
import Navbar from '../components/Navbar';

interface HomeProps {
  session: Session;
}

const Home = ({ session }: HomeProps) => {
  return (
    <div className="min-h-screen bg-secondary">
      <Navbar session={session} />
        <main className="container-padding max-w-7xl mx-auto flex items-center justify-center min-h-screen">
            <h1>Your Camply Space</h1>
        </main>
    </div>
  );
};

export default Home; 