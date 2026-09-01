import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import eventsData from '../data/events.json';
import { useAuthStore } from '../store/authStore';
import { CheckCircle2, Filter } from 'lucide-react';
import { TimelineSection } from '../components/home/TimelineSection';

interface Event {
  id: number;
  name: string;
  description: string;
  category: 'TECHNICAL' | 'NON_TECHNICAL' | 'FLAGSHIP';
  team_type: 'INDIVIDUAL' | 'TEAM';
  min_team_size: number;
  max_team_size: number;
  day: number;
  date: string;
  start_time: string;
  end_time: string;
  venue: string;
  is_online: boolean;
  max_participants: number;
  is_flagship: boolean;
  guardian_asset: string;
  entry_fee: number;
  rules_url?: string;
  status: string;
  coordinator_name?: string;
  coordinator_phone?: string;
}

interface EventDetail {
  name: string;
  guardianName: string;
  quote: string;
  durationText: string;
  shortDesc: string;
  fullDesc: string;
  skills: string[];
  briefing: string;
}

const EVENT_DETAILS: Record<string, EventDetail> = {
  "NOSTOS: The Journey Home": {
    name: "NOSTOS: The Journey Home",
    guardianName: "HELMSMAN",
    quote: "Navigate Odysseus's trials across logic and patterns.",
    durationText: "~3 Hours",
    shortDesc: "Embark on an Odyssey-inspired team adventure filled with riddles, wordplay, logic, patterns, and visual puzzles. Work together to find your way back to Ithaca.",
    fullDesc: "Embark on an Odyssey-inspired team adventure filled with riddles, wordplay, logic, patterns, and visual puzzles. Work together as a ship’s crew, overcome challenging trials, and find your way back to Ithaca.",
    skills: ["Logical Thinking", "Teamwork", "Observation", "Problem Solving"],
    briefing: "I am HELMSMAN. Sail through wordplay, mathematical series, riddles, and pattern recognition on an interactive live world map to reach your homeland."
  },
  "Code Relay": {
    name: "Code Relay",
    guardianName: "TANDEM",
    quote: "Swap coders every five minutes. One mind in two bodies.",
    durationText: "75 Minutes",
    shortDesc: "A fast-paced collaborative coding challenge where teammates take turns coding and must quickly understand and continue each other’s work.",
    fullDesc: "A fast-paced collaborative coding challenge where teammates take turns coding and must quickly understand and continue each other’s work. Success depends on coding ability, adaptability, communication, and teamwork.",
    skills: ["Programming", "Debugging", "Teamwork", "Adaptability"],
    briefing: "I am TANDEM. Two-member teams solve complex algorithmic problems while swapping active coders on a strict five-minute timer. Sync or shatter."
  },
  "In The Slot": {
    name: "IN THE SLOT!!",
    guardianName: "GAVELON",
    quote: "Cricket wisdom, fast math, and high-stakes psychology.",
    durationText: "3–4 Hours",
    shortDesc: "Step into the world of IPL-style franchise auctions. Identify players from statistics, manage your budget, decode opponents’ hidden strategies, and build the strongest squad.",
    fullDesc: "Step into the world of IPL-style franchise auctions. Identify players from statistics, manage your budget, decode opponents’ hidden strategies, and make smart bidding decisions to build the strongest squad.",
    skills: ["Cricket Knowledge", "Strategy", "Budgeting", "Negotiation", "Decision Making"],
    briefing: "I am GAVELON. Step into the ultimate IPL-style auction. Manage your budget, anticipate rival picks, and assemble a championship squad under pressure."
  },
  "Debug Arena": {
    name: "Debug Arena",
    guardianName: "FRACTURE",
    quote: "Corrupted memory. Broken pointers. Fix it before system failure.",
    durationText: "90 Minutes",
    shortDesc: "Take the role of a software engineer and hunt down bugs in faulty programs. Identify errors, fix code, and optimize solutions.",
    fullDesc: "Take the role of a software engineer and hunt down bugs in faulty programs. Identify errors, fix code, optimize solutions, and tackle real-world debugging challenges across programming languages.",
    skills: ["Debugging", "Programming", "Analytical Thinking", "Optimization"],
    briefing: "I am FRACTURE. Flawless code is a myth; diagnosis is an art. You are tasked with identifying, isolating, and optimizing faulty programs against strict runtime limits."
  },
  "CodeXcape": {
    name: "CodeXcape",
    guardianName: "VAULTWARDEN",
    quote: "A six-digit code stands between you and freedom. The clock ticks.",
    durationText: "90 Minutes",
    shortDesc: "Solve interconnected technical challenges, combine clues, and crack the final six-digit escape code before time runs out.",
    fullDesc: "A technical escape-room challenge where teams solve interconnected programming and logic puzzles. Combine clues, communicate with your teammate, and piece together the final six-digit escape code before time runs out.",
    skills: ["Programming", "Logic", "Debugging", "Communication", "Problem Solving"],
    briefing: "I am VAULTWARDEN. Welcome to the technical escape room. Solve timed cryptographic puzzles and algorithmic riddles to extract key fragments and unlock the final escape sequence."
  },
  "Blind Coding": {
    name: "Blind Coding",
    guardianName: "VEIL",
    quote: "Code in the dark. Your eyes lie; your logic does not.",
    durationText: "60–90 Minutes",
    shortDesc: "When vision fades, logic takes over. Solve programming problems through an intentionally blurred coding interface.",
    fullDesc: "When vision fades, logic takes over. Solve programming problems through an intentionally blurred coding interface, relying on your memory, syntax knowledge, algorithms, and problem-solving ability.",
    skills: ["Coding", "Algorithms", "Logical Thinking", "Memory", "Problem Solving"],
    briefing: "I am VEIL. In this arena, visual constraints tighten progressively. You will construct syntactically flawless software while deprived of standard IDE feedback."
  },
  "The Extraction": {
    name: "The Extraction",
    guardianName: "BLACKOUT-9",
    quote: "Operation BLACKOUT is active. Breach the vault and extract the payload.",
    durationText: "3–4 Hours",
    shortDesc: "Step into a story-driven cybersecurity mission where you decode encrypted data, analyze digital clues, crack hashes, and complete extraction.",
    fullDesc: "Step into a story-driven cybersecurity mission where you decode encrypted data, analyze digital clues, crack hashes, and solve multi-layered challenges to complete the final extraction.",
    skills: ["Cybersecurity", "Cryptography", "Encoding", "Logical Thinking"],
    briefing: "I am BLACKOUT-9. Engage in a story-driven cybersecurity CTF. Overcome cryptography, authentication bypasses, and digital forensics to neutralize the threat."
  },
  "Pixel Paradox: AI or Reality?": {
    name: "Pixel Paradox: AI or Reality?",
    guardianName: "SIMULACRA",
    quote: "Deepfake or authentic? Look closely at the artifacts.",
    durationText: "60–75 Minutes",
    shortDesc: "Can you tell AI from reality? Analyze realistic images and media, spot subtle AI-generated artifacts, and reconstruct prompts.",
    fullDesc: "Can you tell AI from reality? Analyze realistic images and media, spot subtle AI-generated artifacts, identify hidden inconsistencies, and reconstruct prompts to prove your observation and AI awareness.",
    skills: ["Observation", "AI Awareness", "Critical Thinking", "Visual Analysis"],
    briefing: "I am SIMULACRA. Test your media observation and AI awareness. Differentiate synthetic generative media from authentic content through technical reasoning."
  },
  "Project Phoenix: System Recovery": {
    name: "Project Phoenix: System Recovery",
    guardianName: "PYRE-01",
    quote: "Catastrophic failure in progress. Rebuild from the ashes.",
    durationText: "2 Hours 30 Minutes",
    shortDesc: "Work as a Recovery Squad to debug applications, recover hidden services, restore infrastructure, and handle live technical incidents.",
    fullDesc: "Enter a simulated company facing a critical production failure. Work as a Recovery Squad to debug applications, recover hidden services, restore infrastructure, and handle live technical incidents before production goes down.",
    skills: ["Programming", "Debugging", "Reverse Engineering", "Linux", "Problem Solving"],
    briefing: "I am PYRE-01. A software engineering simulation simulating production disasters. Recovery squads must analyze server crash logs and restore critical infrastructure in real-time."
  },
  "Hunt your Treasure — QR Escape Challenge": {
    name: "Hunt your Treasure — QR Escape Challenge",
    guardianName: "QRUX",
    quote: "Decipher the grid. Scan the hidden marks across campus.",
    durationText: "2 Hours",
    shortDesc: "Solve clues, scan hidden QR codes across campus, and answer MCA and GK questions to unlock each stage.",
    fullDesc: "Solve clues, scan hidden QR codes across campus, and answer MCA and GK questions to unlock the next stage of the adventure.",
    skills: ["Observation", "Teamwork", "General Knowledge", "Problem Solving"],
    briefing: "I am QRUX. Solve cryptic puzzles, locate concealed QR targets across PSG Tech campus, and answer MCA and general knowledge questions to unlock the next stage."
  },
  "Star of LOGIN": {
    name: "Star of LOGIN",
    guardianName: "THE LAST STANDING",
    quote: "The headline event of LOGIN 2026. The last mind standing.",
    durationText: "3 Hours",
    shortDesc: "The headline flagship event of LOGIN 2026. Only winners of other events qualify to compete in this event.",
    fullDesc: "The headline flagship event of LOGIN 2026. Only winners of other events qualify to compete in this event. Coordinators will communicate directly with qualified participants.",
    skills: ["Advanced Coding", "Resilience", "Problem Solving", "Versatility"],
    briefing: "I am THE LAST STANDING. This is the supreme crown of LOGIN 2026. Only the most versatile, resilient, and brilliant mind will endure through multi-stage eliminate rounds."
  }
};

