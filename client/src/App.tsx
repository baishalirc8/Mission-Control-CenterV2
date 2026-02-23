import { Switch, Route } from "wouter";
import { queryClient, getQueryFn } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import OntologyExplorer from "@/pages/ontology";
import Missions from "@/pages/missions";
import MissionNew from "@/pages/mission-new";
import MissionDetail from "@/pages/mission-detail";
import Workflows from "@/pages/workflows";
import Probes from "@/pages/probes";
import UseCases from "@/pages/usecases";
import KPIs from "@/pages/kpis";
import Admin from "@/pages/admin";
import Login from "@/pages/login";
import NotificationsPage from "@/pages/notifications-page";
import DefenseMap from "@/pages/defense-map";
import CommandControl from "@/pages/command-control";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/ontology" component={OntologyExplorer} />
      <Route path="/missions" component={Missions} />
      <Route path="/missions/new" component={MissionNew} />
      <Route path="/missions/:id" component={MissionDetail} />
      <Route path="/workflows" component={Workflows} />
      <Route path="/probes" component={Probes} />
      <Route path="/usecases" component={UseCases} />
      <Route path="/kpis" component={KPIs} />
      <Route path="/admin" component={Admin} />
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/defense" component={DefenseMap} />
      <Route path="/c2" component={CommandControl} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center gap-2 p-2 border-b h-12 flex-shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2 ml-auto">
              <ThemeToggle />
              <span className="text-xs text-muted-foreground">Holocron v1.0</span>
            </div>
          </header>
          <main className="flex-1 min-h-0 overflow-auto">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppWithAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);

  const { data: user, isLoading } = useQuery<any>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  useEffect(() => {
    if (!isLoading) {
      setIsLoggedIn(!!user);
      setChecking(false);
    }
  }, [user, isLoading]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppWithAuth />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
