import React from 'react';
import { ShieldCheck, Code, ExternalLink } from 'lucide-react';

interface CoordinatorsSectionProps {
  isHomePage?: boolean;
}

const getInitials = (name: string): string => {
  const clean = name.replace(/^(MR\.|MS\.|DR\.)\s+/i, '').replace(/[^A-Za-z\s]/g, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CO';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const CoordinatorsSection: React.FC<CoordinatorsSectionProps> = ({ isHomePage = false }) => {
  const websiteTeam = [
    { name: 'NITHEESH MUTHU KRISHNAN C', role: 'FULL STACK DEVELOPER', url: 'https://www.linkedin.com/in/nitheeshmk5/' },
    { name: 'CHINNAYA K', role: 'FRONTEND DEVELOPER', url: 'https://www.linkedin.com/search/results/all/?keywords=CHINNAYA%20K' },
    { name: 'TAMILINI S', role: 'UI/UX & FRONTEND', url: 'https://www.linkedin.com/search/results/all/?keywords=TAMILINI%20S' },
    { name: 'BARATHVIKRAMAN S K', role: 'BACKEND & LOGISTICS', url: 'https://www.linkedin.com/search/results/all/?keywords=BARATHVIKRAMAN%20S%20K' },
    { name: 'SABARISH', role: 'DEVELOPER', url: 'https://www.linkedin.com/search/results/all/?keywords=SABARISH' },
    { name: 'KARTHEESVARAN', role: 'DEVELOPER', url: 'https://www.linkedin.com/search/results/all/?keywords=KARTHEESVARAN' }
  ];

  const allGroups = [
    {
      title: 'CORE LEADERSHIP',
      tagline: 'Key executive team steering the overall vision and symposium operations.',
      isCore: true,
      items: [
        { role: 'TREASURER', name: 'SWARNA RATHNA A' },
        { role: 'SECRETARY', name: 'BARATHVIKRAMAN S K', highlight: true },
        { role: 'PLACEMENT REPRESENTATIVE', name: 'TINO BRITTY J' }
      ]
    },
    {
      title: 'EXECUTIVE COORDINATORS',
      tagline: 'Managing event operations, technical tracks, and delegate coordination.',
      isCore: false,
      items: [
        { role: 'EXECUTIVE COORDINATOR', name: 'STEPHINA SMILY C' },
        { role: 'EXECUTIVE COORDINATOR', name: 'ARAVINDH KANNAN M S' },
        { role: 'EXECUTIVE COORDINATOR', name: 'MUGUNDHAN K P' }
      ]
    },
    {
      title: 'DEPARTMENT COORDINATORS',
      tagline: 'Leading alumni relations, technical tracks, PR, and student development.',
      isCore: false,
      items: [
        { role: 'ALUMNI COORDINATOR', name: 'SAKTHIVEL MALLAIAH R G A' },
        { role: 'TECHNICAL COORDINATOR', name: 'TAMILINI S' },
        { role: 'PUBLIC RELATIONS', name: 'GAYATHRI S' },
        { role: 'STUDENT DEVELOPMENT', name: 'DEEPIKAA B S' }
      ]
    },
    {
      title: 'EXECUTIVE MEMBERS',
      tagline: 'Key operational delegates executing campus logistics and event execution.',
      isCore: false,
      items: [
        { role: 'EXECUTIVE MEMBER', name: 'NITHEESH MUTHU KRISHNAN C' },
        { role: 'EXECUTIVE MEMBER', name: 'SURIYA G V' },
        { role: 'EXECUTIVE MEMBER', name: 'DIVYADHARSHINI K' }
      ]
    },
    {
      title: 'FACULTY COORDINATORS',
      tagline: 'Department faculty mentors guiding LOGIN 2K26.',
      isCore: false,
      items: [
        { role: 'FACULTY COORDINATOR', name: 'MR. SUNDAR C' },
        { role: 'FACULTY COORDINATOR', name: 'MS A MANORANJITHAM' }
      ]
    },
    {
      title: 'VERTICAL COORDINATORS',
      tagline: 'Vertical domain specialists ensuring arena-specific excellence.',
      isCore: false,
      items: [
        { role: 'VERTICAL COORDINATOR', name: 'SAMPLE NAME 1' },
        { role: 'VERTICAL COORDINATOR', name: 'SAMPLE NAME 2' }
      ]
    },
    {
      title: 'EVENTS COORDINATORS',
      tagline: 'On-ground organizers for competitive event arenas.',
      isCore: false,
      items: [
        { role: 'EVENT COORDINATOR', name: 'SAMPLE NAME 3' },
        { role: 'EVENT COORDINATOR', name: 'SAMPLE NAME 4' }
      ]
    },
    {
      title: 'VOLUNTEERS LIST',
      tagline: 'Dedicated student team supporting symposium operations.',
      isCore: false,
      items: [
        { role: 'VOLUNTEER', name: 'SAMPLE NAME 5' },
        { role: 'VOLUNTEER', name: 'SAMPLE NAME 6' },
        { role: 'VOLUNTEER', name: 'SAMPLE NAME 7' }
      ]
    }
  ];

  const displayGroups = isHomePage
    ? allGroups.filter(
        (g) =>
          g.title !== 'VERTICAL COORDINATORS' &&
          g.title !== 'EVENTS COORDINATORS' &&
          g.title !== 'VOLUNTEERS LIST'
      )
    : allGroups;

  return (
    <section id="coordinators-section" className="py-16 sm:py-24 px-4 sm:px-6 bg-[#0A0607] border-b border-[#2A1A1D] relative overflow-hidden">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#130c0e_1px,transparent_1px),linear-gradient(to_bottom,#130c0e_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[radial-gradient(circle,_rgba(224,27,34,0.06)_0%,_transparent_75%)] pointer-events-none filter blur-3xl z-0" />

      <div className="max-w-6xl mx-auto space-y-14 relative z-10">

        {/* Main Section Header */}
        <div className="text-center space-y-3 select-none max-w-2xl mx-auto">
          <span className="font-mono text-[10px] text-[#E01B22] font-black tracking-[0.3em] uppercase block">
            ✦ LEADERSHIP PROFILE • LOGIN 2K26
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-black text-[#F7F2F2] tracking-wider uppercase">
            SYMPOSIUM COORDINATORS
          </h2>
          <p className="text-xs sm:text-sm text-[#A79798] font-mono tracking-wide leading-relaxed">
            The student committee, vertical leads, and faculty advisors behind the 35th grand edition.
          </p>
        </div>

        {/* Optional Team Photo on Home */}
        {isHomePage && (
          <div className="relative max-w-5xl mx-auto w-full overflow-hidden bg-[#130C0E] border border-[#2A1A1D] hover:border-[#E01B22]/40 rounded-[2px] shadow-2xl transition-colors duration-300 group">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#E01B22]/60 z-20" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#E01B22]/60 z-20" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#E01B22]/60 z-20" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#E01B22]/60 z-20" />

            <div className="absolute top-3 left-4 text-[9px] font-mono text-[#E01B22] z-20 font-bold">
              // TEAM ARCHIVE • MCA DEPT
            </div>

            <img
              src="/coords.webp"
              alt="Department Coordinators"
              className="w-full max-h-[480px] object-cover object-top relative z-10 filter contrast-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/coords_bold.webp';
              }}
            />
          </div>
        )}

        {/* Group Sections */}
        <div className="space-y-12">
          {displayGroups.map((group) => {
            return (
              <div key={group.title} className="space-y-4">
                {/* Clean Subheading with Divider */}
                <div className="border-b border-[#2A1A1D] pb-2 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <div className="flex items-center gap-2">
                    {group.isCore ? (
                      <span className="text-[#E01B22] font-mono font-black text-sm">◇</span>
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-[#E01B22]" />
                    )}
                    <h3 className={`font-display font-black text-lg sm:text-xl tracking-wider uppercase ${
                      group.isCore ? 'text-[#F7F2F2] drop-shadow-[0_0_10px_rgba(224,27,34,0.3)]' : 'text-[#F7F2F2]'
                    }`}>
                      {group.title}
                    </h3>
                  </div>
                  {group.tagline && (
                    <span className="font-mono text-[11px] text-[#A79798]">
                      {group.tagline}
                    </span>
                  )}
                </div>

                {/* Clean Responsive Grid (1-col mobile, 2-col tablet, 3-col desktop) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.items.map((item) => {
                    const avatarInitials = getInitials(item.name);
                    const isCoreCard = group.isCore;

                    return (
                      <div
                        key={`${group.title}-${item.name}`}
                        className={`group relative p-4 rounded-[2px] border transition-all duration-300 flex items-center gap-3.5 ${
                          isCoreCard
                            ? 'bg-gradient-to-r from-[#1A0A0C] via-[#130C0E] to-[#1A0A0C] border-[#E01B22]/60 hover:border-[#E01B22] shadow-[0_0_20px_rgba(224,27,34,0.15)] hover:shadow-[0_0_30px_rgba(224,27,34,0.3)] hover:-translate-y-1'
                            : 'bg-[#130C0E] border-[#2A1A1D] hover:border-[#E01B22]/50 hover:-translate-y-0.5 shadow-lg'
                        }`}
                      >
                        {/* High-End Cyber Initial Badge */}
                        <div className={`w-11 h-11 shrink-0 rounded-[2px] flex items-center justify-center font-mono font-black text-xs tracking-wider transition-all duration-300 ${
                          isCoreCard
                            ? 'bg-[#E01B22] text-[#F7F2F2] shadow-[0_0_12px_rgba(224,27,34,0.5)] border border-[#FF2A2A]'
                            : 'bg-[#1A1013] text-[#E01B22] border border-[#3E2529] group-hover:border-[#E01B22]/50 group-hover:bg-[#E01B22]/10'
                        }`}>
                          {avatarInitials}
                        </div>

                        {/* Person Name & Role Hierarchy */}
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <h4 className="font-display font-black text-xs sm:text-sm text-[#F7F2F2] group-hover:text-[#E01B22] transition-colors uppercase tracking-wide truncate">
                            {item.name}
                          </h4>
                          <div className={`font-mono text-[10px] font-bold tracking-wider uppercase ${
                            isCoreCard ? 'text-[#E08A17]' : 'text-[#A79798]'
                          }`}>
                            {item.role}
                          </div>
                        </div>

                        {/* Core Leadership Indicator */}
                        {isCoreCard && (
                          <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#E01B22] animate-pulse" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Website Developers Section */}
        <div className="pt-6 space-y-4">
          <div className="border-b border-[#2A1A1D] pb-2 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-[#E08A17]" />
              <h3 className="font-display font-black text-lg sm:text-xl text-[#F7F2F2] tracking-wider uppercase">
                WEBSITE DEVELOPMENT TEAM
              </h3>
            </div>
            <span className="font-mono text-[11px] text-[#A79798]">
              Designers and full-stack engineers behind the LOGIN 2K26 digital platform.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {websiteTeam.map((member) => {
              const initials = getInitials(member.name);
              return (
                <div
                  key={member.name}
                  className="group bg-[#130C0E] border border-[#2A1A1D] hover:border-[#E01B22]/50 rounded-[2px] p-4 flex items-center justify-between gap-3 shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 shrink-0 rounded-[2px] bg-[#1A1013] border border-[#3E2529] group-hover:border-[#E08A17]/60 flex items-center justify-center font-mono font-black text-xs text-[#E08A17]">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-display font-black text-xs text-[#F7F2F2] group-hover:text-[#E08A17] transition-colors uppercase tracking-wide truncate">
                        {member.name}
                      </h4>
                      <span className="font-mono text-[9px] text-[#A79798] font-bold block uppercase">
                        {member.role}
                      </span>
                    </div>
                  </div>

                  <a
                    href={member.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-[2px] bg-[#1A1013] border border-[#3E2529] text-[#A79798] hover:text-white hover:bg-[#E01B22] hover:border-[#E01B22] transition-colors shrink-0"
                    title="View Profile"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};

export default CoordinatorsSection;
