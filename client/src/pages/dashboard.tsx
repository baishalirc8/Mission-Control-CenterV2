import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  Target,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const PIE_COLORS = ["hsl(217, 91%, 35%)", "hsl(142, 76%, 32%)", "hsl(271, 81%, 38%)", "hsl(24, 88%, 42%)", "hsl(340, 82%, 38%)"];

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentMissions } = useQuery<any[]>({
    queryKey: ["/api/missions"],
  });

  const { data: recentTelemetry } = useQuery<any[]>({
    queryKey: ["/api/telemetry/recent"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader title="Executive Dashboard" description="Holocron command overview" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  const missionsByType = stats?.missionsByType || [];
  const probeStats = stats?.probeStats || { pass: 0, fail: 0, warning: 0 };
  const probeChartData = [
    { name: "Pass", value: probeStats.pass },
    { name: "Fail", value: probeStats.fail },
    { name: "Warning", value: probeStats.warning },
  ].filter(d => d.value > 0);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Executive Dashboard"
        description="Real-time mission status, telemetry, and KPI overview"
        actions={
          <Link href="/kpis">
            <Button variant="outline" size="sm" data-testid="button-view-kpis">
              <BarChart3 className="h-4 w-4 mr-2" />
              View KPIs
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Missions"
          value={stats?.activeMissions || 0}
          icon={Target}
          description="Across all sectors"
        />
        <StatCard
          title="Probe Pass Rate"
          value={`${stats?.probePassRate || 0}%`}
          icon={Activity}
          description="Last 24 hours"
        />
        <StatCard
          title="Overdue Tasks"
          value={stats?.overdueTasks || 0}
          icon={AlertTriangle}
          description="Requiring attention"
        />
        <StatCard
          title="Evidence Items"
          value={stats?.evidenceCount || 0}
          icon={CheckCircle}
          description="Collected this period"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Missions by Sector</CardTitle>
          </CardHeader>
          <CardContent>
            {missionsByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={missionsByType}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="sector" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(217, 91%, 35%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
                No mission data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Probe Results</CardTitle>
          </CardHeader>
          <CardContent>
            {probeChartData.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={220}>
                  <PieChart>
                    <Pie data={probeChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                      {probeChartData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        color: 'hsl(var(--foreground))',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {probeChartData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: PIE_COLORS[i] }} />
                      <span className="text-sm">{d.name}</span>
                      <span className="text-sm font-semibold ml-auto tabular-nums">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
                No probe data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
            <CardTitle className="text-base font-medium">Recent Missions</CardTitle>
            <Link href="/missions">
              <Button variant="ghost" size="sm" data-testid="button-view-missions">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentMissions && recentMissions.length > 0 ? (
              <div className="space-y-3">
                {recentMissions.slice(0, 5).map((m: any) => (
                  <Link href={`/missions/${m.id}`} key={m.id}>
                    <div className="flex items-center justify-between gap-2 p-3 rounded-md hover-elevate cursor-pointer border border-transparent" data-testid={`mission-${m.id}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <Target className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{m.name}</p>
                          <p className="text-xs text-muted-foreground">{m.description?.substring(0, 60) || "No description"}</p>
                        </div>
                      </div>
                      <StatusBadge status={m.status} />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
                <Target className="h-8 w-8 mb-2 opacity-30" />
                No missions created yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
            <CardTitle className="text-base font-medium">Recent Telemetry</CardTitle>
            <Link href="/probes">
              <Button variant="ghost" size="sm" data-testid="button-view-probes">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentTelemetry && recentTelemetry.length > 0 ? (
              <div className="space-y-3">
                {recentTelemetry.slice(0, 5).map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between gap-2 p-3 rounded-md border border-transparent">
                    <div className="flex items-center gap-3 min-w-0">
                      <Activity className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{t.message}</p>
                        <p className="text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {new Date(t.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={t.severity} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
                <Activity className="h-8 w-8 mb-2 opacity-30" />
                No telemetry events yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-xs text-muted-foreground py-4 border-t">
        Demo data only. This platform uses synthetic data for demonstration purposes.
      </div>
    </div>
  );
}
