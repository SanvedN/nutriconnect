import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing-page";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import DietPlanner from "@/pages/diet-planner";
import RecipeGenerator from "@/pages/recipe-generator";
import WorkoutPlanner from "@/pages/workout-planner";
import WeightLog from "@/pages/weight-log";
import Community from "@/pages/community";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/diet" component={DietPlanner} />
      <ProtectedRoute path="/recipes" component={RecipeGenerator} />
      <ProtectedRoute path="/workout" component={WorkoutPlanner} />
      <ProtectedRoute path="/weight" component={WeightLog} />
      <ProtectedRoute path="/community" component={Community} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
