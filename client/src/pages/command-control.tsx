import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, AlertTriangle, Crosshair, Radio, Zap, Send, Target,
  Activity, Plane, Ship, Eye, ChevronRight, Clock, CheckCircle2,
  XCircle, RotateCw, Satellite, Terminal, Radar, Siren, Brain,
  ThumbsUp, ThumbsDown, Play, Sparkles, Loader2
} from "lucide-react";

const DIRECTIVE_TYPES = [
  { value: "reassign_orbit", label: "Reassign Orbit" },
  { value: "change_altitude", label: "Change Altitude" },
  { value: "retask_sensors", label: "Retask Sensors" },
  { value: "redirect_route", label: "Redirect Route" },
  { value: "recall_to_base", label: "Recall to Base" },
  { value: "weapons_hold", label: "Weapons Hold" },
  { value: "weapons_free", label: "Weapons Free" },
  { value: "go_dark", label: "Go Dark (EMCON)" },
  { value: "increase_readiness", label: "Increase Readiness" },
  { value: "deploy_countermeasures", label: "Deploy Countermeasures" },
];

const RESPONSE_TYPES = [
  { value: "track", label: "Track" },
  { value: "intercept", label: "Intercept" },
  { value: "engage", label: "Engage" },
  { value: "neutralize", label: "Neutralize" },
  { value: "evade", label: "Evade" },
  { value: "jam", label: "Electronic Warfare / Jam" },
  { value: "monitor", label: "Monitor Only" },
];

const QUICK_ACTIONS = [
  { id: "scramble_cap", label: "Scramble CAP", icon: Plane, color: "text-indigo-400", description: "Launch Combat Air Patrol fighters" },
  { id: "deploy_isr", label: "Deploy ISR to Grid", icon: Eye, color: "text-purple-400", description: "Retask nearest ISR asset to target grid" },
  { id: "activate_emcon", label: "Activate EMCON", icon: Radio, color: "text-amber-400", description: "Emission Control - reduce electromagnetic signature" },
  { id: "request_medevac", label: "Request MEDEVAC", icon: Activity, color: "text-red-400", description: "Dispatch medical evacuation to coordinates" },
  { id: "weapons_hold", label: "Weapons Hold - All", icon: Shield, color: "text-blue-400", description: "Cease all offensive operations theater-wide" },
  { id: "threat_warning", label: "Issue Threat Warning", icon: Siren, color: "text-red-400", description: "Broadcast threat warning to all friendly assets" },
  { id: "recall_assets", label: "Recall All Assets", icon: RotateCw, color: "text-emerald-400", description: "Order all deployed assets to return to base" },
  { id: "activate_jamming", label: "Activate EW Jamming", icon: Radar, color: "text-cyan-400", description: "Begin electronic warfare jamming operations" },
];

function DirectiveStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "pending": return <Clock className="h-3.5 w-3.5 text-amber-400" />;
    case "acknowledged": return <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />;
    case "executing": return <RotateCw className="h-3.5 w-3.5 text-indigo-400 animate-spin" />;
    case "completed": return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
    case "cancelled": return <XCircle className="h-3.5 w-3.5 text-gray-400" />;
    default: return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
  }
}

