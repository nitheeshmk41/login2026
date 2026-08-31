import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../services/api';
import { ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff, Copy, Check, Calendar as CalendarIcon, Sparkles, Lock, Download } from 'lucide-react';
import confetti from 'canvas-confetti';
import { COLLEGES } from '../constants/colleges';
import { PG_DEPARTMENTS } from '../constants/departments';

// ──────────────────────────────────────────────
// Zod Validation Schemas
// ──────────────────────────────────────────────
const participantSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  otp: z.string().min(6, 'OTP must be 6 digits'),
  phone: z.string().min(10, 'WhatsApp mobile number is required (min 10 digits)'),
  college_name: z.string().min(2, 'College name is required'),
  department: z.string().optional(),
  roll_no: z.string().optional(),
  gender: z.string().min(1, 'Please select your gender'),
  year_of_study: z.string().optional(),
  accommodation_required: z.boolean().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const alumniSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Please enter a valid email address'),
  otp: z.string().min(6, 'OTP must be 6 digits'),
  phone: z.string().min(10, 'WhatsApp mobile number is required (min 10 digits)'),
  batch_year: z.string().min(1, 'Batch is required (e.g. 25MX)'),
  gender: z.string().min(1, 'Please select your gender'),
  place: z.string().optional(),
  current_organization: z.string().optional(),
  accommodation_required: z.boolean().optional(),
});

type ParticipantForm = z.infer<typeof participantSchema>;
type AlumniForm = z.infer<typeof alumniSchema>;

