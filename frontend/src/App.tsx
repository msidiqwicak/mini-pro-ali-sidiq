import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import type { ReactNode } from "react";

// Pages
import HomePage from "./pages/HomePage";
import EventDetailPage from "./pages/EventDetailPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MyTicketsPage from "./pages/MyTicketsPage";
import TransactionHistoryPage from "./pages/TransactionHistoryPage";
import ProfilePage from "./pages/ProfilePage";

// Dashboard
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import DashboardOverview from "./pages/dashboard/DashboardOverview";
import ManageEvents from "./pages/dashboard/ManageEvents";
import CreateEvent from "./pages/dashboard/CreateEvent";
import EditEvent from "./pages/dashboard/EditEvent";
import DashboardTransactions from "./pages/dashboard/DashboardTransactions";
import DashboardAnalytics from "./pages/dashboard/DashboardAnalytics";
import OrganizerProfilePage from "./pages/OrganizerProfilePage";

// ─── Protected Route ──────────────────────────────────────────────
const ProtectedRoute = ({
  children,
  role,
}: {
  children: ReactNode;
  role?: "CUSTOMER" | "ORGANIZER";
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen bg-[#0a0a0b]" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
};

// ─── Guest Route (hanya bisa diakses kalau belum login) ───────────
const GuestRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen bg-[#0a0a0b]" />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};
const App = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Public ── */}
        <Route path="/" element={<HomePage />} />
        <Route path="/events/:slug" element={<EventDetailPage />} />
        <Route path="/organizer/:id" element={<OrganizerProfilePage />} />

        {/* ── Guest only ── */}
        <Route path="/login" element={
          <GuestRoute><LoginPage /></GuestRoute>
        } />
        <Route path="/register" element={
          <GuestRoute><RegisterPage /></GuestRoute>
        } />

        {/* ── Customer only ── */}
        <Route path="/my-tickets" element={
          <ProtectedRoute role="CUSTOMER"><MyTicketsPage /></ProtectedRoute>
        } />
        <Route path="/transactions" element={
          <ProtectedRoute role="CUSTOMER"><TransactionHistoryPage /></ProtectedRoute>
        } />

        {/* ── Profile (any authenticated user) ── */}
        <Route path="/profile" element={
          <ProtectedRoute><ProfilePage /></ProtectedRoute>
        } />

        {/* ── Organizer Dashboard ── */}
        <Route path="/dashboard" element={
          <ProtectedRoute role="ORGANIZER"><DashboardLayout /></ProtectedRoute>
        }>
          <Route index element={<DashboardOverview />} />
          <Route path="events" element={<ManageEvents />} />
          <Route path="events/create" element={<CreateEvent />} />
          <Route path="events/:id/edit" element={<EditEvent />} />
          <Route path="transactions" element={<DashboardTransactions />} />
          <Route path="analytics" element={<DashboardAnalytics />} />
        </Route>

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
};

export default App;