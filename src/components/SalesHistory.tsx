import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Sale {
  id: string;
  quantity: number;
  price: number;
  status: string;
  buyer_id: string;
  seller_id: string;
  buyer: { username: string };
  seller: { username: string };
  listing: {
    unit: {
      name: string;
      collection: string;
      image_url: string;
    };
  };
}

const SalesHistory = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    fetchSalesHistory();
  }, []);

  const fetchSalesHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from("pending_sales")
        .select(`
          id, quantity, price, status, buyer_id, seller_id,
          buyer:profiles!pending_sales_buyer_id_fkey(username),
          seller:profiles!pending_sales_seller_id_fkey(username),
          listing:listings(unit:units(name, collection, image_url))
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .neq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const groupSales = () => {
    const grouped: { [key: string]: { items: Sale[]; total: number; status: string; isBuyer: boolean; otherParty: string } } = {};
    
    sales.forEach((sale) => {
      const isBuyer = sale.buyer_id === currentUserId;
      const key = `${sale.buyer_id}-${sale.seller_id}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          items: [],
          total: 0,
          status: sale.status,
          isBuyer,
          otherParty: isBuyer ? sale.seller.username : sale.buyer.username
        };
      }
      grouped[key].items.push(sale);
      grouped[key].total += sale.quantity * sale.price;
    });

    return Object.entries(grouped);
  };

  if (loading) return <div className="text-center text-muted-foreground py-8">Carregando...</div>;
  if (sales.length === 0) return <div className="text-center text-muted-foreground py-8">Nenhuma transação encontrada</div>;

  return (
    <div className="space-y-4">
      {groupSales().map(([key, group]) => (
        <Collapsible key={key} open={expandedGroups.has(key)} onOpenChange={() => {
          setExpandedGroups(prev => {
            const newSet = new Set(prev);
            newSet.has(key) ? newSet.delete(key) : newSet.add(key);
            return newSet;
          });
        }}>
          <div className="rounded-lg border-2 border-border bg-muted/30">
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition">
                <div className="flex items-center gap-4">
                  {expandedGroups.has(key) ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  <div className="text-left">
                    <p className="font-semibold">{group.isBuyer ? "Compra de" : "Venda para"}: {group.otherParty}</p>
                    <p className="text-sm text-muted-foreground">{group.items.length} {group.items.length === 1 ? "item" : "itens"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={group.status === "approved" ? "default" : "destructive"}>
                    {group.status === "approved" ? "Aprovado" : "Rejeitado"}
                  </Badge>
                  <p className="font-bold text-primary">R$ {group.total.toFixed(2)}</p>
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-3">
                {group.items.map((sale) => (
                  <div key={sale.id} className="flex gap-4 p-3 rounded bg-background border border-border">
                    <img src={sale.listing.unit.image_url} alt={sale.listing.unit.name} className="w-16 h-16 object-cover rounded" onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{sale.listing.unit.name}</h4>
                      <p className="text-xs text-muted-foreground">{sale.listing.unit.collection}</p>
                      <p className="text-xs mt-1">{sale.quantity} x R$ {sale.price.toFixed(2)} = R$ {(sale.quantity * sale.price).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      ))}
    </div>
  );
};

export default SalesHistory;
