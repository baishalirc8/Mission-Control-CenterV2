import { useLocation, Link } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Network,
  Target,
  GitBranch,
  Activity,
  Factory,
  BarChart3,
  Shield,
  Bell,
  LogOut,
  Crosshair,
  Terminal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import holocronLogo from "@assets/Holocron_Logo_Icon_White_1771788703008.png";

const platformItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Defense GIS", url: "/defense", icon: Crosshair },
  { title: "C2 Center", url: "/c2", icon: Terminal },
  { title: "Ontology", url: "/ontology", icon: Network },
  { title: "Missions", url: "/missions", icon: Target },
  { title: "Workflows", url: "/workflows", icon: GitBranch },
  { title: "Probes", url: "/probes", icon: Activity },
  { title: "Use-Cases", url: "/usecases", icon: Factory },
  { title: "KPIs", url: "/kpis", icon: BarChart3 },
];

const systemItems = [
  { title: "Admin", url: "/admin", icon: Shield },
];

export function AppSidebar() {
  const [location] = useLocation();

  const { data: notifications } = useQuery<any[]>({
    queryKey: ["/api/notifications/unread"],
  });

  const unreadCount = notifications?.length || 0;

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <img src={holocronLogo} alt="Holocron" className="h-8 w-8 rounded-md bg-slate-900 p-0.5" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-widest uppercase">Holocron</span>
            <span className="text-xs text-muted-foreground">Defense Command</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {platformItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    data-active={location === item.url || (item.url !== "/" && location.startsWith(item.url))}
                  >
                    <Link href={item.url} data-testid={`nav-${item.title.toLowerCase()}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    data-active={location.startsWith(item.url)}
                  >
                    <Link href={item.url} data-testid={`nav-${item.title.toLowerCase()}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton asChild data-active={location === "/notifications"}>
                  <Link href="/notifications" data-testid="nav-notifications">
                    <Bell className="h-4 w-4" />
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-auto text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="text-xs text-muted-foreground text-center">
          Authorized Personnel Only
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
