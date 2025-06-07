import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="px-6 py-4 flex items-center justify-between">
        <Link 
          to="/" 
          className=" text-xl font-bold"
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
          <h3 className='text-black bg-[#B0CFEE] border-2 border-black rounded-full w-10 h-10 flex items-center justify-center font-bold shadow-lg'> 
            S 
          </h3>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 