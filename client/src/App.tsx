import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Apply from "./pages/Apply";
import AdminDashboard from "./pages/AdminDashboard";
import AdminApplicationDetail from "./pages/AdminApplicationDetail";
import AdminEvaluators from "./pages/AdminEvaluators";
import ApplicationConfirmation from "./pages/ApplicationConfirmation";
import EvaluatorAccept from "./pages/EvaluatorAccept";
import EvaluatorPortal from "./pages/EvaluatorPortal";
import EvaluatorScore from "./pages/EvaluatorScore";
import { useEffect } from "react";
import { useAuth } from "./_core/hooks/useAuth";

// After OAuth callback lands on "/", check sessionStorage for a pending
// returnPath and navigate there once the user is confirmed authenticated.
function PostLoginRedirect() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (loading || !user) return;
    const returnPath = sessionStorage.getItem("postLoginReturnPath");
    if (returnPath) {
      sessionStorage.removeItem("postLoginReturnPath");
      navigate(returnPath);
    }
  }, [user, loading, navigate]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/apply" component={Apply} />
      <Route path="/apply/confirmation" component={ApplicationConfirmation} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/application/:id" component={AdminApplicationDetail} />
      <Route path="/admin/evaluators" component={AdminEvaluators} />
      <Route path="/evaluator/accept" component={EvaluatorAccept} />
      <Route path="/evaluator" component={EvaluatorPortal} />
      <Route path="/evaluator/score/:id" component={EvaluatorScore} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-right" richColors />
          <PostLoginRedirect />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