const getEventDetail = (eventName: string): EventDetail => {
  if (!eventName) return EVENT_DETAILS["Blind Coding"];
  const clean = eventName.toLowerCase().trim();

  if (clean.includes("blind")) return EVENT_DETAILS["Blind Coding"];
  if (clean.includes("nostos")) return EVENT_DETAILS["NOSTOS: The Journey Home"];
  if (clean.includes("relay")) return EVENT_DETAILS["Code Relay"];
  if (clean.includes("slot")) return EVENT_DETAILS["In The Slot"];
  if (clean.includes("debug")) return EVENT_DETAILS["Debug Arena"];
  if (clean.includes("xcape") || clean.includes("escape")) return EVENT_DETAILS["CodeXcape"];
  if (clean.includes("extraction")) return EVENT_DETAILS["The Extraction"];
  if (clean.includes("pixel") || clean.includes("paradox")) return EVENT_DETAILS["Pixel Paradox: AI or Reality?"];
  if (clean.includes("phoenix")) return EVENT_DETAILS["Project Phoenix: System Recovery"];
  if (clean.includes("treasure") || clean.includes("qr")) return EVENT_DETAILS["Hunt your Treasure — QR Escape Challenge"];
  if (clean.includes("star")) return EVENT_DETAILS["Star of LOGIN"];

  return EVENT_DETAILS[eventName] || {
    name: eventName,
    guardianName: "GUARDIAN",
    quote: "Enter the arena.",
    durationText: "90 Minutes",
    shortDesc: "Compete in LOGIN 2026 symposium challenge.",
    fullDesc: "Compete in LOGIN 2026 symposium challenge.",
    skills: ["Problem Solving", "Logic"],
    briefing: "Welcome to LOGIN 2026."
  };
};

