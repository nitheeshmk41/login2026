import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { ENV } from '../services/env';
import { Plus, Trash2, Download, Search, ShieldAlert, Radio, Trophy, Pencil, Upload, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const AdminPage: React.FC = () => {
  const { section } = useParams<{ section?: string }>();
  const { user: currentUser } = useAuthStore();
  const isSuperAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'admin_power';

  type AdminTab = 'PAYMENTS' | 'REGISTRATIONS' | 'ALUMNI' | 'USERS' | 'DASHBOARD' | 'ANNOUNCEMENTS' | 'EVENTS' | 'CSV_UPLOAD' | 'SETTINGS';

  const sectionToTab = (s?: string): AdminTab => {
    switch (s) {
      case 'users': return 'USERS';
      case 'registrations': return 'REGISTRATIONS';
      case 'alumni': return 'ALUMNI';
      case 'payments': return 'PAYMENTS';
      case 'csv-upload': return 'CSV_UPLOAD';
      case 'events': return 'EVENTS';
      case 'announcements': return 'ANNOUNCEMENTS';
      case 'settings': return 'SETTINGS';
      default: return 'PAYMENTS';
    }
  };

  const [activeTab, setActiveTab] = useState<AdminTab>(sectionToTab(section));

  // Data states
  const [payments, setPayments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<any[]>([]);
  const [showWinnersSetting, setShowWinnersSetting] = useState<boolean>(false);
  const [updatingSetting, setUpdatingSetting] = useState<boolean>(false);

  // CSV Upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvResult, setCsvResult] = useState<{ matched: any[]; unmatched: any[]; total_rows: number } | null>(null);
  const [csvSelectedIds, setCsvSelectedIds] = useState<Set<number>>(new Set());
  const [csvBulkLoading, setCsvBulkLoading] = useState(false);
  const [csvBulkResult, setCsvBulkResult] = useState<string | null>(null);

  // Search & Filter States
  const [paymentSearch, setPaymentSearch] = useState('');
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('ALL');

  // Reject modal state
  const [rejectModalPaymentId, setRejectModalPaymentId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Announcement Form State
  const [newAnnoTitle, setNewAnnoTitle] = useState('');
  const [newAnnoMessage, setNewAnnoMessage] = useState('');
  const [newAnnoPriority, setNewAnnoPriority] = useState<'normal' | 'high' | 'urgent'>('normal');

  // Create User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserLoginId, setNewUserLoginId] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('event_coordinator');
  const [newUserEventId, setNewUserEventId] = useState('');
  const [newUserCollege, setNewUserCollege] = useState('PSG College of Technology');
  const [newUserDepartment, setNewUserDepartment] = useState('Computer Applications');
  const [creatingUser, setCreatingUser] = useState(false);

  // Edit User Modal State
  const [editModalUser, setEditModalUser] = useState<any>(null);

  const fetchData = async () => {
    try {
      const [payRes, userRes, annoRes, eventRes, settingsRes] = await Promise.all([
        api.payments.getAll(),
        api.users.getAll(),
        api.announcements.getActive(),
        api.events.getAll(),
        api.settings.get().catch(() => ({ data: { show_winners: 'false' } })),
      ]);

      if (Array.isArray(payRes.data)) setPayments(payRes.data);
      if (Array.isArray(userRes.data)) setUsers(userRes.data);
      if (Array.isArray(annoRes.data)) setAnnouncements(annoRes.data);
      if (settingsRes?.data) setShowWinnersSetting(settingsRes.data.show_winners === 'true');
      
      if (Array.isArray(eventRes.data)) {
        setEvents(eventRes.data);
        
        // Fetch all registrations across all events for event-wise analysis
        const regPromises = eventRes.data.map((evt: any) =>
          api.registrations.getEventRegistrations(evt.id).then((r) => ({
            eventId: evt.id,
            eventName: evt.name,
            registrations: Array.isArray(r.data) ? r.data : [],
          })).catch(() => ({ eventId: evt.id, eventName: evt.name, registrations: [] }))
        );
        const regResults = await Promise.all(regPromises);
        setAllRegistrations(regResults);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync sidebar nav → activeTab
  useEffect(() => {
    setActiveTab(sectionToTab(section));
  }, [section]);

  // CSV Upload handlers
  const handleCsvUpload = async () => {
    if (!csvFile) return;
    setCsvLoading(true);
    setCsvResult(null);
    setCsvBulkResult(null);
    try {
      const form = new FormData();
      form.append('csv', csvFile);
      const res = await api.payments.uploadCsv(form);
      setCsvResult(res.data);
      // Pre-select all matched pending payments
      const ids = new Set<number>(
        res.data.matched
          .filter((m: any) => m.current_status !== 'VERIFIED')
          .map((m: any) => m.payment_id)
      );
      setCsvSelectedIds(ids);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to process payment report');
    } finally {
      setCsvLoading(false);
    }
  };

  const toggleCsvSelect = (id: number) => {
    setCsvSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkVerify = async () => {
    if (csvSelectedIds.size === 0) return;
    setCsvBulkLoading(true);
    setCsvBulkResult(null);
    try {
      const res = await api.payments.bulkVerify(Array.from(csvSelectedIds));
      setCsvBulkResult(res.data.message);
      setCsvSelectedIds(new Set());
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Bulk verification failed');
    } finally {
      setCsvBulkLoading(false);
    }
  };

  // Handle Add New User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      alert('Please enter Name, Email, and Password.');
      return;
    }

    try {
      setCreatingUser(true);
      await api.users.create({
        name: newUserName.trim(),
        login_id: newUserLoginId.trim() || undefined,
        email: newUserEmail.trim(),
        phone: newUserPhone.trim() || '9876543210',
        password: newUserPassword,
        role: newUserRole,
        event_id: newUserRole === 'event_coordinator' ? Number(newUserEventId) : undefined,
        college_name: newUserCollege.trim(),
        department: newUserDepartment.trim(),
      });

      alert('User created and saved to database successfully!');
      setNewUserName('');
      setNewUserLoginId('');
      setNewUserEmail('');
      setNewUserPhone('');
      setNewUserPassword('');
      setNewUserEventId('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalUser) return;
    try {
      await api.users.updateDetails(editModalUser.id, {
        name: editModalUser.name,
        email: editModalUser.email,
        phone: editModalUser.phone,
        college: editModalUser.college,
        department: editModalUser.department,
        role: editModalUser.role,
      });
      setEditModalUser(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user.');
    }
  };

  // Reject Payment (Approve removed as requested — UTR submission automatically allows student to register)
  const handleRejectPayment = async () => {
    if (!rejectModalPaymentId || !rejectionReason.trim()) return;

    try {
      await api.payments.verify(rejectModalPaymentId, {
        status: 'REJECTED',
        rejection_reason: rejectionReason,
      });

      setRejectModalPaymentId(null);
      setRejectionReason('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject payment.');
    }
  };

  const handleVerifyPayment = async (paymentId: number) => {
    try {
      await api.payments.verify(paymentId, { status: 'VERIFIED' });
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to verify payment.');
    }
  };

  const handleRoleChange = async (userId: number, role: string) => {
    try {
      await api.users.updateRole(userId, role);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user role.');
    }
  };

  const editManagedUser = async (user: any) => {
    const name = window.prompt('Name:', user.name || '');
    if (name === null) return;
    const email = window.prompt('Email:', user.email || '');
    if (email === null) return;
    const phone = window.prompt('Phone:', user.phone || '');
    if (phone === null) return;
    const college_name = window.prompt('College:', user.college_name || '');
    if (college_name === null) return;
    const department = window.prompt('Department:', user.department || '');
    if (department === null) return;
    const roll_no = window.prompt('Roll number:', user.roll_no || '');
    if (roll_no === null) return;
    let alumniFields = {};
    if (user.user_type === 'ALUMNI') {
      const batch_year = window.prompt('Batch year:', user.batch_year || '');
      if (batch_year === null) return;
      const place = window.prompt('Place:', user.place || '');
      if (place === null) return;
      const current_organization = window.prompt('Current organization:', user.current_organization || '');
      if (current_organization === null) return;
      alumniFields = { batch_year, place, current_organization };
    }

    try {
      if (user.user_type === 'ALUMNI') {
        await api.alumni.update(user.id, { name: name.trim(), email: email.trim(), phone: phone.trim(), ...alumniFields });
      } else {
        await api.users.updateDetails(user.id, {
          name: name.trim(), email: email.trim(), phone: phone.trim(), college_name: college_name.trim(),
          department: department.trim(), roll_no: roll_no.trim(),
        });
      }
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user details.');
    }
  };

  const deleteManagedUser = async (user: any) => {
    if (!window.confirm(`Delete ${user.name || 'this user'} permanently?`)) return;

    try {
      await (user.user_type === 'ALUMNI' ? api.alumni.delete(user.id) : api.users.delete(user.id));
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnoTitle.trim() || !newAnnoMessage.trim()) return;

    try {
      await api.announcements.create({
        title: newAnnoTitle,
        message: newAnnoMessage,
        priority: newAnnoPriority,
      });

      alert('Announcement created and broadcasted to coordinators & admins!');
      setNewAnnoTitle('');
      setNewAnnoMessage('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create announcement.');
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    try {
      await api.announcements.delete(id);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete announcement.');
    }
  };

  const handleUpdateEvent = async (id: number, currentVenue: string, currentTime: string) => {
    const newVenue = prompt('Enter new venue (leave empty to keep current):', currentVenue);
    if (newVenue === null) return;
    
    const newTime = prompt('Enter new start time (e.g. 09:00:00) (leave empty to keep current):', currentTime);
    if (newTime === null) return;

    if (newVenue === currentVenue && newTime === currentTime) return;

    try {
      await api.events.update(id, {
        venue: newVenue || currentVenue,
        start_time: newTime || currentTime
      });
      alert('Event updated and emails dispatched to registered students!');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update event.');
    }
  };

  // CSV Export for Payments Queue
  const exportPaymentsCSV = () => {
    const headers = ['User Name', 'Email', 'Phone', 'College', 'UTR Reference', 'Status', 'Student ID', 'Created At'];
    const rows = payments.map((p) => [
      `"${p.student?.name || p.user?.name || 'Participant'}"`,
      `"${p.student?.email || p.user?.email || '-'}"`,
      `"${p.student?.phone || p.user?.phone || '-'}"`,
      `"${p.student?.college_name || p.user?.college_name || '-'}"`,
      `"${p.transaction_reference || '-'}"`,
      `"${p.status}"`,
      `"${p.student?.student_id_code || p.user?.student_id_code || '-'}"`,
      `"${p.createdAt ? new Date(p.createdAt).toLocaleString() : '-'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LOGIN_2K26_Payments_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Export for Event Registrations
  const exportEventRegistrationsCSV = () => {
    const headers = ['Event Name', 'Student Name', 'Student ID', 'Email', 'Phone', 'College', 'Department', 'Team Name', 'Attendance Status'];
    const rows: string[][] = [];

    allRegistrations.forEach((eventGroup) => {
      eventGroup.registrations.forEach((reg: any) => {
        rows.push([
          `"${eventGroup.eventName}"`,
          `"${reg.student?.name || reg.user?.name || 'Student'}"`,
          `"${reg.student?.student_id_code || reg.user?.student_id_code || '-'}"`,
          `"${reg.student?.email || reg.user?.email || '-'}"`,
          `"${reg.student?.phone || reg.user?.phone || '-'}"`,
          `"${reg.student?.college_name || reg.user?.college_name || '-'}"`,
          `"${reg.student?.department || reg.user?.department || '-'}"`,
          `"${reg.team?.name || reg.team_name || 'Solo'}"`,
          `"${reg.attendance_status || (reg.attended ? 'PRESENT' : 'REGISTERED')}"`,
        ]);
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LOGIN_2K26_Event_Registrations_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Lists
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const name = (p.student?.name || p.user?.name || '').toLowerCase();
      const email = (p.student?.email || p.user?.email || '').toLowerCase();
      const ref = (p.transaction_reference || '').toLowerCase();
      const s = paymentSearch.toLowerCase().trim();
      return name.includes(s) || email.includes(s) || ref.includes(s);
    });
  }, [payments, paymentSearch]);


  const alumniUsers = useMemo(() => {
    return users.filter((u) => u.user_type === 'ALUMNI');
  }, [users]);

  const exportAlumniCSV = async () => {
    try {
      const response = await api.exports.getAlumni();
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `LOGIN_2K26_Alumni_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to export alumni roster.');
    }
  };

  // Telemetry Calculations
  const totalStudents = users.filter((u) => u.role === 'student').length;
  const verifiedPaymentsCount = payments.filter((p) => p.status === 'VERIFIED').length;
  
  let totalEnrollments = 0;
  let totalAttended = 0;
  allRegistrations.forEach((eg) => {
    totalEnrollments += eg.registrations.length;
    totalAttended += eg.registrations.filter((r: any) => r.attended || r.attendance_status === 'PRESENT').length;
  });
  const overallAttendancePercentage = totalEnrollments > 0 ? Math.round((totalAttended / totalEnrollments) * 100) : 0;

  const handleToggleShowWinners = async () => {
    try {
      setUpdatingSetting(true);
      const newValue = !showWinnersSetting;
      await api.settings.update({ show_winners: newValue ? 'true' : 'false' });
      setShowWinnersSetting(newValue);
      alert(`Winners & Results navigation link is now ${newValue ? 'ENABLED (Visible in navbars & sidebar)' : 'DISABLED (Hidden from navbars)'}.`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update system setting.');
    } finally {
      setUpdatingSetting(false);
    }
  };

  return (
    <div className="space-y-8 text-[#F7F2F2]">
      <div className="border-b border-[#2A1A1D] pb-4">
        <span className="text-[10px] font-mono text-[#E01B22] uppercase tracking-widest">COMMAND CENTER</span>
        <h1 className="text-xl font-display font-bold text-[#F7F2F2] mt-1">
          {activeTab === 'PAYMENTS' && 'Payment Verification Queue'}
          {activeTab === 'REGISTRATIONS' && 'Event-Wise Participant Roster'}
          {activeTab === 'ALUMNI' && 'Alumni Roster'}
          {activeTab === 'USERS' && 'Create / Manage Accounts'}
          {activeTab === 'DASHBOARD' && 'Telemetry & Stats'}
          {activeTab === 'ANNOUNCEMENTS' && 'Broadcast Announcements'}
          {activeTab === 'EVENTS' && `Events (${events.length})`}
          {activeTab === 'CSV_UPLOAD' && 'Payment Report Verification'}
          {activeTab === 'SETTINGS' && 'System Feature Settings'}
        </h1>
      </div>

        {/* TAB: SYSTEM FEATURE SETTINGS */}
        {activeTab === 'SETTINGS' && (
          <div className="bg-[#130C0E] border border-[#2A1A1D] p-6 rounded-[2px] space-y-6">
            <div>
              <h2 className="text-lg font-display font-bold text-[#F7F2F2]">
                SYSTEM FEATURE CONTROLS
              </h2>
              <p className="text-xs text-[#A79798] font-mono mt-0.5">
                Enable or disable global symposium features across participant views and navigation menus.
              </p>
            </div>

            <div className="bg-[#0A0607] border border-[#2A1A1D] p-6 rounded-[2px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#E08A17]" />
                  <h3 className="font-display font-bold text-sm text-[#F7F2F2]">
                    WINNERS & RESULTS NAVIGATION LINK
                  </h3>
                </div>
                <p className="text-xs font-mono text-[#A79798] max-w-xl">
                  When enabled, the 🏆 Winners link will appear in the main navigation bar and participant dashboard sidebar. Disable this until symposium events conclude.
                </p>
              </div>

              <button
                onClick={handleToggleShowWinners}
                disabled={updatingSetting}
                className={`px-5 py-2.5 rounded-[2px] font-mono text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                  showWinnersSetting
                    ? 'bg-[#1FA971] hover:bg-[#27C487] text-[#0A0607]'
                    : 'bg-[#1A1114] hover:bg-[#2A1A1D] text-[#A79798] border border-[#3E2529] hover:border-[#E01B22]'
                }`}
              >
                {showWinnersSetting ? '✓ ENABLED (Visible)' : 'OFF (Hidden)'}
              </button>
            </div>
          </div>
        )}


        {/* TAB: PAYMENTS VERIFICATION QUEUE */}
        {activeTab === 'PAYMENTS' && (
          <div className="bg-[#130C0E] border border-[#2A1A1D] p-6 rounded-[2px] space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-display font-bold text-[#F7F2F2]">
                  PAYMENT VERIFICATION QUEUE ({filteredPayments.length})
                </h2>
                <p className="text-xs text-[#A79798] font-mono mt-0.5">
                  UTR submission auto-unlocks registrations. Desk officials can reject invalid references.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-[#A79798] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={paymentSearch}
                    onChange={(e) => setPaymentSearch(e.target.value)}
                    placeholder="Search UTR / Name..."
                    className="w-full bg-[#0A0607] border border-[#2A1A1D] pl-9 pr-3 py-1.5 text-xs text-[#F7F2F2] rounded-[2px] outline-none font-mono"
                  />
                </div>
                <button
                  onClick={exportPaymentsCSV}
                  className="px-4 py-2 bg-[#1A1114] hover:bg-[#2A1A1D] border border-[#3E2529] hover:border-[#E01B22] text-[#F7F2F2] font-mono text-xs font-bold rounded-[2px] flex items-center gap-2 transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-[#E01B22]" /> EXPORT CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-body">
                <thead className="bg-[#0A0607] text-[#6B5A5C] font-mono border-b border-[#3E2529]">
                  <tr>
                    <th className="p-3.5">USER</th>
                    <th className="p-3.5">REFERENCE / UTR</th>
                    <th className="p-3.5">DETAILS</th>
                    <th className="p-3.5">STATUS</th>
                    <th className="p-3.5">RECEIPT</th>
                    <th className="p-3.5">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A1A1D]">
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-[#1A1114] transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-[#F7F2F2]">{p.student?.name || p.user?.name || 'Participant'}</div>
                        <div className="text-[10px] text-[#A79798] font-mono">{p.student?.email || p.user?.email || '-'}</div>
                        <div className="text-[10px] font-mono text-[#1FA971] font-bold mt-0.5">{p.student?.student_id_code || p.user?.student_id_code || '-'}</div>
                      </td>
                      <td className="p-3.5 font-mono text-[#E08A17] font-bold">{p.transaction_reference}</td>
                      <td className="p-3.5 font-mono text-[10px]">
                        <div className="text-[#F7F2F2]">₹{p.amount || '150'}</div>
                        <div className="text-[#A79798]">{p.payment_date || '-'}</div>
                        <div className="text-[#A79798]">{p.payment_method || 'UPI'}</div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-[2px] font-mono text-[10px] font-bold ${
                          p.status === 'VERIFIED' ? 'bg-[#1FA971]/20 text-[#1FA971] border border-[#1FA971]' : p.status === 'REJECTED' ? 'bg-[#4A050A] text-[#FF2A2A] border border-[#E01B22]' : 'bg-[#E08A17]/20 text-[#E08A17] border border-[#E08A17]'
                        }`}>
                          {p.status}
                        </span>
                        {p.status === 'REJECTED' && p.rejection_reason && (
                          <div className="text-[9px] text-[#FF2A2A] mt-1 max-w-[120px] truncate" title={p.rejection_reason}>
                            {p.rejection_reason}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        {p.receipt_url ? (
                          <a href={p.receipt_url.startsWith('http') ? p.receipt_url : `${ENV.API_ROOT_URL}${p.receipt_url}`} target="_blank" rel="noreferrer" className="text-[#6366F1] hover:text-[#818CF8] font-mono text-[10px] font-bold flex items-center gap-1 transition-colors">
                            VIEW RECEIPT ↗
                          </a>
                        ) : (
                          <span className="text-[#6B5A5C] text-[10px] font-mono">-</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <button onClick={() => editManagedUser(p.student || p.user)} title="Edit participant details" className="p-1.5 text-[#E08A17] hover:text-[#F7F2F2]"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => deleteManagedUser(p.student || p.user)} title="Delete participant" className="p-1.5 text-[#E01B22] hover:text-[#FF2A2A]"><Trash2 className="w-3.5 h-3.5" /></button>
                          {p.status !== 'VERIFIED' && p.status !== 'REJECTED' && <button onClick={() => handleVerifyPayment(p.id)} className="px-3.5 py-1.5 bg-[#1FA971] hover:bg-[#27C487] text-[#0A0607] font-mono font-bold text-[10px] rounded-[2px] transition-colors">VERIFY ✓</button>}
                          {p.status !== 'REJECTED' && <button onClick={() => setRejectModalPaymentId(p.id)} className="px-3.5 py-1.5 bg-[#7E0910] hover:bg-[#E01B22] text-[#F7F2F2] font-mono font-bold text-[10px] rounded-[2px] transition-colors">REJECT ✗</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: EVENT-WISE REGISTERED PARTICIPANTS LIST & EXPORT */}
        {activeTab === 'REGISTRATIONS' && (
          <div className="bg-[#130C0E] border border-[#2A1A1D] p-6 rounded-[2px] space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-display font-bold text-[#F7F2F2]">
                  EVENT-WISE REGISTRATION ROSTER
                </h2>
                <p className="text-xs text-[#A79798] font-mono mt-0.5">
                  Inspect student enrollments per competition arena and export complete roster.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={selectedEventFilter}
                  onChange={(e) => setSelectedEventFilter(e.target.value)}
                  className="bg-[#0A0607] border border-[#2A1A1D] text-[#F7F2F2] px-3 py-1.5 rounded-[2px] text-xs font-mono outline-none"
                >
                  <option value="ALL">ALL ARENAS ({allRegistrations.reduce((acc, curr) => acc + curr.registrations.length, 0)} ENROLLMENTS)</option>
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id.toString()}>{evt.name}</option>
                  ))}
                </select>

                <button
                  onClick={exportEventRegistrationsCSV}
                  className="px-4 py-1.5 bg-[#1A1114] hover:bg-[#2A1A1D] border border-[#3E2529] hover:border-[#E01B22] text-[#F7F2F2] font-mono text-xs font-bold rounded-[2px] flex items-center gap-2 transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-[#E01B22]" /> EXPORT ENROLLMENTS CSV
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {allRegistrations
                .filter((eg) => selectedEventFilter === 'ALL' || eg.eventId.toString() === selectedEventFilter)
                .map((eventGroup) => (
                  <div key={eventGroup.eventId} className="bg-[#0A0607] border border-[#2A1A1D] rounded-[2px] p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#2A1A1D] pb-2">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-[#E01B22]" />
                        <h3 className="font-display font-bold text-sm text-[#F7F2F2]">{eventGroup.eventName}</h3>
                      </div>
                      <span className="font-mono text-xs text-[#E08A17] font-bold">
                        {eventGroup.registrations.length} ENROLLED
                      </span>
                    </div>

                    {eventGroup.registrations.length === 0 ? (
                      <div className="text-xs font-mono text-[#6B5A5C] py-2">No students enrolled yet.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-body">
                          <thead className="text-[#6B5A5C] font-mono border-b border-[#2A1A1D]">
                            <tr>
                              <th className="py-2 px-3">STUDENT ID</th>
                              <th className="py-2 px-3">PARTICIPANT</th>
                              <th className="py-2 px-3">COLLEGE</th>
                              <th className="py-2 px-3">TEAM / SQUAD</th>
                              <th className="py-2 px-3">ACCOMMODATION</th>
                              <th className="py-2 px-3">ATTENDANCE</th>
                              <th className="py-2 px-3">ACTIONS</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1A1114]">
                            {eventGroup.registrations.map((reg: any) => (
                              <tr key={reg.id} className="hover:bg-[#130C0E]">
                                <td className="py-2 px-3 font-mono text-[#1FA971] font-bold">
                                  {reg.student?.student_id_code || reg.user?.student_id_code || '-'}
                                </td>
                                <td className="py-2 px-3">
                                  <div className="font-bold text-[#F7F2F2]">{reg.student?.name || reg.user?.name || 'Participant'}</div>
                                  <div className="text-[10px] text-[#A79798] font-mono">{reg.student?.email || reg.user?.email || '-'}</div>
                                </td>
                                <td className="py-2 px-3 font-mono text-[#A79798]">
                                  {reg.student?.college_name || reg.user?.college_name || 'PSG Tech'}
                                </td>
                                <td className="py-2 px-3 font-mono text-[#E08A17]">
                                  {reg.team?.name || reg.team_name || 'SOLO'}
                                </td>
                                <td className="py-2 px-3 font-mono text-[#A79798]">
                                  {reg.student?.accommodation_required || reg.user?.accommodation_required ? (
                                    <span className="text-[#E01B22]">YES</span>
                                  ) : 'NO'}
                                </td>
                                <td className="py-2 px-3">
                                  <span className={`px-2 py-0.5 rounded-[2px] font-mono text-[10px] font-bold ${
                                    reg.attended || reg.attendance_status === 'PRESENT'
                                      ? 'bg-[#1FA971]/20 text-[#1FA971] border border-[#1FA971]'
                                      : 'bg-[#1A1114] text-[#A79798] border border-[#2A1A1D]'
                                  }`}>
                                    {reg.attended || reg.attendance_status === 'PRESENT' ? 'PRESENT ✓' : 'REGISTERED'}
                                  </span>
                                </td>
                                <td className="py-2 px-3">
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => editManagedUser(reg.student || reg.user)} title="Edit participant details" className="p-1.5 text-[#E08A17] hover:text-[#F7F2F2]"><Pencil className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => deleteManagedUser(reg.student || reg.user)} title="Delete participant" className="p-1.5 text-[#E01B22] hover:text-[#FF2A2A]"><Trash2 className="w-3.5 h-3.5" /></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 3: ALUMNI ROSTER */}
        {activeTab === 'ALUMNI' && (
          <div className="bg-[#130C0E] border border-[#2A1A1D] p-6 rounded-[2px] space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-display font-bold text-[#F7F2F2]">REGISTERED ALUMNI</h2>
                <p className="text-xs text-[#A79798] font-mono mt-0.5">Alumni RSVP records only. This roster is restricted to administrators.</p>
              </div>
              <button
                onClick={exportAlumniCSV}
                className="px-4 py-1.5 bg-[#1A1114] hover:bg-[#2A1A1D] border border-[#3E2529] hover:border-[#E01B22] text-[#F7F2F2] font-mono text-xs font-bold rounded-[2px] flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5 text-[#E01B22]" /> EXPORT ALUMNI CSV
              </button>
            </div>

            {alumniUsers.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#6B5A5C] font-mono">No alumni registrations found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-body">
                  <thead className="bg-[#0A0607] text-[#6B5A5C] font-mono border-b border-[#3E2529]">
                    <tr>
                      <th className="p-3.5">NAME</th>
                      <th className="p-3.5">EMAIL</th>
                      <th className="p-3.5">PHONE</th>
                      <th className="p-3.5">BATCH</th>
                      <th className="p-3.5">PLACE</th>
                      <th className="p-3.5">ORGANIZATION</th>
                      <th className="p-3.5">ACCOMMODATION</th>
                      <th className="p-3.5">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A1A1D]">
                    {alumniUsers.map((alumni) => (
                      <tr key={alumni.id} className="hover:bg-[#1A1114]">
                        <td className="p-3.5 font-bold text-[#F7F2F2]">{alumni.name}</td>
                        <td className="p-3.5 font-mono text-[#A79798]">{alumni.email}</td>
                        <td className="p-3.5 font-mono text-[#A79798]">{alumni.phone || '-'}</td>
                        <td className="p-3.5 font-mono text-[#E08A17]">{alumni.batch_year || '-'}</td>
                        <td className="p-3.5 text-[#A79798]">{alumni.place || '-'}</td>
                        <td className="p-3.5 text-[#A79798]">{alumni.current_organization || '-'}</td>
                        <td className="p-3.5 font-mono text-[#A79798]">
                          {alumni.accommodation_required ? <span className="text-[#E01B22]">YES</span> : 'NO'}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <button onClick={() => editManagedUser(alumni)} title="Edit alumni details" className="p-1.5 text-[#E08A17] hover:text-[#F7F2F2]"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => deleteManagedUser(alumni)} title="Delete alumni" className="p-1.5 text-[#E01B22] hover:text-[#FF2A2A]"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: USER MANAGEMENT (All Users & Roster Creation) */}
        {activeTab === 'USERS' && (
          <div className="space-y-8">
            {/* Create Official / Power User Form */}
            <div className="bg-[#130C0E] border border-[#2A1A1D] p-6 rounded-[2px] space-y-4">
              <h2 className="text-lg font-display font-bold text-[#F7F2F2] flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#E01B22]" /> ADD NEW DESK OFFICIAL / COORDINATOR
              </h2>
              <form onSubmit={handleCreateUser} className="space-y-4 text-xs font-body">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[#A79798] mb-1 font-semibold">Full Name *</label>
                    <input
                      type="text"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="e.g. Swarna Rathna A"
                      required
                      className="w-full bg-[#0A0607] border border-[#2A1A1D] text-[#F7F2F2] p-2.5 rounded-[2px] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A79798] mb-1 font-semibold">Login ID / Username</label>
                    <input
                      type="text"
                      value={newUserLoginId}
                      onChange={(e) => setNewUserLoginId(e.target.value)}
                      placeholder="e.g. EVENT01"
                      className="w-full bg-[#0A0607] border border-[#2A1A1D] text-[#F7F2F2] p-2.5 rounded-[2px] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A79798] mb-1 font-semibold">Email Address *</label>
                    <input
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="e.g. 25mx127@psgtech.ac.in"
                      required
                      className="w-full bg-[#0A0607] border border-[#2A1A1D] text-[#F7F2F2] p-2.5 rounded-[2px] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A79798] mb-1 font-semibold">Phone Number</label>
                    <input
                      type="text"
                      value={newUserPhone}
                      onChange={(e) => setNewUserPhone(e.target.value)}
                      placeholder="e.g. 9952873426"
                      className="w-full bg-[#0A0607] border border-[#2A1A1D] text-[#F7F2F2] p-2.5 rounded-[2px] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[#A79798] mb-1 font-semibold">Password *</label>
                    <input
                      type="password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                      className="w-full bg-[#0A0607] border border-[#2A1A1D] text-[#F7F2F2] p-2.5 rounded-[2px] outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A79798] mb-1 font-semibold">Role *</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value)}
                      className="w-full bg-[#0A0607] border border-[#2A1A1D] text-[#F7F2F2] p-2.5 rounded-[2px] outline-none font-mono"
                    >
                      <option value="event_coordinator">event_coordinator</option>
                      <option value="admin">admin</option>
                      <option value="student">student</option>
                      {isSuperAdmin && (
                        <>
                          <option value="junior_attendance">junior_attendance</option>
                          <option value="special_user">special_user</option>
                          <option value="super_admin">Admin</option>
                          <option value="admin_power">Admin</option>
                        </>
                      )}
                    </select>
                  </div>
                  {newUserRole === 'event_coordinator' && (
                    <div>
                      <label className="block text-[#A79798] mb-1 font-semibold">Assigned Event *</label>
                      <select
                        value={newUserEventId}
                        onChange={(e) => setNewUserEventId(e.target.value)}
                        required
                        className="w-full bg-[#0A0607] border border-[#2A1A1D] text-[#F7F2F2] p-2.5 rounded-[2px] outline-none font-mono"
                      >
                        <option value="">Select one event</option>
                        {events.map((event) => (
                          <option key={event.id} value={event.id}>{event.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-[#A79798] mb-1 font-semibold">College</label>
                    <input
                      type="text"
                      value={newUserCollege}
                      onChange={(e) => setNewUserCollege(e.target.value)}
                      className="w-full bg-[#0A0607] border border-[#2A1A1D] text-[#F7F2F2] p-2.5 rounded-[2px] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A79798] mb-1 font-semibold">Department</label>
                    <input
                      type="text"
                      value={newUserDepartment}
                      onChange={(e) => setNewUserDepartment(e.target.value)}
                      className="w-full bg-[#0A0607] border border-[#2A1A1D] text-[#F7F2F2] p-2.5 rounded-[2px] outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={creatingUser}
                  className="px-6 py-2.5 bg-[#E01B22] hover:bg-[#FF2A2A] disabled:opacity-50 text-[#F7F2F2] font-mono text-xs font-bold uppercase rounded-[2px] flex items-center gap-2 shadow-lg"
                >
                  <Plus className="w-4 h-4" /> {creatingUser ? 'SAVING...' : 'SAVE & STORE OFFICIAL IN DATABASE'}
                </button>
              </form>
            </div>

            {/* User Management Table */}
            <div className="bg-[#130C0E] border border-[#2A1A1D] p-6 rounded-[2px] space-y-6">
              <h2 className="text-lg font-display font-bold text-[#F7F2F2]">
                ALL USERS & AUTHORIZED PERSONNEL ({users.filter(u => u.user_type !== 'ALUMNI').length})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-body">
                  <thead className="bg-[#0A0607] text-[#6B5A5C] font-mono border-b border-[#3E2529]">
                    <tr>
                      <th className="p-3.5">ID</th>
                      <th className="p-3.5">NAME &amp; EMAIL</th>
                      <th className="p-3.5">DEPARTMENT</th>
                      <th className="p-3.5">ASSIGNED EVENT</th>
                      <th className="p-3.5">ASSIGNED ROLE</th>
                      <th className="p-3.5">CHANGE ROLE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A1A1D]">
                    {users.filter(u => u.user_type !== 'ALUMNI').map((u) => (
                      <tr key={u.id} className="hover:bg-[#1A1114] transition-colors">
                        <td className="p-3.5 font-mono text-[#6B5A5C]">#{u.id}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-[#F7F2F2]">{u.name}</div>
                          <div className="text-[10px] text-[#A79798] font-mono">{u.email} &bull; {u.phone || '-'}</div>
                        </td>
                        <td className="p-3.5 font-mono text-[#A79798]">{u.department || 'Computer Applications'}</td>
                        <td className="p-3.5 font-mono text-[#E08A17]">
                          {u.role === 'event_coordinator'
                            ? (u.eventAssignments?.[0]?.event?.name || 'Unassigned')
                            : '-'}
                        </td>
                        <td className="p-3.5 font-mono text-[#FF2A2A] font-bold uppercase">{u.role}</td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="bg-[#0A0607] border border-[#2A1A1D] text-[#F7F2F2] px-2.5 py-1 rounded-[2px] text-xs font-mono outline-none"
                            >
                            <option value="event_coordinator">event_coordinator</option>
                            <option value="admin">admin</option>
                            <option value="student">student</option>
                            {isSuperAdmin && (
                              <>
                                <option value="junior_attendance">junior_attendance</option>
                                <option value="special_user">special_user</option>
                                <option value="super_admin">Admin</option>
                                <option value="admin_power">Admin</option>
                              </>
                            )}
                          </select>
                          <button
                            onClick={() => setEditModalUser(u)}
                            className="px-2.5 py-1 bg-[#1A1114] hover:bg-[#2A1A1D] border border-[#3E2529] hover:border-[#E08A17] text-[#E08A17] text-[10px] font-bold font-mono rounded-[2px] transition-colors"
                          >
                            EDIT
                          </button>
                          <button
                            onClick={() => deleteManagedUser(u)}
                            className="px-2.5 py-1 bg-[#1A1114] hover:bg-[#2A1A1D] border border-[#3E2529] hover:border-[#E01B22] text-[#E01B22] text-[10px] font-bold font-mono rounded-[2px] transition-colors"
                          >
                            DELETE
                          </button>
                        </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SYMPOSIUM TELEMETRY & ATTENDANCE DASHBOARD */}
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6">
            {/* Top KPI Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#130C0E] border border-[#2A1A1D] p-5 rounded-[2px]">
                <span className="mono-label text-[#A79798] block">REGISTERED STUDENTS</span>
                <strong className="text-2xl font-mono text-[#F7F2F2] mt-1 block">{totalStudents}</strong>
                <span className="text-[10px] text-[#A79798] font-mono">Symposium accounts</span>
              </div>
              <div className="bg-[#130C0E] border border-[#1FA971]/40 p-5 rounded-[2px]">
                <span className="mono-label text-[#1FA971] block">PAYMENTS VERIFIED</span>
                <strong className="text-2xl font-mono text-[#1FA971] mt-1 block">{verifiedPaymentsCount}</strong>
                <span className="text-[10px] text-[#A79798] font-mono">₹{verifiedPaymentsCount * 150} INR collected</span>
              </div>
              <div className="bg-[#130C0E] border border-[#E08A17]/40 p-5 rounded-[2px]">
                <span className="mono-label text-[#E08A17] block">ARENA ENROLLMENTS</span>
                <strong className="text-2xl font-mono text-[#E08A17] mt-1 block">{totalEnrollments}</strong>
                <span className="text-[10px] text-[#A79798] font-mono">Across 11 competition arenas</span>
              </div>
              <div className="bg-[#130C0E] border border-[#E01B22]/40 p-5 rounded-[2px]">
                <span className="mono-label text-[#E01B22] block">OVERALL ATTENDANCE</span>
                <strong className="text-2xl font-mono text-[#FF2A2A] mt-1 block">{overallAttendancePercentage}%</strong>
                <span className="text-[10px] text-[#A79798] font-mono">{totalAttended} of {totalEnrollments} checked in</span>
              </div>
            </div>

            {/* Arena Enrollment & Attendance Rate Breakdown */}
            <div className="bg-[#130C0E] border border-[#2A1A1D] p-6 rounded-[2px] space-y-4">
              <h3 className="font-display font-bold text-base text-[#F7F2F2]">ARENA ENROLLMENT &amp; ATTENDANCE TELEMETRY</h3>
              
              <div className="space-y-3">
                {allRegistrations.map((eg) => {
                  const total = eg.registrations.length;
                  const present = eg.registrations.filter((r: any) => r.attended || r.attendance_status === 'PRESENT').length;
                  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

                  return (
                    <div key={eg.eventId} className="bg-[#0A0607] border border-[#2A1A1D] p-3.5 rounded-[2px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs">
                      <div className="flex-1">
                        <span className="font-bold text-[#F7F2F2] block">{eg.eventName}</span>
                        <div className="w-full bg-[#1A1114] h-2 rounded-full mt-2 overflow-hidden">
                          <div
                            className="bg-[#E01B22] h-full transition-all"
                            style={{ width: `${Math.min(100, (total / 100) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-6 shrink-0 text-right">
                        <div>
                          <span className="text-[#A79798] block text-[10px]">ENROLLED</span>
                          <strong className="text-[#E08A17]">{total}</strong>
                        </div>
                        <div>
                          <span className="text-[#A79798] block text-[10px]">PRESENT</span>
                          <strong className="text-[#1FA971]">{present}</strong>
                        </div>
                        <div>
                          <span className="text-[#A79798] block text-[10px]">RATE</span>
                          <strong className="text-[#FF2A2A]">{pct}%</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BROADCAST ANNOUNCEMENTS */}
        {activeTab === 'ANNOUNCEMENTS' && (
          <div className="space-y-8">
            <div className="bg-[#130C0E] border border-[#2A1A1D] p-6 rounded-[2px] space-y-4">
              <h2 className="text-lg font-display font-bold text-[#F7F2F2] flex items-center gap-2">
                <Radio className="w-5 h-5 text-[#E01B22]" /> BROADCAST MESSAGE TO ALL COORDINATORS &amp; ADMINS
              </h2>
              <p className="text-xs text-[#A79798] font-mono">
                Dispatches an announcement notice to the platform ticker and automatically sends an official email to all coordinators and admin staff.
              </p>

              <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs font-body">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[#A79798] mb-1 font-semibold">Title Tag *</label>
                    <input
                      type="text"
                      value={newAnnoTitle}
                      onChange={(e) => setNewAnnoTitle(e.target.value)}
                      placeholder="e.g. COORDINATOR BRIEFING AT 09:00 AM"
                      required
                      className="w-full bg-[#0A0607] border border-[#2A1A1D] text-[#F7F2F2] p-2.5 rounded-[2px] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#A79798] mb-1 font-semibold">Priority</label>
                    <select
                      value={newAnnoPriority}
                      onChange={(e: any) => setNewAnnoPriority(e.target.value)}
                      className="w-full bg-[#0A0607] border border-[#2A1A1D] text-[#F7F2F2] p-2.5 rounded-[2px] outline-none font-mono"
                    >
                      <option value="normal">normal</option>
                      <option value="high">high</option>
                      <option value="urgent">urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[#A79798] mb-1 font-semibold">Broadcast Message *</label>
                  <textarea
                    value={newAnnoMessage}
                    onChange={(e) => setNewAnnoMessage(e.target.value)}
                    placeholder="Enter broadcast instructions..."
                    required
                    className="w-full bg-[#0A0607] border border-[#2A1A1D] text-[#F7F2F2] p-2.5 rounded-[2px] outline-none h-24"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#E01B22] hover:bg-[#FF2A2A] text-[#F7F2F2] font-mono text-xs font-bold uppercase rounded-[2px] flex items-center gap-2 shadow-lg"
                >
                  <Radio className="w-4 h-4" /> DISPATCH BROADCAST &amp; EMAIL OFFICIALS
                </button>
              </form>
            </div>

            {/* List Active */}
            <div className="bg-[#130C0E] border border-[#2A1A1D] p-6 rounded-[2px] space-y-4">
              <h3 className="font-display font-bold text-sm text-[#F7F2F2]">ACTIVE TICKER ANNOUNCEMENTS</h3>

              <div className="space-y-3">
                {announcements.map((a) => (
                  <div key={a.id} className="bg-[#0A0607] border border-[#2A1A1D] p-4 rounded-[2px] flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-[#E08A17] text-xs">[{a.title}]</span>
                      <p className="text-xs text-[#F7F2F2] mt-1">{a.message}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteAnnouncement(a.id)}
                      className="text-[#A79798] hover:text-[#E01B22] p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: EVENT MANAGEMENT */}
        {activeTab === 'EVENTS' && (
          <div className="bg-[#130C0E] border border-[#2A1A1D] p-6 rounded-[2px] space-y-6">
            <div>
              <h2 className="text-lg font-display font-bold text-[#F7F2F2]">EVENT MANAGEMENT ({events.length})</h2>
              <p className="text-xs text-[#A79798] font-mono mt-1">Updating an event venue or time automatically emails all enrolled participants.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-body">
                <thead className="bg-[#0A0607] text-[#6B5A5C] font-mono border-b border-[#3E2529]">
                  <tr>
                    <th className="p-3.5">EVENT NAME</th>
                    <th className="p-3.5">CATEGORY</th>
                    <th className="p-3.5">DAY &amp; DATE</th>
                    <th className="p-3.5">VENUE</th>
                    <th className="p-3.5">START TIME</th>
                    <th className="p-3.5">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A1A1D]">
                  {events.map((evt) => (
                    <tr key={evt.id} className="hover:bg-[#1A1114] transition-colors">
                      <td className="p-3.5 font-bold text-[#F7F2F2]">{evt.name}</td>
                      <td className="p-3.5 font-mono text-[#E08A17]">{evt.category}</td>
                      <td className="p-3.5 font-mono text-[#A79798]">Day {evt.day} | {evt.date}</td>
                      <td className="p-3.5 font-mono text-[#F7F2F2]">{evt.venue}</td>
                      <td className="p-3.5 font-mono text-[#F7F2F2]">{evt.start_time}</td>
                      <td className="p-3.5">
                        <button
                          onClick={() => handleUpdateEvent(evt.id, evt.venue, evt.start_time)}
                          className="px-3.5 py-1.5 bg-[#E01B22] hover:bg-[#FF2A2A] text-[#F7F2F2] font-mono font-bold text-[10px] rounded-[2px]"
                        >
                          EDIT
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* Reject Modal */}
      {rejectModalPaymentId && (
        <div className="fixed inset-0 z-50 bg-[#0A0607]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#130C0E] border border-[#E01B22] w-full max-w-md p-6 rounded-[2px] space-y-4">
            <h3 className="font-display font-bold text-lg text-[#F7F2F2]">REJECT PAYMENT REFERENCE</h3>
            <p className="text-xs text-[#A79798]">Provide a mandatory rejection reason to inform the participant.</p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Invalid transaction reference / UTR not found on bank statement..."
              className="w-full bg-[#0A0607] border border-[#2A1A1D] text-[#F7F2F2] p-3 rounded-[2px] text-xs outline-none h-28"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectModalPaymentId(null)}
                className="px-4 py-2 text-xs font-mono text-[#A79798]"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectPayment}
                disabled={!rejectionReason.trim()}
                className="px-6 py-2 bg-[#E01B22] disabled:opacity-50 text-[#F7F2F2] font-mono text-xs font-bold uppercase rounded-[2px]"
              >
                CONFIRM REJECTION
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: CSV UPLOAD & VERIFY */}
      {activeTab === 'CSV_UPLOAD' && (
        <div className="bg-[#130C0E] border border-[#2A1A1D] p-6 rounded-[2px] space-y-8 animate-fade-in-up">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded bg-[#E01B22]/10 border border-[#E01B22]/20 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-[#E01B22]" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-[#F7F2F2]">Batch Verify Payments via CSV or Excel</h2>
                <p className="text-sm font-mono text-[#A79798] mt-1 max-w-2xl">
                  Upload a CSV, XLS, or XLSX transaction report. The system will match receipt or transaction IDs with pending student registrations.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-6">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                id="csv-upload"
                className="hidden"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              />
              <label
                htmlFor="csv-upload"
                className="px-6 py-3 bg-[#1A1114] border border-[#3E2529] hover:border-[#E01B22] text-[#F7F2F2] font-mono text-sm cursor-pointer rounded-[2px] transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {csvFile ? csvFile.name : 'Choose CSV or Excel File'}
              </label>
              
              <button
                onClick={handleCsvUpload}
                disabled={!csvFile || csvLoading}
                className="px-8 py-3 bg-[#E01B22] hover:bg-[#FF2A2A] disabled:opacity-50 disabled:cursor-not-allowed text-[#F7F2F2] font-mono text-sm font-bold uppercase rounded-[2px] transition-colors"
              >
                {csvLoading ? 'Processing...' : 'Upload & Match'}
              </button>
            </div>
          </div>

          {/* Results Area */}
          {csvResult && (
            <div className="pt-6 border-t border-[#2A1A1D] space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-[#1A1114] border border-[#2A1A1D] rounded-[2px]">
                  <p className="text-xs font-mono text-[#A79798] uppercase">Total Rows Parsed</p>
                  <p className="text-2xl font-display font-bold text-[#F7F2F2] mt-1">{csvResult.total_rows}</p>
                </div>
                <div className="p-4 bg-[#1FA971]/10 border border-[#1FA971]/30 rounded-[2px]">
                  <p className="text-xs font-mono text-[#1FA971] uppercase">Matched & Found</p>
                  <p className="text-2xl font-display font-bold text-[#1FA971] mt-1">{csvResult.matched.length}</p>
                </div>
                <div className="p-4 bg-[#FF2A2A]/10 border border-[#FF2A2A]/30 rounded-[2px]">
                  <p className="text-xs font-mono text-[#FF2A2A] uppercase">Unmatched</p>
                  <p className="text-2xl font-display font-bold text-[#FF2A2A] mt-1">{csvResult.unmatched.length}</p>
                </div>
              </div>

              {csvBulkResult && (
                <div className="p-4 bg-[#1FA971]/10 border border-[#1FA971] text-[#1FA971] font-mono text-sm rounded-[2px] flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  {csvBulkResult}
                </div>
              )}

              {csvResult.matched.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold text-[#F7F2F2]">Matched Pending Payments</h3>
                    <button
                      onClick={handleBulkVerify}
                      disabled={csvSelectedIds.size === 0 || csvBulkLoading}
                      className="px-6 py-2 bg-[#1FA971] hover:bg-[#25C786] disabled:opacity-50 text-[#050505] font-mono text-xs font-bold uppercase rounded-[2px] transition-colors"
                    >
                      {csvBulkLoading ? 'Verifying...' : `Verify Selected (${csvSelectedIds.size})`}
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-[#2A1A1D] rounded-[2px]">
                    <table className="w-full text-left text-sm font-mono">
                      <thead className="bg-[#1A1114] text-[#A79798] text-xs uppercase">
                        <tr>
                          <th className="px-4 py-3 w-12 text-center">
                            <input
                              type="checkbox"
                              className="accent-[#E01B22]"
                              checked={
                                csvSelectedIds.size > 0 &&
                                csvSelectedIds.size === csvResult.matched.filter((m: any) => m.current_status !== 'VERIFIED').length
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCsvSelectedIds(
                                    new Set(
                                      csvResult.matched
                                        .filter((m: any) => m.current_status !== 'VERIFIED')
                                        .map((m: any) => m.payment_id)
                                    )
                                  );
                                } else {
                                  setCsvSelectedIds(new Set());
                                }
                              }}
                            />
                          </th>
                          <th className="px-4 py-3">Transaction ID</th>
                          <th className="px-4 py-3">Student Name</th>
                          <th className="px-4 py-3">Login ID</th>
                          <th className="px-4 py-3">Amount</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2A1A1D]">
                        {csvResult.matched.map((match: any, idx: number) => {
                          const isVerified = match.current_status === 'VERIFIED';
                          return (
                            <tr key={idx} className={`hover:bg-[#1A1114] transition-colors ${isVerified ? 'opacity-50' : ''}`}>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="checkbox"
                                  className="accent-[#E01B22]"
                                  disabled={isVerified}
                                  checked={csvSelectedIds.has(match.payment_id)}
                                  onChange={() => toggleCsvSelect(match.payment_id)}
                                />
                              </td>
                              <td className="px-4 py-3 text-[#F7F2F2]">{match.transaction_reference}</td>
                              <td className="px-4 py-3">{match.student_name}</td>
                              <td className="px-4 py-3">{match.student_login_id}</td>
                              <td className="px-4 py-3">₹{match.amount}</td>
                              <td className="px-4 py-3">
                                {isVerified ? (
                                  <span className="text-[#1FA971] flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Verified</span>
                                ) : (
                                  <span className="text-[#E08A17]">Pending</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {csvResult.unmatched.length > 0 && (
                <div className="space-y-4 pt-6 border-t border-[#2A1A1D]">
                  <h3 className="font-display text-lg font-bold text-[#FF2A2A] flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    Unmatched Transactions
                  </h3>
                  <p className="text-xs font-mono text-[#A79798]">These transaction IDs from your CSV did not match any pending student submissions.</p>
                  
                  <div className="overflow-x-auto border border-[#2A1A1D] rounded-[2px]">
                    <table className="w-full text-left text-sm font-mono">
                      <thead className="bg-[#1A1114] text-[#A79798] text-xs uppercase">
                        <tr>
                          <th className="px-4 py-3">Transaction ID from CSV</th>
                          <th className="px-4 py-3">Raw CSV Row Data</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2A1A1D]">
                        {csvResult.unmatched.slice(0, 100).map((um: any, idx: number) => (
                          <tr key={idx} className="hover:bg-[#1A1114] transition-colors">
                            <td className="px-4 py-3 text-[#FF2A2A]">{um.transaction_reference || 'N/A'}</td>
                            <td className="px-4 py-3 text-xs text-[#A79798] truncate max-w-md">
                              {JSON.stringify(um.csv_row)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editModalUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#0A0607] border border-[#E01B22]/30 w-full max-w-2xl rounded-[2px] shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-[#2A1A1D] flex items-center justify-between bg-[#130C0E]">
              <h2 className="text-sm font-display font-bold text-[#F7F2F2] flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#E08A17]" /> EDIT USER PROFILE
              </h2>
              <button onClick={() => setEditModalUser(null)} className="text-[#A79798] hover:text-[#F7F2F2]">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto font-mono text-xs text-[#A79798] space-y-4">
              <form id="editUserForm" onSubmit={handleUpdateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-semibold text-[#F7F2F2]">Name</label>
                  <input
                    type="text"
                    value={editModalUser.name || ''}
                    onChange={(e) => setEditModalUser({ ...editModalUser, name: e.target.value })}
                    className="w-full bg-[#130C0E] border border-[#2A1A1D] p-2 text-[#F7F2F2] outline-none focus:border-[#E01B22]"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-[#F7F2F2]">Email</label>
                  <input
                    type="email"
                    value={editModalUser.email || ''}
                    onChange={(e) => setEditModalUser({ ...editModalUser, email: e.target.value })}
                    className="w-full bg-[#130C0E] border border-[#2A1A1D] p-2 text-[#F7F2F2] outline-none focus:border-[#E01B22]"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-[#F7F2F2]">Phone</label>
                  <input
                    type="text"
                    value={editModalUser.phone || ''}
                    onChange={(e) => setEditModalUser({ ...editModalUser, phone: e.target.value })}
                    className="w-full bg-[#130C0E] border border-[#2A1A1D] p-2 text-[#F7F2F2] outline-none focus:border-[#E01B22]"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-[#F7F2F2]">Role</label>
                  <select
                    value={editModalUser.role || ''}
                    onChange={(e) => setEditModalUser({ ...editModalUser, role: e.target.value })}
                    className="w-full bg-[#130C0E] border border-[#2A1A1D] p-2 text-[#F7F2F2] outline-none focus:border-[#E01B22]"
                  >
                    <option value="student">student</option>
                    <option value="event_coordinator">event_coordinator</option>
                    <option value="admin">admin</option>
                    {isSuperAdmin && (
                      <>
                        <option value="junior_attendance">junior_attendance</option>
                        <option value="special_user">special_user</option>
                        <option value="super_admin">Admin</option>
                        <option value="admin_power">Admin</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-[#F7F2F2]">College</label>
                  <input
                    type="text"
                    value={editModalUser.college || ''}
                    onChange={(e) => setEditModalUser({ ...editModalUser, college: e.target.value })}
                    className="w-full bg-[#130C0E] border border-[#2A1A1D] p-2 text-[#F7F2F2] outline-none focus:border-[#E01B22]"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-[#F7F2F2]">Department</label>
                  <input
                    type="text"
                    value={editModalUser.department || ''}
                    onChange={(e) => setEditModalUser({ ...editModalUser, department: e.target.value })}
                    className="w-full bg-[#130C0E] border border-[#2A1A1D] p-2 text-[#F7F2F2] outline-none focus:border-[#E01B22]"
                  />
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-[#2A1A1D] bg-[#130C0E] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditModalUser(null)}
                className="px-4 py-2 border border-[#2A1A1D] text-[#A79798] hover:text-[#F7F2F2] font-mono text-xs font-bold rounded-[2px]"
              >
                CANCEL
              </button>
              <button
                type="submit"
                form="editUserForm"
                className="px-4 py-2 bg-[#E01B22] hover:bg-[#FF2A2A] text-[#F7F2F2] font-mono text-xs font-bold rounded-[2px] shadow-[0_0_15px_rgba(224,27,34,0.3)]"
              >
                SAVE CHANGES
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPage;
