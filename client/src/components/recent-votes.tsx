import { useQuery } from "@tanstack/react-query";
import ParkIcon from "@/components/ui/park-icon";
import { VoteWithParks } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function RecentVotes() {
  const {
    data: recentVotes,
    isLoading,
    isError,
  } = useQuery<VoteWithParks[]>({
    queryKey: ["/api/votes/recent"],
  });

  // Format the time difference
  const formatTimeAgo = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-heading font-bold text-2xl text-stone-dark">recent votes</h2>
      </div>

      {isLoading ? (
        <div className="text-center p-8">Loading recent votes...</div>
      ) : isError ? (
        <div className="text-center p-8 text-fall">Failed to load recent votes</div>
      ) : recentVotes && recentVotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentVotes.map((vote) => (
            <div key={vote.id} className="bg-white rounded-lg shadow-sm p-4 border border-stone-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <ParkIcon 
                    parkType={vote.winner.parkType} 
                    colorScheme={vote.winner.parkType === "forest" ? "forest" : 
                               vote.winner.parkType === "canyon" ? "canyon" :
                               vote.winner.parkType === "mountain" ? "mountain" :
                               vote.winner.parkType === "water" ? "water" :
                               vote.winner.parkType === "desert" ? "canyon" : "mountain"}
                    className="mr-2" 
                  />
                  <span className="font-heading font-medium text-sm">{vote.winner.name}</span>
                </div>
                <span className="text-xs text-stone">beat</span>
                <div className="flex items-center">
                  <span className="font-heading font-medium text-sm">{vote.loser.name}</span>
                  <ParkIcon 
                    parkType={vote.loser.parkType}
                    colorScheme={vote.loser.parkType === "forest" ? "forest" : 
                               vote.loser.parkType === "canyon" ? "canyon" :
                               vote.loser.parkType === "mountain" ? "mountain" :
                               vote.loser.parkType === "water" ? "water" :
                               vote.loser.parkType === "desert" ? "canyon" : "mountain"}
                    className="ml-2" 
                  />
                </div>
              </div>
              <div className="text-xs text-stone text-right">
                {formatTimeAgo(vote.createdAt)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-stone-100">
          No votes recorded yet. Start voting to see results!
        </div>
      )}
    </section>
  );
}
