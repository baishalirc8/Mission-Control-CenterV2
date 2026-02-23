import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { GitBranch, Plus, CheckCircle, Circle, ArrowRight } from "lucide-react";
import type { WorkflowDefinition } from "@shared/schema";

const defaultWorkflowJson = JSON.stringify({
  states: [
    { name: "open", label: "Open", initial: true },
    { name: "in_progress", label: "In Progress" },
    { name: "review", label: "Review" },
    { name: "closed", label: "Closed", final: true }
  ],
  transitions: [
    { from: "open", to: "in_progress", label: "Start", roles: ["operator", "admin"] },
    { from: "in_progress", to: "review", label: "Submit for Review", roles: ["operator", "admin"] },
    { from: "review", to: "closed", label: "Approve & Close", roles: ["supervisor", "admin"] },
    { from: "review", to: "in_progress", label: "Return", roles: ["supervisor", "admin"] }
  ]
}, null, 2);

export default function Workflows() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [jsonDef, setJsonDef] = useState(defaultWorkflowJson);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const { data: workflows, isLoading } = useQuery<WorkflowDefinition[]>({
    queryKey: ["/api/workflow-definitions"],
  });

  const createWorkflow = useMutation({
    mutationFn: async () => {
      try {
        const parsed = JSON.parse(jsonDef);
        const res = await apiRequest("POST", "/api/workflow-definitions", {
          name,
          description,
          states: parsed.states,
          transitions: parsed.transitions,
        });
        return res.json();
      } catch (e: any) {
        throw new Error(e.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflow-definitions"] });
      toast({ title: "Workflow created" });
      setOpen(false);
      setName("");
      setDescription("");
      setJsonDef(defaultWorkflowJson);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const validateJson = (val: string) => {
    setJsonDef(val);
    try {
      const parsed = JSON.parse(val);
      if (!parsed.states || !parsed.transitions) {
        setJsonError("JSON must contain 'states' and 'transitions' arrays");
      } else {
        setJsonError(null);
      }
    } catch {
      setJsonError("Invalid JSON");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Workflow Definitions"
        description="Define and manage workflow state machines"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-workflow">
                <Plus className="h-4 w-4 mr-2" />
                New Workflow
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Workflow Definition</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Workflow name" data-testid="input-workflow-name" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" data-testid="input-workflow-desc" />
                </div>
                <div>
                  <Label>Definition (JSON)</Label>
                  <Textarea
                    value={jsonDef}
                    onChange={(e) => validateJson(e.target.value)}
                    className="font-mono text-xs min-h-[200px]"
                    data-testid="input-workflow-json"
                  />
                  {jsonError && <p className="text-xs text-destructive mt-1">{jsonError}</p>}
                </div>
                <Button
                  onClick={() => createWorkflow.mutate()}
                  disabled={!name || !!jsonError || createWorkflow.isPending}
                  className="w-full"
                  data-testid="button-save-workflow"
                >
                  {createWorkflow.isPending ? "Creating..." : "Create Workflow"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : workflows && workflows.length > 0 ? (
        <div className="space-y-3">
          {workflows.map((wf) => {
            const states = (wf.states as any[]) || [];
            const transitions = (wf.transitions as any[]) || [];
            return (
              <Card key={wf.id} data-testid={`workflow-${wf.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 flex-shrink-0 mt-0.5">
                        <GitBranch className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">{wf.name}</h3>
                        <p className="text-xs text-muted-foreground mb-3">{wf.description || "No description"}</p>
                        <div className="flex items-center gap-1 flex-wrap">
                          {states.map((s: any, i: number) => (
                            <div key={s.name} className="flex items-center gap-1">
                              <Badge
                                variant="outline"
                                className={`text-xs border-transparent ${s.initial ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" : s.final ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" : "bg-accent"}`}
                              >
                                {s.initial && <Circle className="h-2 w-2 mr-1 fill-current" />}
                                {s.final && <CheckCircle className="h-2 w-2 mr-1" />}
                                {s.label || s.name}
                              </Badge>
                              {i < states.length - 1 && (
                                <ArrowRight className="h-3 w-3 text-muted-foreground mx-0.5" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className="text-xs border-transparent bg-accent">{transitions.length} transitions</Badge>
                      {wf.published ? (
                        <Badge variant="outline" className="text-xs border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">Published</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">Draft</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <GitBranch className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-1">No workflows yet</h3>
            <p className="text-sm text-muted-foreground">Create your first workflow definition</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
