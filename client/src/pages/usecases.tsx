import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Factory, Target, ArrowRight, Shield, FileText, Briefcase } from "lucide-react";
import type { MissionTemplate, Mission } from "@shared/schema";

const sectorIcons: Record<string, any> = {
  itsm: Target,
  cyber_compliance: Shield,
  fiu_fatf: FileText,
};

const sectorColors: Record<string, string> = {
  itsm: "hsl(217, 91%, 35%)",
  cyber_compliance: "hsl(142, 76%, 32%)",
  fiu_fatf: "hsl(271, 81%, 38%)",
};

export default function UseCases() {
  const { data: templates, isLoading } = useQuery<MissionTemplate[]>({
    queryKey: ["/api/mission-templates"],
  });

  const { data: missions } = useQuery<Mission[]>({
    queryKey: ["/api/missions"],
  });

  const getInstalledCount = (templateId: string) => {
    return missions?.filter(m => m.templateId === templateId).length || 0;
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Use-Case Factory"
        description="Browse templates and create mission instances"
        actions={
          <Link href="/missions/new">
            <Button data-testid="button-create-mission">
              <Target className="h-4 w-4 mr-2" />
              Create Mission
            </Button>
          </Link>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-40 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates?.map((tmpl) => {
            const IconComp = sectorIcons[tmpl.sector] || Factory;
            const color = sectorColors[tmpl.sector] || "#6366f1";
            const installed = getInstalledCount(tmpl.id);
            return (
              <Card key={tmpl.id} className="hover-elevate" data-testid={`template-card-${tmpl.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-md"
                      style={{ backgroundColor: color + "18" }}
                    >
                      <IconComp className="h-5 w-5" style={{ color }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{tmpl.name}</h3>
                      <Badge variant="outline" className="text-xs capitalize border-transparent bg-accent mt-1">{tmpl.sector.replace(/_/g, " ")}</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-3">
                    {tmpl.description || "No description"}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs border-transparent bg-accent">
                        {installed} installed
                      </Badge>
                    </div>
                    <Link href="/missions/new">
                      <Button size="sm" variant="outline" data-testid={`button-use-template-${tmpl.id}`}>
                        Use Template
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                  <div className="mt-4 pt-3 border-t">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Includes</p>
                    <div className="flex flex-wrap gap-1">
                      {(tmpl.targetRoles as string[] || []).map((role) => (
                        <Badge key={role} variant="outline" className="text-xs border-transparent bg-muted capitalize">{role}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="text-center text-xs text-muted-foreground py-4 border-t">
        Demo data only.
      </div>
    </div>
  );
}
