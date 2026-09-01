import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Calendar, MapPin, Clock, Trash2, ClipboardList, QrCode } from 'lucide-react';
import { QrScannerModal } from '../../components/dashboard/QrScannerModal';

export const MyRegistrationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: async () => { const res = await api.registrations.getMyRegistrations(); return res.data || []; },
  });

  const cancelMutation = useMutation({
    mutationFn: async (regId: number) => await api.registrations.cancel(regId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-registrations'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#2A1A1D] pb-4">
        <div>
          <h1 className="text-xl font-display font-bold text-[#F7F2F2]">My Registrations</h1>
          <p className="text-xs text-[#6B5A5C] font-mono mt-1">{registrations.length} event{registrations.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button
          onClick={() => setIsQrModalOpen(true)}
          className="px-4 py-2 bg-[#1FA971] hover:bg-[#27C487] text-[#0A0607] font-mono text-xs font-bold uppercase rounded-[2px] flex items-center gap-2 shadow-md transition-colors"
        >
          <QrCode className="w-4 h-4" /> SCAN ATTENDANCE QR
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-xs font-mono text-[#6B5A5C]">Loading registrations...</div>
      ) : registrations.length === 0 ? (
        <div className="bg-[#130C0E] border border-[#2A1A1D] rounded-[2px] p-12 text-center space-y-3">
          <ClipboardList className="w-10 h-10 text-[#2A1A1D] mx-auto" />
          <p className="text-xs font-mono text-[#6B5A5C]">You haven't registered for any events yet.</p>
          <a href="/dashboard/events" className="inline-block text-xs font-mono text-[#E01B22] hover:text-[#FF2A2A]">Browse Events →</a>
        </div>
      ) : (
        <div className="bg-[#130C0E] border border-[#2A1A1D] rounded-[2px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-body">
              <thead className="bg-[#0A0607] text-[#6B5A5C] font-mono border-b border-[#3E2529]">
                <tr>
                  <th className="p-4">EVENT</th>
                  <th className="p-4">SCHEDULE</th>
                  <th className="p-4">TEAM</th>
                  <th className="p-4">VENUE</th>
                  <th className="p-4 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A1A1D]">
                {registrations.map((reg: any) => (
                  <tr key={reg.id} className="hover:bg-[#1A1114] transition-colors align-top">
                    <td className="p-4">
                      <p className="font-bold text-[#F7F2F2]">{reg.event?.name || `Event #${reg.event_id}`}</p>
                      <span className={`inline-block mt-1 px-1.5 py-0.5 text-[8px] font-mono font-bold rounded-[2px] ${
                        reg.event?.category === 'TECHNICAL' ? 'bg-[#6366F1]/15 text-[#818CF8]' : 'bg-[#E08A17]/15 text-[#E08A17]'
                      }`}>
                        {reg.event?.category || 'EVENT'}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[#A79798]">
                      <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />{(Number(reg.event?.day) === 2 || Number(reg.event?.day) === 19 || Number(reg.event?.day) === 15) ? 'Day 2' : 'Day 1'}</div>
                      <div className="flex items-center gap-1.5 mt-1"><Clock className="w-3 h-3" />{reg.event?.start_time?.slice(0, 5)} – {reg.event?.end_time?.slice(0, 5)}</div>
                    </td>
                    <td className="p-4 font-mono">
                      {reg.team_name ? (
                        <div>
                          <span className="text-[#E08A17] font-bold">{reg.team_name}</span>
                          {Array.isArray(reg.team_members) && reg.team_members.length > 0 && (
                            <div className="space-y-0.5 mt-1 text-[10px] text-[#A79798]">
                              {reg.team_members.map((m: any, i: number) => (
                                <div key={i} className="flex items-center gap-1">
                                  <span className={m.status === 'pending' ? 'text-[#E08A17]' : 'text-[#1FA971]'}>
                                    {m.status === 'pending' ? '•' : '✓'}
                                  </span>
                                  {m.name || m.email || 'Unknown'}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#6B5A5C]">—</span>
                      )}
                    </td>
                    <td className="p-4 text-[#A79798]">
                      <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{reg.event?.venue || 'TBA'}</div>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => { if (confirm('Cancel this registration?')) cancelMutation.mutate(reg.id); }}
                        className="text-[#6B5A5C] hover:text-[#FF2A2A] p-1.5 transition-colors rounded-[2px] hover:bg-[#4A050A]/30"
                        title="Cancel Registration"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <QrScannerModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} />
    </div>
  );
};
