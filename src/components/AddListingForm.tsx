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
  const [fetchingUnit, setFetchingUnit] = useState(false);
  const [unitError, setUnitError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [unitExists, setUnitExists] = useState(false);

  useEffect(() => {
    if (collection && unitNumber) {
      fetchUnitData();
    } else {
      setName("");
      setPreviewUrl("");
      setUnitError("");
      setUnitExists(false);
    }
  }, [collection, unitNumber]);

  const fetchUnitData = async () => {
    setFetchingUnit(true);
    setUnitError("");
    setUnitExists(false);
    
    try {
      const data = await fetchUnitFromAPI(collection, unitNumber);
      setName(data.name);
      setPreviewUrl(getUnitImageUrl(collection, unitNumber));
      setUnitExists(true);
      setUnitError("");
    } catch (error) {
      setName("");
      setPreviewUrl("");
      setUnitExists(false);
      setUnitError("Peça não encontrada. Verifique se a coleção e número estão corretos.");
    } finally {
      setFetchingUnit(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!unitExists) {
      toast({
        title: "Erro",
        description: "Por favor, verifique se a peça existe antes de cadastrar",
        variant: "destructive",
      });
      return;
    }
    
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
        <Select value={collection} onValueChange={setCollection} required>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a coleção" />
          </SelectTrigger>
          <SelectContent>
            {HC_UNIT_EDITIONS.map((edition) => (
              <SelectItem key={edition.value} value={edition.value}>
                <div className="flex items-center gap-2">
                  <img 
                    src={getCollectionIconUrl(edition.value)} 
                    alt={edition.label}
                    className="w-4 h-4"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  {edition.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Buscando peça...</span>
        </div>
      )}

      {unitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{unitError}</AlertDescription>
        </Alert>
      )}

      {unitExists && name && (
        <div className="space-y-2">
          <Label>Preview da Peça</Label>
          <div className="rounded-lg border-2 border-border p-4 space-y-2 bg-card">
            <p className="font-semibold text-foreground">{name}</p>
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

      <Button type="submit" className="w-full hero-gradient" disabled={loading || !unitExists || fetchingUnit}>
        {loading ? "Cadastrando..." : "Cadastrar Peça"}
      </Button>
    </form>
  );
};

export default AddListingForm;
