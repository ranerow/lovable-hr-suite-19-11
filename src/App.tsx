import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { FontSizeProvider } from "@/contexts/FontSizeContext";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import ArchivedEmployees from "./pages/ArchivedEmployees";
import EmployeeForm from "./pages/EmployeeForm";
import EmployeeDetail from "./pages/EmployeeDetail";
import Roles from "./pages/Roles";
import Units from "./pages/Units";
import Departments from "./pages/Departments";
import Timesheets from "./pages/Timesheets";
import Benefits from "./pages/Benefits";
import Vacations from "./pages/Vacations";
import Trainings from "./pages/Trainings";
import PJContracts from "./pages/PJContracts";
import Recruitment from "./pages/Recruitment";
import Compliance from "./pages/Compliance";
import Reports from "./pages/Reports";
import Permissions from "./pages/Permissions";
import FinanceRH from "./pages/FinanceRH";
import Documents from "./pages/Documents";
import EmployeeDocuments from "./pages/EmployeeDocuments";
import TestPlan from "./pages/TestPlan";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import OnboardingPortal from "./pages/OnboardingPortal";
import OnboardingInvitations from "./pages/OnboardingInvitations";
import EmployeeReview from "./pages/EmployeeReview";
import UserManagement from "./pages/UserManagement";
import { AppLayout } from "./components/layouts/AppLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <FontSizeProvider>
        <BrowserRouter>
          <TooltipProvider>
            <Toaster />
            <Sonner />
        <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding/:token" element={<OnboardingPortal />} />
            <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
            <Route path="/employees" element={<ProtectedRoute><AppLayout><Employees /></AppLayout></ProtectedRoute>} />
            <Route path="/archived-employees" element={<ProtectedRoute><AppLayout><ArchivedEmployees /></AppLayout></ProtectedRoute>} />
            <Route path="/employees/new" element={<ProtectedRoute><AppLayout><EmployeeForm /></AppLayout></ProtectedRoute>} />
            <Route path="/employees/:id" element={<ProtectedRoute><AppLayout><EmployeeDetail /></AppLayout></ProtectedRoute>} />
            <Route path="/employees/:id/review" element={<ProtectedRoute><AppLayout><EmployeeReview /></AppLayout></ProtectedRoute>} />
            <Route path="/employees/:id/edit" element={<ProtectedRoute><AppLayout><EmployeeForm /></AppLayout></ProtectedRoute>} />
            <Route path="/departments" element={<ProtectedRoute><AppLayout><Departments /></AppLayout></ProtectedRoute>} />
            <Route path="/roles" element={<ProtectedRoute><AppLayout><Roles /></AppLayout></ProtectedRoute>} />
            <Route path="/units" element={<ProtectedRoute><AppLayout><Units /></AppLayout></ProtectedRoute>} />
            <Route path="/timesheets" element={<ProtectedRoute><AppLayout><Timesheets /></AppLayout></ProtectedRoute>} />
            <Route path="/benefits" element={<ProtectedRoute><AppLayout><Benefits /></AppLayout></ProtectedRoute>} />
            <Route path="/vacations" element={<ProtectedRoute><AppLayout><Vacations /></AppLayout></ProtectedRoute>} />
            <Route path="/trainings" element={<ProtectedRoute><AppLayout><Trainings /></AppLayout></ProtectedRoute>} />
            <Route path="/pj-contracts" element={<ProtectedRoute><AppLayout><PJContracts /></AppLayout></ProtectedRoute>} />
            <Route path="/recruitment" element={<ProtectedRoute><AppLayout><Recruitment /></AppLayout></ProtectedRoute>} />
            <Route path="/compliance" element={<ProtectedRoute><AppLayout><Compliance /></AppLayout></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><AppLayout><Reports /></AppLayout></ProtectedRoute>} />
            <Route path="/permissions" element={<ProtectedRoute><AppLayout><Permissions /></AppLayout></ProtectedRoute>} />
            <Route path="/finance-rh" element={<ProtectedRoute><AppLayout><FinanceRH /></AppLayout></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><AppLayout><Documents /></AppLayout></ProtectedRoute>} />
            <Route path="/employee-documents" element={<ProtectedRoute><AppLayout><EmployeeDocuments /></AppLayout></ProtectedRoute>} />
            <Route path="/onboarding-invitations" element={<ProtectedRoute><AppLayout><OnboardingInvitations /></AppLayout></ProtectedRoute>} />
            <Route path="/test-plan" element={<ProtectedRoute><AppLayout><TestPlan /></AppLayout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />
            <Route path="/user-management" element={<ProtectedRoute><AppLayout><UserManagement /></AppLayout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
      </FontSizeProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
