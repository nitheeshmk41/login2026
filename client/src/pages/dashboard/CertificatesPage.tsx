import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Award, CheckCircle2, RefreshCw, Lock } from 'lucide-react';

export const CertificatesPage: React.FC = () => {
  const { user } = useAuthStore();

  // Fetch participant registrations
  const { data: regData, isLoading } = useQuery({
    queryKey: ['my-registrations-certs'],
    queryFn: async () => {
      const res = await api.registrations.getMyRegistrations();
      return res.data;
    },
  });

  const registrations = Array.isArray(regData) ? regData : [];

  return (
    <div className="space-y-8 text-[#F7F2F2]">
      {/* Header */}
      <div className="border-b border-[#2A1A1D] pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono text-[#E01B22] uppercase tracking-widest">DIGITAL CREDENTIALS</span>
          <h1 className="text-xl font-display font-bold text-[#F7F2F2] mt-1">E-Certificates Roster</h1>
        </div>
        <div className="text-xs font-mono text-[#A79798]">
          PARTICIPANT: <span className="text-[#F7F2F2] font-bold">{user?.name}</span>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-[#1A0306] border border-[#E01B22] p-4 rounded-[2px] flex items-center gap-3 text-xs font-mono text-[#F7F2F2]">
        <Lock className="w-5 h-5 text-[#E01B22] shrink-0" />
        <div>
          <span className="font-bold text-[#E01B22]">E-CERTIFICATES LOCKED:</span> Official digitally verified certificates of participation will be unlocked after the symposium concludes, based on verified attendance records for each competition arena.
        </div>
      </div>

      {/* Certificates Grid */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-[#A79798] font-mono text-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-[#E01B22]" />
          <span>Fetching your certificates...</span>
        </div>
      ) : registrations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {registrations.map((item: any, i: number) => {
            const eventName = item.event?.name || item.event_name || 'Event';
            const category = item.event?.category || 'CYBER ARENA';
            const isAttended = item.attendance_status === 'PRESENT' || item.attended || item.status === 'CONFIRMED';

            return (
              <div
                key={item.id || i}
                className="bg-[#130C0E] border border-[#2A1A1D] hover:border-[#3E2529] p-6 rounded-[2px] relative overflow-hidden flex flex-col justify-between group transition-all"
              >
                {/* Cyber Watermark Accent */}
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                  <Award className="w-32 h-32 text-[#E01B22]" />
                </div>

                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#E08A17] bg-[#E08A17]/10 px-2 py-0.5 border border-[#E08A17]/30 rounded-sm">
                      {category}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm flex items-center gap-1 ${
                      isAttended ? 'bg-[#1FA971]/20 text-[#1FA971] border border-[#1FA971]/40' : 'bg-[#E08A17]/20 text-[#E08A17] border border-[#E08A17]/40'
                    }`}>
                      <CheckCircle2 className="w-3 h-3" /> {isAttended ? 'VERIFIED ATTENDANCE' : 'REGISTERED'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-display font-bold text-[#F7F2F2] uppercase group-hover:text-[#E01B22] transition-colors">
                      {eventName}
                    </h3>
                    <p className="text-xs font-mono text-[#A79798] mt-1">
                      LOGIN 2K26 National Cyber Symposium • PSG College of Technology
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-6 mt-6 border-t border-[#2A1A1D] flex flex-wrap items-center gap-2 relative z-10">
                  <button
                    disabled
                    className="w-full py-2.5 bg-[#1A1114] border border-[#2A1A1D] text-[#6B5A5C] font-mono text-xs font-bold uppercase rounded-[2px] flex items-center justify-center gap-2 cursor-not-allowed opacity-80"
                  >
                    <Lock className="w-4 h-4 text-[#E01B22]" /> DOWNLOAD UNLOCKS POST-EVENT
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center space-y-4 bg-[#130C0E] border border-[#2A1A1D] rounded-[2px] p-8">
          <Award className="w-12 h-12 text-[#6B5A5C] mx-auto" />
          <h3 className="text-base font-display font-bold text-[#F7F2F2]">NO EVENT REGISTRATIONS FOUND</h3>
          <p className="text-xs font-mono text-[#A79798] max-w-md mx-auto">
            Register and participate in LOGIN 2K26 symposium events to earn official verified digital certificates.
          </p>
        </div>
      )}
    </div>
  );
};
