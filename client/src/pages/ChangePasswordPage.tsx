import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { ShieldAlert, ArrowRight } from 'lucide-react';

export const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      await api.auth.changePassword({ currentPassword, newPassword });
      
      if (user) {
        setUser({ ...user, must_change_password: false });
      }

      if (user?.role === 'admin') navigate('/admin');
      else if (user?.role === 'coordinator') navigate('/coordinator');
      else navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center bg-[#0A0A0C]">
      <div className="max-w-md w-full bg-[#141418] border border-[#E8A317] p-8 rounded-2xl shadow-2xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-[#E8A317]/10 border border-[#E8A317] text-[#E8A317] rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-display font-extrabold text-[#F2F2F4]">ACTION REQUIRED</h1>
          <p className="text-xs text-[#E8A317] font-semibold">You must change your default password before accessing your dashboard.</p>
        </div>

        {error && (
          <div className="bg-[#9B0A12]/30 border border-[#E01B24] p-3 rounded-lg text-xs text-[#FF3B30]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-body">
          <div>
            <label className="block text-[#9A9AA2] mb-1 font-semibold">Current Temporary Password *</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-[#0A0A0C] border border-[#2A1416] focus:border-[#E8A317] rounded-lg px-3.5 py-2.5 text-[#F2F2F4] outline-none"
            />
          </div>

          <div>
            <label className="block text-[#9A9AA2] mb-1 font-semibold">New Secure Password *</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-[#0A0A0C] border border-[#2A1416] focus:border-[#E8A317] rounded-lg px-3.5 py-2.5 text-[#F2F2F4] outline-none"
            />
          </div>

          <div>
            <label className="block text-[#9A9AA2] mb-1 font-semibold">Confirm New Password *</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-[#0A0A0C] border border-[#2A1416] focus:border-[#E8A317] rounded-lg px-3.5 py-2.5 text-[#F2F2F4] outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#E8A317] hover:bg-[#E01B24] text-[#0A0A0C] hover:text-[#F2F2F4] font-bold font-mono rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? 'SAVING...' : 'SET NEW PASSWORD & CONTINUE'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
