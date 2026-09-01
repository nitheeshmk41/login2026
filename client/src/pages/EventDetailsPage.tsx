import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { Monitor, ArrowLeft, Clock, ShieldAlert, CheckCircle2, MapPin, Users, Phone, Sparkles, Terminal, Check } from 'lucide-react';

export const EventDetailsPage: React.FC = () => {
  const { id: slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, survivor } = useAuthStore();
  
  const [userRegistrations, setUserRegistrations] = useState<number[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  useEffect(() => {
    api.events.getAll().then((res) => {
      if (Array.isArray(res.data)) {
        const match = res.data.find((e: any) => e.slug === slug || String(e.id) === String(slug));
        setSelectedEvent(match || null);
      }
    }).catch(() => setSelectedEvent(null));
  }, [slug]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'participant') {
      api.registrations.getMyRegistrations().then((res) => {
        if (Array.isArray(res.data)) {
          setUserRegistrations(res.data.map((r: any) => r.event_id));
        }
      }).catch(() => {});
    }
  }, [isAuthenticated, user]);

  if (!selectedEvent) {
    return (
      <div className="min-h-screen bg-[#0A0607] py-20 px-4 flex flex-col items-center justify-center text-center text-[#F7F2F2]">
        <div className="w-16 h-16 rounded-full bg-[#E01B22]/10 border border-[#E01B22] flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8 text-[#E01B22]" />
        </div>
        <h1 className="text-3xl font-display font-black tracking-wider uppercase">ARENA NOT FOUND</h1>
        <p className="text-xs font-mono text-[#A79798] mt-2 max-w-md">
          The requested symposium arena data does not exist or has been relocated.
        </p>
        <button
          onClick={() => navigate('/events')}
          className="mt-6 px-6 py-3 bg-[#E01B22] hover:bg-[#FF2A2A] text-[#F7F2F2] font-mono text-xs font-bold uppercase rounded-[2px] transition-all flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>RETURN TO ARENAS</span>
        </button>
      </div>
    );
  }

  const detail = selectedEvent.detail || {};
  const isRegistered = userRegistrations.includes(selectedEvent.id) || survivor?.registrations?.some((r: any) => r.worldId === selectedEvent.id);

  const handleRegisterClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      navigate('/dashboard/events');
    }
  };

  const coordinatorNames = (selectedEvent.coordinator_name || '').split(';').map((s: string) => s.trim()).filter(Boolean);
  const coordinatorPhones = (selectedEvent.coordinator_phone || '').split(';').map((s: string) => s.trim()).filter(Boolean);

  return (
    <div className="min-h-screen bg-[#0A0607] pt-24 pb-16 px-4 sm:px-6 lg:px-8 text-[#F7F2F2] relative overflow-hidden">
      
      {/* Background ambient accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-[radial-gradient(ellipse_at_center,_rgba(224,27,34,0.08)_0%,_transparent_70%)] pointer-events-none filter blur-3xl z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#130c0e_1px,transparent_1px),linear-gradient(to_bottom,#130c0e_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none z-0" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between border-b border-[#2A1A1D] pb-4 font-mono text-xs">
          <button
            onClick={() => navigate('/events')}
            className="inline-flex items-center gap-2 text-[#A79798] hover:text-[#E01B22] font-bold uppercase transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ALL ARENAS</span>
          </button>
          
          <div className="flex items-center gap-2 text-[10px] text-[#A79798] uppercase tracking-widest">
            <Link to="/events" className="hover:text-white">EVENTS</Link>
            <span>/</span>
            <span className="text-[#E01B22] font-bold">{selectedEvent.category}</span>
          </div>
        </div>

        {/* HERO CARD */}
        <div className="bg-[#130C0E]/90 border border-[#2A1A1D] rounded-[2px] shadow-2xl overflow-hidden relative corner-bracket-container">
          <div className="corner-bracket-tl" />
          <div className="corner-bracket-br" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            
            {/* Left Guardian Spotlight */}
            <div className="lg:col-span-5 bg-[#070405] p-8 border-b lg:border-b-0 lg:border-r border-[#2A1A1D] flex flex-col items-center justify-center text-center relative scanlines min-h-[360px]">
              <div className="absolute top-4 left-4 bg-black/60 border border-[#2A1A1D] px-2.5 py-1 rounded-[1px] font-mono text-[9px] text-[#E01B22] font-bold tracking-widest uppercase">
                GUARDIAN NODE
              </div>

              <img
                src={selectedEvent.guardian_asset || '/assets/login.png'}
                alt={detail.guardianName || 'Guardian Art'}
                className="max-h-64 w-auto object-contain my-4 animate-float-slow drop-shadow-[0_0_35px_rgba(224,27,34,0.35)]"
              />

              <div className="bg-[#0A0607]/90 border border-[#2A1A1D] p-3.5 rounded-[2px] w-full max-w-sm mt-2">
                <span className="font-mono text-xs font-bold text-[#E01B22] tracking-wider block uppercase mb-1">
                  {detail.guardianName || 'EVENT GUARDIAN'}
                </span>
                {detail.quote && (
                  <p className="text-[11px] font-mono italic text-[#A79798] leading-tight">
                    "{detail.quote}"
                  </p>
                )}
              </div>
            </div>

            {/* Right Event Main Information */}
            <div className="lg:col-span-7 p-6 sm:p-10 space-y-6 flex flex-col justify-between">
              
              <div className="space-y-4">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
                  <span className={`px-2.5 py-1 rounded-[1px] font-bold tracking-widest uppercase border ${
                    selectedEvent.category === 'TECHNICAL'
                      ? 'bg-[#E01B22]/10 border-[#E01B22] text-[#E01B22]'
                      : selectedEvent.category === 'FLAGSHIP'
                      ? 'bg-[#E08A17]/10 border-[#E08A17] text-[#E08A17]'
                      : 'bg-[#1FA971]/10 border-[#1FA971] text-[#1FA971]'
                  }`}>
                    {selectedEvent.category}
                  </span>

                  <span className="px-2.5 py-1 bg-[#1A1114] border border-[#2A1A1D] text-[#A79798] font-bold tracking-wider">
                    DAY {selectedEvent.day} SEP
                  </span>

                  {selectedEvent.is_online && (
                    <span className="px-2.5 py-1 bg-[#4A050A] border border-[#E01B22] text-[#FF2A2A] font-bold tracking-widest flex items-center gap-1">
                      <Monitor className="w-3 h-3" /> ONLINE
                    </span>
                  )}

                  {selectedEvent.is_flagship && (
                    <span className="px-2.5 py-1 bg-[#E08A17] text-[#0A0607] font-bold tracking-widest flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> FLAGSHIP
                    </span>
                  )}
                </div>

                {/* Title */}
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black uppercase text-[#F7F2F2] tracking-wide leading-tight">
                    {selectedEvent.name}
                  </h1>
                  <p className="text-xs font-mono text-[#A79798] mt-2 leading-relaxed">
                    {selectedEvent.description || detail.shortDesc}
                  </p>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-mono text-xs">
                  <div className="bg-[#0A0607] border border-[#2A1A1D] p-3 rounded-[2px]">
                    <span className="text-[10px] text-[#A79798] block mb-1">FORMAT</span>
                    <span className="font-bold text-[#F7F2F2] flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#E01B22]" />
                      {selectedEvent.team_type === 'TEAM' 
                        ? `${selectedEvent.min_team_size}${selectedEvent.max_team_size > selectedEvent.min_team_size ? `-${selectedEvent.max_team_size}` : ''} Members` 
                        : 'Solo'}
                    </span>
                  </div>

                  <div className="bg-[#0A0607] border border-[#2A1A1D] p-3 rounded-[2px]">
                    <span className="text-[10px] text-[#A79798] block mb-1">VENUE</span>
                    <span className="font-bold text-[#F7F2F2] flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#E01B22] shrink-0" />
                      <span className="leading-tight">{selectedEvent.is_online ? 'ONLINE' : (selectedEvent.venue || 'TBA')}</span>
                    </span>
                  </div>

                  <div className="bg-[#0A0607] border border-[#2A1A1D] p-3 rounded-[2px]">
                    <span className="text-[10px] text-[#A79798] block mb-1">TIMING</span>
                    <span className="font-bold text-[#F7F2F2] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#E01B22]" />
                      {selectedEvent.start_time ? selectedEvent.start_time.slice(0, 5) : 'TBA'}
                    </span>
                  </div>

                  <div className="bg-[#0A0607] border border-[#2A1A1D] p-3 rounded-[2px]">
                    <span className="text-[10px] text-[#A79798] block mb-1">ENTRY FEE</span>
                    <span className="font-bold text-[#1FA971] flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" /> INCLUDED
                    </span>
                  </div>
                </div>
              </div>

              {/* Status & Redirect Action Button */}
              <div className="pt-4 border-t border-[#2A1A1D]">
                {user?.role === 'admin' || user?.role === 'coordinator' ? (
                  <button
                    onClick={() => navigate(user?.role === 'coordinator' ? '/coordinator' : '/admin')}
                    className="w-full py-3.5 bg-[#E08A17] hover:bg-[#FFA500] text-[#0A0607] font-mono text-xs font-bold uppercase rounded-[2px] transition-colors"
                  >
                    GO TO EVENT CONTROL DASHBOARD →
                  </button>
                ) : selectedEvent.is_flagship ? (
                  <div className="bg-[#1A1114] border border-[#E01B22] p-3.5 text-center rounded-[2px]">
                    <span className="text-[#E01B22] font-mono text-xs font-bold uppercase tracking-wider">
                      ★ INVITE-ONLY FLAGSHIP ARENA (QUALIFIER WINNERS)
                    </span>
                  </div>
                ) : isRegistered ? (
                  <div className="bg-[#0F291E] border border-[#1FA971] p-3.5 text-center rounded-[2px] flex items-center justify-between">
                    <span className="text-[#1FA971] font-mono text-xs font-bold flex items-center gap-2 uppercase tracking-widest">
                      <CheckCircle2 className="w-4 h-4" /> REGISTRATION CONFIRMED
                    </span>
                    <button
                      onClick={() => navigate('/dashboard/events')}
                      className="text-[10px] font-mono text-[#F7F2F2] underline hover:text-[#1FA971]"
                    >
                      VIEW DASHBOARD →
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleRegisterClick}
                    className="w-full py-3.5 bg-[#E01B22] hover:bg-[#FF2A2A] text-[#F7F2F2] font-mono text-xs font-bold uppercase rounded-[2px] transition-all shadow-[0_0_20px_rgba(224,27,34,0.3)] flex items-center justify-center gap-2"
                  >
                    <span>REGISTER FOR THIS EVENT (GO TO DASHBOARD) &rarr;</span>
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* DETAILED CONTENT SECTION GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Overview & Briefing (Col 8) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Overview Card */}
            <div className="bg-[#130C0E] border border-[#2A1A1D] p-6 sm:p-8 rounded-[2px] space-y-4">
              <h2 className="text-base font-display font-bold text-[#F7F2F2] uppercase tracking-wider border-b border-[#2A1A1D] pb-3 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#E01B22]" />
                <span>ARENA SPECIFICATIONS & BRIEFING</span>
              </h2>
              <p className="text-xs font-mono text-[#A79798] leading-relaxed">
                {detail.fullDesc || selectedEvent.description}
              </p>

              {detail.skills && detail.skills.length > 0 && (
                <div className="pt-4 border-t border-[#2A1A1D]/60 space-y-2">
                  <span className="text-[10px] font-mono text-[#A79798] uppercase tracking-wider block font-bold">
                    CORE SKILLS & EVALUATION CRITERIA:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {detail.skills.map((skill: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-[#0A0607] border border-[#2A1A1D] text-[#E01B22] text-[11px] font-mono rounded-[2px]">
                        • {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tactical Encrypted Briefing */}
            {detail.briefing && (
              <div className="bg-[#0A0607] border border-[#5C1116] p-6 rounded-[2px] space-y-3 font-mono">
                <div className="flex items-center justify-between text-xs text-[#FF2A2A] border-b border-[#2A1A1D] pb-2">
                  <span className="flex items-center gap-2 font-bold"><Clock className="w-3.5 h-3.5" /> CONSOLE BRIEFING</span>
                  <span className="text-[10px] text-[#A79798]">TACTICAL HUD</span>
                </div>
                <p className="text-xs text-[#F7F2F2] leading-relaxed pt-1">
                  {detail.briefing}
                </p>
              </div>
            )}

          </div>

          {/* Sidebar / Coordinators (Col 4) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Event Coordinators Card */}
            <div className="bg-[#130C0E] border border-[#2A1A1D] p-6 rounded-[2px] space-y-4">
              <h3 className="text-xs font-mono font-bold text-[#E01B22] uppercase tracking-wider border-b border-[#2A1A1D] pb-3 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" />
                <span>EVENT COORDINATORS</span>
              </h3>

              {coordinatorNames.length > 0 ? (
                <div className="space-y-3 font-mono text-xs">
                  {coordinatorNames.map((name: string, idx: number) => {
                    const phone = coordinatorPhones[idx] || '';
                    return (
                      <div key={idx} className="bg-[#0A0607] border border-[#2A1A1D] p-3 rounded-[2px] space-y-1">
                        <span className="text-[#F7F2F2] font-bold block">{name}</span>
                        {phone && (
                          <a
                            href={`https://wa.me/91${phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-[#1FA971] hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" /> +91 {phone}
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs font-mono text-[#A79798]">
                  Coordinators will be assigned at the venue desk.
                </p>
              )}
            </div>

            {/* Event Guidelines Card */}
            <div className="bg-[#130C0E] border border-[#2A1A1D] p-6 rounded-[2px] space-y-3 font-mono text-xs">
              <h3 className="font-bold text-[#F7F2F2] uppercase tracking-wider text-[11px] border-b border-[#2A1A1D] pb-2">
                GENERAL RULES & ENTRY
              </h3>
              <ul className="space-y-2 text-[#A79798] text-[11px]">
                <li className="flex items-start gap-1.5">
                  <span className="text-[#E01B22] font-bold">•</span>
                  <span>Bring valid College Student ID Card to enter PSG Tech campus.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-[#E01B22] font-bold">•</span>
                  <span>Arrive 15 minutes prior to start time at designated venue.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-[#E01B22] font-bold">•</span>
                  <span>Single registration pass grants access to all non-clashing events.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default EventDetailsPage;