// ──────────────────────────────────────────────
// Main Register Page
// ──────────────────────────────────────────────
export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [userType, setUserType] = useState<'PARTICIPANT' | 'ALUMNI'>('PARTICIPANT');
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Success state
  const [alumniSuccessData, setAlumniSuccessData] = useState<{ name: string; email: string; batch_year?: string } | null>(null);
  const [successData, setSuccessData] = useState<{ loginId: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const typeParam = searchParams.get('type');
    if ((typeParam && typeParam.toUpperCase() === 'ALUMNI') || window.location.pathname.includes('alumni')) {
      setUserType('ALUMNI');
    }
  }, [searchParams]);

  const participantForm = useForm<ParticipantForm>({
    resolver: zodResolver(participantSchema),
    defaultValues: {
      name: '', email: '', otp: '', phone: '', college_name: '', department: '', roll_no: '',
      gender: '', year_of_study: '1st Year', accommodation_required: false, password: '', confirmPassword: '',
    },
  });

  const alumniForm = useForm<AlumniForm>({
    resolver: zodResolver(alumniSchema),
    defaultValues: {
      name: '', email: '', otp: '', phone: '', gender: '', batch_year: '', place: '', current_organization: '',
      accommodation_required: false,
    },
  });

  const activeForm = userType === 'PARTICIPANT' ? participantForm : alumniForm;
  const { register, handleSubmit, setError, clearErrors, formState: { errors } } = activeForm as any;

  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailExistsError, setEmailExistsError] = useState<string | null>(null);

  const handleEmailBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value?.trim();
    setEmailExistsError(null);
    if (!val || !val.includes('@')) return;

    try {
      setCheckingEmail(true);
      const res = await api.auth.checkEmail(val);
      if (res.data?.exists) {
        const msg = 'This email address is already registered in our database.';
        setEmailExistsError(msg);
        setError('email', { type: 'manual', message: msg });
      } else {
        clearErrors('email');
      }
    } catch (err) {
      console.error('Failed to check email:', err);
    } finally {
      setCheckingEmail(false);
    }
  };

  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);

  const handleSendOtp = async () => {
    const email = (activeForm.getValues() as any).email as string;
    if (!email || !email.includes('@')) {
      setError('email', { type: 'manual', message: 'Enter a valid email first' });
      return;
    }
    if (emailExistsError) return;

    try {
      setSendingOtp(true);
      setOtpMessage(null);
      await api.auth.sendOtp(email);
      setOtpSent(true);
      setOtpMessage('OTP sent successfully. Please check your inbox/spam.');
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const onSubmit = async (data: any) => {
    setServerError(null);
    if (emailExistsError) {
      setServerError('This email address is already registered in our database.');
      return;
    }
    try {
      setLoading(true);
      const res = await api.auth.register({
        ...data,
        user_type: userType,
      });

      if (userType === 'ALUMNI') {
        setAlumniSuccessData({
          name: data.name,
          email: data.email,
          batch_year: data.batch_year,
        });

        // Trigger celebratory confetti
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#E01B22', '#E08A17', '#1FA971', '#F7F2F2'],
        });
      } else {
        setSuccessData({
          loginId: res.data.loginId,
          password: data.password
        });
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        setServerError('This email address is already registered.');
      } else {
        setServerError(err.response?.data?.message || 'Registration failed. Please check your details and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadICS = () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PSG College of Technology//LOGIN 2K26 Alumni Reunion//EN
BEGIN:VEVENT
SUMMARY:LOGIN 2K26 - 35th Edition Alumni Reunion & Cyber Symposium
DESCRIPTION:Welcome back to PSG College of Technology for the grand 35th Edition of LOGIN 2K26 National Cyber Symposium!
LOCATION:PSG College of Technology, Peelamedu, Coimbatore, Tamil Nadu 641004
DTSTART:20260918T033000Z
DTEND:20260919T113000Z
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'LOGIN2K26_Alumni_Reunion.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Render: Alumni Success Confirmation Screen ──
  if (alumniSuccessData) {
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=LOGIN+2K26+35th+Edition+Alumni+Reunion&dates=20260918T033000Z/20260919T113000Z&details=Welcome+back+to+PSG+Tech+for+the+35th+Edition+of+LOGIN+2K26+National+Cyber+Symposium!&location=PSG+College+of+Technology,+Coimbatore`;

    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-[#0A0607] relative overflow-hidden">
        <div className="max-w-xl w-full bg-[#130C0E] border border-[#E08A17] p-8 rounded-[2px] text-center space-y-6 shadow-2xl relative animate-scale-in">
          <div className="w-20 h-20 bg-[#E08A17]/20 border-2 border-[#E08A17] text-[#E08A17] rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(224,138,23,0.3)]">
            <Sparkles className="w-10 h-10 animate-bounce" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono text-[#E08A17] font-bold uppercase tracking-widest bg-[#E08A17]/10 px-3 py-1 border border-[#E08A17]/30 rounded-sm">
              35TH EDITION • OFFICIAL ALUMNI RSVP
            </span>
            <h2 className="text-3xl font-display font-black text-[#F7F2F2] uppercase">
              WELCOME BACK HOME!
            </h2>
            <p className="text-xs font-mono text-[#A79798]">
              Dear <span className="text-[#F7F2F2] font-bold">{alumniSuccessData.name}</span>, your registration for LOGIN 2K26 is confirmed!
            </p>
          </div>

          {/* Registration Confirmation Box */}
          <div className="bg-[#0A0607] border border-[#2A1A1D] p-5 rounded-[2px] space-y-3 text-left font-mono text-xs">
            <div className="flex justify-between items-center text-[#A79798] border-b border-[#2A1A1D] pb-2 text-[10px]">
              <span>ALUMNI RSVP CONFIRMATION</span>
              <span className="text-[#E08A17] font-bold">PSG TECH MCA</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <div>
                <span className="text-[10px] text-[#A79798] block">ALUMNI NAME</span>
                <span className="text-base font-bold text-[#F7F2F2]">{alumniSuccessData.name}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#A79798] block">BATCH / YEAR</span>
                <span className="text-sm font-bold text-[#E08A17]">{alumniSuccessData.batch_year || 'Alumni'}</span>
              </div>
            </div>
          </div>

          {/* Email Notification Banner */}
          <div className="bg-[#1A0306] border border-[#E01B22] p-4 rounded-[2px] text-xs font-mono text-[#F7F2F2] flex items-center gap-3 text-left">
            <Check className="w-5 h-5 text-[#1FA971] shrink-0" />
            <div>
              <span className="font-bold text-[#E08A17]">CONFIRMATION SENT:</span> We have dispatched your personalized greeting email and calendar invitation to <strong className="text-white">{alumniSuccessData.email}</strong>.
            </div>
          </div>

          {/* Calendar Actions */}
          <div className="space-y-3 pt-2">
            <span className="text-[10px] font-mono text-[#A79798] uppercase tracking-wider block">
              MARK YOUR CALENDAR FOR REUNION (SEP 18-19, 2026)
            </span>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={googleCalendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-4 bg-[#E01B22] hover:bg-[#FF2A2A] text-[#F7F2F2] font-mono text-xs font-bold uppercase rounded-[2px] flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <CalendarIcon className="w-4 h-4" />
                <span>+ ADD TO GOOGLE CALENDAR</span>
              </a>

              <button
                onClick={downloadICS}
                className="py-3 px-4 bg-[#1A1114] border border-[#2A1A1D] hover:border-[#E08A17] text-[#F7F2F2] font-mono text-xs font-bold uppercase rounded-[2px] flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4 text-[#E08A17]" />
                <span>DOWNLOAD .ICS</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-[#2A1A1D]">
            <Link
              to="/"
              className="text-xs font-mono text-[#A79798] hover:text-white transition-colors underline"
            >
              RETURN TO LOGIN 2K26 HOMEPAGE
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Main Form Page ──
  const inputClass = "w-full bg-[#0A0607] border border-[#2A1A1D] focus:border-[#E01B22] rounded-[2px] px-3.5 py-2.5 text-[#F7F2F2] outline-none input-glow text-xs font-mono";
  const labelClass = "block text-[#A79798] mb-1 font-semibold text-xs font-mono uppercase tracking-wider";
  const errorClass = "text-[10px] text-[#FF2A2A] mt-0.5 font-mono";

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-[#0A0607] relative overflow-hidden text-[#F7F2F2]">
      
      {/* Background Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#4A050A]/20 via-transparent to-transparent pointer-events-none" />

      {/* Participant Student ID Modal */}
      {successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0607]/90 backdrop-blur-sm px-4">
          <div className="max-w-md w-full bg-[#130C0E] border border-[#1FA971] p-8 rounded-[2px] shadow-[0_0_40px_rgba(31,169,113,0.15)] text-center space-y-6 animate-scale-in">
            <div className="w-16 h-16 bg-[#1FA971]/20 border border-[#1FA971] text-[#1FA971] rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-display font-bold text-[#F2F2F4]">Registration Successful!</h2>
            <p className="text-xs text-[#9A9AA2] leading-relaxed">
              Your participant account has been created. Here is your unique LOGIN ID.
            </p>
            <div className="bg-[#0A0607] border border-[#2A1A1D] rounded p-4 flex flex-col items-center gap-3">
              <span className="text-xs text-[#A79798] uppercase tracking-widest font-semibold">Your Login ID</span>
              <div className="flex items-center gap-4">
                <span className="text-3xl font-mono font-bold text-[#E01B22] tracking-wider">{successData.loginId}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(successData.loginId);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="p-2 bg-[#2A1A1D] hover:bg-[#E01B22] text-[#F7F2F2] rounded transition-colors"
                  title="Copy Login ID"
                >
                  {copied ? <Check className="w-4 h-4 text-[#1FA971]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              onClick={() => navigate('/login', { state: { prefillLoginId: successData.loginId, prefillPassword: successData.password } })}
              className="inline-block w-full px-6 py-3 bg-[#E01B24] hover:bg-[#FF3B30] text-[#F2F2F4] font-bold text-sm font-mono rounded-[2px] transition-transform hover:scale-[1.02]"
            >
              PROCEED TO LOGIN
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-10 relative z-10">

        {/* ── ALUMNI HERO SECTION ── */}
        {userType === 'ALUMNI' ? (
          <div className="text-center space-y-4 sm:space-y-6 pt-2 sm:pt-4">
            {/* Timeline Legacy Badge */}
            <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1 sm:py-1.5 bg-[#1A0306] border border-[#E01B22] rounded-[2px] font-mono text-[10px] sm:text-xs font-bold text-[#E08A17] max-w-full overflow-hidden">
              <span>1983</span>
              <div className="w-8 sm:w-16 h-[1px] bg-[#E01B22] shrink" />
              <span>2026</span>
            </div>

            {/* Title */}
            <div className="space-y-1.5 sm:space-y-2">
              <h1 className="text-2xl xs:text-3xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight uppercase text-[#F7F2F2] leading-tight">
                WELCOME BACK, <span className="text-[#E01B22]">ALUMNI.</span>
              </h1>
              <p className="text-[10px] sm:text-sm font-mono text-[#E08A17] font-bold tracking-wider sm:tracking-widest uppercase leading-relaxed">
                LOGIN 2K26 — 35TH EDITION • RECONNECT. RELIVE. INSPIRE.
              </p>
            </div>

            {/* Emotional Hook Quote */}
            <div className="bg-[#130C0E] border-l-4 border-[#E01B22] p-3 sm:p-4 max-w-2xl mx-auto rounded-[2px] text-[11px] sm:text-xs font-mono text-[#A79798] italic">
              "From the batches before us to the generation after us. You were part of the journey. Now, come back and be part of the legacy."
            </div>
          </div>
        ) : (
          <div className="text-center space-y-3">
            <img src="/assets/login.webp" alt="LOGIN 2K26 Logo" className="h-16 w-auto mx-auto drop-shadow-[0_0_15px_rgba(224,27,34,0.4)]" />
            <div className="space-y-1">
              <h1 className="text-3xl font-display font-black text-[#F7F2F2] uppercase tracking-wider">
                REGISTER FOR LOGIN 2K26
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-[10px] font-mono font-bold tracking-widest uppercase rounded-sm shadow-[0_0_15px_rgba(234,179,8,0.15)]">
                <AlertCircle className="w-3.5 h-3.5" />
                Only for PG Students
              </span>
            </div>
            <p className="text-xs font-mono text-[#A79798]">
              National Level Cyber Symposium • Department of Computer Applications, PSG College of Technology
            </p>
          </div>
        )}

        {/* ── MAIN REGISTRATION CONTAINER ── */}
        <div className="bg-[#130C0E] border border-[#2A1A1D] p-6 sm:p-10 rounded-[2px] shadow-2xl space-y-8 relative corner-bracket-container">
          <div className="corner-bracket-tl" />
          <div className="corner-bracket-br" />

          {/* Registration Step Indicator */}
          {userType === 'ALUMNI' && (
            <div className="border-b border-[#2A1A1D] pb-6 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#E08A17] font-bold">ALUMNI REGISTRATION FORM</span>
                <span className="text-[#A79798]">STEP 1 OF 2</span>
              </div>
              <div className="flex items-center justify-between font-mono text-[10px] text-[#A79798]">
                <div className="flex items-center gap-1.5 text-[#E01B22] font-bold">
                  <span className="w-4 h-4 rounded-full bg-[#E01B22] text-white flex items-center justify-center text-[9px]">1</span>
                  <span>PROFILE & DETAILS</span>
                </div>
                <div className="h-px bg-[#2A1A1D] flex-1 mx-3" />
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#1A1114] border border-[#2A1A1D] text-[#A79798] flex items-center justify-center text-[9px]">2</span>
                  <span>CONFIRMATION & CALENDAR</span>
                </div>
              </div>
            </div>
          )}

          {/* Server Error */}
          {serverError && (
            <div className="bg-[#4A050A] border border-[#E01B22] p-4 rounded-[2px] flex items-center gap-3 text-xs font-mono text-[#FF2A2A]">
              <AlertCircle className="w-5 h-5 shrink-0 text-[#E01B22]" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Full Name *</label>
                <input type="text" {...register('name')} placeholder="e.g. Arun Kumar" className={inputClass} />
                {errors.name && <p className={errorClass}>{(errors.name as any).message}</p>}
              </div>

              <div>
                <label className={labelClass}>Gender *</label>
                <select {...register('gender')} className={inputClass} defaultValue="">
                  <option value="" disabled>Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                {errors.gender && <p className={errorClass}>{(errors.gender as any).message}</p>}
              </div>
            </div>

            {/* Email, OTP & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-1 sm:col-span-2">
                <label className={labelClass}>Email Address *</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    {...register('email')}
                    onBlur={(e) => {
                      register('email').onBlur(e);
                      handleEmailBlur(e);
                    }}
                    placeholder="you@college.edu"
                    className={`${inputClass} flex-1 ${emailExistsError ? 'border-[#E01B22] text-[#FF2A2A]' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={sendingOtp || !!emailExistsError}
                    className="px-3 sm:px-6 py-2.5 bg-[#1A0306] border border-[#E01B22] hover:bg-[#E01B22] text-[#F7F2F2] font-mono font-bold text-[10px] sm:text-xs uppercase rounded-[2px] transition-colors disabled:opacity-50 shrink-0"
                  >
                    {sendingOtp ? 'SENDING...' : otpSent ? 'RESEND OTP' : 'SEND OTP'}
                  </button>
                </div>
                {checkingEmail && <p className="text-[10px] font-mono text-[#E08A17] mt-1 animate-pulse">Verifying email in database...</p>}
                {(errors.email || emailExistsError) && <p className={errorClass}>{emailExistsError || (errors.email as any).message}</p>}
                {otpMessage && <p className="text-[10px] font-mono text-[#1FA971] mt-1">{otpMessage}</p>}
              </div>

              {otpSent && (
                <div className="animate-fade-in">
                  <label className={labelClass}>Enter OTP *</label>
                  <input
                    type="text"
                    {...register('otp')}
                    placeholder="6-digit code"
                    className={inputClass}
                    maxLength={6}
                  />
                  {errors.otp && <p className={errorClass}>{(errors.otp as any).message}</p>}
                </div>
              )}

              <div className={otpSent ? "" : "sm:col-span-2"}>
                <label className={labelClass}>WhatsApp Mobile Number *</label>
                <input
                  type="text"
                  {...register('phone')}
                  placeholder="e.g. 9876543210"
                  className={inputClass}
                />
                {errors.phone && <p className={errorClass}>{(errors.phone as any).message}</p>}
              </div>
            </div>

            {/* Alumni Specific Fields */}
            {userType === 'ALUMNI' ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Batch *</label>
                    <input
                      type="text"
                      {...register('batch_year')}
                      placeholder="e.g. 25MX"
                      className={inputClass}
                    />
                    {errors.batch_year && <p className={errorClass}>{(errors.batch_year as any).message}</p>}
                  </div>

                  <div>
                    <label className={labelClass}>City / Current Location</label>
                    <input type="text" {...register('place')} placeholder="e.g. Bengaluru / Coimbatore" className={inputClass} />
                  </div>

                  <div>
                    <label className={labelClass}>Current Organization</label>
                    <input type="text" {...register('current_organization')} placeholder="Company / Startup" className={inputClass} />
                  </div>
                </div>

                <div className="bg-[#0A0607] border border-[#2A1A1D] p-3.5 rounded-[2px]">
                  <label className="flex items-center gap-3 text-xs font-mono text-[#F7F2F2] cursor-pointer">
                    <input type="checkbox" {...register('accommodation_required')} className="h-4 w-4 accent-[#E01B22]" />
                    <span>Accommodation required for event days (Sep 18-19)</span>
                  </label>
                </div>
              </>
            ) : (
              /* Student Participant Fields */
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>College / Institution *</label>
                    <input list="colleges-list" type="text" {...register('college_name')} placeholder="Search or type college..." className={inputClass} />
                    <datalist id="colleges-list">
                      {COLLEGES.map((c) => <option key={c} value={c} />)}
                    </datalist>
                    {errors.college_name && <p className={errorClass}>{(errors.college_name as any).message}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>PG Department / Stream</label>
                    <select {...register('department')} className={inputClass}>
                      <option value="">Select PG Department (Optional)</option>
                      {PG_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Roll / Reg No. (Optional)</label>
                    <input type="text" {...register('roll_no')} placeholder="e.g. 24MX101" className={inputClass} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Year of Study</label>
                    <select {...register('year_of_study')} className={inputClass}>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                    </select>
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-3 text-xs font-mono text-[#F7F2F2] cursor-pointer">
                      <input type="checkbox" {...register('accommodation_required')} className="h-4 w-4 accent-[#E01B22]" />
                      <span>Accommodation required</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Password *</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} {...register('password')} placeholder="••••••••" className={`${inputClass} pr-11`} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A9AA2] hover:text-white">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className={errorClass}>{(errors.password as any).message}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Confirm Password *</label>
                    <div className="relative">
                      <input type={showConfirmPassword ? 'text' : 'password'} {...register('confirmPassword')} placeholder="••••••••" className={`${inputClass} pr-11`} />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A9AA2] hover:text-white">
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className={errorClass}>{(errors.confirmPassword as any).message}</p>}
                  </div>
                </div>
              </>
            )}

            {/* CTA Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#E01B22] hover:bg-[#FF2A2A] text-[#F7F2F2] font-bold font-mono text-sm uppercase rounded-[2px] transition-all shadow-[0_0_20px_rgba(224,27,34,0.3)] flex items-center justify-center gap-3 disabled:opacity-60"
            >
              {loading ? (
                'PROCESSING REGISTRATION...'
              ) : userType === 'ALUMNI' ? (
                <>
                  <span>REGISTER AS ALUMNI →</span>
                </>
              ) : (
                <>
                  <span>COMPLETE REGISTRATION</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* ── TRUST & PRIVACY FOOTER ── */}
          <div className="pt-4 border-t border-[#2A1A1D] text-center space-y-2 font-mono text-[11px] text-[#A79798]">
            <p className="flex items-center justify-center gap-1.5 text-[#F7F2F2]">
              <Lock className="w-3.5 h-3.5 text-[#1FA971]" />
              <span>Your information is strictly used for LOGIN 2K26 event coordination.</span>
            </p>
            <p>
              Officially organized by <strong className="text-[#F7F2F2]">Department of Computer Applications, PSG College of Technology</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
