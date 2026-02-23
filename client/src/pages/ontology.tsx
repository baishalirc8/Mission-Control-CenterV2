import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import {
  Network,
  Search,
  Filter,
  Box,
  User,
  Building2,
  Monitor,
  Ticket,
  Shield,
  FileText,
  Briefcase,
  ArrowRight,
} from "lucide-react";
import type { OntologyEntity, OntologyRelationship, OntologyType } from "@shared/schema";

const typeIcons: Record<string, any> = {
  Person: User,
  Organization: Building2,
  Asset: Box,
  System: Monitor,
  Ticket: Ticket,
  Control: Shield,
  STR: FileText,
  BOEntity: Briefcase,
  Case: FileText,
  Event: Network,
};

export default function OntologyExplorer() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);

  const { data: types, isLoading: typesLoading } = useQuery<OntologyType[]>({
    queryKey: ["/api/ontology/types"],
  });

  const { data: entities, isLoading: entitiesLoading } = useQuery<OntologyEntity[]>({
    queryKey: ["/api/ontology/entities"],
  });

  const { data: relationships } = useQuery<OntologyRelationship[]>({
    queryKey: ["/api/ontology/relationships"],
  });

  const { data: entityDetail } = useQuery<any>({
    queryKey: ["/api/ontology/entities", selectedEntity],
    enabled: !!selectedEntity,
  });

  const filteredEntities = entities?.filter((e) => {
    const matchesSearch = !searchTerm || e.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || e.typeId === selectedType;
    return matchesSearch && matchesType;
  });

  const selectedEntityData = entities?.find(e => e.id === selectedEntity);
  const relatedRelationships = relationships?.filter(
    r => r.sourceId === selectedEntity || r.targetId === selectedEntity
  );

  const isLoading = typesLoading || entitiesLoading;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Ontology Explorer"
        description="Browse entities, relationships, and the semantic graph"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Entity Types</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-3 pt-0">
              <Button
                variant={selectedType === null ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start"
                onClick={() => setSelectedType(null)}
                data-testid="filter-all-types"
              >
                <Box className="h-4 w-4 mr-2" />
                All Types
                <Badge variant="outline" className="ml-auto border-transparent bg-muted text-xs">{entities?.length || 0}</Badge>
              </Button>
              {types?.map((type) => {
                const IconComp = typeIcons[type.name] || Box;
                const count = entities?.filter(e => e.typeId === type.id).length || 0;
                return (
                  <Button
                    key={type.id}
                    variant={selectedType === type.id ? "secondary" : "ghost"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setSelectedType(type.id)}
                    data-testid={`filter-type-${type.name}`}
                  >
                    <IconComp className="h-4 w-4 mr-2" />
                    {type.name}
                    <Badge variant="outline" className="ml-auto border-transparent bg-muted text-xs">{count}</Badge>
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search entities..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    data-testid="input-search-entities"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                  </div>
                ) : filteredEntities && filteredEntities.length > 0 ? (
                  <div className="divide-y">
                    {filteredEntities.map((entity) => {
                      const type = types?.find(t => t.id === entity.typeId);
                      const IconComp = type ? (typeIcons[type.name] || Box) : Box;
                      return (
                        <div
                          key={entity.id}
                          className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                            selectedEntity === entity.id ? "bg-accent" : "hover:bg-accent/50"
                          }`}
                          onClick={() => setSelectedEntity(entity.id)}
                          data-testid={`entity-${entity.id}`}
                        >
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-md"
                            style={{ backgroundColor: (type?.color || "#6366f1") + "20" }}
                          >
                            <IconComp className="h-4 w-4" style={{ color: type?.color || "#6366f1" }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{entity.name}</p>
                            <p className="text-xs text-muted-foreground">{type?.name || "Unknown"}</p>
                          </div>
                          <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
                    <Network className="h-8 w-8 mb-2 opacity-30" />
                    No entities found
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                {selectedEntityData ? "Entity Detail" : "Select an Entity"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEntityData ? (
                <Tabs defaultValue="properties">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="properties" data-testid="tab-properties">Properties</TabsTrigger>
                    <TabsTrigger value="relationships" data-testid="tab-relationships">Relationships</TabsTrigger>
                  </TabsList>
                  <TabsContent value="properties" className="space-y-4 mt-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Name</p>
                      <p className="text-sm font-medium">{selectedEntityData.name}</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Type</p>
                      <p className="text-sm">{types?.find(t => t.id === selectedEntityData.typeId)?.name}</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Properties</p>
                      {selectedEntityData.properties && Object.keys(selectedEntityData.properties as any).length > 0 ? (
                        <div className="space-y-2">
                          {Object.entries(selectedEntityData.properties as any).map(([k, v]) => (
                            <div key={k} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{k}</span>
                              <span className="font-medium">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No properties</p>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="relationships" className="mt-4">
                    {relatedRelationships && relatedRelationships.length > 0 ? (
                      <div className="space-y-3">
                        {relatedRelationships.map((rel) => {
                          const isSource = rel.sourceId === selectedEntity;
                          const otherId = isSource ? rel.targetId : rel.sourceId;
                          const otherEntity = entities?.find(e => e.id === otherId);
                          return (
                            <div key={rel.id} className="flex items-center gap-2 p-2 rounded-md bg-accent/30">
                              <Badge variant="outline" className="text-xs border-transparent bg-primary/10 text-primary">{rel.type}</Badge>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <span
                                className="text-sm cursor-pointer text-primary"
                                onClick={() => setSelectedEntity(otherId)}
                              >
                                {otherEntity?.name || otherId}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No relationships</p>
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
                  <Network className="h-8 w-8 mb-2 opacity-30" />
                  Click an entity to view details
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
