import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { ShieldCheck, Clock, AlertCircle, QrCode, Calendar, Users, ArrowRight, CreditCard, CheckCircle, Copy, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrScannerModal } from '../../components/dashboard/QrScannerModal';

export const DashboardHome: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [newLoginId, setNewLoginId] = React.useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = React.useState(false);

  React.useEffect(() => {
    const id = localStorage.getItem('newLoginId');
    if (id) {
      setNewLoginId(id);
      localStorage.removeItem('newLoginId');
    }
  }, []);

  const { data: paymentData } = useQuery({
    queryKey: ['payment-status'],
    queryFn: async () => { const res = await api.payments.getMyStatus(); return res.data; },
    staleTime: 15 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: async () => { const res = await api.registrations.getMyRegistrations(); return res.data || []; },
  });

  const pStatus = paymentData?.status || 'NOT_SUBMITTED';

  const regCount = Array.isArray(registrations) ? registrations.length : 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } as const }
  };

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <AnimatePresence>
        {newLoginId && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: -20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="bg-[#130C0E] border-2 border-[#1FA971] p-6 rounded-[2px] shadow-[0_0_30px_rgba(31,169,113,0.15)] flex flex-col items-center justify-center text-center space-y-4 relative"
          >
            <button onClick={() => setNewLoginId(null)} className="absolute top-4 right-4 text-[#A79798] hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 bg-[#1FA971]/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-[#1FA971]" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-[#F7F2F2]">Registration Successful!</h2>
              <p className="text-xs text-[#A79798] font-mono mt-1">Please save your Participant ID for future logins.</p>
            </div>
            <div className="bg-[#0A0607] border border-[#2A1A1D] px-6 py-3 rounded-[2px] flex items-center gap-4">
              <span className="text-2xl font-mono font-black text-[#1FA971] tracking-[4px] select-all">{newLoginId}</span>
              <button 
                onClick={() => navigator.clipboard.writeText(newLoginId)}
                className="p-2 hover:bg-[#2A1A1D] rounded-[2px] transition-colors"
                title="Copy ID"
              >
                <Copy className="w-4 h-4 text-[#A79798]" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Profile Header / ID Card */}
      <motion.div variants={itemVariants} className="bg-[#130C0E] border border-[#2A1A1D] p-6 rounded-[2px] shadow-2xl relative overflow-hidden group hover:border-[#3E2529] transition-colors">
        {/* Cyber Image Overlay */}
        <img src="/assets/hero.webp" alt="Background Texture" className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none mix-blend-overlay" />
        <div className="absolute top-0 left-0 w-1 h-full bg-[#E01B22]" />
        <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-6 pl-0 sm:pl-4 relative z-10">
          
          <div className="flex flex-col md:flex-row items-center gap-3 md:gap-5 text-center md:text-left w-full md:w-auto">
            <div className="w-16 h-16 rounded-[2px] bg-[#1A1114] border border-[#3E2529] flex items-center justify-center font-display font-extrabold text-3xl text-[#F7F2F2]">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-display font-bold text-[#F7F2F2] tracking-wider uppercase mt-1 md:mt-0">{user?.name}</h1>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                <span className="text-[10px] font-mono font-bold text-[#A79798] uppercase tracking-widest">
                  {user?.user_type || 'PARTICIPANT'} • LOGIN 2K26
                </span>
              </div>
              <p className="text-xs text-[#A79798] font-mono mt-1.5 md:mt-2">{user?.email} • {user?.college_name || 'PSG Tech'}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-0 border border-[#2A1A1D] rounded-[2px] bg-[#0A0607] w-full md:w-auto mt-2 md:mt-0">
            <div className="p-4 text-center border-r border-[#2A1A1D]">
              <span className="text-[10px] font-mono text-[#A79798] uppercase tracking-wider block mb-1">EVENTS</span>
              <span className="text-xl font-display font-bold text-[#F7F2F2]">{regCount < 10 ? `0${regCount}` : regCount}</span>
            </div>
            <div className="p-4 text-center border-r border-[#2A1A1D]">
              <span className="text-[10px] font-mono text-[#A79798] uppercase tracking-wider block mb-1">TEAMS</span>
              <span className="text-xl font-display font-bold text-[#F7F2F2]">00</span>
            </div>
            <div className="p-4 text-center flex flex-col items-center justify-center">
              <span className="text-[10px] font-mono text-[#A79798] uppercase tracking-wider block mb-1">STATUS</span>
              {pStatus === 'VERIFIED' ? (
                <span className="text-sm font-mono font-bold text-[#1FA971] flex items-center gap-1">
                  ✓ VERIFIED
                </span>
              ) : pStatus === 'PENDING' ? (
                <span className="text-sm font-mono font-bold text-[#E08A17] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> PENDING
                </span>
              ) : (
                <span className="text-sm font-mono font-bold text-[#FF2A2A] flex items-center gap-1">
                  ⚠ UNPAID
                </span>
              )}
            </div>
          </div>
          
        </div>
      </motion.div>

      {/* 2. Compressed Action Required Banner */}
      {pStatus !== 'VERIFIED' ? (
        <motion.div variants={itemVariants} className="bg-[#1A0306] border border-[#E01B22] p-4 rounded-[2px] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_15px_rgba(224,27,34,0.1)]">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[#E01B22]" />
            <span className="text-sm font-mono font-bold text-[#F7F2F2] text-center sm:text-left">
              <span className="text-[#FF2A2A]">PAYMENT REQUIRED:</span> Complete your payment to unlock event registration.
            </span>
          </div>
          {pStatus === 'NOT_SUBMITTED' && (
            <button
              onClick={() => navigate('/dashboard/payment')}
              className="px-6 py-2 bg-[#E01B22] hover:bg-[#FF2A2A] text-[#F7F2F2] font-mono text-xs font-bold uppercase rounded-[2px] transition-colors whitespace-nowrap group w-full sm:w-auto min-h-[48px] flex items-center justify-center mt-2 sm:mt-0"
            >
              COMPLETE PAYMENT <ArrowRight className="inline-block w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="bg-[#130C0E] border border-[#1FA971]/40 p-4 rounded-[2px] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_15px_rgba(31,169,113,0.1)]">
          <div className="flex items-center gap-3">
            <QrCode className="w-6 h-6 text-[#1FA971] animate-pulse shrink-0" />
            <div>
              <span className="text-xs font-mono font-bold text-[#F7F2F2] block">
                EVENT ATTENDANCE SCANNER
              </span>
              <span className="text-[10px] font-mono text-[#A79798]">
                Scan coordinator's QR code in venue to mark your live event attendance
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsQrModalOpen(true)}
            className="px-6 py-2.5 bg-[#1FA971] hover:bg-[#27C487] text-[#0A0607] font-mono text-xs font-bold uppercase rounded-[2px] transition-colors whitespace-nowrap flex items-center justify-center gap-2 w-full sm:w-auto shadow-md"
          >
            <QrCode className="w-4 h-4" /> SCAN EVENT QR CODE
          </button>
        </motion.div>
      )}

      {/* 3. Participant Journey */}
      <motion.div variants={itemVariants} className="bg-[#130C0E] border border-[#2A1A1D] p-6 rounded-[2px] space-y-4">
        
        {/* Mobile Vertical Journey (visible < sm) */}
        <div className="flex flex-col sm:hidden space-y-0">
          
          {/* 1. REGISTERED */}
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-[2px] bg-[#1FA971]/20 border border-[#1FA971] flex items-center justify-center z-10 text-[#1FA971] shadow-[0_0_12px_rgba(31,169,113,0.3)] shrink-0">✓</div>
              <div className={`w-px h-8 ${pStatus !== 'NOT_SUBMITTED' ? 'bg-[#1FA971]' : 'bg-[#2A1A1D]'}`} />
            </div>
            <div className="pt-1.5">
              <span className="text-[10px] font-mono font-bold text-[#1FA971] block">REGISTERED</span>
              <span className="text-[9px] font-mono text-[#A79798] mt-0.5">COMPLETE</span>
            </div>
          </div>

          {/* 2. PAYMENT */}
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-[2px] flex items-center justify-center z-10 shrink-0 ${pStatus === 'VERIFIED' ? 'bg-[#1FA971]/20 border border-[#1FA971] text-[#1FA971] shadow-[0_0_12px_rgba(31,169,113,0.3)]' : pStatus === 'PENDING' ? 'bg-[#E08A17]/20 border border-[#E08A17] text-[#E08A17] shadow-[0_0_12px_rgba(224,138,23,0.3)]' : pStatus === 'NOT_SUBMITTED' ? 'bg-[#1A0306] border border-[#E01B22] text-[#FF2A2A] shadow-[0_0_12px_rgba(224,27,34,0.3)]' : 'bg-[#0A0607] border border-[#2A1A1D] text-[#6B5A5C]'}`}>
                {pStatus === 'VERIFIED' ? '✓' : pStatus === 'PENDING' ? <Clock className="w-3.5 h-3.5" /> : '2'}
              </div>
              <div className={`w-px h-8 ${pStatus === 'VERIFIED' ? 'bg-[#1FA971]' : 'bg-[#2A1A1D]'}`} />
            </div>
            <div className="pt-1.5">
              <span className={`text-[10px] font-mono font-bold block ${pStatus === 'VERIFIED' ? 'text-[#1FA971]' : pStatus === 'PENDING' ? 'text-[#E08A17]' : pStatus === 'NOT_SUBMITTED' ? 'text-[#FF2A2A]' : 'text-[#6B5A5C]'}`}>PAYMENT</span>
              <span className="text-[9px] font-mono text-[#A79798] mt-0.5">{pStatus === 'VERIFIED' ? 'COMPLETE' : pStatus === 'PENDING' ? 'PENDING' : 'REQUIRED'}</span>
            </div>
          </div>

          {/* 3. VERIFIED */}
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-[2px] flex items-center justify-center z-10 shrink-0 ${pStatus === 'VERIFIED' ? 'bg-[#1FA971]/20 border border-[#1FA971] text-[#1FA971] shadow-[0_0_12px_rgba(31,169,113,0.3)]' : 'bg-[#0A0607] border border-[#2A1A1D] text-[#6B5A5C]'}`}>
                {pStatus === 'VERIFIED' ? '✓' : <ShieldCheck className="w-3.5 h-3.5" />}
              </div>
              <div className={`w-px h-8 ${regCount > 0 ? 'bg-[#1FA971]' : 'bg-[#2A1A1D]'}`} />
            </div>
            <div className="pt-1.5">
              <span className={`text-[10px] font-mono font-bold block ${pStatus === 'VERIFIED' ? 'text-[#1FA971]' : 'text-[#6B5A5C]'}`}>VERIFIED</span>
              <span className="text-[9px] font-mono text-[#A79798] mt-0.5">{pStatus === 'VERIFIED' ? 'COMPLETE' : 'LOCKED'}</span>
            </div>
          </div>

          {/* 4. EVENTS */}
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-[2px] flex items-center justify-center z-10 shrink-0 ${regCount > 0 ? 'bg-[#1FA971]/20 border border-[#1FA971] text-[#1FA971] shadow-[0_0_12px_rgba(31,169,113,0.3)]' : pStatus === 'VERIFIED' ? 'bg-[#1A0306] border border-[#E01B22] text-[#FF2A2A] shadow-[0_0_12px_rgba(224,27,34,0.3)]' : 'bg-[#0A0607] border border-[#2A1A1D] text-[#6B5A5C]'}`}>
                {regCount > 0 ? '✓' : pStatus === 'VERIFIED' ? '4' : '🔒'}
              </div>
            </div>
            <div className="pt-1.5 pb-2">
              <span className={`text-[10px] font-mono font-bold block ${regCount > 0 ? 'text-[#1FA971]' : pStatus === 'VERIFIED' ? 'text-[#FF2A2A]' : 'text-[#6B5A5C]'}`}>EVENTS</span>
              <span className="text-[9px] font-mono text-[#A79798] mt-0.5">{regCount > 0 ? 'REGISTERED' : pStatus === 'VERIFIED' ? 'REQUIRED' : 'LOCKED'}</span>
            </div>
          </div>
        </div>

        {/* Desktop Horizontal Journey (visible >= sm) */}
        <div className="hidden sm:flex items-center min-w-0">
          
          {/* 1. REGISTERED */}
          <div className="flex flex-col items-center flex-1 relative">
            <div className="w-8 h-8 rounded-[2px] bg-[#1FA971]/20 border border-[#1FA971] flex items-center justify-center z-10 text-[#1FA971] shadow-[0_0_12px_rgba(31,169,113,0.3)]">
              ✓
            </div>
            <div className="mt-3 text-center">
              <span className="text-[10px] font-mono font-bold text-[#1FA971] block">REGISTERED</span>
              <span className="text-[9px] font-mono text-[#A79798] mt-0.5">COMPLETE</span>
            </div>
            <div className={`absolute top-4 left-1/2 right-[-50%] h-px ${pStatus !== 'NOT_SUBMITTED' ? 'bg-[#1FA971]' : 'bg-[#2A1A1D]'}`} />
          </div>

          {/* 2. PAYMENT */}
          <div className="flex flex-col items-center flex-1 relative">
            <div className={`w-8 h-8 rounded-[2px] flex items-center justify-center z-10 ${pStatus === 'VERIFIED' ? 'bg-[#1FA971]/20 border border-[#1FA971] text-[#1FA971] shadow-[0_0_12px_rgba(31,169,113,0.3)]' : pStatus === 'PENDING' ? 'bg-[#E08A17]/20 border border-[#E08A17] text-[#E08A17] shadow-[0_0_12px_rgba(224,138,23,0.3)]' : pStatus === 'NOT_SUBMITTED' ? 'bg-[#1A0306] border border-[#E01B22] text-[#FF2A2A] shadow-[0_0_12px_rgba(224,27,34,0.3)]' : 'bg-[#0A0607] border border-[#2A1A1D] text-[#6B5A5C]'}`}>
              {pStatus === 'VERIFIED' ? '✓' : pStatus === 'PENDING' ? <Clock className="w-3.5 h-3.5" /> : '2'}
            </div>
            <div className="mt-3 text-center">
              <span className={`text-[10px] font-mono font-bold block ${pStatus === 'VERIFIED' ? 'text-[#1FA971]' : pStatus === 'PENDING' ? 'text-[#E08A17]' : pStatus === 'NOT_SUBMITTED' ? 'text-[#FF2A2A]' : 'text-[#6B5A5C]'}`}>PAYMENT</span>
              <span className="text-[9px] font-mono text-[#A79798] mt-0.5">{pStatus === 'VERIFIED' ? 'COMPLETE' : pStatus === 'PENDING' ? 'PENDING' : 'REQUIRED'}</span>
            </div>
            <div className={`absolute top-4 left-[-50%] right-1/2 h-px ${pStatus !== 'NOT_SUBMITTED' ? 'bg-[#1FA971]' : 'bg-[#2A1A1D]'}`} />
            <div className={`absolute top-4 left-1/2 right-[-50%] h-px ${pStatus === 'VERIFIED' ? 'bg-[#1FA971]' : 'bg-[#2A1A1D]'}`} />
          </div>

          {/* 3. VERIFIED */}
          <div className="flex flex-col items-center flex-1 relative">
            <div className={`w-8 h-8 rounded-[2px] flex items-center justify-center z-10 ${pStatus === 'VERIFIED' ? 'bg-[#1FA971]/20 border border-[#1FA971] text-[#1FA971] shadow-[0_0_12px_rgba(31,169,113,0.3)]' : 'bg-[#0A0607] border border-[#2A1A1D] text-[#6B5A5C]'}`}>
              {pStatus === 'VERIFIED' ? '✓' : <ShieldCheck className="w-3.5 h-3.5" />}
            </div>
            <div className="mt-3 text-center">
              <span className={`text-[10px] font-mono font-bold block ${pStatus === 'VERIFIED' ? 'text-[#1FA971]' : 'text-[#6B5A5C]'}`}>VERIFIED</span>
              <span className="text-[9px] font-mono text-[#A79798] mt-0.5">{pStatus === 'VERIFIED' ? 'COMPLETE' : 'LOCKED'}</span>
            </div>
            <div className={`absolute top-4 left-[-50%] right-1/2 h-px ${pStatus === 'VERIFIED' ? 'bg-[#1FA971]' : 'bg-[#2A1A1D]'}`} />
            <div className={`absolute top-4 left-1/2 right-[-50%] h-px ${regCount > 0 ? 'bg-[#1FA971]' : 'bg-[#2A1A1D]'}`} />
          </div>

          {/* 4. EVENTS */}
          <div className="flex flex-col items-center flex-1 relative">
            <div className={`w-8 h-8 rounded-[2px] flex items-center justify-center z-10 ${regCount > 0 ? 'bg-[#1FA971]/20 border border-[#1FA971] text-[#1FA971] shadow-[0_0_12px_rgba(31,169,113,0.3)]' : pStatus === 'VERIFIED' ? 'bg-[#1A0306] border border-[#E01B22] text-[#FF2A2A] shadow-[0_0_12px_rgba(224,27,34,0.3)]' : 'bg-[#0A0607] border border-[#2A1A1D] text-[#6B5A5C]'}`}>
              {regCount > 0 ? '✓' : pStatus === 'VERIFIED' ? '4' : '🔒'}
            </div>
            <div className="mt-3 text-center">
              <span className={`text-[10px] font-mono font-bold block ${regCount > 0 ? 'text-[#1FA971]' : pStatus === 'VERIFIED' ? 'text-[#FF2A2A]' : 'text-[#6B5A5C]'}`}>EVENTS</span>
              <span className="text-[9px] font-mono text-[#A79798] mt-0.5">{regCount > 0 ? 'REGISTERED' : pStatus === 'VERIFIED' ? 'REQUIRED' : 'LOCKED'}</span>
            </div>
            <div className={`absolute top-4 left-[-50%] right-1/2 h-px ${regCount > 0 ? 'bg-[#1FA971]' : 'bg-[#2A1A1D]'}`} />
          </div>
        </div>
      </motion.div>

      {/* 4. Bottom Action Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Browse Events */}
        <div className="bg-[#130C0E] border border-[#2A1A1D] hover:-translate-y-1 hover:border-[#3E2529] p-6 rounded-[2px] flex flex-col justify-between transition-all duration-300 group relative overflow-hidden">
          <img src="/assets/events/code_relay.webp" alt="Events Preview" className="absolute inset-0 w-full h-full object-cover opacity-15 group-hover:opacity-30 group-hover:scale-105 transition-all duration-500 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#130C0E] via-[#130C0E]/80 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <Calendar className="w-6 h-6 mb-3 text-[#A79798] group-hover:text-[#F7F2F2] transition-colors" />
            <h3 className="text-lg font-display font-bold text-[#F7F2F2]">Browse Events</h3>
            <p className="text-xs font-mono text-[#6B5A5C] mt-1">{regCount} registered</p>
          </div>
          {pStatus === 'VERIFIED' ? (
            <button onClick={() => navigate('/dashboard/events')} className="mt-6 text-xs font-mono font-bold text-[#1FA971] flex items-center gap-2 group-hover:text-[#27C487] transition-colors w-max relative z-10">
              VIEW EVENTS <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <div className="mt-6 text-[10px] font-mono font-bold text-[#6B5A5C] flex items-center gap-1.5 uppercase tracking-wider relative z-10">
              🔒 REGISTRATION LOCKED
            </div>
          )}
        </div>

        {/* My Teams */}
        <div className="bg-[#130C0E] border border-[#2A1A1D] hover:-translate-y-1 hover:border-[#3E2529] p-6 rounded-[2px] flex flex-col justify-between transition-all duration-300 group relative overflow-hidden">
          <img src="/assets/gallery-2.webp" alt="Teams Preview" className="absolute inset-0 w-full h-full object-cover opacity-15 group-hover:opacity-30 group-hover:scale-105 transition-all duration-500 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#130C0E] via-[#130C0E]/80 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <Users className="w-6 h-6 mb-3 text-[#A79798] group-hover:text-[#F7F2F2] transition-colors" />
            <h3 className="text-lg font-display font-bold text-[#F7F2F2]">My Teams</h3>
            <p className="text-xs font-mono text-[#6B5A5C] mt-1">Manage your team</p>
          </div>
          <button onClick={() => navigate('/dashboard/teams')} className="mt-6 text-xs font-mono font-bold text-[#A79798] flex items-center gap-2 group-hover:text-[#F7F2F2] transition-colors w-max relative z-10">
            MANAGE TEAM <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Payment */}
        <div className={`bg-[#130C0E] border ${pStatus === 'NOT_SUBMITTED' ? 'border-[#E01B22] shadow-[0_0_20px_rgba(224,27,34,0.15)] hover:shadow-[0_0_30px_rgba(224,27,34,0.25)]' : 'border-[#2A1A1D] hover:border-[#3E2529]'} hover:-translate-y-1 p-6 rounded-[2px] flex flex-col justify-between transition-all duration-300 group relative overflow-hidden`}>
          <img src="/assets/events/star_of_login.webp" alt="Payment Background" className="absolute inset-0 w-full h-full object-cover opacity-15 group-hover:opacity-25 transition-all duration-500 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#130C0E] via-[#130C0E]/80 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <CreditCard className={`w-6 h-6 mb-3 ${pStatus === 'NOT_SUBMITTED' ? 'text-[#E01B22]' : pStatus === 'VERIFIED' ? 'text-[#1FA971]' : 'text-[#E08A17]'}`} />
            <h3 className={`text-lg font-display font-bold ${pStatus === 'NOT_SUBMITTED' ? 'text-[#E01B22]' : 'text-[#F7F2F2]'}`}>
              {pStatus === 'NOT_SUBMITTED' ? 'PAYMENT REQUIRED ⚠' : 'Payment Status'}
            </h3>
            <p className="text-xs font-mono text-[#6B5A5C] mt-1 uppercase">{pStatus.replace('_', ' ')}</p>
          </div>
          <button 
            onClick={() => navigate('/dashboard/payment')}
            className={`mt-6 text-xs font-mono font-bold flex items-center gap-2 w-max transition-colors relative z-10 ${
              pStatus === 'NOT_SUBMITTED' ? 'text-[#FF2A2A] group-hover:text-[#F7F2F2]' : 'text-[#A79798] group-hover:text-[#F7F2F2]'
            }`}
          >
            {pStatus === 'NOT_SUBMITTED' ? 'COMPLETE PAYMENT' : 'VIEW DETAILS'} <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </motion.div>

      <QrScannerModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} />
    </motion.div>
  );
};
