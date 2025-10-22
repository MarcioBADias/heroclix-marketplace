import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import UnitCard from "@/components/UnitCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

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

const Index = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase
        .from("units")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUnits(data || []);
    } catch (error) {
      console.error("Error fetching units:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUnits = units.filter((unit) =>
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.collection.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 space-y-4">
          <h2 className="text-4xl font-bold text-center bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Marketplace de Heroclix
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto">
            Encontre e compre suas peças favoritas de Heroclix diretamente de outros colecionadores
          </p>
          
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder="Buscar peças..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-12">
            Carregando peças...
          </div>
        ) : filteredUnits.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p className="text-xl">Nenhuma peça encontrada</p>
            <p className="text-sm mt-2">Seja o primeiro a cadastrar uma peça!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredUnits.map((unit) => (
              <UnitCard 
                key={unit.id}
                id={unit.id}
                name={unit.name}
                collection={unit.collection}
                unitNumber={unit.unit_number}
                imageUrl={unit.image_url}
                minPrice={unit.min_price}
                avgPrice={unit.avg_price}
                maxPrice={unit.max_price}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
