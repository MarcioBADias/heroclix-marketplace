import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import AddListingForm from "@/components/AddListingForm";
import MyListings from "@/components/MyListings";
import PendingSales from "@/components/PendingSales";
import SalesHistory from "@/components/SalesHistory";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setLoading(false);
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

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Meu Dashboard
          </h1>
          <p className="text-muted-foreground">Gerencie suas peças e vendas</p>
        </div>

        <Tabs defaultValue="listings" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl">
            <TabsTrigger value="listings">Meus Anuncios</TabsTrigger>
            <TabsTrigger value="pending">Vendas Pendentes</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-4">
            <Card className="card-gradient border-2 border-border">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Anuncios abertos</CardTitle>
                  <Button onClick={() => setShowAddForm(!showAddForm)} className="hero-gradient">
                    <Plus className="h-4 w-4 mr-2" />
                    {showAddForm ? "Cancelar" : "Nova Peça"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showAddForm ? (
                  <AddListingForm onSuccess={() => setShowAddForm(false)} />
                ) : (
                  <MyListings />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending">
            <Card className="card-gradient border-2 border-border">
              <CardHeader>
                <CardTitle>Vendas Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <PendingSales />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="card-gradient border-2 border-border">
              <CardHeader>
                <CardTitle>Histórico de Vendas e Compras</CardTitle>
              </CardHeader>
              <CardContent>
                <SalesHistory />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
