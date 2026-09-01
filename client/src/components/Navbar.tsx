import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Menu, X, LogOut, LayoutDashboard, Shield, Trophy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

interface NavbarProps {
  onOpenCommandSearch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const { isAuthenticated, user, resetAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const res = await api.settings.get();
      return res.data;
    },
    staleTime: 60000,
  });

  const showWinners = settings?.show_winners === 'true';

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 48) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    resetAuth();
    setUserMenuOpen(false);
    navigate('/login');
  };

  const isHomepage = location.pathname === '/' || location.pathname === '/home';

  return (
    <header className={`w-full sticky top-0 z-50 transition-colors duration-300 ${
      isHomepage && !isSticky
        ? 'bg-transparent border-b border-transparent'
        : 'bg-[#130C0E]/95 backdrop-blur-md border-b border-[#2A1A1D] shadow-2xl'
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          
          {/* Logo / Brand Header */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group select-none shrink">
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* LOGIN Logo */}
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full border border-[#2A1A1D] bg-white flex items-center justify-center p-0.5 shadow-md transition-transform group-hover:scale-105 duration-300">
                <img 
                  src="/assets/login.webp" 
                  alt="LOGIN Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              {/* CAA Logo */}
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full border border-[#2A1A1D] bg-white flex items-center justify-center p-0.5 shadow-md transition-transform group-hover:scale-105 duration-300">
                <img 
                  src="/assets/logos/caa.webp" 
                  alt="CAA Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Brand Title with Responsive Truncation */}
            <div className="flex flex-col min-w-0">
              <span className="font-display font-black text-sm sm:text-lg lg:text-xl tracking-wider text-[#F7F2F2] group-hover:text-[#E01B22] transition-colors uppercase leading-none drop-shadow-[0_0_10px_rgba(224,27,34,0.3)] truncate">
                LOGIN<span className="text-[#E01B22] font-black">2K26</span>
              </span>
              <span className="text-[7px] xs:text-[8px] sm:text-[9.5px] font-mono text-[#A79798] tracking-wider uppercase font-bold mt-0.5 leading-none group-hover:text-white transition-colors truncate max-w-[140px] xs:max-w-[180px] sm:max-w-none">
                DEPARTMENT OF COMPUTER APPLICATIONS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-8 font-mono text-xs tracking-widest font-bold uppercase">
            <Link
              to="/home"
              className={`relative py-1 px-2 transition-colors font-bold ${
                location.pathname === '/home' || location.pathname === '/' ? 'text-[#E01B22]' : 'text-[#A79798] hover:text-white'
              }`}
            >
              Home
            </Link>
            <Link
              to="/events"
              className={`relative py-1 px-2 transition-colors font-bold ${
                location.pathname === '/events' ? 'text-[#E01B22]' : 'text-[#A79798] hover:text-white'
              }`}
            >
              Events
            </Link>
            {showWinners && (
              <Link
                to="/winners"
                className={`relative py-1 px-2 transition-colors font-bold ${
                  location.pathname === '/winners' ? 'text-[#E08A17]' : 'text-[#A79798] hover:text-white'
                }`}
              >
                🏆 Winners
              </Link>
            )}
            <Link
              to="/gallery"
              className={`relative py-1 px-2 transition-colors font-bold ${
                location.pathname === '/gallery' ? 'text-[#E01B22]' : 'text-[#A79798] hover:text-white'
              }`}
            >
              Gallery
            </Link>
            <Link
              to="/coordinators"
              className={`relative py-1 px-2 transition-colors font-bold ${
                location.pathname === '/coordinators' ? 'text-[#E01B22]' : 'text-[#A79798] hover:text-white'
              }`}
            >
              Coordinators
            </Link>
            <Link
              to="/contact"
              className={`relative py-1 px-2 transition-colors font-bold ${
                location.pathname === '/contact' ? 'text-[#E01B22]' : 'text-[#A79798] hover:text-white'
              }`}
            >
              Contact
            </Link>
          </nav>

          {/* Right Action Button Container */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {!isAuthenticated ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  to="/alumni"
                  className="hidden sm:inline-flex px-3 py-1.5 border border-[#E01B22]/50 hover:border-[#E01B22] text-[#F7F2F2] hover:bg-[#E01B22]/10 font-bold text-[10px] sm:text-[11px] font-mono uppercase tracking-widest rounded-[2px] transition-all"
                >
                  ALUMNI
                </Link>
                <Link
                  to="/login"
                  className="px-3 sm:px-4 py-1.5 bg-[#E01B22] hover:bg-[#FF2A2A] text-[#F7F2F2] font-bold text-[10px] sm:text-[11px] font-mono uppercase tracking-widest rounded-[2px] transition-all shadow-[0_0_12px_rgba(224,27,34,0.4)]"
                >
                  LOGIN
                </Link>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 bg-[#0A0607] hover:bg-[#130C0E] border border-[#2A1A1D] px-2.5 py-1 rounded-[2px] transition-colors"
                >
                  <div className="w-5 h-5 rounded-full bg-[#7E0910] border border-[#E01B22] flex items-center justify-center font-bold text-[9px] text-[#F7F2F2]">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="text-[11px] font-bold text-[#F7F2F2] hidden sm:inline">{user?.name?.split(' ')[0] || 'User'}</span>
                </button>

                {/* User Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-[#130C0E] border border-[#2A1A1D] rounded-[2px] shadow-2xl py-2 z-50 animate-fade-in text-xs font-mono font-bold">
                    <div className="px-4 py-2 border-b border-[#2A1A1D]">
                      <p className="font-bold text-[#F7F2F2] truncate">{user?.name}</p>
                      <p className="text-[10px] text-[#A79798] truncate">{user?.email}</p>
                    </div>
                    
                    {user?.role === 'admin' ? (
                      <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 font-bold text-[#E01B22] hover:bg-[#0A0607]">
                        <Shield className="w-4 h-4" /> COMMAND CENTER
                      </Link>
                    ) : user?.role === 'coordinator' ? (
                      <Link to="/coordinator" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 font-bold text-[#E08A17] hover:bg-[#0A0607]">
                        <Trophy className="w-4 h-4" /> COORDINATOR HUB
                      </Link>
                    ) : (
                      <Link to="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 font-bold text-[#F7F2F2] hover:bg-[#0A0607]">
                        <LayoutDashboard className="w-4 h-4 text-[#E01B22]" /> MY DASHBOARD
                      </Link>
                    )}

                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-[#FF2A2A] hover:bg-[#0A0607] text-left border-t border-[#2A1A1D] mt-1 font-bold">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-[#A79798] hover:text-white shrink-0"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#130C0E] border-t border-[#2A1A1D] px-4 py-4 space-y-3 font-mono font-bold uppercase text-xs">
            <Link
              to="/home"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-mono font-bold text-[#F7F2F2] hover:text-[#E01B22]"
            >
              HOME
            </Link>
            <Link
              to="/events"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-mono font-bold text-[#F7F2F2] hover:text-[#E01B22]"
            >
              EVENTS
            </Link>
            <Link
              to="/gallery"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-mono font-bold text-[#F7F2F2] hover:text-[#E01B22]"
            >
              GALLERY
            </Link>
            <Link
              to="/coordinators"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-mono font-bold text-[#F7F2F2] hover:text-[#E01B22]"
            >
              COORDINATORS
            </Link>
            <Link
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-mono font-bold text-[#F7F2F2] hover:text-[#E01B22]"
            >
              CONTACT
            </Link>

            {!isAuthenticated && (
              <>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-xs font-mono font-bold text-[#E01B22] pt-2 border-t border-[#2A1A1D]"
                >
                  REGISTRATION
                </Link>
                <Link
                  to="/alumni"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-xs font-mono font-bold text-[#E08A17] pt-2"
                >
                  ALUMNI SIGNUP
                </Link>
              </>
            )}

            {isAuthenticated && (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-mono font-bold text-[#E01B22] pt-2 border-t border-[#2A1A1D]"
              >
                GO TO DASHBOARD
              </Link>
            )}
          </div>
        )}
      </header>
    );
  };

export default Navbar;
