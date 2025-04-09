import { 
  Park, InsertPark, 
  Vote, InsertVote, 
  ParkRanking, InsertParkRanking,
  ParkWithRanking,
  VoteWithParks
} from "@shared/schema";
import { nationalParksData } from "./parks";

export interface IStorage {
  // Parks
  getAllParks(): Promise<Park[]>;
  getPark(id: number): Promise<Park | undefined>;
  updateParkRating(id: number, rating: number): Promise<Park>;
  
  // Votes
  createVote(vote: InsertVote, winnerPrevRating: number, loserPrevRating: number, 
            winnerNewRating: number, loserNewRating: number): Promise<Vote>;
  getRecentVotes(limit: number): Promise<VoteWithParks[]>;
  
  // Rankings
  getParkRankings(): Promise<ParkWithRanking[]>;
  updateRankings(): Promise<ParkWithRanking[]>;
  getRandomParkPair(): Promise<[Park, Park]>;
}

export class MemStorage implements IStorage {
  private parks: Map<number, Park>;
  private votes: Map<number, Vote>;
  private parkRankings: Map<number, ParkRanking>;
  private currentVoteId: number;
  private currentRankingId: number;

  constructor() {
    this.parks = new Map();
    this.votes = new Map();
    this.parkRankings = new Map();
    this.currentVoteId = 1;
    this.currentRankingId = 1;
    
    // Initialize with national parks data
    nationalParksData.forEach((park, index) => {
      this.parks.set(park.id, park);
      this.updateParkRanking(park.id, index + 1, null);
    });
  }

  async getAllParks(): Promise<Park[]> {
    return Array.from(this.parks.values());
  }

  async getPark(id: number): Promise<Park | undefined> {
    return this.parks.get(id);
  }

  async updateParkRating(id: number, rating: number): Promise<Park> {
    const park = this.parks.get(id);
    if (!park) {
      throw new Error(`Park with id ${id} not found`);
    }
    
    const updatedPark: Park = { ...park, rating };
    this.parks.set(id, updatedPark);
    return updatedPark;
  }

  async createVote(
    vote: InsertVote, 
    winnerPrevRating: number, 
    loserPrevRating: number,
    winnerNewRating: number,
    loserNewRating: number
  ): Promise<Vote> {
    const id = this.currentVoteId++;
    const newVote: Vote = {
      id,
      winnerId: vote.winnerId,
      loserId: vote.loserId,
      winnerPrevRating,
      loserPrevRating,
      winnerNewRating,
      loserNewRating,
      createdAt: new Date()
    };
    
    this.votes.set(id, newVote);
    
    // Update park ratings
    await this.updateParkRating(vote.winnerId, winnerNewRating);
    await this.updateParkRating(vote.loserId, loserNewRating);
    
    // Update rankings after vote
    await this.updateRankings();
    
    return newVote;
  }

  async getRecentVotes(limit: number): Promise<VoteWithParks[]> {
    const allVotes = Array.from(this.votes.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
      
    return Promise.all(allVotes.map(async vote => {
      const winner = await this.getPark(vote.winnerId);
      const loser = await this.getPark(vote.loserId);
      if (!winner || !loser) {
        throw new Error("Failed to get park details for vote");
      }
      return { ...vote, winner, loser };
    }));
  }

  private async updateParkRanking(parkId: number, position: number, previousPosition: number | null): Promise<ParkRanking> {
    const park = await this.getPark(parkId);
    if (!park) {
      throw new Error(`Park with id ${parkId} not found`);
    }
    
    const id = this.currentRankingId++;
    const ranking: ParkRanking = {
      id,
      parkId,
      position,
      rating: park.rating,
      previousPosition,
      snapshotDate: new Date()
    };
    
    this.parkRankings.set(id, ranking);
    return ranking;
  }

  async getParkRankings(): Promise<ParkWithRanking[]> {
    // Get all parks sorted by rating
    const parks = await this.getAllParks();
    const sortedParks = [...parks].sort((a, b) => b.rating - a.rating);
    
    // Get the latest park rankings to calculate position changes
    const parkIdToRanking = new Map<number, ParkRanking>();
    
    // Group rankings by parkId
    const parkRankingsGrouped = Array.from(this.parkRankings.values())
      .reduce((groups, ranking) => {
        if (!groups[ranking.parkId]) {
          groups[ranking.parkId] = [];
        }
        groups[ranking.parkId].push(ranking);
        return groups;
      }, {} as Record<number, ParkRanking[]>);
    
    // Get the second most recent ranking for each park
    Object.entries(parkRankingsGrouped).forEach(([parkId, rankings]) => {
      if (rankings.length >= 2) {
        // Sort by date descending and get the second one
        const sortedRankings = rankings.sort((a, b) => 
          b.snapshotDate.getTime() - a.snapshotDate.getTime());
        parkIdToRanking.set(Number(parkId), sortedRankings[1]);
      }
    });
    
    // Create park with ranking data
    return sortedParks.map((park, index) => {
      const position = index + 1;
      const previousRanking = parkIdToRanking.get(park.id);
      const previousPosition = previousRanking?.position ?? position;
      const change = previousPosition - position;
      
      return {
        ...park,
        position,
        change
      };
    });
  }

  async updateRankings(): Promise<ParkWithRanking[]> {
    const parks = await this.getAllParks();
    const sortedParks = [...parks].sort((a, b) => b.rating - a.rating);
    
    // Update rankings for all parks
    await Promise.all(sortedParks.map(async (park, index) => {
      // Find the current position first
      const currentPositions = Array.from(this.parkRankings.values())
        .filter(r => r.parkId === park.id)
        .sort((a, b) => b.snapshotDate.getTime() - a.snapshotDate.getTime());
        
      const currentPosition = currentPositions.length > 0 ? currentPositions[0].position : null;
      await this.updateParkRanking(park.id, index + 1, currentPosition);
    }));
    
    return this.getParkRankings();
  }

  async getRandomParkPair(): Promise<[Park, Park]> {
    const parks = await this.getAllParks();
    if (parks.length < 2) {
      throw new Error("Not enough parks to create a pair");
    }
    
    // Get two random parks
    const shuffled = [...parks].sort(() => 0.5 - Math.random());
    return [shuffled[0], shuffled[1]];
  }
}

export const storage = new MemStorage();
