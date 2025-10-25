import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import UnitCard from "@/components/UnitCard";
import HeroCarousel from "@/components/HeroCarousel";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { HC_UNIT_EDITIONS, getUnitImageUrl, getCollectionIconUrl } from "@/lib/constants";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Unit {
  id: string;
  name: string;
  collection: string;
  unit_number: string;
  image_url: string;
  min_price: number | null;
  avg_price: number | null;
  max_price: number | null;
  listings?: Array<{ available_quantity: number }>;
}

const Index = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase
        .from("units")
        .select(`
          *,
          listings(available_quantity)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUnits(data || []);
    } catch (error) {
      console.error("Error fetching units:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUnits = units.filter((unit) => {
    const matchesSearch = unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.collection.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCollection = !selectedCollection || unit.collection === selectedCollection;
    return matchesSearch && matchesCollection;
  });

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
          
            <HeroCarousel />
            
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

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-center">Filtrar por Coleção</h3>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-4 pb-4 justify-center">
              <button
                onClick={() => setSelectedCollection("")}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all hover:scale-110 ${
                  !selectedCollection 
                    ? "bg-primary text-primary-foreground shadow-lg" 
                    : "bg-card hover:bg-muted"
                }`}
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary">
                  <Search className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium">Todas</span>
              </button>
              {HC_UNIT_EDITIONS.map((edition) => (
                <button
                  key={edition.value}
                  onClick={() => setSelectedCollection(edition.value === selectedCollection ? "" : edition.value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all hover:scale-110 ${
                    selectedCollection === edition.value 
                      ? "bg-primary text-primary-foreground shadow-lg" 
                      : "bg-card hover:bg-muted"
                  }`}
                >
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-muted">
                    <img
                      src={getCollectionIconUrl(edition.value)}
                      alt={edition.label}
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-center max-w-[80px]">{edition.label}</span>
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
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
            imageUrl={getUnitImageUrl(unit.collection, unit.unit_number)}
            minPrice={unit.min_price}
            avgPrice={unit.avg_price}
            maxPrice={unit.max_price}
            hasAvailableListings={unit.listings?.some((l: any) => l.available_quantity > 0) || false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
