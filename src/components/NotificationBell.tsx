import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Notification {
  id: string;
  type: "pending" | "approved";
  message: string;
  saleId: string;
}

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get pending sales where user is seller
    const { data: pendingSales } = await supabase
      .from("pending_sales")
      .select("id, status, buyer:profiles!pending_sales_buyer_id_fkey(username)")
      .eq("seller_id", user.id)
      .eq("status", "pending");

    // Get recently approved sales where user is buyer
    const { data: approvedSales } = await supabase
      .from("pending_sales")
      .select("id, status, seller:profiles!pending_sales_seller_id_fkey(username)")
      .eq("buyer_id", user.id)
      .eq("status", "approved")
      .gte("updated_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24h

    const notifs: Notification[] = [];

    pendingSales?.forEach((sale) => {
      notifs.push({
        id: sale.id,
        type: "pending",
        message: `Nova compra pendente de ${(sale.buyer as any)?.username}`,
        saleId: sale.id,
      });
    });

    approvedSales?.forEach((sale) => {
      notifs.push({
        id: sale.id,
        type: "approved",
        message: `Venda aprovada por ${(sale.seller as any)?.username}`,
        saleId: sale.id,
      });
    });

    setNotifications(notifs);
  };

  useEffect(() => {
    fetchNotifications();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchNotifications();
    });

    // Realtime subscription for pending_sales changes
    const channel = supabase
      .channel("pending_sales_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pending_sales",
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  const handleNotificationClick = () => {
    navigate("/dashboard");
    setNotifications([]);
  };

  if (notifications.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {notifications.length}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {notifications.map((notif) => (
          <DropdownMenuItem
            key={notif.id}
            onClick={handleNotificationClick}
            className="cursor-pointer"
          >
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">{notif.message}</p>
              <p className="text-xs text-muted-foreground">
                {notif.type === "pending" ? "Aguardando aprovação" : "Clique para ver detalhes"}
              </p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
