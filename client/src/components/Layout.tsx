
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  bgImageDesktop?: string;
  bgImageMobile?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, bgImageDesktop, bgImageMobile }) => {
  const navigate = useNavigate();
  const isAuthenticated = document.cookie.includes('token');
  const hasBackground = !!(bgImageDesktop || bgImageMobile);

  const handleLogout = async () => {
    // In a real app, call API
    document.cookie = 'token=; Max-Age=0; path=/;';
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans relative">
      {hasBackground && (
        <div className="fixed inset-0 -z-10 bg-navy">
          {bgImageMobile && (
            <div
              className={`absolute inset-0 bg-cover bg-center ${bgImageDesktop ? 'md:hidden' : ''}`}
              style={{ backgroundImage: `url(${bgImageMobile})` }}
            />
          )}
          {bgImageDesktop && (
            <div
              className="absolute inset-0 bg-cover bg-center hidden md:block"
              style={{ backgroundImage: `url(${bgImageDesktop})` }}
            />
          )}
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}
      <header className="bg-navy text-white p-4 shadow-md relative z-10">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-gold tracking-wider">ONE NATION</Link>
          <nav className="space-x-4">
            <Link to="/" className="hover:text-gold transition">Home</Link>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="hover:text-gold transition">Library</Link>
                <button onClick={handleLogout} className="text-gold hover:text-white transition">Logout</button>
              </>
            ) : (
              <Link to="/login" className="bg-gold text-navy px-4 py-2 rounded font-bold hover:bg-white transition">Member Login</Link>
            )}
          </nav>
        </div>
      </header>

      <main className={`flex-grow ${hasBackground ? '' : 'bg-gray-50'} relative z-0`}>
        {children}
      </main>

      <footer className="bg-navy-dark text-gray-400 py-8">
        <div className="container mx-auto text-center">
          <p className="mb-4">© 2025 One Nation Republic. All Rights Reserved.</p>
          <p className="text-sm">Private Membership Association. Not for Public Consumption.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
