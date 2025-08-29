import Navigation from "@/components/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data: notifications = [] } = useQuery<any[]>({ queryKey: ["/api/notifications"] });

  const markAllMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/notifications/mark-all-read");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] })
  });

  return (
    <div className="min-h-screen bg-baartal-cream">
      <Navigation />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-baartal-blue flex items-center"><Bell className="h-6 w-6 mr-2" /> Notifications</h1>
          <Button variant="outline" onClick={() => markAllMutation.mutate()} disabled={markAllMutation.isPending}>Mark all read</Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Recent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="text-gray-600">You're all caught up.</div>
              ) : notifications.map((n: any) => (
                <div key={n.id} className="p-3 bg-white rounded border">
                  <div className="font-medium">{n.title || n.type}</div>
                  <div className="text-sm text-gray-600">{n.message}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


