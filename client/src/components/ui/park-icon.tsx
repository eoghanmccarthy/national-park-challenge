import { ChevronDown, ChevronUp, Mountain, Network, Palmtree, Waves, Building } from "lucide-react";

interface ParkIconProps {
  parkType: string;
  colorScheme?: "forest" | "canyon" | "mountain" | "water" | "desert" | "urban";
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function ParkIcon({ 
  parkType, 
  colorScheme = "forest", 
  className = "", 
  size = "md" 
}: ParkIconProps) {
  // Determine icon based on park type
  const getIcon = () => {
    switch (parkType) {
      case "forest":
        return <Network className="w-4 h-4" />;
      case "mountain":
        return <Mountain className="w-4 h-4" />;
      case "canyon":
        return <ChevronDown className="w-4 h-4" />;
      case "water":
        return <Waves className="w-4 h-4" />;
      case "desert":
        return <ChevronUp className="w-4 h-4" />;
      case "urban":
        return <Building className="w-4 h-4" />;
      default:
        return <ChevronDown className="w-4 h-4" />;
    }
  };

  // Determine background color based on color scheme
  const getBgColor = () => {
    switch (colorScheme) {
      case "forest":
        return "bg-forest-light";
      case "canyon":
        return "bg-canyon";
      case "mountain":
        return "bg-mountain";
      case "water":
        return "bg-mountain-light";
      case "desert":
        return "bg-canyon-light";
      case "urban":
        return "bg-stone";
      default:
        return "bg-forest-light";
    }
  };

  // Determine size class
  const getSizeClass = () => {
    switch (size) {
      case "sm":
        return "w-5 h-5";
      case "lg":
        return "w-10 h-10";
      case "md":
      default:
        return "w-7 h-7";
    }
  };

  return (
    <div className={`park-icon ${getBgColor()} text-white ${getSizeClass()} flex items-center justify-center rounded-full ${className}`}>
      {getIcon()}
    </div>
  );
}
