import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Sale {
  id: string;
  quantity: number;
  price: number;
  status: string;
  created_at: string;
  buyer: {
    username: string;
  };
  seller: {
    username: string;
  };
  listing: {
    unit: {
      name: string;
      image_url: string;
    };
  };
}

const SalesHistory = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalesHistory();
  }, []);

  const fetchSalesHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("pending_sales")
        .select(`
          id,
          quantity,
          price,
          status,
          created_at,
          buyer:profiles!pending_sales_buyer_id_fkey(username),
          seller:profiles!pending_sales_seller_id_fkey(username),
          listing:listings(
            unit:units(name, image_url)
          )
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error("Error fetching sales history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500">Pendente</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500">Aprovada</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500">Rejeitada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="text-center text-muted-foreground">Carregando histórico...</div>;
  }

  if (sales.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Nenhuma transação encontrada
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sales.map((sale) => (
        <Card key={sale.id} className="card-gradient border-2 border-border">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <img
                src={sale.listing.unit.image_url}
                alt={sale.listing.unit.name}
                className="w-16 h-16 object-cover rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{sale.listing.unit.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Comprador: {sale.buyer.username} | Vendedor: {sale.seller.username}
                    </p>
                  </div>
                  {getStatusBadge(sale.status)}
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Quantidade:</span>{" "}
                    <span className="font-medium">{sale.quantity}</span>
                  </div>
                  <div className="text-lg font-bold text-primary">
                    R$ {(sale.price * sale.quantity).toFixed(2)}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(sale.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SalesHistory;
