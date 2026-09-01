import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import type { Event } from '../../types/event';
import { Calendar, Users, User, Clock, MapPin, ArrowRight, Search, AlertCircle, CheckCircle2, Shield, Sparkles, AlertTriangle, Trash2, X } from 'lucide-react';
import { motion } from 'framer-motion';

const formatDayLabel = (day?: number | string): string => {
  if (!day) return 'Day 1';
  const num = Number(day);
  if (num === 2 || num === 19 || num === 15) return 'Day 2';
  return 'Day 1';
};

const getEventImage = (eventName: string): string => {
  const clean = (eventName || '').toLowerCase().trim();
  if (clean.includes("blind")) return "/assets/events/blind_coding.webp";
  if (clean.includes("nostos")) return "/assets/events/nostos.webp";
  if (clean.includes("relay")) return "/assets/events/code_relay.webp";
  if (clean.includes("slot")) return "/assets/events/in_the_slot.webp";
  if (clean.includes("debug")) return "/assets/events/debug_arena.webp";
  if (clean.includes("xcape") || clean.includes("escape")) return "/assets/events/code_x_cape.webp";
  if (clean.includes("extraction")) return "/assets/events/the_extraction.webp";
  if (clean.includes("pixel") || clean.includes("paradox")) return "/assets/events/pixel_paradox.webp";
  if (clean.includes("phoenix")) return "/assets/events/phoenix.webp";
  if (clean.includes("treasure") || clean.includes("qr")) return "/assets/events/hunt_your_treasure.webp";
  if (clean.includes("star")) return "/assets/events/star_of_login.webp";
  return "/assets/events/blind_coding.webp";
};

const getEventGuardian = (eventName: string): { name: string; title: string } => {
  const clean = (eventName || '').toLowerCase().trim();
  if (clean.includes("blind")) return { name: "VEIL", title: "Code without eyes" };
  if (clean.includes("nostos")) return { name: "HELMSMAN", title: "Poetic mariner" };
  if (clean.includes("relay")) return { name: "TANDEM", title: "Twin coders" };
  if (clean.includes("slot")) return { name: "GAVELON", title: "Auctioneer cadence" };
  if (clean.includes("debug")) return { name: "FRACTURE", title: "Surgical precision" };
  if (clean.includes("xcape") || clean.includes("escape")) return { name: "VAULTWARDEN", title: "Escape gatekeeper" };
  if (clean.includes("extraction")) return { name: "BLACKOUT-9", title: "Encrypted CTF" };
  if (clean.includes("pixel") || clean.includes("paradox")) return { name: "SIMULACRA", title: "AI or Reality" };
  if (clean.includes("phoenix")) return { name: "PYRE-01", title: "Recovery squad" };
  if (clean.includes("treasure") || clean.includes("qr")) return { name: "QRUX", title: "Riddling lantern" };
  if (clean.includes("star")) return { name: "THE LAST STANDING", title: "Supreme mind" };
  return { name: "GUARDIAN", title: "Arena Overseer" };
};

