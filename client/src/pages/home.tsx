import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ParkCard from "@/components/park-card";
import RankingsTable from "@/components/rankings-table";
import RecentVotes from "@/components/recent-votes";
import { Park } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const [currentMatchup, setCurrentMatchup] = useState<[Park, Park] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [votingEnabled, setVotingEnabled] = useState(true);

  // Fetch a random pair of parks
  const fetchParkPair = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/parks/pair");
      if (!res.ok) throw new Error("Failed to fetch parks");
      const data = await res.json();
      setCurrentMatchup(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load park matchup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchParkPair();
  }, []);

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ winnerId, loserId }: { winnerId: number; loserId: number }) => {
      const res = await apiRequest("POST", "/api/vote", { winnerId, loserId });
      return res.json();
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/rankings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/votes/recent"] });
      
      // Load a new matchup after vote
      setTimeout(() => {
        fetchParkPair();
        setVotingEnabled(true);
      }, 1000);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit vote. Please try again.",
        variant: "destructive",
      });
      setVotingEnabled(true);
    },
  });

  // Handle vote submission
  const handleVote = (winnerId: number, loserId: number) => {
    if (!votingEnabled) return;
    
    setVotingEnabled(false);
    voteMutation.mutate({ winnerId, loserId });
  };

  // Handle skipping the current matchup
  const handleSkipVote = () => {
    fetchParkPair();
  };

  return (
    <main className="flex-grow container mx-auto px-4 py-6 md:py-10">
      {/* Voting Section */}
      <section className="mb-12">
        <h2 className="font-heading font-bold text-2xl mb-6 text-center">
          Which park would you rather visit?
        </h2>

        <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
          {currentMatchup ? (
            <>
              {/* First Park Card */}
              <ParkCard
                park={currentMatchup[0]}
                loading={isLoading || voteMutation.isPending}
                onVote={(parkId) => handleVote(parkId, currentMatchup[1].id)}
                colorScheme="forest"
              />

              {/* VS Indicator */}
              <div className="flex flex-col items-center justify-center my-3 md:my-0">
                <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center">
                  <span className="font-heading font-bold text-xl text-mountain">VS</span>
                </div>
              </div>

              {/* Second Park Card */}
              <ParkCard
                park={currentMatchup[1]}
                loading={isLoading || voteMutation.isPending}
                onVote={(parkId) => handleVote(parkId, currentMatchup[0].id)}
                colorScheme="canyon"
              />
            </>
          ) : (
            <div className="text-center w-full py-10">
              {isLoading ? "Loading parks..." : "No parks available for voting"}
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            className="inline-flex items-center justify-center px-4 py-2 bg-stone-light hover:bg-stone text-white font-medium rounded-md transition duration-300 ease-in-out"
            onClick={handleSkipVote}
            disabled={isLoading || voteMutation.isPending}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              ></path>
            </svg>
            Skip This Matchup
          </button>
        </div>
      </section>

      {/* Rankings Section */}
      <RankingsTable />

      {/* Recent Votes Section */}
      <RecentVotes />
    </main>
  );
}
