import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Users, Building2, Clock, Activity } from "lucide-react";
import type { User, Organization, AuditLog } from "@shared/schema";

export default function Admin() {
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: orgs } = useQuery<Organization[]>({
    queryKey: ["/api/admin/organizations"],
  });

  const { data: auditLogs } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
  });

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Administration"
        description="Users, roles, organizations, and audit trail"
      />

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="organizations" data-testid="tab-organizations">
            <Building2 className="h-4 w-4 mr-2" />
            Organizations
          </TabsTrigger>
          <TabsTrigger value="audit" data-testid="tab-audit">
            <Activity className="h-4 w-4 mr-2" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {usersLoading ? (
                <div className="p-4 space-y-3">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : users && users.length > 0 ? (
                <div className="divide-y">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between gap-3 p-4" data-testid={`user-${user.id}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{user.displayName}</p>
                          <p className="text-xs text-muted-foreground">@{user.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className="text-xs capitalize border-transparent bg-primary/10 text-primary">{user.role.replace(/_/g, " ")}</Badge>
                        <StatusBadge status={user.active ? "active" : "closed"} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-muted-foreground">No users found</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organizations" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {orgs && orgs.length > 0 ? (
                <div className="divide-y">
                  {orgs.map((org) => (
                    <div key={org.id} className="flex items-center justify-between gap-3 p-4" data-testid={`org-${org.id}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{org.name}</p>
                          <p className="text-xs text-muted-foreground">{org.slug}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs border-transparent bg-accent">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-muted-foreground">No organizations</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {auditLogs && auditLogs.length > 0 ? (
                  <div className="divide-y">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between gap-3 p-4" data-testid={`audit-${log.id}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent">
                            <Activity className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{log.action}</p>
                            <p className="text-xs text-muted-foreground">
                              {log.entityType} {log.entityId ? `(${log.entityId.substring(0, 8)}...)` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                          <Clock className="h-3 w-3" />
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-sm text-muted-foreground">No audit entries</div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