export default function CommandControl() {
  const { toast } = useToast();
  const [directiveDialog, setDirectiveDialog] = useState(false);
  const [threatDialog, setThreatDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState("");
  const [selectedThreat, setSelectedThreat] = useState("");
  const [directiveType, setDirectiveType] = useState("");
  const [directiveCommand, setDirectiveCommand] = useState("");
  const [directivePriority, setDirectivePriority] = useState("normal");
  const [directiveNotes, setDirectiveNotes] = useState("");
  const [responseType, setResponseType] = useState("");
  const [responsePriority, setResponsePriority] = useState("high");
  const [responseNotes, setResponseNotes] = useState("");

  const { data: overview } = useQuery<any>({ queryKey: ["/api/c2/overview"] });
  const { data: directives = [] } = useQuery<any[]>({ queryKey: ["/api/c2/directives"] });
  const { data: threatResponses = [] } = useQuery<any[]>({ queryKey: ["/api/c2/threat-responses"] });
  const { data: assets = [] } = useQuery<any[]>({ queryKey: ["/api/defense/geo-assets"] });
  const { data: telemetry = [] } = useQuery<any[]>({ queryKey: ["/api/telemetry/recent"] });

  const friendlyAssets = assets.filter((a: any) => a.category !== "threat");
  const threatAssets = assets.filter((a: any) => a.category === "threat");

  const createDirectiveMut = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/c2/directives", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/c2/directives"] });
      queryClient.invalidateQueries({ queryKey: ["/api/c2/overview"] });
      setDirectiveDialog(false);
      resetDirectiveForm();
      toast({ title: "Directive Issued", description: "Command sent to target endpoint" });
    },
  });

  const updateDirectiveMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/c2/directives/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/c2/directives"] });
      queryClient.invalidateQueries({ queryKey: ["/api/c2/overview"] });
    },
  });

  const createThreatResponseMut = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/c2/threat-responses", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/c2/threat-responses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/c2/overview"] });
      setThreatDialog(false);
      resetThreatForm();
      toast({ title: "Threat Response Initiated", description: "Response order dispatched" });
    },
  });

  const updateThreatResponseMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/c2/threat-responses/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/c2/threat-responses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/c2/overview"] });
    },
  });

  const quickActionMut = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/c2/quick-action", data);
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/c2/directives"] });
      queryClient.invalidateQueries({ queryKey: ["/api/c2/overview"] });
      toast({ title: "Quick Action Executed", description: `${variables.action} dispatched` });
    },
  });

  const { data: aiRecommendations = [], isLoading: aiLoading } = useQuery<any[]>({ queryKey: ["/api/ai/recommendations"] });

  const generateAiMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/recommendations/generate", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/recommendations"] });
      toast({ title: "AI Analysis Complete", description: "New tactical recommendations generated" });
    },
    onError: () => {
      toast({ title: "AI Analysis Failed", description: "Could not generate recommendations", variant: "destructive" });
    },
  });

  const approveRecMut = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const res = await apiRequest("PATCH", `/api/ai/recommendations/${id}/approve`, { notes });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/recommendations"] });
      toast({ title: "Recommendation Approved", description: "Action authorized for execution" });
    },
  });

  const rejectRecMut = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const res = await apiRequest("PATCH", `/api/ai/recommendations/${id}/reject`, { notes });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/recommendations"] });
      toast({ title: "Recommendation Rejected" });
    },
  });

  const executeRecMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/ai/recommendations/${id}/execute`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/recommendations"] });
      toast({ title: "Recommendation Executed", description: "Action has been carried out" });
    },
  });

  function resetDirectiveForm() {
    setSelectedAsset("");
    setDirectiveType("");
    setDirectiveCommand("");
    setDirectivePriority("normal");
    setDirectiveNotes("");
  }

  function resetThreatForm() {
    setSelectedThreat("");
    setResponseType("");
    setResponsePriority("high");
    setResponseNotes("");
  }

  function getAssetName(id: string) {
    const asset = assets.find((a: any) => a.id === id);
    return asset?.name || "Unknown";
  }

  function formatTime(ts: string) {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Command Control Center"
        description="Manage threats, issue directives to endpoints, and execute mission operations"
        actions={
          <div className="flex gap-2">
            <Dialog open={threatDialog} onOpenChange={setThreatDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm" data-testid="button-new-threat-response">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Threat Response
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Initiate Threat Response</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Target Threat</Label>
                    <Select value={selectedThreat} onValueChange={setSelectedThreat}>
                      <SelectTrigger data-testid="select-threat">
                        <SelectValue placeholder="Select threat to respond to" />
                      </SelectTrigger>
                      <SelectContent>
                        {threatAssets.map((t: any) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Response Type</Label>
                    <Select value={responseType} onValueChange={setResponseType}>
                      <SelectTrigger data-testid="select-response-type">
                        <SelectValue placeholder="Select response type" />
                      </SelectTrigger>
                      <SelectContent>
                        {RESPONSE_TYPES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={responsePriority} onValueChange={setResponsePriority}>
                      <SelectTrigger data-testid="select-response-priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={responseNotes}
                      onChange={(e) => setResponseNotes(e.target.value)}
                      placeholder="Additional context or ROE notes..."
                      data-testid="input-response-notes"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="destructive"
                    onClick={() => createThreatResponseMut.mutate({
                      threatAssetId: selectedThreat,
                      responseType,
                      priority: responsePriority,
                      notes: responseNotes,
                    })}
                    disabled={!selectedThreat || !responseType || createThreatResponseMut.isPending}
                    data-testid="button-submit-threat-response"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    {createThreatResponseMut.isPending ? "Dispatching..." : "Dispatch Response"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={directiveDialog} onOpenChange={setDirectiveDialog}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-new-directive">
                  <Terminal className="h-4 w-4 mr-1" />
                  Issue Directive
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Issue Endpoint Directive</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Target Endpoint</Label>
                    <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                      <SelectTrigger data-testid="select-asset">
                        <SelectValue placeholder="Select target asset" />
                      </SelectTrigger>
                      <SelectContent>
                        {friendlyAssets.map((a: any) => (
                          <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Directive Type</Label>
                    <Select value={directiveType} onValueChange={setDirectiveType}>
                      <SelectTrigger data-testid="select-directive-type">
                        <SelectValue placeholder="Select directive type" />
                      </SelectTrigger>
                      <SelectContent>
                        {DIRECTIVE_TYPES.map((d) => (
                          <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Command Details</Label>
                    <Input
                      value={directiveCommand}
                      onChange={(e) => setDirectiveCommand(e.target.value)}
                      placeholder="e.g., Move to grid 34.5N 33.8E at FL250"
                      data-testid="input-directive-command"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={directivePriority} onValueChange={setDirectivePriority}>
                      <SelectTrigger data-testid="select-directive-priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={directiveNotes}
                      onChange={(e) => setDirectiveNotes(e.target.value)}
                      placeholder="Additional instructions..."
                      data-testid="input-directive-notes"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => createDirectiveMut.mutate({
                      targetAssetId: selectedAsset,
                      type: directiveType,
                      command: directiveCommand,
                      priority: directivePriority,
                      notes: directiveNotes,
                    })}
                    disabled={!selectedAsset || !directiveType || !directiveCommand || createDirectiveMut.isPending}
                    data-testid="button-submit-directive"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    {createDirectiveMut.isPending ? "Sending..." : "Send Directive"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Controlled Endpoints"
          value={overview?.totalAssets || 0}
          description={`${overview?.activeAssets || 0} active`}
          icon={Satellite}
        />
        <StatCard
          title="Active Threats"
          value={overview?.totalThreats || 0}
          icon={AlertTriangle}
        />
        <StatCard
          title="Open Directives"
          value={overview?.activeDirectives || 0}
          description={`${overview?.pendingDirectives || 0} pending`}
          icon={Terminal}
        />
        <StatCard
          title="Active Responses"
          value={overview?.activeResponses || 0}
          icon={Shield}
        />
      </div>

      <Tabs defaultValue="threats" className="space-y-4">
        <TabsList data-testid="c2-tabs">
          <TabsTrigger value="threats" data-testid="tab-threats">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Threat Board
          </TabsTrigger>
          <TabsTrigger value="endpoints" data-testid="tab-endpoints">
            <Satellite className="h-4 w-4 mr-1" />
            Endpoint Control
          </TabsTrigger>
          <TabsTrigger value="directives" data-testid="tab-directives">
            <Terminal className="h-4 w-4 mr-1" />
            Directives Log
          </TabsTrigger>
          <TabsTrigger value="quick" data-testid="tab-quick-actions">
            <Zap className="h-4 w-4 mr-1" />
            Quick Actions
          </TabsTrigger>
          <TabsTrigger value="telemetry" data-testid="tab-telemetry">
            <Activity className="h-4 w-4 mr-1" />
            Telemetry
          </TabsTrigger>
          <TabsTrigger value="ai-advisor" data-testid="tab-ai-advisor">
            <Brain className="h-4 w-4 mr-1" />
            AI Advisor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="threats" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  Active Threats ({threatAssets.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[350px]">
                  <div className="space-y-3">
                    {threatAssets.map((threat: any) => (
                      <div
                        key={threat.id}
                        className="p-3 rounded-lg border bg-red-950/20 border-red-900/30 hover:border-red-700/50 transition-colors"
                        data-testid={`threat-card-${threat.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm truncate">{threat.name}</span>
                              <StatusBadge status={threat.status} />
                            </div>
                            <div className="text-xs text-muted-foreground space-y-0.5">
                              <div>Type: {threat.assetType?.replace(/_/g, " ")}</div>
                              <div>Position: {threat.lat?.toFixed(2)}N, {threat.lng?.toFixed(2)}E</div>
                              {threat.properties?.threat_level && (
                                <div className="flex items-center gap-1">
                                  Threat Level: <StatusBadge status={threat.properties.threat_level.toLowerCase()} />
                                </div>
                              )}
                              {threat.properties?.assessed_intent && (
                                <div>Intent: {threat.properties.assessed_intent}</div>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="shrink-0"
                            onClick={() => {
                              setSelectedThreat(threat.id);
                              setThreatDialog(true);
                            }}
                            data-testid={`button-respond-threat-${threat.id}`}
                          >
                            <Crosshair className="h-3 w-3 mr-1" />
                            Respond
                          </Button>
                        </div>
                      </div>
                    ))}
                    {threatAssets.length === 0 && (
                      <div className="text-center text-muted-foreground text-sm py-8">
                        No active threats detected
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-400" />
                  Response Orders ({threatResponses.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[350px]">
                  <div className="space-y-3">
                    {threatResponses.map((resp: any) => (
                      <div
                        key={resp.id}
                        className="p-3 rounded-lg border hover:border-muted-foreground/30 transition-colors"
                        data-testid={`response-card-${resp.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm capitalize">{resp.responseType?.replace(/_/g, " ")}</span>
                              <StatusBadge status={resp.status} />
                              <StatusBadge status={resp.priority} />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Target: {getAssetName(resp.threatAssetId)}
                            </div>
                            {resp.notes && (
                              <div className="text-xs text-muted-foreground mt-1">{resp.notes}</div>
                            )}
                            <div className="text-xs text-muted-foreground mt-1">
                              Issued: {formatTime(resp.createdAt)}
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            {resp.status === "pending" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateThreatResponseMut.mutate({ id: resp.id, status: "active" })}
                                data-testid={`button-activate-response-${resp.id}`}
                              >
                                Activate
                              </Button>
                            )}
                            {resp.status === "active" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateThreatResponseMut.mutate({ id: resp.id, status: "resolved" })}
                                data-testid={`button-resolve-response-${resp.id}`}
                              >
                                Resolve
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {threatResponses.length === 0 && (
                      <div className="text-center text-muted-foreground text-sm py-8">
                        No response orders issued
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {friendlyAssets.map((asset: any) => (
              <Card
                key={asset.id}
                className="hover:border-primary/30 transition-colors"
                data-testid={`endpoint-card-${asset.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{asset.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{asset.category?.replace(/_/g, " ")} - {asset.assetType?.replace(/_/g, " ")}</div>
                    </div>
                    <StatusBadge status={asset.status} />
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5 mb-3">
                    <div>Position: {asset.lat?.toFixed(2)}N, {asset.lng?.toFixed(2)}E</div>
                    {asset.properties?.altitude && <div>Altitude: {asset.properties.altitude}</div>}
                    {asset.properties?.callsign && <div>Callsign: {asset.properties.callsign}</div>}
                    {asset.properties?.sensors && <div>Sensors: {asset.properties.sensors}</div>}
                    {asset.properties?.endurance && <div>Endurance: {asset.properties.endurance}</div>}
                    {asset.properties?.weapons && <div>Weapons: {asset.properties.weapons}</div>}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSelectedAsset(asset.id);
                      setDirectiveDialog(true);
                    }}
                    data-testid={`button-directive-asset-${asset.id}`}
                  >
                    <Terminal className="h-3 w-3 mr-1" />
                    Issue Directive
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="directives" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Directive History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {directives.map((dir: any) => (
                    <div
                      key={dir.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:border-muted-foreground/30 transition-colors"
                      data-testid={`directive-row-${dir.id}`}
                    >
                      <DirectiveStatusIcon status={dir.status} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm capitalize">{dir.type?.replace(/_/g, " ")}</span>
                          <StatusBadge status={dir.status} />
                          <StatusBadge status={dir.priority} />
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {dir.command} &rarr; {getAssetName(dir.targetAssetId)}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0">
                        {formatTime(dir.createdAt)}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {dir.status === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateDirectiveMut.mutate({ id: dir.id, status: "acknowledged" })}
                              data-testid={`button-ack-directive-${dir.id}`}
                            >
                              ACK
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateDirectiveMut.mutate({ id: dir.id, status: "cancelled" })}
                              data-testid={`button-cancel-directive-${dir.id}`}
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        {dir.status === "acknowledged" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateDirectiveMut.mutate({ id: dir.id, status: "executing" })}
                            data-testid={`button-execute-directive-${dir.id}`}
                          >
                            Execute
                          </Button>
                        )}
                        {dir.status === "executing" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateDirectiveMut.mutate({ id: dir.id, status: "completed" })}
                            data-testid={`button-complete-directive-${dir.id}`}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {directives.length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      No directives issued yet
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quick" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {QUICK_ACTIONS.map((action) => (
              <Card
                key={action.id}
                className="hover:border-primary/30 transition-colors cursor-pointer group"
                data-testid={`quick-action-${action.id}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <action.icon className={`h-5 w-5 ${action.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{action.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{action.description}</div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => quickActionMut.mutate({ action: action.id, parameters: {} })}
                    disabled={quickActionMut.isPending}
                    data-testid={`button-execute-${action.id}`}
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Execute
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="telemetry" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" />
                Live Telemetry Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-1 font-mono text-xs">
                  {(overview?.recentTelemetry || telemetry || []).map((evt: any, i: number) => {
                    const severityMap: Record<string, string> = {
                      info: "text-blue-400",
                      warning: "text-amber-400",
                      critical: "text-red-400",
                      error: "text-red-500",
                    };
                    const severityColor = severityMap[evt.severity] || "text-muted-foreground";

                    return (
                      <div
                        key={evt.id || i}
                        className="flex items-start gap-2 p-2 rounded hover:bg-muted/50 transition-colors"
                        data-testid={`telemetry-event-${evt.id || i}`}
                      >
                        <span className="text-muted-foreground shrink-0 w-16">{formatTime(evt.timestamp)}</span>
                        <span className={`uppercase font-bold shrink-0 w-16 ${severityColor}`}>
                          [{evt.severity}]
                        </span>
                        <span className="text-muted-foreground shrink-0 w-28 truncate">{evt.type}</span>
                        <span className="flex-1">{evt.message}</span>
                      </div>
                    );
                  })}
                  {(!overview?.recentTelemetry || overview.recentTelemetry.length === 0) && telemetry.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      No telemetry events available
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-advisor" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-semibold">AI Tactical Advisor</h3>
              <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-400">
                Human-in-the-Loop
              </Badge>
            </div>
            <Button
              onClick={() => generateAiMut.mutate()}
              disabled={generateAiMut.isPending}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
              data-testid="button-generate-ai"
            >
              {generateAiMut.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Analyzing Situation...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-1" />
                  Generate Recommendations
                </>
              )}
            </Button>
          </div>

          {generateAiMut.isPending && (
            <Card className="border-purple-500/30 bg-purple-950/20">
              <CardContent className="py-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-3" />
                <p className="text-sm text-purple-300">AI is analyzing the operational theater...</p>
                <p className="text-xs text-muted-foreground mt-1">Evaluating threats, assets, intel reports, and mission status</p>
              </CardContent>
            </Card>
          )}

          {aiLoading && !generateAiMut.isPending && (
            <Card>
              <CardContent className="py-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading recommendations...</p>
              </CardContent>
            </Card>
          )}

          {!aiLoading && aiRecommendations.length === 0 && !generateAiMut.isPending && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Brain className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-2">No AI recommendations generated yet</p>
                <p className="text-xs text-muted-foreground">Click "Generate Recommendations" to analyze the current operational situation</p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4">
            {aiRecommendations.map((rec: any) => {
              const priorityColors: Record<string, string> = {
                critical: "border-red-500/50 bg-red-950/10",
                high: "border-amber-500/50 bg-amber-950/10",
                medium: "border-blue-500/50 bg-blue-950/10",
                low: "border-emerald-500/50 bg-emerald-950/10",
              };
              const priorityBadge: Record<string, string> = {
                critical: "bg-red-500/20 text-red-400 border-red-500/30",
                high: "bg-amber-500/20 text-amber-400 border-amber-500/30",
                medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
                low: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
              };
              const categoryLabels: Record<string, string> = {
                threat_response: "Threat Response",
                asset_reposition: "Asset Reposition",
                intelligence_collection: "Intelligence Collection",
                force_protection: "Force Protection",
                logistics: "Logistics",
                electronic_warfare: "Electronic Warfare",
                mission_planning: "Mission Planning",
              };
              const statusIcons: Record<string, any> = {
                pending: <Clock className="h-4 w-4 text-amber-400" />,
                approved: <ThumbsUp className="h-4 w-4 text-emerald-400" />,
                rejected: <ThumbsDown className="h-4 w-4 text-red-400" />,
                executed: <CheckCircle2 className="h-4 w-4 text-blue-400" />,
              };

              return (
                <Card
                  key={rec.id}
                  className={`${priorityColors[rec.priority] || ""} transition-all`}
                  data-testid={`ai-rec-${rec.id}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        {statusIcons[rec.status] || statusIcons.pending}
                        <CardTitle className="text-sm font-semibold">{rec.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className={`text-xs ${priorityBadge[rec.priority] || ""}`}>
                          {rec.priority?.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {categoryLabels[rec.category] || rec.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400">
                          {Math.round((rec.confidence || 0) * 100)}% conf
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm">{rec.summary}</p>

                    <div className="bg-muted/30 rounded-md p-3 space-y-2">
                      <div>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reasoning</span>
                        <p className="text-xs mt-0.5">{rec.reasoning}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Suggested Action</span>
                        <p className="text-xs mt-0.5 text-purple-300">{rec.suggestedAction}</p>
                      </div>
                    </div>

                    {(rec.affectedAssets?.length > 0 || rec.relatedThreats?.length > 0) && (
                      <div className="flex flex-wrap gap-1">
                        {(rec.affectedAssets || []).map((a: string, i: number) => (
                          <Badge key={`asset-${i}`} variant="secondary" className="text-xs">
                            {a}
                          </Badge>
                        ))}
                        {(rec.relatedThreats || []).map((t: string, i: number) => (
                          <Badge key={`threat-${i}`} variant="destructive" className="text-xs">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <div className="text-xs text-muted-foreground">
                        {rec.status === "pending" && "Awaiting human review"}
                        {rec.status === "approved" && `Approved${rec.reviewedAt ? ` at ${formatTime(rec.reviewedAt)}` : ""}`}
                        {rec.status === "rejected" && `Rejected${rec.reviewNotes ? ` — ${rec.reviewNotes}` : ""}`}
                        {rec.status === "executed" && `Executed${rec.executedAt ? ` at ${formatTime(rec.executedAt)}` : ""}`}
                      </div>
                      <div className="flex gap-2">
                        {rec.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-red-500/30 text-red-400 hover:bg-red-950/30"
                              onClick={() => rejectRecMut.mutate({ id: rec.id })}
                              disabled={rejectRecMut.isPending}
                              data-testid={`button-reject-${rec.id}`}
                            >
                              <ThumbsDown className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => approveRecMut.mutate({ id: rec.id })}
                              disabled={approveRecMut.isPending}
                              data-testid={`button-approve-${rec.id}`}
                            >
                              <ThumbsUp className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                          </>
                        )}
                        {rec.status === "approved" && (
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                            onClick={() => executeRecMut.mutate(rec.id)}
                            disabled={executeRecMut.isPending}
                            data-testid={`button-execute-${rec.id}`}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Execute
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