export const DashboardEventsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'TECHNICAL' | 'NON_TECHNICAL' | 'INDIVIDUAL' | 'TEAM'>('ALL');
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Modals state
  const [confirmEvent, setConfirmEvent] = useState<Event | null>(null);
  const [deregisterEvent, setDeregisterEvent] = useState<Event | null>(null);
  const [teamModalEvent, setTeamModalEvent] = useState<Event | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [teamNameInput, setTeamNameInput] = useState<string>('');
  const [teamSubmitting, setTeamSubmitting] = useState(false);
  const [resultModal, setResultModal] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => { const res = await api.events.getAll(); return res.data || []; },
  });

  const { data: userTeams = [] } = useQuery({
    queryKey: ['my-teams'],
    queryFn: async () => { const res = await api.teams.getMyTeams(); return res.data || []; },
  });

  const { data: paymentData } = useQuery({
    queryKey: ['payment-status'],
    queryFn: async () => { const res = await api.payments.getMyStatus(); return res.data; },
    staleTime: 15 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  });

  const { data: myRegistrations = [] } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: async () => { const res = await api.registrations.getMyRegistrations(); return res.data || []; },
  });

  const registeredEventIds = new Set(myRegistrations.map((r: any) => r.event_id));

  const pStatus = paymentData?.status || 'NOT_SUBMITTED';
  const canRegister = pStatus === 'PENDING' || pStatus === 'VERIFIED';

  // Solo Registration Mutation
  const registerMutation = useMutation({
    mutationFn: async (eventId: number) => {
      return await api.registrations.register({ event_id: eventId });
    },
    onSuccess: (_, eventId) => {
      const event = events.find((e: Event) => e.id === eventId);
      const msg = `You have successfully registered for ${event?.name || 'the event'}! Your slot is now locked.`;
      setRegSuccess(msg);
      setRegError(null);
      setConfirmEvent(null);
      setResultModal({
        type: 'success',
        title: 'REGISTRATION SUCCESSFUL!',
        message: msg,
      });
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
      setTimeout(() => setRegSuccess(null), 4000);
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.message || err.response?.data?.error || 'Registration failed';
      setRegError(errMsg);
      setRegSuccess(null);
      setConfirmEvent(null);
      setResultModal({
        type: 'error',
        title: 'REGISTRATION FAILED',
        message: errMsg,
      });
    },
  });

  // Deregister Mutation
  const deregisterMutation = useMutation({
    mutationFn: async (eventId: number) => {
      return await api.registrations.deregister(eventId);
    },
    onSuccess: (_, eventId) => {
      const event = events.find((e: Event) => e.id === eventId);
      setRegSuccess(`Deregistered from ${event?.name || 'event'}.`);
      setRegError(null);
      setDeregisterEvent(null);
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
      setTimeout(() => setRegSuccess(null), 4000);
    },
    onError: (err: any) => {
      setRegError(err.response?.data?.message || 'Failed to deregister');
      setRegSuccess(null);
      setDeregisterEvent(null);
    },
  });

  // Schedule Clash Detection Helper
  const checkScheduleClash = (newEvent: Event): Event | null => {
    if (!newEvent || !Array.isArray(myRegistrations)) return null;
    for (const reg of myRegistrations) {
      const existing = reg?.event;
      if (!existing || existing.id === newEvent.id) continue;

      // Check same day / date
      const sameDay = Number(existing.day) === Number(newEvent.day) || existing.date === newEvent.date;
      const existingStart = existing.start_time || (existing as any).startTime;
      const existingEnd = existing.end_time || (existing as any).endTime;
      const newStart = newEvent.start_time || (newEvent as any).startTime;
      const newEnd = newEvent.end_time || (newEvent as any).endTime;

      if (sameDay && existingStart && newStart && existingEnd && newEnd) {
        const nStart = newStart.slice(0, 5);
        const nEnd = newEnd.slice(0, 5);
        const eStart = existingStart.slice(0, 5);
        const eEnd = existingEnd.slice(0, 5);

        // Time overlap condition: nStart < eEnd && eStart < nEnd
        if (nStart < eEnd && eStart < nEnd) {
          return existing;
        }
      }
    }
    return null;
  };

  const filteredEvents = (events as Event[]).filter((event) => {
    const matchesSearch = event.name.toLowerCase().includes(search.toLowerCase()) ||
      (event.description && event.description.toLowerCase().includes(search.toLowerCase()));

    let matchesFilter = true;
    if (filter === 'TECHNICAL') matchesFilter = event.category === 'TECHNICAL';
    else if (filter === 'NON_TECHNICAL') matchesFilter = event.category === 'NON_TECHNICAL';
    else if (filter === 'INDIVIDUAL') matchesFilter = event.team_type === 'INDIVIDUAL';
    else if (filter === 'TEAM') matchesFilter = event.team_type === 'TEAM';

    return matchesSearch && matchesFilter && event.status === 'open';
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.96, y: 15 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } as const }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A1A1D] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#E01B22]" />
            <h1 className="text-xl font-display font-bold text-[#F7F2F2]">Symposium Arenas</h1>
          </div>
          <p className="text-xs text-[#A79798] font-mono mt-1">Explore, form squads, and compete across 11 technical & non-technical arenas</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[#A79798]">Registrations Limit:</span>
          <span className={`px-2.5 py-1 rounded-[2px] font-bold border ${
            myRegistrations.length >= 5 
              ? 'bg-[#E08A17]/20 border-[#E08A17] text-[#E08A17]' 
              : 'bg-[#E01B22]/20 border-[#E01B22]/40 text-[#F7F2F2]'
          }`}>
            {myRegistrations.length} / 5 EVENTS USED
          </span>
        </div>
      </div>

      {/* Alerts */}
      {regError && (
        <div className="bg-[#9B0A12]/20 border border-[#E01B22]/60 p-3.5 rounded-[2px] flex items-center gap-3 text-xs text-[#FF2A2A] font-mono animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{regError}</span>
          <button onClick={() => setRegError(null)} className="ml-auto text-[#6B5A5C] hover:text-white">✕</button>
        </div>
      )}
      {regSuccess && (
        <div className="bg-[#1FA971]/15 border border-[#1FA971]/60 p-3.5 rounded-[2px] flex items-center gap-3 text-xs text-[#1FA971] font-mono animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#1FA971]" />
          <span>{regSuccess}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A79798]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events by keyword, guardian, or topic..."
            className="w-full bg-[#0A0607] border border-[#2A1A1D] focus:border-[#E01B22] rounded-[2px] pl-10 pr-4 py-2.5 text-[#F7F2F2] text-xs font-mono outline-none transition-colors"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(['ALL', 'TECHNICAL', 'NON_TECHNICAL', 'INDIVIDUAL', 'TEAM'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 text-[10px] font-mono rounded-[2px] border transition-all ${
                filter === f
                  ? 'bg-[#E01B22] border-[#E01B22] text-[#F7F2F2] font-bold shadow-lg shadow-[#E01B22]/20'
                  : 'bg-[#0A0607] border-[#2A1A1D] text-[#A79798] hover:text-[#F7F2F2] hover:border-[#3E2529]'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-xs font-mono text-[#A79798] flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-[#E01B22] animate-spin" /> Loading event dossiers...
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 text-xs font-mono text-[#A79798] bg-[#0A0607] border border-[#2A1A1D] p-6 rounded-[2px]">
          No matching symposium events found for your search.
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {filteredEvents.map((event) => {
            const imageUrl = getEventImage(event.name);
            const guardian = getEventGuardian(event.name);
            const isRegistered = registeredEventIds.has(event.id);

            return (
              <motion.div
                variants={itemVariants}
                key={event.id}
                className="group bg-[#130C0E] border border-[#2A1A1D] rounded-[2px] overflow-hidden hover:border-[#E01B22]/60 transition-all duration-300 flex flex-col justify-between shadow-xl hover:shadow-2xl hover:shadow-[#E01B22]/10"
              >
                <div>
                  {/* Card Cover Image Header */}
                  <div
                    onClick={() => navigate(`/events/${event.id}`)}
                    className="relative h-32 sm:h-44 w-full overflow-hidden bg-[#0A0607] cursor-pointer"
                  >
                    <img
                      src={imageUrl}
                      alt={event.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-80"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#130C0E] via-[#130C0E]/60 to-transparent" />

                    {/* Top Status Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                      <span className={`px-2.5 py-1 text-[9px] font-mono font-bold rounded-[2px] tracking-wider uppercase shadow-md ${
                        event.category === 'TECHNICAL'
                          ? 'bg-[#6366F1] text-[#FFFFFF]'
                          : 'bg-[#E08A17] text-[#0A0607]'
                      }`}>
                        {event.category}
                      </span>

                      <span className={`px-2.5 py-1 text-[9px] font-mono font-bold rounded-[2px] flex items-center gap-1 shadow-md ${
                        event.team_type === 'TEAM'
                          ? 'bg-[#130C0E]/90 border border-[#E08A17] text-[#E08A17]'
                          : 'bg-[#130C0E]/90 border border-[#1FA971] text-[#1FA971]'
                      }`}>
                        {event.team_type === 'TEAM' ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        {event.team_type === 'TEAM' ? `${event.min_team_size}-${event.max_team_size} SQUAD` : 'SOLO'}
                      </span>
                    </div>

                    {/* Guardian Name Overlay */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                      <div>
                        <div className="text-[9px] font-mono text-[#E01B22] font-bold tracking-widest uppercase">
                          GUARDIAN: {guardian.name}
                        </div>
                        <h3 className="text-base font-display font-bold text-[#F7F2F2] drop-shadow-md leading-tight hover:text-[#E01B22] transition-colors">
                          {event.name}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-4 space-y-3">
                    {event.description && (
                      <p className="text-xs text-[#A79798] line-clamp-2 leading-relaxed font-body">
                        {event.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-mono text-[#A79798] pt-1 border-t border-[#2A1A1D]/60">
                      <span className="flex items-center gap-1.5 text-[#F7F2F2]">
                        <Calendar className="w-3.5 h-3.5 text-[#E01B22]" /> {formatDayLabel(event.day)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#E08A17]" />
                        {event.start_time?.slice(0, 5)} - {event.end_time?.slice(0, 5)}
                      </span>
                      {event.venue && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#818CF8]" /> {event.venue}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 pt-0">
                  {event.is_flagship || (event.name || '').toLowerCase().includes('star of login') ? (
                    <div className="w-full py-2.5 bg-[#E08A17]/15 border border-[#E08A17]/60 text-[#E08A17] font-mono text-[11px] font-bold rounded-[2px] flex items-center justify-center gap-2 text-center">
                      🏆 INVITE-ONLY FLAGSHIP EVENT
                    </div>
                  ) : isRegistered ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 py-2.5 bg-[#1FA971]/20 border border-[#1FA971] text-[#1FA971] font-mono text-xs font-bold rounded-[2px] flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> REGISTERED
                      </div>
                      <button
                        onClick={() => setDeregisterEvent(event)}
                        className="px-3 py-2.5 bg-[#4A050A]/40 hover:bg-[#E01B22] border border-[#E01B22] text-[#FF2A2A] hover:text-white font-mono text-xs font-bold rounded-[2px] transition-colors flex items-center gap-1"
                        title="Deregister from this event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : !canRegister ? (
                    <button
                      disabled
                      className="w-full py-2.5 bg-[#4A050A] text-[#FF2A2A] border border-[#E01B22] font-mono text-[11px] font-bold rounded-[2px] flex items-center justify-center gap-2 opacity-80 cursor-not-allowed"
                    >
                      PAYMENT REQUIRED TO REGISTER
                    </button>
                  ) : myRegistrations.length >= 5 ? (
                    <button
                      disabled
                      className="w-full py-2.5 bg-[#1A1114] text-[#E08A17] border border-[#E08A17]/40 font-mono text-[11px] font-bold rounded-[2px] flex items-center justify-center gap-2 cursor-not-allowed opacity-90"
                      title="You have reached the maximum limit of 5 event registrations"
                    >
                      MAX 5 EVENTS LIMIT REACHED
                    </button>
                  ) : Boolean(checkScheduleClash(event)) ? (
                    <button
                      disabled
                      className="w-full py-2.5 bg-[#1A1114] text-[#FF2A2A] border border-[#E01B22]/70 font-mono text-[11px] font-bold rounded-[2px] flex items-center justify-center gap-2 cursor-not-allowed opacity-90"
                      title="This event conflicts with another event already registered on your schedule"
                    >
                      SCHEDULE CONFLICT
                    </button>
                  ) : event.team_type === 'INDIVIDUAL' ? (
                    <button
                      onClick={() => setConfirmEvent(event)}
                      className="w-full py-2.5 bg-[#E01B22] hover:bg-[#FF2A2A] text-[#F7F2F2] font-mono text-xs font-bold rounded-[2px] flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg hover:shadow-[#E01B22]/30"
                    >
                      REGISTER NOW <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setTeamModalEvent(event)}
                      className="w-full py-2.5 bg-[#E08A17]/20 hover:bg-[#E08A17]/30 text-[#E08A17] font-mono text-xs font-bold rounded-[2px] text-center transition-colors border border-[#E08A17]/50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                      REGISTER TEAM <Users className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Solo Event Registration Confirmation Modal */}
      {confirmEvent && (() => {
        const clash = checkScheduleClash(confirmEvent);
        const guardian = getEventGuardian(confirmEvent.name);

        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setConfirmEvent(null)}>
            <div className="bg-[#130C0E] border border-[#E01B22] rounded-[2px] w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setConfirmEvent(null)}
                className="absolute top-4 right-4 text-[#A79798] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-lg font-display font-bold text-[#F7F2F2] flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#E01B22]" /> Confirm Arena Registration
              </h2>

              <div className="bg-[#0A0607] border border-[#2A1A1D] p-4 rounded-[2px] space-y-2 font-mono text-xs">
                <div className="text-[10px] text-[#E01B22] font-bold uppercase">GUARDIAN: {guardian.name}</div>
                <h3 className="text-sm font-bold text-[#F7F2F2]">{confirmEvent.name}</h3>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#A79798] pt-2 border-t border-[#2A1A1D]">
                  <span>📅 {formatDayLabel(confirmEvent.day)}</span>
                  <span>⏰ {confirmEvent.start_time?.slice(0, 5)} - {confirmEvent.end_time?.slice(0, 5)} IST</span>
                  {confirmEvent.venue && <span>📍 {confirmEvent.venue}</span>}
                </div>
              </div>

              {/* Schedule Clash Warning */}
              {clash ? (
                <div className="bg-[#9B0A12]/30 border border-[#E01B22] p-3.5 rounded-[2px] text-xs font-mono text-[#FF2A2A] space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-[#FF2A2A]" /> SCHEDULE CLASH DETECTED!
                  </div>
                  <p className="text-[11px] text-[#F7F2F2]">
                    You are already registered for <strong className="text-[#E08A17]">{clash.name}</strong> on {formatDayLabel(confirmEvent.day)} ({clash.start_time?.slice(0, 5)} - {clash.end_time?.slice(0, 5)} IST).
                  </p>
                  <p className="text-[10px] text-[#A79798] pt-1">
                    You cannot register for two overlapping events on the same day. Please deregister from the conflicting event first.
                  </p>
                </div>
              ) : (
                <p className="text-xs font-mono text-[#A79798]">
                  Are you sure you want to register for this event? Once confirmed, an official entry badge will be generated for your profile.
                </p>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setConfirmEvent(null)}
                  className="px-4 py-2 text-xs font-mono text-[#A79798] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => registerMutation.mutate(confirmEvent.id)}
                  disabled={Boolean(clash) || registerMutation.isPending}
                  className="px-5 py-2 bg-[#E01B22] hover:bg-[#FF2A2A] text-white text-xs font-mono font-bold rounded-[2px] disabled:opacity-50 flex items-center gap-2 shadow-lg"
                >
                  {registerMutation.isPending ? 'Confirming...' : 'CONFIRM REGISTRATION'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Deregister Confirmation Modal */}
      {deregisterEvent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeregisterEvent(null)}>
          <div className="bg-[#130C0E] border border-[#E01B22] rounded-[2px] w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setDeregisterEvent(null)}
              className="absolute top-4 right-4 text-[#A79798] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-display font-bold text-[#F7F2F2] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#E01B22]" /> Deregister from Event
            </h2>

            <p className="text-xs font-mono text-[#A79798]">
              Are you sure you want to cancel your registration for <strong className="text-[#F7F2F2]">{deregisterEvent.name}</strong>? Your slot will be released for other participants.
            </p>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setDeregisterEvent(null)}
                className="px-4 py-2 text-xs font-mono text-[#A79798] hover:text-white"
              >
                Keep Registration
              </button>
              <button
                onClick={() => deregisterMutation.mutate(deregisterEvent.id)}
                disabled={deregisterMutation.isPending}
                className="px-5 py-2 bg-[#E01B22] hover:bg-[#FF2A2A] text-white text-xs font-mono font-bold rounded-[2px] disabled:opacity-50"
              >
                {deregisterMutation.isPending ? 'Deregistering...' : 'DEREGISTER NOW'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Registration Modal */}
      {teamModalEvent && (() => {
        const clash = checkScheduleClash(teamModalEvent);
        const myCreatedTeams = userTeams.map((m: any) => m.team).filter(Boolean);
        const hasNoTeam = !selectedTeamId && !teamNameInput.trim();

        const handleTeamSubmit = async () => {
          try {
            setRegError(null);
            setTeamSubmitting(true);

            let selectedTeam = myCreatedTeams.find((t: any) => String(t.id) === String(selectedTeamId));
            let teamName = selectedTeam ? selectedTeam.name : teamNameInput.trim();

            if (!teamName) {
              setRegError('Please select an existing team or enter a team name.');
              setTeamSubmitting(false);
              return;
            }

            await api.registrations.register({
              event_id: teamModalEvent.id,
              team_name: teamName,
              team_id: selectedTeamId ? Number(selectedTeamId) : undefined,
            });

            queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
            queryClient.invalidateQueries({ queryKey: ['my-teams'] });
            const successMsg = `Squad '${teamName}' has been successfully registered for ${teamModalEvent.name}!`;
            setRegSuccess(successMsg);
            setTeamModalEvent(null);
            setSelectedTeamId('');
            setTeamNameInput('');
            setResultModal({
              type: 'success',
              title: 'TEAM REGISTRATION SUCCESSFUL!',
              message: successMsg,
            });
          } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to register team.';
            setRegError(errorMsg);
            setResultModal({
              type: 'error',
              title: 'TEAM REGISTRATION FAILED',
              message: errorMsg,
            });
          } finally {
            setTeamSubmitting(false);
          }
        };

        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setTeamModalEvent(null)}>
            <div className="bg-[#130C0E] border border-[#E08A17] rounded-[2px] w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setTeamModalEvent(null)}
                className="absolute top-4 right-4 text-[#A79798] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-lg font-display font-bold text-[#F7F2F2] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#E08A17]" /> Register Squad for Event
              </h2>

              <div className="bg-[#0A0607] border border-[#2A1A1D] p-3.5 rounded-[2px] space-y-1 font-mono text-xs">
                <div className="text-[#E08A17] font-bold">{teamModalEvent.name}</div>
                <div className="text-[10px] text-[#A79798]">
                  {formatDayLabel(teamModalEvent.day)} • {teamModalEvent.start_time?.slice(0, 5)} - {teamModalEvent.end_time?.slice(0, 5)} IST ({teamModalEvent.min_team_size || 2}-{teamModalEvent.max_team_size || 2} members)
                </div>
              </div>

              {clash && (
                <div className="bg-[#9B0A12]/30 border border-[#E01B22] p-3 rounded-[2px] text-xs font-mono text-[#FF2A2A] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-[#FF2A2A]" />
                  <span>Warning: Schedule clash with {clash.name} on {formatDayLabel(teamModalEvent.day)}.</span>
                </div>
              )}

              <div className="space-y-3 font-mono text-xs">
                {myCreatedTeams.length > 0 ? (
                  <div>
                    <label className="block text-[#A79798] mb-1 font-semibold">Select Existing Team *</label>
                    <select
                      value={selectedTeamId}
                      onChange={(e) => {
                        setSelectedTeamId(e.target.value);
                        const found = myCreatedTeams.find((t: any) => String(t.id) === String(e.target.value));
                        if (found) setTeamNameInput(found.name);
                      }}
                      className="w-full bg-[#0A0607] border border-[#2A1A1D] focus:border-[#E08A17] text-[#F7F2F2] px-3 py-2 rounded-[2px] outline-none"
                    >
                      <option value="">-- Choose from your teams --</option>
                      {myCreatedTeams.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.name} ({t.members?.length || 1} members)</option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <div>
                  <label className="block text-[#A79798] mb-1 font-semibold">
                    {myCreatedTeams.length > 0 ? 'Or Enter New Team Name' : 'Team Name *'}
                  </label>
                  <input
                    type="text"
                    value={teamNameInput}
                    onChange={(e) => {
                      setTeamNameInput(e.target.value);
                      if (selectedTeamId) setSelectedTeamId('');
                    }}
                    placeholder="e.g. Cyber Squad"
                    className="w-full bg-[#0A0607] border border-[#2A1A1D] focus:border-[#E08A17] text-[#F7F2F2] px-3 py-2 rounded-[2px] outline-none"
                  />
                </div>

                {myCreatedTeams.length === 0 && (
                  <div className="bg-[#9B0A12]/30 border border-[#E01B22] p-3 rounded-[2px] text-xs font-mono text-[#FF2A2A] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-[#FF2A2A]" />
                    <span>No squad was found for this account. Create a team from the My Teams page first, or enter a new team name here to create one.</span>
                  </div>
                )}

                {hasNoTeam && myCreatedTeams.length > 0 && (
                  <div className="bg-[#9B0A12]/30 border border-[#E01B22] p-3 rounded-[2px] text-xs font-mono text-[#FF2A2A] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-[#FF2A2A]" />
                    <span>Please select an existing team or enter a new team name to register.</span>
                  </div>
                )}

                <div className="text-[10px] text-[#A79798] leading-relaxed pt-1">
                  💡 Note: Using your existing team registers all members into this event. You do not need to recreate your squad for every event!
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-[#2A1A1D]">
                <button
                  type="button"
                  onClick={() => setTeamModalEvent(null)}
                  className="px-4 py-2 text-xs font-mono text-[#A79798] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleTeamSubmit}
                  disabled={teamSubmitting || Boolean(clash) || hasNoTeam}
                  className="px-5 py-2 bg-[#E08A17] hover:bg-[#c9780e] text-black text-xs font-mono font-bold rounded-[2px] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#E08A17] transition-colors shadow-md"
                >
                  {teamSubmitting ? 'Registering Team...' : 'REGISTER SQUAD'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Registration Result Popup Modal (Success / Error) */}
      {resultModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setResultModal(null)}>
          <div className={`bg-[#130C0E] border-2 rounded-[2px] w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 relative ${
            resultModal.type === 'success' ? 'border-[#1FA971]' : 'border-[#E01B22]'
          }`} onClick={(e) => e.stopPropagation()}>
            
            <button
              onClick={() => setResultModal(null)}
              className="absolute top-4 right-4 text-[#A79798] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${
                resultModal.type === 'success' 
                  ? 'bg-[#1FA971]/20 border-[#1FA971] text-[#1FA971]' 
                  : 'bg-[#9B0A12]/30 border-[#E01B22] text-[#FF2A2A]'
              }`}>
                {resultModal.type === 'success' ? <CheckCircle2 className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
              </div>
              <div>
                <h3 className={`font-display font-bold text-base uppercase tracking-wider ${
                  resultModal.type === 'success' ? 'text-[#1FA971]' : 'text-[#FF2A2A]'
                }`}>
                  {resultModal.title}
                </h3>
                <span className="text-[10px] font-mono text-[#A79798]">LOGIN 2K26 REGISTRATION NOTIFICATION</span>
              </div>
            </div>

            <div className="bg-[#0A0607] border border-[#2A1A1D] p-4 rounded-[2px] font-mono text-xs text-[#F7F2F2] leading-relaxed">
              {resultModal.message}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setResultModal(null)}
                className={`px-6 py-2.5 font-mono text-xs font-bold rounded-[2px] transition-all shadow-md ${
                  resultModal.type === 'success'
                    ? 'bg-[#1FA971] hover:bg-[#18875a] text-black'
                    : 'bg-[#E01B22] hover:bg-[#FF2A2A] text-white'
                }`}
              >
                {resultModal.type === 'success' ? 'GOT IT / CONTINUE' : 'OK / DISMISS'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