export const EventsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const [events] = useState<Event[]>(eventsData as any);
  const [userRegistrations, setUserRegistrations] = useState<number[]>([]);

  const categoryParam = searchParams.get('category')?.toUpperCase() || 'ALL';

  useEffect(() => {
    if (isAuthenticated && user?.role === 'participant') {
      api.registrations.getMyRegistrations().then((res) => {
        if (Array.isArray(res.data)) {
          setUserRegistrations(res.data.map((r: any) => r.event_id));
        }
      }).catch(() => {});
    }
  }, [isAuthenticated, user]);

  const handleCategoryChange = (cat: string) => {
    if (cat === 'ALL') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', cat.toLowerCase());
    }
    setSearchParams(searchParams);
  };

  const filteredEvents = events.filter((e) => {
    if (categoryParam === 'FLAGSHIP') return e.category === 'FLAGSHIP';
    if (categoryParam === 'ONLINE') return e.is_online === true;
    if (categoryParam === 'TECHNICAL') return e.category === 'TECHNICAL' && !e.is_online;
    if (categoryParam === 'NON_TECHNICAL') return e.category === 'NON_TECHNICAL' && !e.is_online;
    return true;
  }).sort((a, b) => {
    if (a.category === 'FLAGSHIP' && b.category !== 'FLAGSHIP') return -1;
    if (a.category !== 'FLAGSHIP' && b.category === 'FLAGSHIP') return 1;
    if (a.is_online && !b.is_online) return -1;
    if (!a.is_online && b.is_online) return 1;
    return 0;
  });

  return (
    <div className="min-h-screen bg-[#0A0607] py-12 text-[#F7F2F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Sticky Filter Bar */}
        <div className="sticky top-16 sm:top-20 z-30 bg-[#130C0E]/95 backdrop-blur-md border border-[#2A1A1D] p-3 sm:p-4 rounded-[2px] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 w-full sm:w-auto">
            <span className="mono-label text-[#E01B22] font-bold shrink-0 text-[10px] sm:text-xs mr-1">CATEGORIES:</span>
            {['ALL', 'FLAGSHIP', 'ONLINE', 'TECHNICAL', 'NON_TECHNICAL'].map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-3 sm:px-4 py-1.5 rounded-[2px] font-mono text-[10px] sm:text-xs font-bold transition-all border whitespace-nowrap shrink-0 ${
                  (cat === 'ALL' && categoryParam === 'ALL') ||
                  (cat === 'FLAGSHIP' && categoryParam === 'FLAGSHIP') ||
                  (cat === 'ONLINE' && categoryParam === 'ONLINE') ||
                  (cat === 'TECHNICAL' && categoryParam === 'TECHNICAL') ||
                  (cat === 'NON_TECHNICAL' && categoryParam === 'NON_TECHNICAL')
                    ? 'bg-[#E01B22] text-[#F7F2F2] border-[#E01B22]'
                    : 'bg-[#0A0607] text-[#A79798] border-[#2A1A1D] hover:border-[#A79798]'
                }`}
              >
                {cat === 'ALL' ? 'ALL ARENAS' : cat === 'FLAGSHIP' ? 'FLAGSHIP EVENT' : cat === 'ONLINE' ? 'ONLINE EVENTS' : cat === 'TECHNICAL' ? 'TECHNICAL' : 'NON-TECHNICAL'}
              </button>
            ))}
          </div>

          <div className="mono-label text-[#6B5A5C] text-[10px] sm:text-xs text-right sm:text-left shrink-0">
            SHOWING {filteredEvents.length} OF 11 EVENTS
          </div>
        </div>

        {/* Empty State */}
        {filteredEvents.length === 0 && (
          <div className="text-center py-20 bg-[#130C0E] border border-[#2A1A1D] rounded-[2px] p-8 space-y-4 max-w-md mx-auto">
            <Filter className="w-12 h-12 text-[#6B5A5C] mx-auto" />
            <h3 className="text-lg font-display font-bold text-[#F7F2F2]">No events match this category</h3>
            <p className="text-xs text-[#A79798]">Select 'ALL ARENAS' to view the complete list of 11 LOGIN 2026 events.</p>
            <button
              onClick={() => handleCategoryChange('ALL')}
              className="px-6 py-2 bg-[#E01B22] text-[#F7F2F2] text-xs font-mono font-bold rounded-[2px]"
            >
              SHOW ALL 11 EVENTS
            </button>
          </div>
        )}

        {/* Event Cards Grid */}
        {filteredEvents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {filteredEvents.map((event, idx) => {
              const detail = getEventDetail(event.name);
              const isRegistered = userRegistrations.includes(event.id);

              return (
                <div
                  key={event.id}
                  className={`bg-[#130C0E] rounded-[2px] flex flex-col card-hover-lift corner-bracket-container border animate-fade-in-up ${
                    event.is_flagship
                      ? 'border-[#E01B22] shadow-[0_0_25px_rgba(224,27,34,0.25)]'
                      : 'border-[#2A1A1D] hover:border-[#E01B22]/50'
                  }`}
                  style={{ animationDelay: `${idx * 0.07}s` }}
                >
                  <div className="corner-bracket-tl" />
                  <div className="corner-bracket-br" />

                  {/* Guardian Art Frame */}
                  <div className="p-5 bg-[#1A1114] border-b-2 border-[#3E2529] flex items-center justify-center scanlines h-48 relative overflow-hidden shadow-[inset_0_0_40px_rgba(224,27,34,0.06)]">
                    {event.is_flagship && (
                      <span className="absolute top-3 right-3 px-2.5 py-0.5 text-[10px] font-mono font-bold bg-[#E01B22] text-[#F7F2F2] rounded-[2px] animate-pulse-glow z-10">
                        ★ FLAGSHIP
                      </span>
                    )}
                    <img
                      src={event.guardian_asset || '/assets/login.png'}
                      alt={`${detail.guardianName} Guardian`}
                      className="max-h-36 w-auto object-contain animate-float-slow drop-shadow-[0_0_20px_rgba(224,27,34,0.2)]"
                    />
                  </div>

                  {/* Clean Card Body Format */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h2 className="text-xl font-display font-bold text-[#F7F2F2] hover:text-[#E01B22] transition-colors leading-tight">
                        {event.name}
                      </h2>

                      <div className="text-xs font-mono font-semibold text-[#FF2A2A] mt-1">
                        {event.category === 'FLAGSHIP' ? 'Flagship Event' : event.is_online ? 'Online Event' : (event.category === 'TECHNICAL' ? 'Technical' : 'Non-Technical')} • {(event.team_type === 'TEAM' || event.max_team_size > 1) ? `${event.min_team_size || 2}${event.max_team_size > (event.min_team_size || 1) ? `–${event.max_team_size}` : ''} Members` : 'Individual'} • {detail.durationText}
                      </div>

                      <p className="text-xs text-[#A79798] leading-relaxed mt-3 line-clamp-3">
                        {event.description || detail.shortDesc}
                      </p>

                      {detail.skills && detail.skills.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-[#2A1A1D]/60 flex flex-wrap gap-1.5">
                          {detail.skills.map((skill, sIdx) => (
                            <span key={sIdx} className="px-2 py-0.5 text-[10px] font-mono bg-[#1A1114] text-[#F7F2F2]/80 border border-[#3E2529] rounded-[2px]">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-[#2A1A1D] flex items-center justify-between gap-2 mt-auto">
                      <button
                        onClick={() => navigate(`/events/${(event as any).slug}`)}
                        className="px-3.5 py-2 text-xs font-mono font-semibold border border-[#2A1A1D] hover:border-[#A79798] text-[#A79798] hover:text-[#F7F2F2] rounded-[2px] transition-colors"
                      >
                        View Details
                      </button>

                      {user?.role === 'admin' || user?.role === 'coordinator' ? (
                        <button
                          onClick={() => navigate(user?.role === 'coordinator' ? '/coordinator' : '/admin')}
                          className="px-3.5 py-2 bg-[#1A1114] border border-[#3E2529] hover:border-[#E08A17] text-[#E08A17] hover:text-[#F7F2F2] font-mono text-xs font-bold uppercase rounded-[2px] transition-colors"
                        >
                          Manage Event
                        </button>
                      ) : event.is_flagship ? (
                        <span className="px-3.5 py-2 bg-[#1A1114] border border-[#E01B22] text-[#E01B22] font-mono text-xs font-bold rounded-[2px]">
                          Invite-Only
                        </span>
                      ) : event.status !== 'open' ? (
                        <span className="px-4 py-2 bg-[#130C0E] border border-[#2A1A1D] text-[#A79798] font-mono text-xs font-bold uppercase rounded-[2px] cursor-not-allowed">
                          Registration Filled
                        </span>
                      ) : !isAuthenticated ? (
                        <button
                          onClick={() => navigate('/login')}
                          className="px-4 py-2 bg-[#E01B22] hover:bg-[#FF2A2A] text-[#F7F2F2] font-mono text-xs font-bold uppercase rounded-[2px] transition-colors shadow-md"
                        >
                          Register Now
                        </button>
                      ) : isRegistered ? (
                        <span className="chip-registered px-3.5 py-2 flex items-center gap-1 text-xs font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Registered ✓
                        </span>
                      ) : (
                        <button
                          onClick={() => navigate(`/events/${(event as any).slug}`)}
                          className="px-4 py-2 bg-[#E01B22] hover:bg-[#FF2A2A] text-[#F7F2F2] font-mono text-xs font-bold uppercase rounded-[2px] transition-colors shadow-md"
                        >
                          Register Now
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ── EVENT TIMELINE EMBEDDED IN EVENTS ROUTE ── */}
      <div className="mt-20">
        <TimelineSection />
      </div>

    </div>
  );
};

export default EventsPage;
