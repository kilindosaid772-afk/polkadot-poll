import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Public pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Elections from "./pages/Elections";
import VotePage from "./pages/VotePage";
import Verify from "./pages/Verify";
import Explorer from "./pages/Explorer";
import Results from "./pages/Results";
import Calendar from "./pages/Calendar";
import NotFound from "./pages/NotFound";

// Voter pages
import VoterDashboard from "./pages/voter/VoterDashboard";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminElections from "./pages/admin/AdminElections";
import AdminVoters from "./pages/admin/AdminVoters";
import AdminCandidates from "./pages/admin/AdminCandidates";
import AdminBlockchain from "./pages/admin/AdminBlockchain";
import AdminAudit from "./pages/admin/AdminAudit";
import AdminAnalytics from "./pages/admin/AdminAnalytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/elections" element={<Elections />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/vote/:electionId" element={<VotePage />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/explorer" element={<Explorer />} />
            <Route path="/results/:electionId" element={<Results />} />
            <Route path="/results" element={<Results />} />

            {/* Voter Routes - Protected */}
            <Route path="/voter" element={
              <ProtectedRoute requireAdmin={false}>
                <VoterDashboard />
              </ProtectedRoute>
            } />

            {/* Admin Routes - Protected */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/elections" element={
              <ProtectedRoute requireAdmin>
                <AdminElections />
              </ProtectedRoute>
            } />
            <Route path="/admin/voters" element={
              <ProtectedRoute requireAdmin>
                <AdminVoters />
              </ProtectedRoute>
            } />
            <Route path="/admin/candidates" element={
              <ProtectedRoute requireAdmin>
                <AdminCandidates />
              </ProtectedRoute>
            } />
            <Route path="/admin/analytics" element={
              <ProtectedRoute requireAdmin>
                <AdminAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/admin/blockchain" element={
              <ProtectedRoute requireAdmin>
                <AdminBlockchain />
              </ProtectedRoute>
            } />
            <Route path="/admin/audit" element={
              <ProtectedRoute requireAdmin>
                <AdminAudit />
              </ProtectedRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
