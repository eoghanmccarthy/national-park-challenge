import { useQuery } from "@tanstack/react-query";
import ParkIcon from "@/components/ui/park-icon";
import { ParkWithRanking } from "@shared/schema";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

export default function RankingsTable() {
  const {
    data: rankings,
    isLoading,
    isError,
  } = useQuery<ParkWithRanking[]>({
    queryKey: ["/api/rankings"],
  });

  // Display the top 10 parks (or however many we have)
  const topRankedParks = rankings?.slice(0, 10) || [];

  // Function to render the change indicator
  const renderChangeIndicator = (change: number) => {
    if (change > 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rise bg-opacity-10 text-rise">
          <ArrowUp className="w-3 h-3 mr-1" />
          {change}
        </span>
      );
    } else if (change < 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-fall bg-opacity-10 text-fall">
          <ArrowDown className="w-3 h-3 mr-1" />
          {Math.abs(change)}
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral bg-opacity-10 text-neutral">
          <Minus className="w-3 h-3 mr-1" />
          0
        </span>
      );
    }
  };

  return (
    <section className="mb-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-heading font-bold text-2xl text-stone-dark">rankings</h2>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-stone-100">
        {isLoading ? (
          <div className="p-8 text-center">Loading rankings...</div>
        ) : isError ? (
          <div className="p-8 text-center text-fall">Failed to load rankings</div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-stone uppercase tracking-wider"></th>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-stone uppercase tracking-wider">Park</th>
                <th className="px-6 py-3 text-right text-xs font-heading font-semibold text-stone uppercase tracking-wider">score</th>
                <th className="px-6 py-3 text-right text-xs font-heading font-semibold text-stone uppercase tracking-wider">change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {topRankedParks.map((park) => (
                <tr key={park.id} className="hover:bg-stone-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="flex-shrink-0 font-heading font-bold text-lg">{park.position}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <ParkIcon 
                        parkType={park.parkType} 
                        colorScheme={park.parkType === "forest" ? "forest" : 
                                    park.parkType === "canyon" ? "canyon" :
                                    park.parkType === "mountain" ? "mountain" :
                                    park.parkType === "water" ? "water" :
                                    park.parkType === "desert" ? "canyon" : "mountain"}
                        className="mr-3" 
                      />
                      <div className="font-heading font-medium">{park.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-medium">{park.rating}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {renderChangeIndicator(park.change)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
