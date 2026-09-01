import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, MapPin, Calendar, LayoutGrid, BarChart3, ChevronRight, Trophy } from 'lucide-react';

interface Event {
  id: number;
  name: string;
  category: string;
  day: number;
  date: string;
  start_time: string;
  end_time: string;
  venue: string;
  is_online: boolean;
  team_type?: string;
  min_team_size?: number;
  max_team_size?: number;
  is_flagship: boolean;
  guardian_asset: string;
}

// Convert "HH:MM:SS" to minutes from midnight
const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
};

// Timeline configuration (09:00 to 18:00 = 9 hours = 540 minutes)
const TIMELINE_START_HOUR = 9; // 09:00 AM
const TIMELINE_END_HOUR = 18;  // 06:00 PM
const TIMELINE_START_MINUTES = TIMELINE_START_HOUR * 60; // 540
const TIMELINE_TOTAL_MINUTES = (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60; // 540

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

export const TimelinePage: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(18);
  const [viewMode, setViewMode] = useState<'GANTT' | 'CARDS'>('GANTT');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'TECHNICAL' | 'NON_TECHNICAL'>('ALL');
  const [userRegistrations, setUserRegistrations] = useState<number[]>([]);

  useEffect(() => {
    api.events.getAll().then((res) => {
      if (Array.isArray(res.data)) setEvents(res.data);
    }).catch(() => setEvents([]));
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'participant') {
      api.registrations.getMyRegistrations().then((res) => {
        if (Array.isArray(res.data)) {
          setUserRegistrations(res.data.map((r: any) => r.event_id));
        }
      }).catch(() => {});
    }
  }, [isAuthenticated, user]);

  const dayEvents = events.filter((e) => {
    if (e.is_online) return false;
    const matchDay = e.day === selectedDay;
    const matchCat = categoryFilter === 'ALL' || e.category === categoryFilter;
    return matchDay && matchCat;
  });

  // Star of Login Flagship Event
  const starOfLoginEvt = events.find((e) => e.is_flagship || e.name.toLowerCase().includes('star of login'));

  return (
    <div className="min-h-screen bg-[#0A0607] py-12 px-4 sm:px-6 lg:px-8 text-[#F7F2F2]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[#2A1A1D] pb-6">
          <div className="text-left space-y-2 max-w-2xl">

            <h1 className="display-l text-[#F7F2F2]">TIMELINE &amp; TIMINGS</h1>
            <p className="text-xs sm:text-sm text-[#A79798] leading-relaxed">
              Timeline map for 18 &amp; 19 September 2026. Review start times, durations, and parallel arenas.
            </p>
            <div className="inline-flex items-center gap-2 bg-[#E08A17]/10 border border-[#E08A17]/40 px-3 py-1.5 rounded-[2px] text-xs font-mono text-[#E08A17] font-bold">
              <span>⚠️ REGISTRATION RULE: Max 5 events allowed per participant with 0 schedule collisions.</span>
            </div>
          </div>

          {/* View Mode Toggle: Gantt vs Card Flow */}
          <div className="flex items-center gap-2 bg-[#130C0E] p-1 rounded-[2px] border border-[#2A1A1D]">
            <button
              onClick={() => setViewMode('GANTT')}
              className={`px-3.5 py-1.5 rounded-[2px] font-mono text-xs font-bold flex items-center gap-2 transition-all ${
                viewMode === 'GANTT'
                  ? 'bg-[#E01B22] text-[#F7F2F2] shadow-[0_0_15px_rgba(224,27,34,0.4)]'
                  : 'text-[#A79798] hover:text-[#F7F2F2]'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> TIMELINE GRAPH
            </button>
            <button
              onClick={() => setViewMode('CARDS')}
              className={`px-3.5 py-1.5 rounded-[2px] font-mono text-xs font-bold flex items-center gap-2 transition-all ${
                viewMode === 'CARDS'
                  ? 'bg-[#E01B22] text-[#F7F2F2] shadow-[0_0_15px_rgba(224,27,34,0.4)]'
                  : 'text-[#A79798] hover:text-[#F7F2F2]'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> LIST VIEW
            </button>
          </div>
        </div>

        {/* Controls Toolbar: Day Selector & Category Filter */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#130C0E] border border-[#2A1A1D] p-4 rounded-[2px]">
          
          {/* Day 1 & Day 2 Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDay(18)}
              className={`px-5 py-2.5 rounded-[2px] font-mono text-xs font-bold transition-all border flex items-center gap-2 ${
                selectedDay === 18
                  ? 'bg-[#E01B22] text-[#F7F2F2] border-[#E01B22] shadow-[0_0_15px_rgba(224,27,34,0.3)]'
                  : 'bg-[#0A0607] text-[#A79798] border-[#2A1A1D] hover:border-[#A79798]'
              }`}
            >
              <Calendar className="w-4 h-4" /> DAY 1 — 18 SEP 2026
            </button>
            <button
              onClick={() => setSelectedDay(19)}
              className={`px-5 py-2.5 rounded-[2px] font-mono text-xs font-bold transition-all border flex items-center gap-2 ${
                selectedDay === 19
                  ? 'bg-[#E01B22] text-[#F7F2F2] border-[#E01B22] shadow-[0_0_15px_rgba(224,27,34,0.3)]'
                  : 'bg-[#0A0607] text-[#A79798] border-[#2A1A1D] hover:border-[#A79798]'
              }`}
            >
              <Calendar className="w-4 h-4" /> DAY 2 — 19 SEP 2026
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-[#A79798] text-[11px] hidden sm:inline">TRACK:</span>
            {(['ALL', 'TECHNICAL', 'NON_TECHNICAL'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-[2px] border transition-all ${
                  categoryFilter === cat
                    ? 'bg-[#1A1114] text-[#E01B22] border-[#E01B22] font-bold'
                    : 'bg-[#0A0607] text-[#6B5A5C] border-[#2A1A1D] hover:text-[#A79798]'
                }`}
              >
                {cat === 'ALL' ? 'ALL TRACKS' : cat === 'TECHNICAL' ? 'TECHNICAL' : 'NON-TECH'}
              </button>
            ))}
          </div>

        </div>

        {/* VIEW MODE 1: VISUAL HORIZONTAL GANTT TIMELINE GRAPH */}
        {viewMode === 'GANTT' && (
          <div className="bg-[#130C0E] border border-[#2A1A1D] rounded-[2px] p-6 space-y-6 shadow-2xl overflow-hidden">
            
            {/* Timeline Guide Legend */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2A1A1D] pb-4 text-xs font-mono">
              <div className="flex items-center gap-4 text-[#A79798]">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-[2px] bg-[#E01B22]/30 border border-[#E01B22]" /> TECHNICAL
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-[2px] bg-[#E08A17]/30 border border-[#E08A17]" /> NON-TECHNICAL
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-[2px] bg-[#1FA971]/30 border border-[#1FA971]" /> REGISTERED
                </span>
              </div>
              <div className="text-[11px] text-[#A79798]">
                Click any event block to inspect briefing &amp; register
              </div>
            </div>

            {/* Visual Scrollable Gantt Canvas */}
            <div className="overflow-x-auto pb-4">
              <div className="min-w-[860px] relative space-y-4">
                
                {/* 1. Time Axis Header Ruler */}
                <div className="grid grid-cols-9 border-b border-[#3E2529] pb-2 font-mono text-xs text-[#A79798] text-center">
                  {HOURS.slice(0, 9).map((hour) => (
                    <div key={hour} className="relative">
                      <span className="font-bold text-[#F7F2F2]">
                        {hour < 10 ? `0${hour}` : hour}:00
                      </span>
                      <span className="text-[9px] text-[#6B5A5C] block">IST</span>
                      {/* Vertical Grid Line Guide */}
                      <div className="absolute top-8 bottom-[-500px] left-1/2 w-px border-l border-dashed border-[#2A1A1D] pointer-events-none z-0" />
                    </div>
                  ))}
                </div>

                {/* 2. Visual Schedule Bars Container */}
                <div className="space-y-3 pt-3 relative z-10">
                  {dayEvents.map((evt, idx) => {
                    const startMin = timeToMinutes(evt.start_time);
                    const endMin = timeToMinutes(evt.end_time);
                    
                    // Clamp start and duration relative to timeline canvas (09:00 - 18:00)
                    const offsetMinutes = Math.max(0, startMin - TIMELINE_START_MINUTES);
                    const durationMinutes = Math.max(45, endMin - startMin);

                    const leftPercent = Math.min(95, Math.max(0, (offsetMinutes / TIMELINE_TOTAL_MINUTES) * 100));
                    const widthPercent = Math.min(100 - leftPercent, Math.max(12, (durationMinutes / TIMELINE_TOTAL_MINUTES) * 100));

                    const isRegistered = userRegistrations.includes(evt.id);
                    const isTech = evt.category === 'TECHNICAL';

                    return (
                      <motion.div 
                        key={evt.id} 
                        initial={{ opacity: 0, x: -20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ duration: 0.5, delay: idx * 0.1, type: 'spring', stiffness: 100 }}
                        className="relative h-20 group"
                      >
                        {/* Event Positioning Box on Time Axis */}
                        <div
                          onClick={() => navigate(`/events/${(evt as any).slug}`)}
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                          }}
                          className={`absolute top-0 bottom-0 rounded-[3px] p-3 border transition-all cursor-pointer flex items-center justify-between gap-3 shadow-lg ${
                            isRegistered
                              ? 'bg-[#0F291E] border-[#1FA971] text-[#F7F2F2] hover:shadow-[0_0_20px_rgba(31,169,113,0.4)]'
                              : isTech
                              ? 'bg-[#1C0D10] border-[#E01B22]/60 hover:border-[#FF2A2A] text-[#F7F2F2] hover:shadow-[0_0_20px_rgba(224,27,34,0.4)]'
                              : 'bg-[#1C1409] border-[#E08A17]/60 hover:border-[#FFA500] text-[#F7F2F2] hover:shadow-[0_0_20px_rgba(224,138,23,0.4)]'
                          }`}
                        >
                          {/* Event Thumbnail & Details */}
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={evt.guardian_asset || '/assets/login.webp'}
                              alt={evt.name}
                              className="w-10 h-10 object-contain shrink-0 drop-shadow-[0_0_8px_rgba(224,27,34,0.3)]"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-display font-bold text-xs truncate group-hover:text-[#E01B22] transition-colors">
                                  {evt.name}
                                </h4>
                                {isRegistered && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1FA971] shrink-0" />
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 text-[10px] font-mono text-[#A79798] mt-0.5 truncate">
                                <span className="flex items-center gap-1 text-[#F7F2F2]">
                                  <Clock className="w-3 h-3 text-[#E01B22]" />
                                  {evt.start_time.slice(0, 5)} - {evt.end_time.slice(0, 5)}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1 truncate">
                                  <MapPin className="w-3 h-3 text-[#E08A17]" />
                                  {evt.venue || 'TBA'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Category Badge on Right */}
                          <div className="shrink-0 hidden sm:block">
                            <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded-[2px] uppercase ${
                              isTech
                                ? 'bg-[#E01B22]/20 text-[#FF2A2A] border border-[#E01B22]/40'
                                : 'bg-[#E08A17]/20 text-[#E08A17] border border-[#E08A17]/40'
                            }`}>
                              {evt.category === 'TECHNICAL' ? 'TECH' : 'NON-TECH'}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

              </div>
            </div>

          </div>
        )}

        {/* VIEW MODE 2: CHRONOLOGICAL CARDS LIST */}
        {viewMode === 'CARDS' && (
          <div className="space-y-4">
            {dayEvents.map((evt, idx) => {
              const isRegistered = userRegistrations.includes(evt.id);
              const isTech = evt.category === 'TECHNICAL';

              return (
                <motion.div
                  key={evt.id}
                  onClick={() => navigate(`/events/${(evt as any).slug}`)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="bg-[#130C0E] border border-[#2A1A1D] hover:border-[#FF2A2A] p-5 rounded-[2px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer transition-all hover:bg-[#1A1114] group"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={evt.guardian_asset || '/assets/login.png'}
                      alt={evt.name}
                      className="w-12 h-12 object-contain drop-shadow-[0_0_10px_rgba(224,27,34,0.3)] shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-[2px] ${
                          isTech
                            ? 'bg-[#E01B22]/20 text-[#FF2A2A] border border-[#E01B22]/40'
                            : 'bg-[#E08A17]/20 text-[#E08A17] border border-[#E08A17]/40'
                        }`}>
                          {evt.category}
                        </span>
                        <h3 className="font-display font-bold text-sm text-[#F7F2F2] group-hover:text-[#E01B22] transition-colors">
                          {evt.name}
                        </h3>
                        {isRegistered && (
                          <span className="chip-registered px-2 py-0.5 text-[10px] font-mono flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> REGISTERED
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#A79798] mt-1.5">
                        <span className="flex items-center gap-1.5 text-[#F7F2F2]">
                          <Clock className="w-3.5 h-3.5 text-[#E01B22]" />
                          {evt.start_time.slice(0, 5)} - {evt.end_time.slice(0, 5)} IST
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#E08A17]" />
                          Venue: {evt.venue || 'TBA'}
                        </span>
                        <span>•</span>
                        <span>Team: {evt.team_type === 'TEAM' ? `${evt.min_team_size || 1}–${evt.max_team_size || evt.min_team_size || 1}` : 'Individual'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="text-xs font-mono text-[#E01B22] font-bold group-hover:underline">
                      VIEW DOSSIER
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#E01B22] group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* STAR OF LOGIN FLAGSHIP CALLOUT CARD */}
        {starOfLoginEvt && (
          <div className="bg-gradient-to-r from-[#4A050A] via-[#1A0306] to-[#4A050A] border-2 border-[#E01B22] p-6 rounded-[2px] shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-[#FF2A2A] animate-pulse" />
                <div>
                  <h3 className="font-display font-bold text-base text-[#F7F2F2] uppercase tracking-wider">
                    FLAGSHIP FINALE: STAR OF LOGIN (THE LAST STANDING)
                  </h3>
                  <p className="text-xs text-[#A79798] font-mono">Invite-Only Supreme Championship Arena</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-[#E01B22] text-white font-mono text-xs font-bold rounded-[2px] uppercase">
                DAY 2 • 19 SEP
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#0A0607] p-4 rounded-[2px] border border-[#2A1A1D] text-xs font-mono">
              <div>
                <span className="text-[#A79798] block">TOURNAMENT HOURS:</span>
                <strong className="text-[#F7F2F2]">{starOfLoginEvt.start_time.slice(0, 5)} - {starOfLoginEvt.end_time.slice(0, 5)} IST</strong>
              </div>
              <div>
                <span className="text-[#A79798] block">BATTLE VENUE:</span>
                <strong className="text-[#F7F2F2]">{starOfLoginEvt.venue}</strong>
              </div>
              <div>
                <span className="text-[#A79798] block">ELIGIBILITY:</span>
                <strong className="text-[#E08A17]">Winners of Preliminary Arenas</strong>
              </div>
            </div>
          </div>
        )}

        {/* UnifiedDossierModal removed in favor of /events/:slug route */}
      </div>
    </div>
  );
};

export default TimelinePage;
