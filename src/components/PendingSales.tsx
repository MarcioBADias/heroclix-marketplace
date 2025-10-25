import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PendingSale {
  id: string;
  quantity: number;
  price: number;
  status: string;
  buyer_id: string;
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

interface GroupedSale {
  buyerId: string;
  buyerName: string;
  items: PendingSale[];
  totalValue: number;
  isPending: boolean;
}

const PendingSales = () => {
  const { toast } = useToast();
  const [sales, setSales] = useState<PendingSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: 'approve' | 'reject' | null;
    buyerId: string | null;
  }>({ isOpen: false, action: null, buyerId: null });

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
          buyer_id,
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

  const groupSalesByBuyer = (): GroupedSale[] => {
    const grouped: { [key: string]: GroupedSale } = {};
    
    sales.forEach((sale) => {
      const buyerId = sale.buyer_id;
      if (!grouped[buyerId]) {
        grouped[buyerId] = {
          buyerId,
          buyerName: sale.buyer.username,
          items: [],
          totalValue: 0,
          isPending: false,
        };
      }
      grouped[buyerId].items.push(sale);
      grouped[buyerId].totalValue += sale.quantity * sale.price;
      if (sale.status === "pending") {
        grouped[buyerId].isPending = true;
      }
    });

    return Object.values(grouped);
  };

  const toggleGroup = (buyerId: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(buyerId)) {
        newSet.delete(buyerId);
      } else {
        newSet.add(buyerId);
      }
      return newSet;
    });
  };

  const handleApproveAll = async (buyerId: string) => {
    try {
      const groupSales = sales.filter(s => s.buyer_id === buyerId && s.status === "pending");
      
      for (const sale of groupSales) {
        const newQuantity = sale.listing.available_quantity - sale.quantity;
        
        if (newQuantity < 0) {
          toast({
            title: "Erro",
            description: `Quantidade insuficiente para ${sale.listing.unit.name}`,
            variant: "destructive",
          });
          return;
        }

        await supabase
          .from("listings")
          .update({ available_quantity: newQuantity })
          .eq("id", sale.listing.id);

        await supabase
          .from("pending_sales")
          .update({ status: "approved" })
          .eq("id", sale.id);
      }

      toast({ title: "Todas as vendas aprovadas com sucesso!" });
      await fetchPendingSales();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
    setConfirmDialog({ isOpen: false, action: null, buyerId: null });
  };

  const handleRejectAll = async (buyerId: string) => {
    try {
      const groupSales = sales.filter(s => s.buyer_id === buyerId && s.status === "pending");
      
      for (const sale of groupSales) {
        await supabase
          .from("pending_sales")
          .update({ status: "rejected" })
          .eq("id", sale.id);
      }

      toast({ title: "Todas as vendas rejeitadas" });
      await fetchPendingSales();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
    setConfirmDialog({ isOpen: false, action: null, buyerId: null });
  };

  const handleApproveOne = async (sale: PendingSale) => {
    try {
      const newQuantity = sale.listing.available_quantity - sale.quantity;
      
      if (newQuantity < 0) {
        toast({
          title: "Erro",
          description: "Quantidade insuficiente em estoque",
          variant: "destructive",
        });
        return;
      }

      await supabase
        .from("listings")
        .update({ available_quantity: newQuantity })
        .eq("id", sale.listing.id);

      await supabase
        .from("pending_sales")
        .update({ status: "approved" })
        .eq("id", sale.id);

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

  const handleRejectOne = async (id: string) => {
    try {
      await supabase
        .from("pending_sales")
        .update({ status: "rejected" })
        .eq("id", id);

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

  const groupedSales = groupSalesByBuyer();

  return (
    <>
      <div className="space-y-4">
        {groupedSales.map((group) => (
          <Collapsible
            key={group.buyerId}
            open={expandedGroups.has(group.buyerId)}
            onOpenChange={() => toggleGroup(group.buyerId)}
          >
            <div className="rounded-lg border-2 border-border bg-muted/30">
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition">
                  <div className="flex items-center gap-4">
                    {expandedGroups.has(group.buyerId) ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div className="text-left">
                      <p className="font-semibold">Comprador: {group.buyerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {group.items.length} {group.items.length === 1 ? "item" : "itens"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={group.isPending ? "secondary" : "default"}
                      className={group.isPending ? "" : "bg-primary"}
                    >
                      {group.isPending ? "Pendente" : "Processado"}
                    </Badge>
                    <p className="font-bold text-primary">R$ {group.totalValue.toFixed(2)}</p>
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="px-4 pb-4 space-y-3">
                  {group.items.map((sale) => (
                    <div
                      key={sale.id}
                      className="flex gap-4 p-3 rounded bg-background border border-border"
                    >
                      <img
                        src={sale.listing.unit.image_url}
                        alt={sale.listing.unit.name}
                        className="w-16 h-16 object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{sale.listing.unit.name}</h4>
                        <p className="text-xs text-muted-foreground">{sale.listing.unit.collection}</p>
                        <p className="text-xs mt-1">
                          {sale.quantity} x R$ {sale.price.toFixed(2)} = R${" "}
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
                          className="mt-1 text-xs"
                        >
                          {sale.status === "pending"
                            ? "Pendente"
                            : sale.status === "approved"
                            ? "Aprovado"
                            : "Rejeitado"}
                        </Badge>
                      </div>
                      {sale.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="icon"
                            onClick={() => handleApproveOne(sale)}
                            className="h-8 w-8"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleRejectOne(sale.id)}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}

                  {group.isPending && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() =>
                          setConfirmDialog({
                            isOpen: true,
                            action: "approve",
                            buyerId: group.buyerId,
                          })
                        }
                        className="flex-1 bg-primary"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Aprovar Toda Venda
                      </Button>
                      <Button
                        onClick={() =>
                          setConfirmDialog({
                            isOpen: true,
                            action: "reject",
                            buyerId: group.buyerId,
                          })
                        }
                        variant="destructive"
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Recusar Toda Venda
                      </Button>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}
      </div>

      <AlertDialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && setConfirmDialog({ isOpen: false, action: null, buyerId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirmar {confirmDialog.action === "approve" ? "Aprovação" : "Rejeição"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja {confirmDialog.action === "approve" ? "aprovar" : "recusar"} toda esta venda? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDialog.buyerId) {
                  if (confirmDialog.action === "approve") {
                    handleApproveAll(confirmDialog.buyerId);
                  } else {
                    handleRejectAll(confirmDialog.buyerId);
                  }
                }
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PendingSales;
