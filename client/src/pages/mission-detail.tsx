import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft,
  GitBranch,
  ListTodo,
  FileCheck,
  Clock,
  Play,
  Download,
  User,
  CheckCircle,
} from "lucide-react";

export default function MissionDetail() {
  const [, params] = useRoute("/missions/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const missionId = params?.id;

  const { data: mission, isLoading } = useQuery<any>({
    queryKey: ["/api/missions", missionId],
    enabled: !!missionId,
  });

  const { data: workflow } = useQuery<any>({
    queryKey: ["/api/missions", missionId, "workflow"],
    enabled: !!missionId,
  });

  const { data: tasks } = useQuery<any[]>({
    queryKey: ["/api/missions", missionId, "tasks"],
    enabled: !!missionId,
  });

  const { data: evidence } = useQuery<any[]>({
    queryKey: ["/api/missions", missionId, "evidence"],
    enabled: !!missionId,
  });

  const { data: timeline } = useQuery<any[]>({
    queryKey: ["/api/missions", missionId, "timeline"],
    enabled: !!missionId,
  });

  const transitionMutation = useMutation({
    mutationFn: async (toState: string) => {
      const res = await apiRequest("POST", `/api/missions/${missionId}/transition`, { toState });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/missions", missionId] });
      queryClient.invalidateQueries({ queryKey: ["/api/missions", missionId, "workflow"] });
      queryClient.invalidateQueries({ queryKey: ["/api/missions", missionId, "timeline"] });
      toast({ title: "Transition successful" });
    },
    onError: (err: Error) => {
      toast({ title: "Transition failed", description: err.message, variant: "destructive" });
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/missions/${missionId}/export`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mission-${missionId}-evidence-pack.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({ title: "Evidence pack exported" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-60" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Mission not found</p>
      </div>
    );
  }

  const availableTransitions = workflow?.availableTransitions || [];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={mission.name}
        description={mission.description}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => exportMutation.mutate()} data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              Export Evidence Pack
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLocation("/missions")} data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-3 flex-wrap">
        <StatusBadge status={mission.status} />
        {workflow && (
          <Badge variant="outline" className="border-transparent bg-accent">
            <GitBranch className="h-3 w-3 mr-1" />
            State: {workflow.currentState}
          </Badge>
        )}
      </div>

      {availableTransitions.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Available Transitions</p>
            <div className="flex items-center gap-2 flex-wrap">
              {availableTransitions.map((t: any) => (
                <Button
                  key={t.toState}
                  size="sm"
                  onClick={() => transitionMutation.mutate(t.toState)}
                  disabled={transitionMutation.isPending}
                  data-testid={`button-transition-${t.toState}`}
                >
                  <Play className="h-3 w-3 mr-1" />
                  {t.label || t.toState}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks" data-testid="tab-tasks">Tasks</TabsTrigger>
          <TabsTrigger value="evidence" data-testid="tab-evidence">Evidence</TabsTrigger>
          <TabsTrigger value="timeline" data-testid="tab-timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tasks Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-medium">{tasks?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="font-medium">{tasks?.filter((t: any) => t.status === "completed").length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="font-medium">{tasks?.filter((t: any) => t.status === "pending").length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Evidence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{evidence?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Collected items</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Workflow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">{workflow?.currentState || "N/A"}</div>
                <p className="text-xs text-muted-foreground">{timeline?.length || 0} transitions</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {tasks && tasks.length > 0 ? (
                <div className="divide-y">
                  {tasks.map((task: any) => (
                    <div key={task.id} className="flex items-center justify-between gap-3 p-4" data-testid={`task-${task.id}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <ListTodo className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          <p className="text-xs text-muted-foreground">{task.description || "No description"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <StatusBadge status={task.priority || "medium"} />
                        <StatusBadge status={task.status} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
                  <ListTodo className="h-8 w-8 mb-2 opacity-30" />
                  No tasks created yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evidence" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {evidence && evidence.length > 0 ? (
                <div className="divide-y">
                  {evidence.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 p-4" data-testid={`evidence-${item.id}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <FileCheck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.type} - {new Date(item.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      {item.hash && (
                        <code className="text-xs text-muted-foreground font-mono">{item.hash.substring(0, 12)}...</code>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
                  <FileCheck className="h-8 w-8 mb-2 opacity-30" />
                  No evidence collected yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardContent className="p-4">
              {timeline && timeline.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                  <div className="space-y-6">
                    {timeline.map((entry: any, i: number) => (
                      <div key={entry.id || i} className="flex gap-4 relative">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-card border flex-shrink-0 z-10">
                          <CheckCircle className="h-3 w-3 text-primary" />
                        </div>
                        <div className="min-w-0 pt-0.5">
                          <p className="text-sm font-medium">
                            {entry.fromState} <span className="text-muted-foreground mx-1">-&gt;</span> {entry.toState}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {new Date(entry.timestamp).toLocaleString()}
                            {entry.notes && ` - ${entry.notes}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
                  <Clock className="h-8 w-8 mb-2 opacity-30" />
                  No transitions yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="text-center text-xs text-muted-foreground py-2">
        Demo data only.
      </div>
    </div>
  );
}
