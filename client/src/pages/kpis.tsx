import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  BarChart3,
  RefreshCw,
  Target,
  Clock,
  AlertTriangle,
  Activity,
  Ticket,
  Shield,
  FileText,
} from "lucide-react";
import type { KpiSnapshot } from "@shared/schema";

export default function KPIs() {
  const { toast } = useToast();

  const { data: kpis, isLoading } = useQuery<KpiSnapshot[]>({
    queryKey: ["/api/kpis"],
  });

  const computeKpis = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/kpis/compute");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kpis"] });
      toast({ title: "KPIs computed", description: "Dashboard updated with latest metrics." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const getKpisByCategory = (category: string) => {
    return kpis?.filter(k => k.category === category) || [];
  };

  const getKpiValue = (name: string) => {
    const kpi = kpis?.find(k => k.name === name);
    return kpi?.value || "0";
  };

  const platformKpis = getKpisByCategory("platform");
  const itsmKpis = getKpisByCategory("itsm");
  const cyberKpis = getKpisByCategory("cyber_compliance");
  const fiuKpis = getKpisByCategory("fiu_fatf");

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="KPI Dashboard"
        description="Key performance indicators across all mission sectors"
        actions={
          <Button
            onClick={() => computeKpis.mutate()}
            disabled={computeKpis.isPending}
            data-testid="button-compute-kpis"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${computeKpis.isPending ? "animate-spin" : ""}`} />
            {computeKpis.isPending ? "Computing..." : "Compute KPIs"}
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <>
          <div>
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Platform Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Active Missions" value={getKpiValue("active_missions")} icon={Target} />
              <StatCard title="Avg Time in State" value={getKpiValue("avg_time_in_state") + "h"} icon={Clock} />
              <StatCard title="Overdue Tasks" value={getKpiValue("overdue_tasks")} icon={AlertTriangle} />
              <StatCard title="Probe Pass Rate" value={getKpiValue("probe_pass_rate") + "%"} icon={Activity} />
            </div>
          </div>

          <Separator />

          <div>
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Ticket className="h-4 w-4" style={{ color: "hsl(217, 91%, 35%)" }} />
              ITSM Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {itsmKpis.length > 0 ? itsmKpis.map((kpi) => (
                <Card key={kpi.id}>
                  <CardContent className="p-5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.name.replace(/_/g, " ")}</p>
                    <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                  </CardContent>
                </Card>
              )) : (
                <Card className="col-span-full">
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    Click "Compute KPIs" to generate ITSM metrics
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" style={{ color: "hsl(142, 76%, 32%)" }} />
              Cyber Compliance Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cyberKpis.length > 0 ? cyberKpis.map((kpi) => (
                <Card key={kpi.id}>
                  <CardContent className="p-5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.name.replace(/_/g, " ")}</p>
                    <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                  </CardContent>
                </Card>
              )) : (
                <Card className="col-span-full">
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    Click "Compute KPIs" to generate compliance metrics
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" style={{ color: "hsl(271, 81%, 38%)" }} />
              FIU / FATF Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fiuKpis.length > 0 ? fiuKpis.map((kpi) => (
                <Card key={kpi.id}>
                  <CardContent className="p-5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.name.replace(/_/g, " ")}</p>
                    <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                  </CardContent>
                </Card>
              )) : (
                <Card className="col-span-full">
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    Click "Compute KPIs" to generate FIU/FATF metrics
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}

      <div className="text-center text-xs text-muted-foreground py-4 border-t">
        Demo data only.
      </div>
    </div>
  );
}
