import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import { KeyRound, Mail, Phone, Building2, GraduationCap, Hash, User, Edit3, Save, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { CollegeCombobox } from '../../components/common/CollegeCombobox';
import { PG_DEPARTMENTS } from '../../constants/departments';

export const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [collegeName, setCollegeName] = useState(user?.college_name || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [rollNo, setRollNo] = useState(user?.roll_no || '');
  const [gender, setGender] = useState(user?.gender || 'Male');

  const handleStartEdit = () => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setPhone(user?.phone || '');
    setCollegeName(user?.college_name || '');
    setDepartment(user?.department || '');
    setRollNo(user?.roll_no || '');
    setGender(user?.gender || 'Male');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrorMsg(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }
    if (name.trim().length > 35) {
      setErrorMsg('Full name must be maximum 35 characters.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg(null);

      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        college_name: collegeName.trim(),
        department: department.trim(),
        roll_no: rollNo.trim(),
        gender,
      };

      const res = await api.users.updateProfile(payload);
      const updatedUser = res.data?.user || { ...user, ...payload };

      setUser(updatedUser);
      setSuccessMsg('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const displayFields = [
    { icon: KeyRound, label: 'LOGIN ID', value: user?.login_id, color: '#E01B22', mono: true },
    { icon: User, label: 'Full Name', value: user?.name },
    { icon: Mail, label: 'Email', value: user?.email },
    { icon: Phone, label: 'Phone', value: user?.phone },
    { icon: Building2, label: 'College', value: user?.college_name },
    { icon: GraduationCap, label: 'Department', value: user?.department },
    { icon: Hash, label: 'Roll Number', value: user?.roll_no },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2A1A1D] pb-4">
        <div>
          <h1 className="text-xl font-display font-bold text-[#F7F2F2]">My Profile</h1>
          <p className="text-xs text-[#6B5A5C] font-mono mt-1">View and update your participant account details</p>
        </div>

        {!isEditing ? (
          <button
            onClick={handleStartEdit}
            className="px-4 py-2 bg-[#E01B22] hover:bg-[#FF2A2A] text-white text-xs font-mono font-bold rounded-[2px] flex items-center gap-1.5 transition-colors shadow-md"
          >
            <Edit3 className="w-3.5 h-3.5" /> EDIT PROFILE
          </button>
        ) : (
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-[#2A1A1D] hover:bg-[#3E2529] text-[#A79798] hover:text-white text-xs font-mono font-bold rounded-[2px] flex items-center gap-1.5 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> CANCEL
          </button>
        )}
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="bg-[#1FA971]/15 border border-[#1FA971]/60 p-3.5 rounded-[2px] flex items-center gap-3 text-xs text-[#1FA971] font-mono animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#1FA971]" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-[#9B0A12]/20 border border-[#E01B22]/60 p-3.5 rounded-[2px] flex items-center gap-3 text-xs text-[#FF2A2A] font-mono animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#FF2A2A]" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Read-Only Mode */}
      {!isEditing ? (
        <div className="bg-[#130C0E] border border-[#2A1A1D] rounded-[2px] divide-y divide-[#2A1A1D] shadow-xl">
          {displayFields.map(({ icon: Icon, label, value, color, mono }) => (
            <div key={label} className="flex items-center gap-4 px-6 py-4 hover:bg-[#1A1114]/40 transition-colors">
              <Icon className="w-4 h-4 shrink-0" style={{ color: color || '#6B5A5C' }} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-mono text-[#6B5A5C] uppercase tracking-wider">{label}</p>
                <p
                  className={`text-sm text-[#F7F2F2] mt-0.5 truncate ${mono ? 'font-mono font-bold tracking-wider' : ''}`}
                  style={color ? { color } : undefined}
                >
                  {value || '—'}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Edit Mode Form */
        <form onSubmit={handleSave} className="bg-[#130C0E] border border-[#E01B22]/60 rounded-[2px] p-6 space-y-5 shadow-2xl animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[#2A1A1D] pb-3">
            <h2 className="text-sm font-display font-bold text-[#F7F2F2] flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-[#E01B22]" /> Edit Account Information
            </h2>
            <span className="text-[10px] font-mono text-[#E01B22]">LOGIN ID: {user?.login_id} (IMMUTABLE)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
            {/* Full Name */}
            <div>
              <label className="block text-[#A79798] mb-1 font-semibold">Full Name * (Max 35 chars)</label>
              <input
                type="text"
                maxLength={35}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Full Name"
                className="w-full bg-[#0A0607] border border-[#2A1A1D] focus:border-[#E01B22] text-[#F7F2F2] px-3 py-2.5 rounded-[2px] outline-none"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-[#A79798] mb-1 font-semibold">Email Address *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@domain.com"
                className="w-full bg-[#0A0607] border border-[#2A1A1D] focus:border-[#E01B22] text-[#F7F2F2] px-3 py-2.5 rounded-[2px] outline-none"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[#A79798] mb-1 font-semibold">WhatsApp Mobile Phone *</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="WhatsApp Phone Number"
                className="w-full bg-[#0A0607] border border-[#2A1A1D] focus:border-[#E01B22] text-[#F7F2F2] px-3 py-2.5 rounded-[2px] outline-none"
              />
            </div>

            {/* Roll Number */}
            <div>
              <label className="block text-[#A79798] mb-1 font-semibold">Roll Number / Student ID</label>
              <input
                type="text"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                placeholder="e.g. 25MX318"
                className="w-full bg-[#0A0607] border border-[#2A1A1D] focus:border-[#E01B22] text-[#F7F2F2] px-3 py-2.5 rounded-[2px] outline-none uppercase"
              />
            </div>

            {/* College Name (CollegeCombobox) */}
            <div className="sm:col-span-2">
              <label className="block text-[#A79798] mb-1 font-semibold">College / Institution *</label>
              <CollegeCombobox
                value={collegeName}
                onChange={(val) => setCollegeName(val)}
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-[#A79798] mb-1 font-semibold">Department *</label>
              <input
                type="text"
                list="pg-departments-list"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Select or enter department"
                className="w-full bg-[#0A0607] border border-[#2A1A1D] focus:border-[#E01B22] text-[#F7F2F2] px-3 py-2.5 rounded-[2px] outline-none"
              />
              <datalist id="pg-departments-list">
                {PG_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept} />
                ))}
              </datalist>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-[#A79798] mb-1 font-semibold">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-[#0A0607] border border-[#2A1A1D] focus:border-[#E01B22] text-[#F7F2F2] px-3 py-2.5 rounded-[2px] outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-[#2A1A1D]">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-transparent hover:bg-[#2A1A1D] text-[#A79798] hover:text-white font-mono text-xs rounded-[2px] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#E01B22] hover:bg-[#FF2A2A] text-white font-mono text-xs font-bold rounded-[2px] flex items-center gap-2 transition-colors disabled:opacity-50 shadow-md"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> SAVING...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" /> SAVE CHANGES
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Official Student ID Badge */}
      {user?.student_id_code && (
        <div className="bg-[#0A0607] border border-[#1FA971] p-6 rounded-[2px] text-center space-y-2 shadow-xl">
          <p className="text-[10px] font-mono text-[#A79798] uppercase tracking-[3px]">Official Student ID</p>
          <p className="text-3xl font-mono font-extrabold text-[#1FA971] tracking-[4px]">{user.student_id_code}</p>
        </div>
      )}
    </div>
  );
};
