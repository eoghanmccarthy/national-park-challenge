import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { eloSystem } from "./elo";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  
  // Get random park pair for voting
  app.get("/api/parks/pair", async (req, res) => {
    try {
      const parkPair = await storage.getRandomParkPair();
      res.json(parkPair);
    } catch (error) {
      console.error("Error getting park pair:", error);
      res.status(500).json({ message: "Failed to get park pair" });
    }
  });
  
  // Get all parks
  app.get("/api/parks", async (req, res) => {
    try {
      const parks = await storage.getAllParks();
      res.json(parks);
    } catch (error) {
      console.error("Error getting all parks:", error);
      res.status(500).json({ message: "Failed to get parks" });
    }
  });
  
  // Get park rankings
  app.get("/api/rankings", async (req, res) => {
    try {
      const rankings = await storage.getParkRankings();
      res.json(rankings);
    } catch (error) {
      console.error("Error getting rankings:", error);
      res.status(500).json({ message: "Failed to get rankings" });
    }
  });
  
  // Get recent votes
  app.get("/api/votes/recent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const recentVotes = await storage.getRecentVotes(limit);
      res.json(recentVotes);
    } catch (error) {
      console.error("Error getting recent votes:", error);
      res.status(500).json({ message: "Failed to get recent votes" });
    }
  });
  
  // Submit vote
  app.post("/api/vote", async (req, res) => {
    try {
      const { winnerId, loserId } = req.body;
      
      if (!winnerId || !loserId) {
        return res.status(400).json({ message: "Winner and loser IDs are required" });
      }
      
      // Get current ratings
      const winner = await storage.getPark(winnerId);
      const loser = await storage.getPark(loserId);
      
      if (!winner || !loser) {
        return res.status(404).json({ message: "Park not found" });
      }
      
      // Calculate new ratings
      const { newWinnerRating, newLoserRating } = eloSystem.calculateNewRatings(
        winner.rating,
        loser.rating
      );
      
      // Store vote and update ratings
      const vote = await storage.createVote(
        { winnerId, loserId },
        winner.rating,
        loser.rating,
        newWinnerRating,
        newLoserRating
      );
      
      res.json({ 
        vote,
        winner: { 
          ...winner, 
          newRating: newWinnerRating,
          ratingChange: newWinnerRating - winner.rating
        },
        loser: { 
          ...loser, 
          newRating: newLoserRating,
          ratingChange: newLoserRating - loser.rating
        }
      });
    } catch (error) {
      console.error("Error submitting vote:", error);
      res.status(500).json({ message: "Failed to submit vote" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
