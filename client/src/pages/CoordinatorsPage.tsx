import React from 'react';
import { CoordinatorsSection } from '../components/home/CoordinatorsSection';
import { GraduationCap, Phone } from 'lucide-react';

interface AdvisorCardProps {
  name: string;
  role: string;
  designation: string;
  node: string;
  phone?: string;
}

const getInitials = (name: string): string => {
  const clean = name.replace(/^(MR\.|MS\.|DR\.)\s+/i, '').replace(/[^A-Za-z\s]/g, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'FA';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const AdvisorCard: React.FC<AdvisorCardProps> = ({ name, role, designation, node, phone }) => {
  const initials = getInitials(name);

  return (
    <div className="border border-[#2A1A1D] bg-[#130C0E] p-5 rounded-[2px] relative overflow-hidden group hover:border-[#E01B22]/50 transition-all duration-300 shadow-xl hover:-translate-y-0.5">
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#E01B22]/40 group-hover:border-[#E01B22] transition-colors" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#E01B22]/40 group-hover:border-[#E01B22] transition-colors" />
      
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-[2px] border border-[#3E2529] bg-[#1A1013] flex items-center justify-center font-mono font-black text-sm text-[#E01B22] group-hover:border-[#E01B22]/60 group-hover:bg-[#E01B22]/10 transition-all shrink-0">
          {initials}
        </div>
        <div className="space-y-1 text-left min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] font-mono text-[#E01B22] font-black uppercase tracking-wider block">
              {node}
            </span>
            <GraduationCap className="w-3.5 h-3.5 text-[#A79798]" />
          </div>
          <h4 className="font-display font-black text-sm text-[#F7F2F2] group-hover:text-[#E01B22] transition-colors uppercase tracking-wide truncate">
            {name}
          </h4>
          <p className="text-[11px] font-mono text-[#E08A17] font-bold uppercase tracking-wide">
            {role}
          </p>
          <p className="text-[10px] font-mono text-[#A79798] tracking-wide pt-0.5">
            {designation}
          </p>
          {phone && (
            <p className="text-[10px] font-mono text-[#E01B22] tracking-wide pt-1 flex items-center gap-1.5 font-bold">
              <Phone className="w-3 h-3" /> {phone}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export const CoordinatorsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0A0607] pt-24 pb-16 relative overflow-hidden">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#130c0e_1px,transparent_1px),linear-gradient(to_bottom,#130c0e_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />

      {/* Render student coordinators section */}
      <CoordinatorsSection />

      {/* Faculty Advisor Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-12 space-y-10 relative z-10">
        
        {/* Section divider */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#2A1A1D]" />
          </div>
          <span className="relative px-4 bg-[#0A0607] font-mono text-[9px] text-[#A79798] tracking-[0.3em] uppercase">
            // ADVISORY NETWORKS NODES
          </span>
        </div>

        {/* Section Header */}
        <div className="text-center space-y-2 select-none max-w-2xl mx-auto">
          <span className="font-mono text-[10px] text-[#E01B22] font-black tracking-[0.3em] block uppercase">
            ✦ ACADEMIC ADVISORY
          </span>
          <h3 className="text-2xl sm:text-3xl font-display font-black text-[#F7F2F2] tracking-wider uppercase">
            FACULTY MANAGEMENT NODES
          </h3>
          <p className="text-xs text-[#A79798] font-mono tracking-wide">
            Head of Department and Faculty Advisors guiding LOGIN 2K26 operations.
          </p>
        </div>

        {/* Advisors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          <AdvisorCard 
            name="Dr. Ilayaraja N"
            role="Head of Department (i/c)"
            designation="Dept. of Computer Applications, PSG Tech"
            node="NODE // HOD"
            phone="9171432005"
          />
          <AdvisorCard 
            name="Ms. Kalyani A"
            role="Faculty Advisor"
            designation="Computer Applications Association, PSG Tech"
            node="NODE // ADV_01"
            phone="9944473831"
          />
          <AdvisorCard 
            name="Mr. Sundar C"
            role="Website Faculty Coordinator"
            designation="Dept. of Computer Applications, PSG Tech"
            node="NODE // WEB_01"
          />
          <AdvisorCard 
            name="Ms A Manoranjitham"
            role="Website Faculty Coordinator"
            designation="Dept. of Computer Applications, PSG Tech"
            node="NODE // WEB_02"
          />
        </div>

      </div>

    </div>
  );
};

export default CoordinatorsPage;
