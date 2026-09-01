import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { DecryptedText } from '../../animations/DecryptedText';
import GradientWaves from '../../animations/GradientWaves';

interface HeroSectionProps {
  onExploreEvents: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onExploreEvents }) => {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <section 
      className="relative min-h-[100dvh] flex flex-col justify-center items-center text-center overflow-hidden pt-20"
    >
      {/* Absolute Background Image for parallax */}
      <div 
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          backgroundImage: "url('/final_hero_doom.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
      />
      
      {/* Layer 1: Dark Base Vignette Overlay */}
      <div className="absolute inset-0 bg-black/25 pointer-events-none z-0" />
      
      {/* Light Red Theme Gradient Waves from ReactBits */}
      <div className="absolute inset-0 z-0 opacity-50 mix-blend-screen select-none">
         <GradientWaves 
            horizonColor="#4A0404" 
            waveColor="#E01B22" 
            crestColor="#FF2A2A"
            speed={0.3} 
            amplitude={1.8} 
            waveScale={0.8}
            opacity={0.6}
            mouseInteraction={true}
            className="w-full h-full"
         />
      </div>

      {/* Layer 2: Deep Red Thematic Vignette Aura */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(126,9,16,0.18)_0%,_transparent_75%)] pointer-events-none z-0" />
      
      {/* Layer 3: Vertical Fade Gradients (Bottom Blend & Top Darkener) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-[#0A0607] pointer-events-none z-0" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none z-0"
        style={{
          backgroundImage: 'radial-gradient(#FF2A2A 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Localized Dark Overlay behind content for maximum text legibility */}
      <div 
        className="absolute inset-x-0 top-[15%] bottom-[15%] pointer-events-none z-0 select-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.15) 50%, transparent 80%)',
        }}
      />

      {/* ── Main Composition Wrapper ── */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-4 flex-grow py-12">
        
        {/* ── Top Header Spacer & Institutional Label ── */}
        <div className="flex flex-col items-center select-none space-y-1.5 mb-4 sm:mb-6">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="flex items-center gap-3 justify-center select-none">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white border border-[#2A1A1D]/60 flex items-center justify-center p-1.5 shadow-lg">
                <img 
                  src="/assets/logos/psg-main.webp" 
                  alt="PSG Main" 
                  className="w-full h-full object-contain"
                  loading="eager"
                  fetchPriority="high"
                />
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white border border-[#2A1A1D]/60 flex items-center justify-center p-1.5 shadow-lg">
                <img 
                  src="/assets/logos/psg-100.webp" 
                  alt="PSG Centenary" 
                  className="w-full h-full object-contain"
                  loading="eager"
                />
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white border border-[#2A1A1D]/60 flex items-center justify-center p-1.5 shadow-lg">
                <img 
                  src="/assets/logos/psg-75.webp" 
                  alt="PSG 75" 
                  className="w-full h-full object-contain"
                  loading="eager"
                />
              </div>
            </div>
            <div 
              className="flex flex-col items-center text-[10px] sm:text-xs font-mono font-bold tracking-[0.25em] text-[#B8B2B2] uppercase text-center space-y-1"
              style={{ textShadow: '0 2px 10px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 0, 0, 0.6)' }}
            >
              <span>PSG College of Technology</span>
              <span>Department of Computer Applications</span>
              <span>Computer Applications Association</span>
              <span>Presents</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 font-mono tracking-[0.2em] text-[#F7F2F2] font-bold text-[10px] sm:text-xs uppercase text-center mt-2">
            <span style={{ textShadow: '0 2px 10px rgba(0, 0, 0, 0.95), 0 0 30px rgba(0, 0, 0, 0.7)' }}>
              [ <DecryptedText 
                text="35TH EDITION" 
                animateOn="view" 
                speed={65} 
                maxIterations={12}
                useOriginalCharsOnly
              /> ]
            </span>
            <span 
              className="text-[#B8B2B2] font-semibold text-[8px] sm:text-[9px] tracking-[0.25em] mt-0.5 block"
              style={{ textShadow: '0 2px 10px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 0, 0, 0.6)' }}
            >
              NATIONAL TECHNICAL SYMPOSIUM
            </span>
          </div>
        </div>

        {/* ── Main Hero Content ── */}
        <div className="space-y-1 mb-5 sm:mb-6">
          <h1 
            className="text-4xl sm:text-6xl md:text-7xl font-display font-black text-[#F7F2F2] tracking-wider uppercase text-center flex justify-center items-center"
            style={{ textShadow: '0 3px 12px rgba(0, 0, 0, 0.95), 0 0 40px rgba(0, 0, 0, 0.7)' }}
          >
            LOGIN <span className="text-[#E01B22] ml-2 sm:ml-3 lg:ml-4">2K26</span>
          </h1>
          <div className="flex items-center justify-center select-none">
            <div 
              className="font-mono text-[11px] sm:text-xs font-bold text-[#F5F5F5] tracking-[0.35em] uppercase"
              style={{ textShadow: '0 2px 10px rgba(0, 0, 0, 0.95), 0 0 35px rgba(0, 0, 0, 0.6)' }}
            >
              [ <DecryptedText 
                text="THE LAST HUMAN" 
                animateOn="view" 
                speed={70} 
                maxIterations={15}
              /> ]
            </div>
          </div>
        </div>

        {/* Short Powerful Description */}
        <p 
          className="text-xs sm:text-sm md:text-base text-[#F7F2F2]/95 max-w-[46ch] leading-relaxed font-body font-medium mb-2"
          style={{ textShadow: '0 2px 10px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 0, 0, 0.6)' }}
        >
          The Perfect Fusion of Masterminds!
        </p>
        
        <p 
          className="text-base sm:text-lg md:text-xl text-[#F7F2F2] font-mono font-bold tracking-widest mb-8"
          style={{ textShadow: '0 2px 15px rgba(209, 80, 80, 0.5)' }}
        >
          September 18 & 19, 2026
        </p>

        {/* Actions - Primary (Red Filled) vs Secondary (Subtle Link) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto">
          {isAuthenticated ? (
            <Link
              to={
                user?.role === 'admin'
                  ? '/admin'
                  : user?.role === 'coordinator'
                  ? '/coordinator'
                  : user?.user_type === 'ALUMNI'
                  ? '/alumni'
                  : '/dashboard'
              }
              className="shimmer-btn w-full sm:w-auto px-8 py-3.5 bg-[#E01B22] hover:bg-[#FF2A2A] text-[#F7F2F2] font-mono text-xs font-bold uppercase tracking-wider rounded-[2px] shadow-lg hover:shadow-[0_0_20px_rgba(224,27,34,0.4)] flex items-center justify-center gap-2"
            >
              {user?.role === 'admin'
                ? 'COMMAND CENTER'
                : user?.role === 'coordinator'
                ? 'COORDINATOR PORTAL'
                : 'MY DASHBOARD'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              to="/register"
              className="shimmer-btn w-full sm:w-auto px-8 py-3.5 bg-[#E01B22] hover:bg-[#FF2A2A] text-[#F7F2F2] font-mono text-xs font-bold uppercase tracking-wider rounded-[2px] shadow-lg hover:shadow-[0_0_20px_rgba(224,27,34,0.4)] flex items-center justify-center gap-2"
            >
              REGISTER NOW
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          <button
            onClick={onExploreEvents}
            className="text-[#A79798] hover:text-[#F7F2F2] font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 py-2 px-4 group"
          >
            EXPLORE EVENTS <span className="transform group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>

      </div>

      {/* ── Bottom Padding / Scroll Indicator Area ── */}
      <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center justify-center select-none font-mono text-[9px] tracking-[0.25em] text-[#A79798]/55">
        <span>SCROLL TO EXPLORE</span>
        <span className="mt-1 text-xs text-[#E01B22] animate-pulse">↓</span>
      </div>

    </section>
  );
};
