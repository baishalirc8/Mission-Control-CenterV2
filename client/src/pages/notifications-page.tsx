import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Bell, CheckCheck, Clock, AlertTriangle, Info, Shield } from "lucide-react";
import type { Notification } from "@shared/schema";

const typeIcons: Record<string, any> = {
  assignment: Info,
  approval_needed: AlertTriangle,
  probe_failure: Shield,
  sla_breach: Clock,
};

export default function NotificationsPage() {
  const { toast } = useToast();

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/notifications/read-all");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread"] });
      toast({ title: "All notifications marked as read" });
    },
  });

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Notifications"
        description="System alerts, assignments, and approvals"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            data-testid="button-mark-all-read"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : notifications && notifications.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {notifications.map((notif) => {
                const IconComp = typeIcons[notif.type] || Bell;
                return (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 p-4 ${!notif.read ? "bg-primary/5" : ""}`}
                    data-testid={`notification-${notif.id}`}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 flex-shrink-0 mt-0.5">
                      <IconComp className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium">{notif.title}</p>
                        {!notif.read && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-1">No notifications</h3>
            <p className="text-sm text-muted-foreground">You're all caught up</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
