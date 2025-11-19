import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import EmployeeDetail from "./pages/EmployeeDetail";
import Roles from "./pages/Roles";
import Units from "./pages/Units";
import Departments from "./pages/Departments";
import Timesheets from "./pages/Timesheets";
import Benefits from "./pages/Benefits";
import Vacations from "./pages/Vacations";
import Trainings from "./pages/Trainings";
import PJContracts from "./pages/PJContracts";
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
            <Route path="/employees/:id" element={<AppLayout><EmployeeDetail /></AppLayout>} />
            <Route path="/departments" element={<AppLayout><Departments /></AppLayout>} />
            <Route path="/roles" element={<AppLayout><Roles /></AppLayout>} />
            <Route path="/units" element={<AppLayout><Units /></AppLayout>} />
            <Route path="/timesheets" element={<AppLayout><Timesheets /></AppLayout>} />
            <Route path="/benefits" element={<AppLayout><Benefits /></AppLayout>} />
            <Route path="/vacations" element={<AppLayout><Vacations /></AppLayout>} />
            <Route path="/trainings" element={<AppLayout><Trainings /></AppLayout>} />
            <Route path="/pj-contracts" element={<AppLayout><PJContracts /></AppLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
