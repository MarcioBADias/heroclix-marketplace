import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, ExternalLink, ArrowLeft, Zap } from "lucide-react";
import { getCollectionIconUrl, getCollectionLabel } from "@/lib/constants";

interface Listing {
  id: string;
  price: number;
  available_quantity: number;
  seller: {
    username: string;
    whatsapp: string;
  };
}

interface Unit {
  id: string;
  name: string;
  collection: string;
  unit_number: string;
  image_url: string;
  min_price: number | null;
  avg_price: number | null;
  max_price: number | null;
}

const UnitDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [unit, setUnit] = useState<Unit | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchUnitDetails();
    }
  }, [id]);

  const fetchUnitDetails = async () => {
    try {
      const { data: unitData, error: unitError } = await supabase
        .from("units")
        .select("*")
        .eq("id", id)
        .single();

      if (unitError) throw unitError;
      setUnit(unitData);

      const { data: listingsData, error: listingsError } = await supabase
        .from("listings")
        .select(`
          id,
          price,
          available_quantity,
          seller:profiles(username, whatsapp)
        `)
        .eq("unit_id", id)
        .gt("available_quantity", 0)
        .order("price", { ascending: true });

      if (listingsError) throw listingsError;
      setListings(listingsData || []);
      
      const initialQuantities: { [key: string]: number } = {};
      listingsData?.forEach((listing) => {
        initialQuantities[listing.id] = 1;
      });
      setQuantities(initialQuantities);
    } catch (error) {
      console.error("Error fetching unit details:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes da peça",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (listingId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Login necessário",
          description: "Faça login para adicionar itens ao carrinho",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const quantity = quantities[listingId] || 1;

      const { error } = await supabase
        .from("cart_items")
        .upsert(
          { user_id: user.id, listing_id: listingId, quantity },
          { onConflict: "user_id,listing_id" }
        );

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Item adicionado ao carrinho",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível adicionar ao carrinho",
        variant: "destructive",
      });
    }
  };

  const handleBuyCheapest = async () => {
    if (listings.length === 0) return;
    const cheapestListing = listings[0];
    await handleAddToCart(cheapestListing.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          Carregando...
        </div>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          Peça não encontrada
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="outline" 
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="aspect-square rounded-lg overflow-hidden card-gradient card-shadow border-2 border-border">
            <img
              src={unit.image_url}
              alt={unit.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
          </div>
          
          <div className="space-y-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              {unit.name}
            </h1>
            
            <div className="flex gap-2 flex-wrap">
              {unit.min_price && (
                <Badge variant="outline" className="text-sm bg-green-500/20 border-green-500 text-green-700 dark:text-green-400">
                  Mínimo: R$ {unit.min_price.toFixed(2)}
                </Badge>
              )}
              {unit.avg_price && (
                <Badge variant="outline" className="text-sm bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-400">
                  Médio: R$ {unit.avg_price.toFixed(2)}
                </Badge>
              )}
              {unit.max_price && (
                <Badge variant="outline" className="text-sm bg-red-500/20 border-red-500 text-red-700 dark:text-red-400">
                  Máximo: R$ {unit.max_price.toFixed(2)}
                </Badge>
              )}
            </div>

            {listings.length > 0 && (
              <Button
                onClick={handleBuyCheapest}
                className="w-full hero-gradient"
                size="lg"
              >
                <Zap className="h-5 w-5 mr-2" />
                Comprar Mais Barato - R$ {listings[0].price.toFixed(2)}
              </Button>
            )}

            <div className="space-y-2">
              <p className="text-muted-foreground flex items-center gap-2">
                <span className="font-semibold text-foreground">Coleção:</span> 
                <img
                  src={getCollectionIconUrl(unit.collection)}
                  alt={unit.collection}
                  className="w-5 h-5"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                {getCollectionLabel(unit.collection)}
              </p>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Número:</span> {unit.unit_number}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://hcunits.net/units/${unit.collection}${unit.unit_number}/`, '_blank')}
                className="mt-2"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver no HCUnits
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Vendedores Disponíveis</h2>
          
          {listings.length === 0 ? (
            <Card className="card-gradient border-2 border-border">
              <CardContent className="p-6 text-center text-muted-foreground">
                Nenhum vendedor disponível no momento
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {listings.map((listing) => (
                <Card key={listing.id} className="card-gradient border-2 border-border hover:border-primary transition-colors">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-2 flex-1">
                        <p className="font-semibold text-lg">{listing.seller.username}</p>
                        <p className="text-2xl font-bold text-primary">R$ {listing.price.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">
                          Disponível: {listing.available_quantity} unidades
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-muted-foreground">Qtd:</label>
                          <Input
                            type="number"
                            min="1"
                            max={listing.available_quantity}
                            value={quantities[listing.id] || 1}
                            onChange={(e) =>
                              setQuantities({
                                ...quantities,
                                [listing.id]: Math.min(
                                  Math.max(1, parseInt(e.target.value) || 1),
                                  listing.available_quantity
                                ),
                              })
                            }
                            className="w-20"
                          />
                        </div>
                        <Button
                          onClick={() => handleAddToCart(listing.id)}
                          className="hero-gradient"
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnitDetails;
