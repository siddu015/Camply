import { Link, useLocation } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { signOut } from '../lib/supabase';

interface NavbarProps {
  session?: Session;
}

const Navbar = ({ session }: NavbarProps) => {
  const location = useLocation();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      console.error('Error signing out:', error.message);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="px-6 py-4 flex items-center justify-between">
        <Link 
          to="/" 
          className="text-xl font-bold"
        >
          Camply
        </Link>
        
        <div className="flex items-center gap-1 bg-white rounded-full border border-gray-200 px-2">
          {['Home', 'Campus', 'Desk'].map((page) => (
            <Link
              key={page}
              to={`/${page.toLowerCase()}`}
              className={`
                px-4 py-2 rounded-full transition-all duration-200
                ${location.pathname === `/${page.toLowerCase()}` 
                  ? 'bg-black text-white' 
                  : 'hover:bg-gray-100'
                }
              `}
            >
              {page}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {session && (
            <>
              <span className="text-sm text-gray-600">
                {session.user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 