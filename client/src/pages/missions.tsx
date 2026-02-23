import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { Target, Plus, ArrowRight, Clock } from "lucide-react";
import type { Mission } from "@shared/schema";

export default function Missions() {
  const { data: missions, isLoading } = useQuery<Mission[]>({
    queryKey: ["/api/missions"],
  });

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Missions"
        description="Active mission instances across all sectors"
        actions={
          <Link href="/missions/new">
            <Button data-testid="button-new-mission">
              <Plus className="h-4 w-4 mr-2" />
              New Mission
            </Button>
          </Link>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : missions && missions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {missions.map((mission) => (
            <Link href={`/missions/${mission.id}`} key={mission.id}>
              <Card className="hover-elevate cursor-pointer h-full" data-testid={`card-mission-${mission.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 flex-shrink-0">
                      <Target className="h-4 w-4 text-primary" />
                    </div>
                    <StatusBadge status={mission.status} />
                  </div>
                  <h3 className="text-sm font-semibold mb-1">{mission.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {mission.description || "No description"}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(mission.createdAt).toLocaleDateString()}
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Target className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-1">No missions yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first mission from a use-case template</p>
            <Link href="/missions/new">
              <Button data-testid="button-create-first-mission">
                <Plus className="h-4 w-4 mr-2" />
                Create Mission
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
