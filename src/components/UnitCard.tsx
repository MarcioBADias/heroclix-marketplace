import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getCollectionIconUrl } from "@/lib/constants";

interface UnitCardProps {
  id: string;
  name: string;
  collection: string;
  unitNumber: string;
  imageUrl: string;
  minPrice: number | null;
  avgPrice: number | null;
  maxPrice: number | null;
  hasAvailableListings: boolean;
}

const UnitCard = ({ 
  id, 
  name, 
  collection, 
  unitNumber, 
  imageUrl, 
  minPrice, 
  avgPrice, 
  maxPrice, 
  hasAvailableListings 
}: UnitCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!hasAvailableListings) {
      toast({
        title: "Indisponível",
        description: "Não há peças disponíveis no momento",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Find cheapest listing
      const { data: listings, error } = await supabase
        .from("listings")
        .select("id, price, seller_id")
        .eq("unit_id", id)
        .gt("available_quantity", 0)
        .order("price", { ascending: true })
        .limit(1);

      if (error) throw error;
      if (!listings || listings.length === 0) {
        toast({
          title: "Erro",
          description: "Nenhuma oferta disponível",
          variant: "destructive",
        });
        return;
      }

      const cheapestListing = listings[0];
      
      if (cheapestListing.seller_id === user.id) {
        toast({
          title: "Ops!",
          description: "Você não pode comprar seu próprio anúncio",
          variant: "destructive",
        });
        return;
      }

      // Check if already in cart
      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("listing_id", cheapestListing.id)
        .maybeSingle();

      if (existingItem) {
        await supabase
          .from("cart_items")
          .update({ quantity: existingItem.quantity + 1 })
          .eq("id", existingItem.id);
      } else {
        await supabase.from("cart_items").insert({
          user_id: user.id,
          listing_id: cheapestListing.id,
          quantity: 1,
        });
      }

      toast({ title: "Adicionado ao carrinho!" });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-2 border-border card-gradient">
      <div className="flex gap-4 p-4">
        <div 
          className="w-32 h-32 flex-shrink-0 cursor-pointer"
          onClick={() => navigate(`/unit/${id}`)}
        >
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover rounded group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.svg";
            }}
          />
        </div>
        
        <div className="flex-1 flex flex-col justify-between space-y-2">
          <div 
            className="cursor-pointer"
            onClick={() => navigate(`/unit/${id}`)}
          >
            <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">
              {name}
            </h3>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <img 
                src={getCollectionIconUrl(collection)} 
                alt={collection}
                className="w-4 h-4"
              />
              <span>{collection}</span>
            </div>
          </div>

          <div className="space-y-2">
            {!hasAvailableListings && (
              <Badge variant="secondary" className="bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30">
                Indisponível
              </Badge>
            )}
            
            <div className="flex flex-wrap gap-2">
              {minPrice !== null && (
                <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                  Min: R$ {minPrice.toFixed(2)}
                </Badge>
              )}
              {avgPrice !== null && (
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30">
                  Méd: R$ {avgPrice.toFixed(2)}
                </Badge>
              )}
              {maxPrice !== null && (
                <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30">
                  Max: R$ {maxPrice.toFixed(2)}
                </Badge>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAddToCart}
                disabled={!hasAvailableListings}
                className="flex-1 hero-gradient"
                size="sm"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Comprar Mais Barato
              </Button>
              <Button
                onClick={() => navigate(`/unit/${id}`)}
                variant="outline"
                size="sm"
              >
                Saber Mais
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default UnitCard;
