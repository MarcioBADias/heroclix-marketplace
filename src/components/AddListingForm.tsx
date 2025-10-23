import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { HC_UNIT_EDITIONS, getUnitImageUrl, getCollectionIconUrl, fetchUnitFromAPI } from "@/lib/constants";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const listingSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  collection: z.string().min(1, "Coleção é obrigatória"),
  unitNumber: z.string().min(1, "Número da unidade é obrigatório"),
  price: z.number().positive("Preço deve ser positivo"),
  quantity: z.number().int().positive("Quantidade deve ser positiva"),
});

interface AddListingFormProps {
  onSuccess: () => void;
}

const AddListingForm = ({ onSuccess }: AddListingFormProps) => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [collection, setCollection] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [unitExists, setUnitExists] = useState(false);
  const [fetchingUnit, setFetchingUnit] = useState(false);
  const [unitError, setUnitError] = useState("");
  const [marketPrices, setMarketPrices] = useState<{min: number | null, avg: number | null, max: number | null}>({min: null, avg: null, max: null});
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchUnitData = async () => {
      if (collection && unitNumber) {
        setFetchingUnit(true);
        setUnitError("");
        setUnitExists(false);
        const url = getUnitImageUrl(collection, unitNumber);
        setPreviewUrl(url);

        try {
          // Fetch from API
          const apiData = await fetchUnitFromAPI(collection, unitNumber);
          if (apiData && apiData.name) {
            setName(apiData.name);
            setUnitExists(true);
            setUnitError("");
            
            // Check if unit already exists in database
            const { data: existingUnit } = await supabase
              .from("units")
              .select("min_price, avg_price, max_price")
              .eq("collection", collection)
              .eq("unit_number", unitNumber)
              .maybeSingle();
            
            if (existingUnit) {
              setMarketPrices({
                min: existingUnit.min_price,
                avg: existingUnit.avg_price,
                max: existingUnit.max_price
              });
            } else {
              setMarketPrices({min: null, avg: null, max: null});
            }
          }
        } catch (error) {
          setUnitError("Numeração incorreta. Verifique o número da unidade.");
          setUnitExists(false);
          setName("");
          setMarketPrices({min: null, avg: null, max: null});
        } finally {
          setFetchingUnit(false);
        }
      } else {
        setPreviewUrl("");
        setUnitExists(false);
        setMarketPrices({min: null, avg: null, max: null});
      }
    };

    fetchUnitData();
  }, [collection, unitNumber]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        name,
        collection,
        unitNumber,
        price: parseFloat(price),
        quantity: parseInt(quantity),
      };

      listingSchema.parse(data);

      if (!unitExists) {
        throw new Error("Por favor, verifique a coleção e número da unidade antes de cadastrar.");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const imageUrl = getUnitImageUrl(collection, unitNumber);

      // Check if unit exists
      let { data: existingUnit, error: unitCheckError } = await supabase
        .from("units")
        .select("id")
        .eq("collection", collection)
        .eq("unit_number", unitNumber)
        .maybeSingle();

      if (unitCheckError) throw unitCheckError;

      let unitId: string;

      if (existingUnit) {
        unitId = existingUnit.id;
      } else {
        // Create new unit
        const { data: newUnit, error: unitError } = await supabase
          .from("units")
          .insert({
            name,
            collection,
            unit_number: unitNumber,
            image_url: imageUrl,
          })
          .select("id")
          .single();

        if (unitError) throw unitError;
        unitId = newUnit.id;
      }

      // Create listing
      const { error: listingError } = await supabase
        .from("listings")
        .insert({
          unit_id: unitId,
          seller_id: user.id,
          price: data.price,
          quantity: data.quantity,
          available_quantity: data.quantity,
        });

      if (listingError) throw listingError;

      toast({
        title: "Sucesso!",
        description: "Peça cadastrada com sucesso",
      });

      setName("");
      setCollection("");
      setUnitNumber("");
      setPrice("");
      setQuantity("");
      onSuccess();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: error.message || "Não foi possível cadastrar a peça",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <div className="space-y-2">
        <Label htmlFor="collection">Coleção</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {collection
                ? HC_UNIT_EDITIONS.find((edition) => edition.value === collection)?.label
                : "Selecione ou busque a coleção..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Buscar coleção..." />
              <CommandList>
                <CommandEmpty>Nenhuma coleção encontrada.</CommandEmpty>
                <CommandGroup>
                  {HC_UNIT_EDITIONS.map((edition) => (
                    <CommandItem
                      key={edition.value}
                      value={edition.label}
                      onSelect={() => {
                        setCollection(edition.value);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          collection === edition.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <img 
                        src={getCollectionIconUrl(edition.value)} 
                        alt={edition.label}
                        className="w-4 h-4 mr-2"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      {edition.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="unitNumber">Número da Unidade</Label>
        <Input
          id="unitNumber"
          value={unitNumber}
          onChange={(e) => setUnitNumber(e.target.value)}
          placeholder="Ex: 001 ou l001 ou 001b"
          required
          disabled={!collection}
        />
        <p className="text-xs text-muted-foreground">
          Para Legacy use l001, para variantes use 001b
        </p>
      </div>

      {fetchingUnit && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Buscando informações da peça...</span>
        </div>
      )}

      {unitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{unitError}</AlertDescription>
        </Alert>
      )}

      {unitExists && previewUrl && (
        <div className="space-y-2">
          <Label>Preview da Peça</Label>
          <div className="rounded-lg border-2 border-border p-4 space-y-2 bg-card">
            <p className="font-semibold text-foreground">{name}</p>
            {(marketPrices.min || marketPrices.avg || marketPrices.max) && (
              <div className="flex gap-2 flex-wrap text-xs">
                <span className="text-muted-foreground">Preços atuais no mercado:</span>
                {marketPrices.min && (
                  <Badge variant="outline" className="bg-green-500/20 border-green-500 text-green-700 dark:text-green-400">
                    Min: R$ {marketPrices.min.toFixed(2)}
                  </Badge>
                )}
                {marketPrices.avg && (
                  <Badge variant="outline" className="bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-400">
                    Méd: R$ {marketPrices.avg.toFixed(2)}
                  </Badge>
                )}
                {marketPrices.max && (
                  <Badge variant="outline" className="bg-red-500/20 border-red-500 text-red-700 dark:text-red-400">
                    Max: R$ {marketPrices.max.toFixed(2)}
                  </Badge>
                )}
              </div>
            )}
            <div className="aspect-square max-w-xs mx-auto rounded-lg overflow-hidden border border-border">
              <img
                src={previewUrl}
                alt={name}
                className="w-full h-full object-contain bg-muted"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
            </div>
          </div>
        </div>
      )}


      <div className="space-y-2">
        <Label htmlFor="name">Nome da Peça</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Superman"
          required
        />
        <p className="text-xs text-muted-foreground">
          Se a peça já existir, preencha com o mesmo nome
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Preço (R$)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Quantidade</Label>
          <Input
            id="quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="1"
            required
          />
        </div>
      </div>

      <Button type="submit" className="w-full hero-gradient" disabled={loading || !unitExists}>
        {loading ? "Cadastrando..." : "Cadastrar Peça"}
      </Button>
    </form>
  );
};

export default AddListingForm;
