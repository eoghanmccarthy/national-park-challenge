import { Park } from "@shared/schema";
import ParkIcon from "@/components/ui/park-icon";

interface ParkCardProps {
  park: Park;
  onVote: (parkId: number) => void;
  loading?: boolean;
  colorScheme: "forest" | "canyon" | "mountain" | "water" | "desert" | "urban";
}

export default function ParkCard({ park, onVote, loading = false, colorScheme }: ParkCardProps) {
  // Map park type to color scheme if not provided
  if (!colorScheme) {
    const typeToColor: Record<string, "forest" | "canyon" | "mountain" | "water" | "desert" | "urban"> = {
      forest: "forest",
      canyon: "canyon",
      mountain: "mountain",
      water: "water",
      desert: "desert",
      urban: "urban",
    };
    colorScheme = typeToColor[park.type] || "forest";
  }

  // Get the background and hover colors based on colorScheme
  const getBgColors = () => {
    switch (colorScheme) {
      case "forest":
        return "bg-forest hover:bg-forest-dark";
      case "canyon":
        return "bg-canyon hover:bg-canyon-dark";
      case "mountain":
        return "bg-mountain hover:bg-mountain-dark";
      case "water":
        return "bg-water hover:bg-water-dark";
      case "desert":
        return "bg-desert hover:bg-desert-dark";
      case "urban":
        return "bg-urban hover:bg-urban-dark";
      default:
        return "bg-forest hover:bg-forest-dark";
    }
  };

  // Function to handle missing or broken image URLs
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Hide the image container when image fails to load
    const imgContainer = e.currentTarget.parentElement;
    if (imgContainer) {
      imgContainer.style.display = 'none';
    }
  };

  // Function to clean up state info
  const cleanState = (state: string): string => {
    // Remove coordinates and any text after them
    if (state.includes(",")) {
      return state.split(",")[0].trim();
    }
    return state;
  };

  // Choose a fallback image based on park type
  const getFallbackImage = (): string => {
    const fallbacks = {
      forest: "https://upload.wikimedia.org/wikipedia/commons/2/29/ForestLake.jpg",
      canyon: "https://upload.wikimedia.org/wikipedia/commons/f/f9/Canyonlands.jpg",
      mountain: "https://upload.wikimedia.org/wikipedia/commons/e/e7/Scafell_Pike_Panorama.jpg",
      water: "https://upload.wikimedia.org/wikipedia/commons/4/46/Mountaintop_lake.jpg",
      desert: "https://upload.wikimedia.org/wikipedia/commons/b/be/Desert_near_Marrakech%2C_Morocco.jpg",
      urban: "https://upload.wikimedia.org/wikipedia/commons/3/38/Gateway_Arch_at_night_-_Wikimedia_Foundation.jpg"
    };
    
    return fallbacks[park.type as keyof typeof fallbacks] || fallbacks.forest;
  };

  return (
    <div 
      className="park-card bg-white rounded-lg shadow-md overflow-hidden w-full md:w-2/5 border border-stone-100 transition-all duration-300 hover:shadow-lg" 
      data-park-id={park.id}
    >
      {/* Park Image with Fallback */}
      <div className="park-image-container h-48 overflow-hidden">
        <img 
          src={park.imageUrl || getFallbackImage()} 
          alt={`${park.name} National Park`} 
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      </div>

      <div className="p-5">
        <div className="flex items-center mb-3">
          <ParkIcon parkType={park.type} colorScheme={colorScheme} className="mr-2" />
          <h3 className="font-heading font-semibold text-lg text-stone-dark">
            {park.name}
          </h3>
        </div>

        <p className="text-sm text-stone mb-4">
          {park.description}
        </p>

        <div className="flex justify-between items-center">
          <span className="inline-block bg-stone-100 rounded-full px-3 py-1 text-xs font-medium text-stone-dark">
            {cleanState(park.state)}
          </span>
          <span className="inline-block bg-stone-100 rounded-full px-3 py-1 text-xs font-medium text-stone-dark">
            Since {park.established}
          </span>
        </div>
      </div>

      <button
        className={`w-full ${getBgColors()} text-white font-heading font-semibold py-3 transition duration-300 ease-in-out ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !loading && onVote(park.id)}
        disabled={loading}
      >
        {loading ? "Voting..." : "Choose This Park"}
      </button>
    </div>
  );
}
