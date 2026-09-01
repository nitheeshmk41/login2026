import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';

import { HomePage } from '../pages/HomePage';
import { AboutPage } from '../pages/AboutPage';
import { EventsPage } from '../pages/EventsPage';
import { EventDetailsPage } from '../pages/EventDetailsPage';
import { TimelinePage } from '../pages/TimelinePage';
import { GalleryPage } from '../pages/GalleryPage';
import { ContactPage } from '../pages/ContactPage';
import { CoordinatorsPage } from '../pages/CoordinatorsPage';
import { WinnersPage } from '../pages/WinnersPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { ChangePasswordPage } from '../pages/ChangePasswordPage';

// Shared dashboard layout (role-aware sidebar)
import { ProtectedRoute } from '../components/ProtectedRoute';
import { DashboardLayout } from '../layouts/DashboardLayout';

// Participant dashboard pages
import { DashboardHome } from '../pages/dashboard/DashboardHome';
import { ProfilePage as DashboardProfilePage } from '../pages/dashboard/ProfilePage';
import { DashboardEventsPage } from '../pages/dashboard/DashboardEventsPage';
import { MyRegistrationsPage } from '../pages/dashboard/MyRegistrationsPage';
import { MyPaymentPage } from '../pages/dashboard/MyPaymentPage';
import { MyTeamsPage } from '../pages/dashboard/MyTeamsPage';
import { NotificationsPage } from '../pages/dashboard/NotificationsPage';
import { CertificatesPage } from '../pages/dashboard/CertificatesPage';

// Admin pages (rendered inside DashboardLayout)
import { AdminPage } from '../pages/AdminPage';

// Coordinator pages (rendered inside DashboardLayout)
import { CoordinatorPage } from '../pages/CoordinatorPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'home', element: <HomePage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'events', element: <EventsPage /> },
      { path: 'events/:id', element: <EventDetailsPage /> },
      { path: 'winners', element: <WinnersPage /> },
      { path: 'timeline', element: <TimelinePage /> },
      { path: 'gallery', element: <GalleryPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'coordinators', element: <CoordinatorsPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'alumni-register', element: <RegisterPage /> },
      { path: 'alumni', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
      { path: 'change-password', element: <ChangePasswordPage /> },

      // ── Unified Dashboard (all roles use the same DashboardLayout) ────────
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute requireRole="">
            <DashboardLayout />
          </ProtectedRoute>
        ),
        children: [
          // Participant routes
          {
            index: true,
            element: (
              <ProtectedRoute requireRole="participant">
                <DashboardHome />
              </ProtectedRoute>
            ),
          },
          { path: 'profile', element: <ProtectedRoute requireRole="participant"><DashboardProfilePage /></ProtectedRoute> },
          { path: 'events', element: <ProtectedRoute requireRole="participant"><DashboardEventsPage /></ProtectedRoute> },
          { path: 'payment', element: <ProtectedRoute requireRole="participant"><MyPaymentPage /></ProtectedRoute> },
          { path: 'registrations', element: <ProtectedRoute requireRole="participant"><MyRegistrationsPage /></ProtectedRoute> },
          { path: 'certificates', element: <ProtectedRoute requireRole="participant"><CertificatesPage /></ProtectedRoute> },
          { path: 'winners', element: <ProtectedRoute requireRole=""><WinnersPage /></ProtectedRoute> },
          { path: 'teams', element: <ProtectedRoute requireRole="participant"><MyTeamsPage /></ProtectedRoute> },
          { path: 'notifications', element: <ProtectedRoute requireRole="participant"><NotificationsPage /></ProtectedRoute> },

          // Admin routes — section driven by URL path
          {
            path: 'admin',
            element: <ProtectedRoute requireRole="admin"><AdminPage /></ProtectedRoute>,
          },
          {
            path: 'admin/:section',
            element: <ProtectedRoute requireRole="admin"><AdminPage /></ProtectedRoute>,
          },

          // Coordinator routes — section driven by URL path
          {
            path: 'coordinator',
            element: <ProtectedRoute requireRole="coordinator"><CoordinatorPage /></ProtectedRoute>,
          },
          {
            path: 'coordinator/:section',
            element: <ProtectedRoute requireRole="coordinator"><CoordinatorPage /></ProtectedRoute>,
          },
        ],
      },

      // ── Legacy redirects ──────────────────────────────────────────────────
      { path: 'profile', element: <Navigate to="/dashboard/profile" replace /> },
      { path: 'payment', element: <Navigate to="/dashboard/payment" replace /> },
      { path: 'registered-events', element: <Navigate to="/dashboard/registrations" replace /> },
      { path: 'team', element: <Navigate to="/dashboard/teams" replace /> },

      // Old standalone admin/coordinator paths → new nested paths
      { path: 'admin', element: <Navigate to="/dashboard/admin" replace /> },
      { path: 'admin/access-control', element: <Navigate to="/dashboard/admin/create-user" replace /> },
      { path: 'coordinator', element: <Navigate to="/dashboard/coordinator" replace /> },
      { path: 'event-dashboard', element: <Navigate to="/dashboard/coordinator" replace /> },
      { path: 'junior-attendance', element: <Navigate to="/dashboard/coordinator/attendance" replace /> },
      { path: 'special-user', element: <Navigate to="/dashboard/admin" replace /> },

      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
