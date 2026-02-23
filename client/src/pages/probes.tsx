import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Activity, Play, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import type { ProbeDefinition, ProbeRun } from "@shared/schema";

export default function Probes() {
  const { toast } = useToast();
  const [selectedProbe, setSelectedProbe] = useState<string | null>(null);

  const { data: probes, isLoading } = useQuery<ProbeDefinition[]>({
    queryKey: ["/api/probes"],
  });

  const { data: runs } = useQuery<ProbeRun[]>({
    queryKey: ["/api/probes", selectedProbe, "runs"],
    enabled: !!selectedProbe,
  });

  const runProbe = useMutation({
    mutationFn: async (probeId: string) => {
      const res = await apiRequest("POST", `/api/probes/${probeId}/run`);
      return res.json();
    },
    onSuccess: (_, probeId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/probes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/probes", probeId, "runs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/telemetry/recent"] });
      toast({ title: "Probe executed", description: "Check the results below." });
    },
    onError: (err: Error) => {
      toast({ title: "Probe failed", description: err.message, variant: "destructive" });
    },
  });

  const getProbeIcon = (status: string) => {
    switch (status) {
      case "pass": return <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case "fail": return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Probes Dashboard"
        description="Runtime telemetry, health checks, and evidence generation"
      />

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 space-y-3">
            {probes && probes.length > 0 ? probes.map((probe) => (
              <Card
                key={probe.id}
                className={`cursor-pointer transition-colors ${selectedProbe === probe.id ? "border-primary" : ""}`}
                onClick={() => setSelectedProbe(probe.id)}
                data-testid={`probe-${probe.id}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 flex-shrink-0 mt-0.5">
                        <Activity className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">{probe.name}</h3>
                        <p className="text-xs text-muted-foreground mb-2">{probe.description || "No description"}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs capitalize border-transparent bg-accent">{probe.type}</Badge>
                          {probe.schedule && (
                            <Badge variant="outline" className="text-xs border-transparent bg-accent">
                              <Clock className="h-3 w-3 mr-1" />
                              {probe.schedule}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={probe.active ? "active" : "closed"} />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          runProbe.mutate(probe.id);
                        }}
                        disabled={runProbe.isPending}
                        data-testid={`button-run-probe-${probe.id}`}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Run Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Activity className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium mb-1">No probes configured</h3>
                  <p className="text-sm text-muted-foreground">Probes are auto-created with missions</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-5">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {selectedProbe ? "Probe Run History" : "Select a Probe"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedProbe && runs ? (
                  runs.length > 0 ? (
                    <div className="space-y-3">
                      {runs.map((run) => (
                        <div key={run.id} className="flex items-center justify-between gap-2 p-3 rounded-md bg-accent/30" data-testid={`probe-run-${run.id}`}>
                          <div className="flex items-center gap-2 min-w-0">
                            {getProbeIcon(run.status)}
                            <div className="min-w-0">
                              <p className="text-sm font-medium capitalize">{run.status}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(run.startedAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <StatusBadge status={run.status} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No runs yet. Click "Run Now" to execute.</p>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
                    <Activity className="h-8 w-8 mb-2 opacity-30" />
                    Click a probe to view its history
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
