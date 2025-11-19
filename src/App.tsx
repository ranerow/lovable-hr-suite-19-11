import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
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
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { AppLayout } from "./components/layouts/AppLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
        <Route path="/employees" element={<AppLayout><Employees /></AppLayout>} />
        <Route path="/employees/new" element={<AppLayout><EmployeeForm /></AppLayout>} />
        <Route path="/employees/:id" element={<AppLayout><EmployeeDetail /></AppLayout>} />
        <Route path="/employees/:id/edit" element={<AppLayout><EmployeeForm /></AppLayout>} />
            <Route path="/departments" element={<AppLayout><Departments /></AppLayout>} />
            <Route path="/roles" element={<AppLayout><Roles /></AppLayout>} />
            <Route path="/units" element={<AppLayout><Units /></AppLayout>} />
            <Route path="/timesheets" element={<AppLayout><Timesheets /></AppLayout>} />
            <Route path="/benefits" element={<AppLayout><Benefits /></AppLayout>} />
            <Route path="/vacations" element={<AppLayout><Vacations /></AppLayout>} />
            <Route path="/trainings" element={<AppLayout><Trainings /></AppLayout>} />
            <Route path="/pj-contracts" element={<AppLayout><PJContracts /></AppLayout>} />
            <Route path="/recruitment" element={<AppLayout><Recruitment /></AppLayout>} />
            <Route path="/compliance" element={<AppLayout><Compliance /></AppLayout>} />
            <Route path="/reports" element={<AppLayout><Reports /></AppLayout>} />
            <Route path="/permissions" element={<AppLayout><Permissions /></AppLayout>} />
            <Route path="/finance-rh" element={<AppLayout><FinanceRH /></AppLayout>} />
            <Route path="/documents" element={<AppLayout><Documents /></AppLayout>} />
            <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
