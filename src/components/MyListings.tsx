import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getUnitImageUrl } from "@/lib/constants";

interface Listing {
  id: string;
  price: number;
  quantity: number;
  available_quantity: number;
  unit: {
    name: string;
    collection: string;
    image_url: string;
    unit_number: string;
  };
}

const MyListings = () => {
  const { toast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editQuantity, setEditQuantity] = useState("");

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("listings")
        .select(`
          id,
          price,
          quantity,
          available_quantity,
          unit:units(name, collection, image_url, unit_number)
        `)
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) throw error;

      toast({ title: "Anúncio removido com sucesso" });
      await fetchListings();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const startEdit = (listing: Listing) => {
    setEditingId(listing.id);
    setEditPrice(listing.price.toString());
    setEditQuantity(listing.available_quantity.toString());
  };

  const handleUpdate = async (id: string) => {
    try {
      const { error } = await supabase
        .from("listings")
        .update({
          price: parseFloat(editPrice),
          available_quantity: parseInt(editQuantity),
        })
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Anúncio atualizado com sucesso" });
      setEditingId(null);
      await fetchListings();
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

  if (listings.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Você ainda não cadastrou nenhuma peça
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {listings.map((listing) => (
        <div
          key={listing.id}
          className="flex gap-4 p-4 rounded-lg bg-muted/30 border border-border"
        >
          <img
            src={getUnitImageUrl(listing.unit.collection, listing.unit.unit_number)}
            alt={listing.unit.name}
            className="w-20 h-20 object-cover rounded"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.svg";
            }}
          />
          <div className="flex-1">
            <h3 className="font-semibold">{listing.unit.name}</h3>
            <p className="text-sm text-muted-foreground">{listing.unit.collection}</p>

            {editingId === listing.id ? (
              <div className="mt-2 space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    placeholder="Preço"
                    className="w-32"
                  />
                  <Input
                    type="number"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    placeholder="Qtd"
                    className="w-20"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleUpdate(listing.id)}>
                    Salvar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-2">
                <p className="text-sm">Preço: R$ {listing.price.toFixed(2)}</p>
                <p className="text-sm">Disponível: {listing.available_quantity}</p>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => startEdit(listing)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(listing.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyListings;
