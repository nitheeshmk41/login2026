import { create } from 'zustand';

export interface UserProfile {
  id: number;
  login_id: string | null;
  name: string;
  fullName?: string;
  email: string;
  phone: string | null;
  college_name: string | null;
  department: string | null;
  roll_no: string | null;
  // Canonical portal roles:
  // admin → admin
  // coordinator → coordinator
  // registration_desk → registration_desk
  // participant → participant
  // alumni is signup-only metadata and is not a portal login role
  role: 'admin' | 'coordinator' | 'registration_desk' | 'participant';
  user_type: 'PARTICIPANT' | 'ALUMNI' | 'STAFF';
  student_id_code?: string | null;
  must_change_password?: boolean;
  is_active: boolean;
  hasPaidFee?: boolean;
  registrations?: any[];
  accommodation_required?: boolean;
}

interface AuthState {
  isInitialized: boolean;
  isAuthenticated: boolean;
  token: string | null;
  user: UserProfile | null;
  survivor: UserProfile | null;
  setInitialized: (isInitialized: boolean) => void;
  setAuth: (isAuthenticated: boolean, token: string | null, user?: UserProfile | null) => void;
  setUser: (user: UserProfile | null) => void;
  setSurvivor: (user: UserProfile | null) => void;
  resetAuth: () => void;
}

const normalizeRole = (role?: string | null): UserProfile['role'] => {
  const value = String(role || '').trim().toLowerCase();
  const mapping: Record<string, UserProfile['role']> = {
    student: 'participant',
    participant: 'participant',
    event_coordinator: 'coordinator',
    coordinator: 'coordinator',
    special_user: 'coordinator',
    junior_attendance: 'coordinator',
    registration_desk: 'registration_desk',
    desk: 'registration_desk',
    admin: 'admin',
    super_admin: 'admin',
    admin_power: 'admin',
  };

  return mapping[value] || 'participant';
};

export const useAuthStore = create<AuthState>((set) => ({
  isInitialized: false,
  isAuthenticated: !!localStorage.getItem('token'),
  token: localStorage.getItem('token'),
  user: null,
  survivor: null,
  setInitialized: (isInitialized) => set({ isInitialized }),
  setAuth: (isAuthenticated, token, user = null) => {
    const safeUser = user ? {
      ...user,
      role: normalizeRole(user.role),
    } : null;

    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ isAuthenticated, token, user: safeUser as UserProfile, survivor: safeUser as UserProfile });
  },
  setUser: (user) => set({ user, survivor: user }),
  setSurvivor: (survivor) => set({ user: survivor, survivor }),
  resetAuth: () => {
    localStorage.removeItem('token');
    set({ isAuthenticated: false, token: null, user: null, survivor: null });
  },
}));

// ── Role helpers ────────────────────────────────────────────────────────────
const ADMIN_ROLES = ['admin'] as const;
const COORD_ROLES = ['coordinator'] as const;
const REGISTRATION_DESK_ROLES = ['registration_desk'] as const;
const PARTICIPANT_ROLES = ['participant'] as const;

export const isAdminRole = (role?: string | null): boolean =>
  ADMIN_ROLES.includes((normalizeRole(role) as typeof ADMIN_ROLES[number]));

export const isCoordinatorRole = (role?: string | null): boolean =>
  COORD_ROLES.includes((normalizeRole(role) as typeof COORD_ROLES[number]));

export const isRegistrationDeskRole = (role?: string | null): boolean =>
  REGISTRATION_DESK_ROLES.includes((normalizeRole(role) as typeof REGISTRATION_DESK_ROLES[number]));

export const isStudentRole = (role?: string | null): boolean =>
  PARTICIPANT_ROLES.includes((normalizeRole(role) as typeof PARTICIPANT_ROLES[number]));

