import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { Trophy, Users, Search, CheckCircle2, XCircle, Lock, Unlock, Save, RefreshCw, AlertCircle, QrCode, Maximize2 } from 'lucide-react';
import { SafeQRCode } from '../components/common/SafeQRCode';

export const CoordinatorPage: React.FC = () => {
  const { section } = useParams<{ section?: string }>();
  
  type CoordSection = 'OVERVIEW' | 'EVENTS' | 'ATTENDANCE' | 'REGISTRATIONS' | 'PAYMENTS';
  const getSection = (s?: string): CoordSection => {
    switch(s) {
      case 'events': return 'EVENTS';
      case 'attendance': return 'ATTENDANCE';
      case 'registrations': return 'REGISTRATIONS';
      case 'payments': return 'PAYMENTS';
      default: return 'OVERVIEW';
    }
  };
  const activeSection = getSection(section);

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<any[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT'>('ALL');

  // Results state
  const [firstPlace, setFirstPlace] = useState('');
  const [secondPlace, setSecondPlace] = useState('');
  const [thirdPlace, setThirdPlace] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [resultsMessage, setResultsMessage] = useState<string | null>(null);
  const [resultsError, setResultsError] = useState<string | null>(null);
  const [showFullQR, setShowFullQR] = useState(false);

  // 1. Fetch Events & Global Data based on section
  useEffect(() => {
    const fetchGlobalData = async () => {
      setLoading(true);
      try {
        const [eventsRes, regsRes, paymentsRes] = await Promise.allSettled([
          api.events.getAssigned(),
          activeSection === 'REGISTRATIONS' || activeSection === 'OVERVIEW' ? api.events.getAll() : Promise.resolve({ data: [] }),
          activeSection === 'PAYMENTS' || activeSection === 'OVERVIEW' ? api.payments.getAll() : Promise.resolve({ data: [] })
        ]);

        if (eventsRes.status === 'fulfilled' && Array.isArray(eventsRes.value.data)) {
          setEvents(eventsRes.value.data);
          if (eventsRes.value.data.length > 0 && !selectedEventId) {
            setSelectedEventId(eventsRes.value.data[0].id);
          }
        }
        
        if (regsRes.status === 'fulfilled' && Array.isArray(regsRes.value.data)) {
          // If we fetched all events, now we fetch registrations for each to build the total view
          const allEvts = regsRes.value.data;
          const regPromises = allEvts.map(async (e: any) => {
            const r = await api.registrations.getEventRegistrations(e.id);
            return { eventName: e.name, registrations: r.data || [] };
          });
          const allRegs = await Promise.all(regPromises);
          setAllRegistrations(allRegs);
        }

        if (paymentsRes.status === 'fulfilled' && Array.isArray(paymentsRes.value.data)) {
          setAllPayments(paymentsRes.value.data);
        }

      } catch (err) {
        console.error('Failed to load coordinator data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalData();
  }, [activeSection]);

  // 2. Fetch Roster & Results whenever selected event changes
  useEffect(() => {
    if (!selectedEventId) return;

    const fetchEventData = async () => {
      setRosterLoading(true);
      try {
        const [rosterRes, resultRes] = await Promise.allSettled([
          api.registrations.getEventRegistrations(selectedEventId),
          api.results.getEventResult(selectedEventId),
        ]);

        if (rosterRes.status === 'fulfilled' && Array.isArray(rosterRes.value.data)) {
          setRoster(rosterRes.value.data);
        } else {
          setRoster([]);
        }

        if (resultRes.status === 'fulfilled' && resultRes.value.data) {
          setFirstPlace(resultRes.value.data.first_place || '');
          setSecondPlace(resultRes.value.data.second_place || '');
          setThirdPlace(resultRes.value.data.third_place || '');
          setIsLocked(resultRes.value.data.is_locked || false);
        } else {
          setFirstPlace('');
          setSecondPlace('');
          setThirdPlace('');
          setIsLocked(false);
        }
      } catch (err) {
        console.error('Error loading event data:', err);
      } finally {
        setRosterLoading(false);
      }
    };

    fetchEventData();
  }, [selectedEventId]);

  const handleMarkAttendance = async (studentId: number, currentStatus: string) => {
    if (!selectedEventId) return;
    const newStatus = currentStatus === 'PRESENT' ? 'ABSENT' : 'PRESENT';

    try {
      await api.attendance.mark({
        event_id: selectedEventId,
        student_id: studentId,
        status: newStatus,
      });

      setRoster((prev) =>
        prev.map((item) =>
          item.user_id === studentId || item.user?.id === studentId
            ? { ...item, attendance_status: newStatus }
            : item
        )
      );
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update attendance status.');
    }
  };

  const handleSaveResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;
    setResultsMessage(null);
    setResultsError(null);

    try {
      await api.results.saveEventResult(selectedEventId, {
        first_place: firstPlace,
        second_place: secondPlace,
        third_place: thirdPlace,
        is_locked: isLocked,
      });

      setResultsMessage('Winners and competition results saved successfully!');
      setTimeout(() => setResultsMessage(null), 4000);
    } catch (err: any) {
      setResultsError(err.response?.data?.message || 'Failed to save results.');
      setTimeout(() => setResultsError(null), 4000);
    }
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  // Filter roster by search & attendance
  const filteredRoster = roster.filter((r) => {
    const matchesSearch =
      !search ||
      (r.user?.name && r.user.name.toLowerCase().includes(search.toLowerCase())) ||
      (r.user?.student_id_code && r.user.student_id_code.toLowerCase().includes(search.toLowerCase())) ||
      (r.user?.college_name && r.user.college_name.toLowerCase().includes(search.toLowerCase())) ||
      (r.team_name && r.team_name.toLowerCase().includes(search.toLowerCase()));

    const status = r.attendance_status || 'ABSENT';
    const matchesFilter =
      attendanceFilter === 'ALL' ||
      (attendanceFilter === 'PRESENT' && status === 'PRESENT') ||
      (attendanceFilter === 'ABSENT' && status !== 'PRESENT');

    return matchesSearch && matchesFilter;
  });

  const totalRegistered = roster.length;
  const presentCount = roster.filter((r) => r.attendance_status === 'PRESENT').length;
  const absentCount = totalRegistered - presentCount;
  const attendanceRate = totalRegistered > 0 ? Math.round((presentCount / totalRegistered) * 100) : 0;

  return (
    <div className="space-y-8 text-[#F7F2F2]">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#2A1A1D] pb-4">
        <div>
          <span className="text-[10px] font-mono text-[#E08A17] uppercase tracking-widest">COORDINATOR COMMAND HUB</span>
          <h1 className="text-xl font-display font-bold text-[#F7F2F2] mt-1">
            {activeSection === 'OVERVIEW' && 'Coordinator Overview'}
            {activeSection === 'EVENTS' && 'My Assigned Events'}
            {activeSection === 'ATTENDANCE' && 'Attendance & Results'}
            {activeSection === 'REGISTRATIONS' && 'Global Registrations'}
            {activeSection === 'PAYMENTS' && 'Payment Tracking'}
          </h1>
        </div>
      </div>

      {/* ── OVERVIEW SECTION ── */}
      {activeSection === 'OVERVIEW' && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#130C0E] border border-[#2A1A1D] p-5 rounded-[2px]">
              <p className="text-[10px] font-mono text-[#A79798] uppercase">Assigned Events</p>
              <p className="text-3xl font-display font-bold text-[#F7F2F2] mt-2">{events.length}</p>
            </div>
            <div className="bg-[#130C0E] border border-[#2A1A1D] p-5 rounded-[2px]">
              <p className="text-[10px] font-mono text-[#A79798] uppercase">Global Registrations</p>
              <p className="text-3xl font-display font-bold text-[#F7F2F2] mt-2">
                {allRegistrations.reduce((sum, e) => sum + e.registrations.length, 0)}
              </p>
            </div>
            <div className="bg-[#130C0E] border border-[#2A1A1D] p-5 rounded-[2px]">
              <p className="text-[10px] font-mono text-[#A79798] uppercase">Total Payments</p>
              <p className="text-3xl font-display font-bold text-[#F7F2F2] mt-2">{allPayments.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── EVENTS SECTION ── */}
      {activeSection === 'EVENTS' && (
        <div className="space-y-6 animate-fade-in-up">
          <h2 className="text-lg font-display font-bold text-[#F7F2F2]">My Assigned Events</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map(evt => (
              <div key={evt.id} className="bg-[#130C0E] border border-[#2A1A1D] p-5 rounded-[2px]">
                <h3 className="font-display font-bold text-white text-lg">{evt.name}</h3>
                <p className="text-xs font-mono text-[#E08A17] mt-1">{evt.category} • Day {evt.day}</p>
                <div className="mt-4 pt-4 border-t border-[#2A1A1D] flex justify-between items-center text-xs font-mono text-[#A79798]">
                  <span>Team Size: {evt.min_team_size}-{evt.max_team_size}</span>
                  <span>Fee: ₹{evt.fee}</span>
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="col-span-full p-8 text-center bg-[#130C0E] border border-[#2A1A1D] text-[#A79798] font-mono text-sm">
                No events assigned.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── REGISTRATIONS SECTION ── */}
      {activeSection === 'REGISTRATIONS' && (
        <div className="space-y-6 animate-fade-in-up">
          <h2 className="text-lg font-display font-bold text-[#F7F2F2]">Global Event Registrations</h2>
          {allRegistrations.map((evt, i) => (
            <div key={i} className="bg-[#130C0E] border border-[#2A1A1D] rounded-[2px] overflow-hidden">
              <div className="bg-[#1A1114] px-4 py-3 border-b border-[#2A1A1D] flex justify-between items-center">
                <h3 className="font-mono font-bold text-[#F7F2F2] text-sm">{evt.eventName}</h3>
                <span className="text-xs font-mono text-[#A79798]">{evt.registrations.length} registered</span>
              </div>
              <div className="p-4">
                {evt.registrations.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono whitespace-nowrap">
                      <thead className="text-[#A79798]">
                        <tr>
                          <th className="pb-2 font-normal">Student</th>
                          <th className="pb-2 font-normal">ID</th>
                          <th className="pb-2 font-normal">College</th>
                          <th className="pb-2 font-normal">Team</th>
                          <th className="pb-2 font-normal">Accommodation</th>
                          <th className="pb-2 font-normal">Payment</th>
                          <th className="pb-2 font-normal">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-[#F7F2F2]">
                        {evt.registrations.slice(0, 10).map((r: any, j: number) => (
                          <tr key={j} className="border-t border-[#2A1A1D]">
                            <td className="py-2">{r.student?.name || r.user?.name}</td>
                            <td className="py-2 text-[#A79798]">{r.student?.student_id_code || r.user?.student_id_code}</td>
                            <td className="py-2 truncate max-w-[150px]">{r.student?.college_name || r.user?.college_name}</td>
                            <td className="py-2">{r.team?.name || r.team_name || '-'}</td>
                            <td className="py-2 font-mono text-[#A79798]">
                              {r.student?.accommodation_required || r.user?.accommodation_required ? (
                                <span className="text-[#E01B22]">YES</span>
                              ) : 'NO'}
                            </td>
                            <td className="py-2 font-mono text-[#A79798]">
                              {(r.payment_status || 'NOT_SUBMITTED').toUpperCase()}
                            </td>
                            <td className="py-2">{r.attendance_status || (r.attended ? 'PRESENT' : 'ABSENT')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {evt.registrations.length > 10 && (
                      <div className="text-center pt-2 text-[#E08A17] text-[10px] mt-2 border-t border-[#2A1A1D]">
                        + {evt.registrations.length - 10} more
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs font-mono text-[#6B5A5C] text-center py-4">No registrations yet</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── PAYMENTS SECTION ── */}
      {activeSection === 'PAYMENTS' && (
        <div className="space-y-6 animate-fade-in-up">
          <h2 className="text-lg font-display font-bold text-[#F7F2F2]">Payment Tracking (Read-Only)</h2>
          <div className="bg-[#130C0E] border border-[#2A1A1D] rounded-[2px] overflow-x-auto">
            <table className="w-full text-left text-xs font-mono whitespace-nowrap">
              <thead className="bg-[#1A1114] text-[#A79798]">
                <tr>
                  <th className="px-4 py-3 font-normal">Date</th>
                  <th className="px-4 py-3 font-normal">Transaction ID</th>
                  <th className="px-4 py-3 font-normal">Student</th>
                  <th className="px-4 py-3 font-normal">ID</th>
                  <th className="px-4 py-3 font-normal">Amount</th>
                  <th className="px-4 py-3 font-normal">Status</th>
                </tr>
              </thead>
              <tbody className="text-[#F7F2F2] divide-y divide-[#2A1A1D]">
                {allPayments.map((p: any, i: number) => (
                  <tr key={i} className="hover:bg-[#1A1114]">
                    <td className="px-4 py-3 text-[#A79798]">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3">{p.transaction_reference}</td>
                    <td className="px-4 py-3">{p.student?.name || '-'}</td>
                    <td className="px-4 py-3 text-[#A79798]">{p.student?.student_id_code || '-'}</td>
                    <td className="px-4 py-3">₹{p.amount}</td>
                    <td className="px-4 py-3">
                      {p.status === 'VERIFIED' ? (
                        <span className="text-[#1FA971]">Verified</span>
                      ) : p.status === 'REJECTED' ? (
                        <span className="text-[#FF2A2A]">Rejected</span>
                      ) : (
                        <span className="text-[#E08A17]">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
                {allPayments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[#6B5A5C]">No payments found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ATTENDANCE & RESULTS SECTION ── */}
      {activeSection === 'ATTENDANCE' && (
        <div className="space-y-8 animate-fade-in-up">
          {/* Event Selector Dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full bg-[#130C0E] p-4 rounded-[2px] border border-[#2A1A1D]">
            <span className="text-xs font-mono text-[#A79798] uppercase tracking-widest shrink-0">Select Arena:</span>
            {loading ? (
              <div className="text-xs font-mono text-[#A79798] flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#E01B22]" /> Loading Arenas...
              </div>
            ) : events.length > 0 ? (
              <select
                value={selectedEventId || ''}
                onChange={(e) => setSelectedEventId(Number(e.target.value))}
                className="w-full sm:max-w-md bg-[#0A0607] border border-[#2A1A1D] text-[#F7F2F2] px-4 py-2 rounded-[2px] text-xs font-mono outline-none"
              >
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.name} ({evt.category} • Day {evt.day})
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-xs font-mono text-[#A79798]">No Events Available</div>
            )}
          </div>

          {/* Live Attendance QR Code Display Card */}
          {selectedEventId && (
            <div className="bg-[#130C0E] border border-[#E01B22]/60 p-6 rounded-[2px] shadow-[0_0_20px_rgba(224,27,34,0.15)] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="space-y-3 flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <QrCode className="w-5 h-5 text-[#E01B22] animate-pulse" />
                  <span className="text-xs font-mono font-bold text-[#E08A17] uppercase tracking-widest">
                    LIVE EVENT ATTENDANCE QR CODE
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-display font-bold text-[#F7F2F2]">
                  {selectedEvent?.name}
                </h2>
                <p className="text-xs font-mono text-[#A79798]">
                  Display this QR code on classroom display/projector. Participants can scan this QR code from their Participant Dashboard to automatically mark attendance.
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                  <div className="bg-[#0A0607] border border-[#2A1A1D] px-3 py-1.5 rounded-[2px] text-xs font-mono">
                    <span className="text-[#A79798]">PASSCODE / ID: </span>
                    <span className="text-[#E01B22] font-bold">LOGIN2K26-ATTENDANCE-EVT-{selectedEventId}</span>
                  </div>
                  <button
                    onClick={() => setShowFullQR(true)}
                    className="px-4 py-1.5 bg-[#E01B22] hover:bg-[#FF2A2A] text-[#F7F2F2] text-xs font-mono font-bold rounded-[2px] flex items-center gap-1.5 transition-colors"
                  >
                    <Maximize2 className="w-3.5 h-3.5" /> FULLSCREEN MODE
                  </button>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="bg-[#F7F2F2] p-4 rounded-[4px] shadow-xl shrink-0 flex flex-col items-center justify-center border-4 border-[#E01B22]">
                <SafeQRCode
                  value={`LOGIN2K26-ATTENDANCE-EVT-${selectedEventId}`}
                  size={160}
                  bgColor="#F7F2F2"
                  fgColor="#0A0607"
                />
                <span className="text-[10px] font-mono font-bold text-[#0A0607] mt-2 tracking-widest uppercase">
                  SCAN TO MARK PRESENT
                </span>
              </div>
            </div>
          )}

          {/* Fullscreen QR Modal */}
          {showFullQR && selectedEventId && (
            <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 space-y-6">
              <button
                onClick={() => setShowFullQR(false)}
                className="absolute top-6 right-6 px-4 py-2 bg-[#E01B22] text-white text-xs font-mono font-bold rounded-[2px]"
              >
                ✕ CLOSE FULLSCREEN
              </button>

              <div className="text-center space-y-2">
                <span className="text-sm font-mono text-[#E08A17] tracking-widest uppercase">PSG COLLEGE OF TECHNOLOGY • LOGIN 2K26</span>
                <h1 className="text-3xl md:text-5xl font-display font-bold text-white uppercase">{selectedEvent?.name}</h1>
                <p className="text-sm font-mono text-[#A79798]">Scan QR code on your mobile dashboard to mark attendance</p>
              </div>

              <div className="bg-white p-8 rounded-[8px] border-8 border-[#E01B22] shadow-[0_0_50px_rgba(224,27,34,0.5)]">
                <SafeQRCode
                  value={`LOGIN2K26-ATTENDANCE-EVT-${selectedEventId}`}
                  size={320}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                />
              </div>

              <div className="bg-[#130C0E] border border-[#2A1A1D] px-6 py-3 rounded-[2px] text-center font-mono text-sm">
                <span className="text-[#A79798]">EVENT CODE: </span>
                <span className="text-[#E08A17] font-bold">LOGIN2K26-ATTENDANCE-EVT-{selectedEventId}</span>
              </div>
            </div>
          )}

          {/* Telemetry Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#130C0E] border border-[#2A1A1D] p-4 rounded-[2px] space-y-1">
              <span className="mono-label block text-[10px]">SELECTED EVENT</span>
              <div className="font-display text-sm sm:text-base font-bold text-[#F7F2F2] truncate">
                {selectedEvent?.name || 'Select Arena'}
              </div>
            </div>

            <div className="bg-[#130C0E] border border-[#2A1A1D] p-4 rounded-[2px] space-y-1">
              <span className="mono-label block text-[10px]">TOTAL REGISTERED</span>
              <div className="font-mono text-xl sm:text-2xl font-bold text-[#F7F2F2]">
                {totalRegistered} <span className="text-xs text-[#A79798] font-normal">PARTICIPANTS</span>
              </div>
            </div>

            <div className="bg-[#130C0E] border border-[#2A1A1D] p-4 rounded-[2px] space-y-1">
              <span className="mono-label block text-[10px]">ATTENDANCE MARKED</span>
              <div className="font-mono text-xl sm:text-2xl font-bold text-[#1FA971]">
                {presentCount} <span className="text-xs text-[#A79798] font-normal">({attendanceRate}%)</span>
              </div>
            </div>

            <div className="bg-[#130C0E] border border-[#2A1A1D] p-4 rounded-[2px] space-y-1">
              <span className="mono-label block text-[10px]">ABSENT / PENDING</span>
              <div className="font-mono text-xl sm:text-2xl font-bold text-[#E08A17]">
                {absentCount} <span className="text-xs text-[#A79798] font-normal">LEFT</span>
              </div>
            </div>
          </div>

          {/* Attendance & Participant Roster */}
          <div className="bg-[#130C0E] border border-[#2A1A1D] p-5 sm:p-6 rounded-[2px] space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-[#2A1A1D] pb-5">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[#E01B22]" />
                <div>
                  <h2 className="text-base sm:text-lg font-display font-bold text-[#F7F2F2]">PARTICIPANT ROSTER &amp; ATTENDANCE</h2>
                  <p className="text-[11px] font-mono text-[#A79798]">Live attendance tracking for {selectedEvent?.name}</p>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <div className="flex items-center bg-[#0A0607] border border-[#2A1A1D] p-1 rounded-[2px] text-[11px] font-mono">
                  <button
                    onClick={() => setAttendanceFilter('ALL')}
                    className={`px-3 py-1 rounded-[2px] transition-colors ${
                      attendanceFilter === 'ALL' ? 'bg-[#E01B22] text-white font-bold' : 'text-[#A79798] hover:text-white'
                    }`}
                  >
                    ALL ({totalRegistered})
                  </button>
                  <button
                    onClick={() => setAttendanceFilter('PRESENT')}
                    className={`px-3 py-1 rounded-[2px] transition-colors ${
                      attendanceFilter === 'PRESENT' ? 'bg-[#1FA971] text-[#0A0607] font-bold' : 'text-[#A79798] hover:text-[#1FA971]'
                    }`}
                  >
                    PRESENT ({presentCount})
                  </button>
                  <button
                    onClick={() => setAttendanceFilter('ABSENT')}
                    className={`px-3 py-1 rounded-[2px] transition-colors ${
                      attendanceFilter === 'ABSENT' ? 'bg-[#4A050A] text-[#FF2A2A] font-bold' : 'text-[#A79798] hover:text-[#FF2A2A]'
                    }`}
                  >
                    ABSENT ({absentCount})
                  </button>
                </div>
                
                <div className="relative flex-1 lg:w-64">
                  <Search className="w-4 h-4 text-[#A79798] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search Participant/ID/College..."
                    className="w-full bg-[#0A0607] border border-[#2A1A1D] pl-9 pr-3 py-2 text-[11px] font-mono text-[#F7F2F2] rounded-[2px] outline-none"
                  />
                </div>
              </div>
            </div>

            {rosterLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-[#A79798] font-mono text-xs">
                <RefreshCw className="w-6 h-6 animate-spin text-[#E01B22]" />
                <span>Loading roster data...</span>
              </div>
            ) : filteredRoster.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredRoster.map((item) => {
                  const student = item.user || item.student;
                  const isPresent = item.attendance_status === 'PRESENT';
                  return (
                    <div
                      key={item.id}
                      className={`p-4 border rounded-[2px] flex flex-col justify-between transition-colors ${
                        isPresent
                          ? 'bg-[#1FA971]/5 border-[#1FA971]/30 hover:border-[#1FA971]/50'
                          : 'bg-[#0A0607] border-[#2A1A1D] hover:border-[#E01B22]/40'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h3 className="font-display font-bold text-sm text-[#F7F2F2] leading-tight break-words">
                            {student?.name || 'Unknown Student'}
                          </h3>
                          <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded-full ${
                            isPresent ? 'bg-[#1FA971] text-[#0A0607]' : 'bg-[#2A1A1D] text-[#A79798]'
                          }`}>
                            {isPresent ? 'PRESENT' : 'ABSENT'}
                          </span>
                        </div>
                        <div className="space-y-1 mb-4">
                          <p className="text-[10px] font-mono text-[#E08A17]">{student?.student_id_code || 'No ID'}</p>
                          <p className="text-[10px] font-mono text-[#A79798] truncate" title={student?.college_name}>
                            {student?.college_name || 'N/A'}
                          </p>
                          {item.team_name && (
                            <p className="text-[10px] font-mono text-[#F7F2F2] bg-[#1A1114] px-1.5 py-0.5 inline-block rounded-sm mt-1">
                              Team: {item.team_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleMarkAttendance(student?.id, item.attendance_status)}
                        className={`w-full py-2 flex items-center justify-center gap-2 text-[10px] font-mono font-bold uppercase rounded-[2px] transition-colors ${
                          isPresent
                            ? 'bg-[#1A1114] text-[#A79798] hover:text-[#FF2A2A]'
                            : 'bg-[#E01B22] text-[#F7F2F2] hover:bg-[#FF2A2A]'
                        }`}
                      >
                        {isPresent ? (
                          <><XCircle className="w-3.5 h-3.5" /> Mark Absent</>
                        ) : (
                          <><CheckCircle2 className="w-3.5 h-3.5" /> Mark Present</>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center text-center space-y-3">
                <AlertCircle className="w-8 h-8 mx-auto text-[#6B5A5C]" />
                <p className="text-sm font-mono text-[#A79798]">
                  {search ? `No participants matched search "${search}"` : 'No participants registered for this event yet.'}
                </p>
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="px-4 py-1.5 bg-[#1A1114] border border-[#2A1A1D] text-xs font-mono text-[#E01B22] rounded-[2px]"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Results & Winner Selection Section */}
          <div className="bg-[#130C0E] border border-[#2A1A1D] p-5 sm:p-6 rounded-[2px] space-y-6">
            <div className="flex items-center gap-3 border-b border-[#2A1A1D] pb-4">
              <Trophy className="w-5 h-5 text-[#E08A17]" />
              <div>
                <h2 className="text-base sm:text-lg font-display font-bold text-[#F7F2F2]">OFFICIAL EVENT RESULTS &amp; WINNERS</h2>
                <p className="text-[11px] font-mono text-[#A79798]">Declare podium finishers for {selectedEvent?.name}</p>
              </div>
            </div>

            {resultsMessage && (
              <div className="bg-[#1FA971]/20 border border-[#1FA971] p-3.5 rounded-[2px] text-xs text-[#1FA971] font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {resultsMessage}
              </div>
            )}

            {resultsError && (
              <div className="bg-[#4A050A] border border-[#E01B22] p-3.5 rounded-[2px] text-xs text-[#FF2A2A] font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {resultsError}
              </div>
            )}

            <form onSubmit={handleSaveResults} className="space-y-5 text-xs font-body">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-[#E08A17] mb-1.5 font-mono font-bold">🥇 1ST PLACE WINNER *</label>
                  <input
                    type="text"
                    value={firstPlace}
                    onChange={(e) => setFirstPlace(e.target.value)}
                    disabled={isLocked}
                    placeholder="Participant / Team Name"
                    className="w-full bg-[#0A0607] border border-[#2A1A1D] text-[#F7F2F2] p-3 rounded-[2px] outline-none disabled:opacity-50 font-mono input-glow"
                  />
                </div>

                <div>
                  <label className="block text-[#A79798] mb-1.5 font-mono font-bold">🥈 2ND PLACE WINNER</label>
                  <input
                    type="text"
                    value={secondPlace}
                    onChange={(e) => setSecondPlace(e.target.value)}
                    disabled={isLocked}
                    placeholder="Participant / Team Name"
                    className="w-full bg-[#0A0607] border border-[#2A1A1D] text-[#F7F2F2] p-3 rounded-[2px] outline-none disabled:opacity-50 font-mono input-glow"
                  />
                </div>

                <div>
                  <label className="block text-[#A79798] mb-1.5 font-mono font-bold">🥉 3RD PLACE WINNER</label>
                  <input
                    type="text"
                    value={thirdPlace}
                    onChange={(e) => setThirdPlace(e.target.value)}
                    disabled={isLocked}
                    placeholder="Participant / Team Name"
                    className="w-full bg-[#0A0607] border border-[#2A1A1D] text-[#F7F2F2] p-3 rounded-[2px] outline-none disabled:opacity-50 font-mono input-glow"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLocked(!isLocked)}
                  className={`px-4 py-2.5 rounded-[2px] font-mono text-xs font-bold flex items-center gap-2 border transition-all ${
                    isLocked
                      ? 'bg-[#4A050A] border-[#E01B22] text-[#FF2A2A]'
                      : 'bg-[#130C0E] border-[#2A1A1D] text-[#A79798] hover:text-white'
                  }`}
                >
                  {isLocked ? <Lock className="w-4 h-4 text-[#E01B22]" /> : <Unlock className="w-4 h-4" />}
                  {isLocked ? 'RESULTS LOCKED' : 'UNLOCKED FOR EDITING'}
                </button>

                <button
                  type="submit"
                  className="shimmer-btn px-6 py-2.5 bg-[#E01B22] hover:bg-[#FF2A2A] text-[#F7F2F2] font-mono text-xs font-bold uppercase rounded-[2px] flex items-center gap-2 shadow-lg"
                >
                  <Save className="w-4 h-4" /> SAVE RESULTS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
