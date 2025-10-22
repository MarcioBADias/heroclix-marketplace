import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";

interface PendingSale {
  id: string;
  quantity: number;
  price: number;
  status: string;
  buyer: {
    username: string;
  };
  listing: {
    id: string;
    available_quantity: number;
    unit: {
      name: string;
      collection: string;
      image_url: string;
    };
  };
}

const PendingSales = () => {
  const { toast } = useToast();
  const [sales, setSales] = useState<PendingSale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingSales();
  }, []);

  const fetchPendingSales = async () => {
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
          buyer:profiles!pending_sales_buyer_id_fkey(username),
          listing:listings(
            id,
            available_quantity,
            unit:units(name, collection, image_url)
          )
        `)
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error("Error fetching pending sales:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (sale: PendingSale) => {
    try {
      // Update listing available quantity
      const newQuantity = sale.listing.available_quantity - sale.quantity;
      
      if (newQuantity < 0) {
        toast({
          title: "Erro",
          description: "Quantidade insuficiente em estoque",
          variant: "destructive",
        });
        return;
      }

      const { error: listingError } = await supabase
        .from("listings")
        .update({ available_quantity: newQuantity })
        .eq("id", sale.listing.id);

      if (listingError) throw listingError;

      // Update sale status
      const { error: saleError } = await supabase
        .from("pending_sales")
        .update({ status: "approved" })
        .eq("id", sale.id);

      if (saleError) throw saleError;

      toast({ title: "Venda aprovada com sucesso!" });
      await fetchPendingSales();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase
        .from("pending_sales")
        .update({ status: "rejected" })
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Venda rejeitada" });
      await fetchPendingSales();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center text-muted-foreground py-8">Carregando...</div>;
  }

  if (sales.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Nenhuma venda pendente no momento
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sales.map((sale) => (
        <div
          key={sale.id}
          className="flex gap-4 p-4 rounded-lg bg-muted/30 border border-border"
        >
          <img
            src={sale.listing.unit.image_url}
            alt={sale.listing.unit.name}
            className="w-20 h-20 object-cover rounded"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.svg";
            }}
          />
          <div className="flex-1">
            <h3 className="font-semibold">{sale.listing.unit.name}</h3>
            <p className="text-sm text-muted-foreground">{sale.listing.unit.collection}</p>
            <p className="text-sm mt-2">
              Comprador: <span className="font-semibold">{sale.buyer.username}</span>
            </p>
            <p className="text-sm">
              Quantidade: {sale.quantity} x R$ {sale.price.toFixed(2)} = R${" "}
              {(sale.quantity * sale.price).toFixed(2)}
            </p>
            <Badge
              variant={
                sale.status === "approved"
                  ? "default"
                  : sale.status === "rejected"
                  ? "destructive"
                  : "secondary"
              }
              className="mt-2"
            >
              {sale.status === "pending" ? "Pendente" : sale.status === "approved" ? "Aprovado" : "Rejeitado"}
            </Badge>
          </div>
          {sale.status === "pending" && (
            <div className="flex gap-2">
              <Button
                variant="default"
                size="icon"
                onClick={() => handleApprove(sale)}
                className="bg-primary"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => handleReject(sale.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PendingSales;
