import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface UnitCardProps {
  id: string;
  name: string;
  collection: string;
  unitNumber: string;
  imageUrl: string;
  minPrice: number | null;
  avgPrice: number | null;
  maxPrice: number | null;
}

const UnitCard = ({ id, name, imageUrl, minPrice, avgPrice, maxPrice }: UnitCardProps) => {
  const navigate = useNavigate();

  return (
    <Card 
      className="card-gradient card-shadow hover:glow-effect transition-all duration-300 cursor-pointer group overflow-hidden border-2 border-border hover:border-primary"
      onClick={() => navigate(`/unit/${id}`)}
    >
      <CardContent className="p-0">
        <div className="aspect-square overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.svg";
            }}
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-3 p-4">
        <h3 className="font-bold text-lg line-clamp-2 text-foreground">{name}</h3>
        <div className="flex gap-2 w-full flex-wrap">
          {minPrice && (
            <Badge variant="outline" className="text-xs bg-green-500/20 border-green-500 text-green-700 dark:text-green-400">
              Min: R$ {minPrice.toFixed(2)}
            </Badge>
          )}
          {avgPrice && (
            <Badge variant="outline" className="text-xs bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-400">
              Méd: R$ {avgPrice.toFixed(2)}
            </Badge>
          )}
          {maxPrice && (
            <Badge variant="outline" className="text-xs bg-red-500/20 border-red-500 text-red-700 dark:text-red-400">
              Max: R$ {maxPrice.toFixed(2)}
            </Badge>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default UnitCard;
