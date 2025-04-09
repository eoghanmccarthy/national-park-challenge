import { 
  Park, InsertPark, 
  Vote, InsertVote, 
  ParkRanking, InsertParkRanking,
  ParkWithRanking,
  VoteWithParks,
  parkRankings as parkRankingsTable,
  parks as parksTable,
  votes as votesTable
} from "@shared/schema";
import { nationalParksData } from "./parks";
import { db, sql as sqlClient } from "./db";
import { and, desc, eq, sql } from "drizzle-orm";

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
  
  // Initialize database with data
  initializeDatabase(): Promise<void>;
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
  
  async initializeDatabase(): Promise<void> {
    // This method is only needed for DatabaseStorage, but is included here for interface compatibility
    console.log("In-memory storage already initialized");
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

export class DatabaseStorage implements IStorage {
  async initializeDatabase(): Promise<void> {
    try {
      console.log("Checking if parks table is empty...");
      const existingParksResult = await sqlClient`SELECT COUNT(*) FROM parks`;
      const existingParksCount = parseInt(existingParksResult[0].count);
      
      if (existingParksCount === 0) {
        console.log("Initializing database with national parks data...");
        
        // Insert all parks from our pre-defined data using raw SQL
        for (const park of nationalParksData) {
          const established = park.yearEstablished?.toString() || park.established || '1900';
          const parkType = park.parkType || park.type || 'forest';
          
          await sqlClient`
            INSERT INTO parks (
              id, name, description, state, established, 
              rating, type, imageurl, url, area
            ) VALUES (
              ${park.id}, ${park.name}, ${park.description}, ${park.state}, 
              ${established}, ${park.rating}, ${parkType}, ${park.imageUrl || ''},
              ${park.url || ''}, ${park.area || ''}
            )
          `;
        }
        
        // Get all parks for creating initial rankings
        const parks = await this.getAllParks();
        const sortedParks = [...parks].sort((a, b) => a.id - b.id);
        
        // Create initial rankings with raw SQL
        for (let i = 0; i < sortedParks.length; i++) {
          const park = sortedParks[i];
          await sqlClient`
            INSERT INTO park_rankings (
              park_id, position, rating, previous_position, snapshot_date
            ) VALUES (
              ${park.id}, ${i + 1}, ${park.rating}, NULL, ${new Date().toISOString()}
            )
          `;
        }
        
        console.log("Database initialized with park data!");
      } else {
        console.log(`Database already has ${existingParksCount} parks, no initialization needed`);
      }
    } catch (error) {
      console.error("Error initializing database:", error);
      throw error;
    }
  }
  
  async getAllParks(): Promise<Park[]> {
    return db.select().from(parksTable);
  }
  
  async getPark(id: number): Promise<Park | undefined> {
    const parks = await db.select().from(parksTable).where(eq(parksTable.id, id));
    return parks.length > 0 ? parks[0] : undefined;
  }
  
  async updateParkRating(id: number, rating: number): Promise<Park> {
    const updatedParks = await db
      .update(parksTable)
      .set({ rating })
      .where(eq(parksTable.id, id))
      .returning();
      
    if (updatedParks.length === 0) {
      throw new Error(`Park with id ${id} not found`);
    }
    
    return updatedParks[0];
  }
  
  async createVote(
    vote: InsertVote,
    winnerPrevRating: number,
    loserPrevRating: number,
    winnerNewRating: number,
    loserNewRating: number
  ): Promise<Vote> {
    // Insert the vote using raw SQL
    const nowDate = new Date().toISOString();
    const result = await sqlClient`
      INSERT INTO votes (
        winner_id, loser_id, winner_prev_rating, loser_prev_rating,
        winner_new_rating, loser_new_rating, created_at
      ) VALUES (
        ${vote.winnerId}, ${vote.loserId}, ${winnerPrevRating}, ${loserPrevRating},
        ${winnerNewRating}, ${loserNewRating}, ${nowDate}
      )
      RETURNING *
    `;
    
    // Convert snake_case database fields to camelCase
    const newVote: Vote = {
      id: result[0].id,
      winnerId: result[0].winner_id,
      loserId: result[0].loser_id,
      winnerPrevRating: result[0].winner_prev_rating,
      loserPrevRating: result[0].loser_prev_rating,
      winnerNewRating: result[0].winner_new_rating,
      loserNewRating: result[0].loser_new_rating,
      createdAt: result[0].created_at
    };
    
    // Update the park ratings
    await this.updateParkRating(vote.winnerId, winnerNewRating);
    await this.updateParkRating(vote.loserId, loserNewRating);
    
    // Update the rankings
    await this.updateRankings();
    
    return newVote;
  }
  
  async getRecentVotes(limit: number): Promise<VoteWithParks[]> {
    // Get the most recent votes
    const recentVotes = await db
      .select()
      .from(votesTable)
      .orderBy(desc(votesTable.createdAt))
      .limit(limit);
      
    // Fetch park data for each vote
    const votesWithParks: VoteWithParks[] = [];
    
    for (const vote of recentVotes) {
      const winner = await this.getPark(vote.winnerId);
      const loser = await this.getPark(vote.loserId);
      
      if (!winner || !loser) {
        throw new Error(`Parks not found for vote ${vote.id}`);
      }
      
      votesWithParks.push({
        ...vote,
        winner,
        loser
      });
    }
    
    return votesWithParks;
  }
  
  private async getParkRanking(parkId: number): Promise<ParkRanking | undefined> {
    const rankings = await db
      .select()
      .from(parkRankingsTable)
      .where(eq(parkRankingsTable.parkId, parkId))
      .orderBy(desc(parkRankingsTable.snapshotDate));
      
    return rankings.length > 0 ? rankings[0] : undefined;
  }
  
  private async updateParkRanking(parkId: number, position: number, previousPosition: number | null): Promise<ParkRanking> {
    const park = await this.getPark(parkId);
    if (!park) {
      throw new Error(`Park with id ${parkId} not found`);
    }
    
    // Check if a ranking already exists with raw SQL
    const existingRanking = await this.getParkRanking(parkId);
    const nowDate = new Date().toISOString();
    
    if (existingRanking) {
      // Update the existing ranking with raw SQL
      const prevPosValue = previousPosition === null ? 'NULL' : previousPosition;
      const updatedRanking = await sqlClient`
        UPDATE park_rankings
        SET 
          position = ${position},
          rating = ${park.rating},
          previous_position = ${previousPosition},
          snapshot_date = ${nowDate}
        WHERE id = ${existingRanking.id}
        RETURNING *
      `;
      
      // Convert snake_case to camelCase
      return {
        id: updatedRanking[0].id,
        parkId: updatedRanking[0].park_id,
        position: updatedRanking[0].position,
        rating: updatedRanking[0].rating,
        previousPosition: updatedRanking[0].previous_position,
        snapshotDate: updatedRanking[0].snapshot_date
      };
    } else {
      // Create a new ranking with raw SQL
      const newRanking = await sqlClient`
        INSERT INTO park_rankings (
          park_id, position, rating, previous_position, snapshot_date
        ) VALUES (
          ${parkId}, ${position}, ${park.rating}, ${previousPosition}, ${nowDate}
        )
        RETURNING *
      `;
      
      // Convert snake_case to camelCase
      return {
        id: newRanking[0].id,
        parkId: newRanking[0].park_id,
        position: newRanking[0].position,
        rating: newRanking[0].rating,
        previousPosition: newRanking[0].previous_position,
        snapshotDate: newRanking[0].snapshot_date
      };
    }
  }
  
  async getParkRankings(): Promise<ParkWithRanking[]> {
    // Get all parks sorted by rating
    const parks = await db
      .select()
      .from(parksTable)
      .orderBy(desc(parksTable.rating));
      
    // Get all rankings
    const allRankings = await db
      .select()
      .from(parkRankingsTable);
      
    // Group rankings by parkId and sort by date to find previous positions
    const parkRankingMap = new Map<number, ParkRanking[]>();
    
    for (const ranking of allRankings) {
      if (!parkRankingMap.has(ranking.parkId)) {
        parkRankingMap.set(ranking.parkId, []);
      }
      parkRankingMap.get(ranking.parkId)?.push(ranking);
    }
    
    // Calculate the park ranking data
    const parksWithRankings: ParkWithRanking[] = [];
    
    for (let i = 0; i < parks.length; i++) {
      const park = parks[i];
      const position = i + 1;
      
      // Get rankings for this park sorted by date (most recent first)
      const parkRankings = parkRankingMap.get(park.id) || [];
      parkRankings.sort((a, b) => b.snapshotDate.getTime() - a.snapshotDate.getTime());
      
      // Find previous position (if at least 2 rankings exist)
      let previousPosition = position;
      let change = 0;
      
      if (parkRankings.length >= 2) {
        previousPosition = parkRankings[1].position;
        change = previousPosition - position;
      }
      
      // Update the ranking with the new position
      await this.updateParkRanking(park.id, position, previousPosition);
      
      parksWithRankings.push({
        ...park,
        position,
        change
      });
    }
    
    return parksWithRankings;
  }
  
  async updateRankings(): Promise<ParkWithRanking[]> {
    return this.getParkRankings();
  }
  
  async getRandomParkPair(): Promise<[Park, Park]> {
    // Get all parks
    const parks = await this.getAllParks();
    
    if (parks.length < 2) {
      throw new Error("Not enough parks to create a pair");
    }
    
    // Get two random parks
    const shuffled = [...parks].sort(() => 0.5 - Math.random());
    return [shuffled[0], shuffled[1]];
  }
}

// Create a singleton instance of the DatabaseStorage class
// We keep the MemStorage name for backward compatibility with existing code
export const storage = new DatabaseStorage();
