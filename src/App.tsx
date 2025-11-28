import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Public pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Elections from "./pages/Elections";
import VotePage from "./pages/VotePage";
import Verify from "./pages/Verify";
import Explorer from "./pages/Explorer";
import Results from "./pages/Results";
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
            <Route path="/vote/:electionId" element={<VotePage />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/explorer" element={<Explorer />} />
            <Route path="/results/:electionId" element={<Results />} />
            <Route path="/results" element={<Results />} />

            {/* Voter Routes */}
            <Route path="/voter" element={<VoterDashboard />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/elections" element={<AdminElections />} />
            <Route path="/admin/voters" element={<AdminVoters />} />
            <Route path="/admin/candidates" element={<AdminCandidates />} />
            <Route path="/admin/blockchain" element={<AdminBlockchain />} />
            <Route path="/admin/audit" element={<AdminAudit />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
