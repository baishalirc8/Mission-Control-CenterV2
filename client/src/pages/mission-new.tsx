import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Target, ArrowLeft, Rocket } from "lucide-react";
import type { MissionTemplate } from "@shared/schema";

export default function MissionNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: templates, isLoading } = useQuery<MissionTemplate[]>({
    queryKey: ["/api/mission-templates"],
  });

  const createMission = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/missions", {
        templateId: selectedTemplate,
        name,
        description,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/missions"] });
      toast({ title: "Mission created", description: "Your new mission has been launched." });
      setLocation(`/missions/${data.id}`);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const selectedTemplateData = templates?.find(t => t.id === selectedTemplate);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Create Mission"
        description="Launch a new mission instance from a template"
        actions={
          <Button variant="outline" size="sm" onClick={() => setLocation("/missions")} data-testid="button-back-missions">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">1. Choose Template</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {templates?.map((tmpl) => (
                    <div
                      key={tmpl.id}
                      className={`p-4 rounded-md border cursor-pointer transition-colors ${
                        selectedTemplate === tmpl.id
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      }`}
                      onClick={() => {
                        setSelectedTemplate(tmpl.id);
                        if (!name) setName(tmpl.name + " - Instance");
                      }}
                      data-testid={`template-${tmpl.id}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{tmpl.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{tmpl.description}</p>
                      <Badge variant="outline" className="text-xs capitalize border-transparent bg-accent">{tmpl.sector}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">2. Mission Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Mission Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter mission name..."
                  data-testid="input-mission-name"
                />
              </div>
              <div>
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe this mission..."
                  data-testid="input-mission-description"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedTemplateData ? (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Template</p>
                    <p className="text-sm font-medium">{selectedTemplateData.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Sector</p>
                    <Badge variant="outline" className="capitalize border-transparent bg-accent">{selectedTemplateData.sector}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Mission Name</p>
                    <p className="text-sm">{name || "Not set"}</p>
                  </div>
                  <Button
                    className="w-full"
                    disabled={!name || !selectedTemplate || createMission.isPending}
                    onClick={() => createMission.mutate()}
                    data-testid="button-launch-mission"
                  >
                    <Rocket className="h-4 w-4 mr-2" />
                    {createMission.isPending ? "Launching..." : "Launch Mission"}
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Select a template to get started
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
