import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trash2, ShoppingBag } from "lucide-react";

interface CartItem {
  id: string;
  quantity: number;
  listing: {
    id: string;
    price: number;
    available_quantity: number;
    seller: {
      id: string;
      username: string;
      whatsapp: string;
    };
    unit: {
      name: string;
      collection: string;
      image_url: string;
    };
  };
}

const Cart = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndFetchCart();
  }, []);

  const checkAuthAndFetchCart = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    await fetchCart();
  };

  const fetchCart = async () => {
    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          id,
          quantity,
          listing:listings(
            id,
            price,
            available_quantity,
            seller:profiles(id, username, whatsapp),
            unit:units(name, collection, image_url)
          )
        `);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
      await fetchCart();
      toast({ title: "Item removido do carrinho" });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const groupBySeller = () => {
    const grouped: { [key: string]: CartItem[] } = {};
    cartItems.forEach((item) => {
      const sellerId = item.listing.seller.id;
      if (!grouped[sellerId]) {
        grouped[sellerId] = [];
      }
      grouped[sellerId].push(item);
    });
    return grouped;
  };

  const handleCheckout = async (sellerId: string, items: CartItem[]) => {
    const seller = items[0].listing.seller;
    let message = `Olá, gostaria de comprar as seguintes peças:\n\n`;
    
    let total = 0;
    items.forEach((item) => {
      const itemTotal = item.quantity * item.listing.price;
      total += itemTotal;
      message += `• ${item.listing.unit.name} (${item.listing.unit.collection})\n`;
      message += `  Quantidade: ${item.quantity} x R$ ${item.listing.price.toFixed(2)} = R$ ${itemTotal.toFixed(2)}\n\n`;
    });
    
    message += `Total: R$ ${total.toFixed(2)}`;
    
    const whatsappUrl = `https://wa.me/55${seller.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");

    // Create pending sales
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      for (const item of items) {
        await supabase.from("pending_sales").insert({
          listing_id: item.listing.id,
          buyer_id: user.id,
          seller_id: sellerId,
          quantity: item.quantity,
          price: item.listing.price,
        });
      }
    } catch (error) {
      console.error("Error creating pending sales:", error);
    }
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

  const groupedItems = groupBySeller();

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Meu Carrinho
          </h1>
          <p className="text-muted-foreground">Revise suas compras antes de finalizar</p>
        </div>

        {cartItems.length === 0 ? (
          <Card className="card-gradient border-2 border-border">
            <CardContent className="p-12 text-center">
              <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-xl text-muted-foreground mb-4">Seu carrinho está vazio</p>
              <Button onClick={() => navigate("/")} className="hero-gradient">
                Continuar Comprando
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([sellerId, items]) => {
              const seller = items[0].listing.seller;
              const sellerTotal = items.reduce(
                (sum, item) => sum + item.quantity * item.listing.price,
                0
              );

              return (
                <Card key={sellerId} className="card-gradient border-2 border-border">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>Vendedor: {seller.username}</span>
                      <span className="text-primary">Total: R$ {sellerTotal.toFixed(2)}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-4 p-4 rounded-lg bg-muted/30 border border-border"
                      >
                        <img
                          src={item.listing.unit.image_url}
                          alt={item.listing.unit.name}
                          className="w-20 h-20 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder.svg";
                          }}
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.listing.unit.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.listing.unit.collection}</p>
                          <p className="text-sm mt-2">
                            {item.quantity} x R$ {item.listing.price.toFixed(2)} = R${" "}
                            {(item.quantity * item.listing.price).toFixed(2)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      onClick={() => handleCheckout(sellerId, items)}
                      className="w-full hero-gradient"
                    >
                      Comprar via WhatsApp
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
