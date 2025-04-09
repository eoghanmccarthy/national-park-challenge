import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// National Parks table
export const parks = pgTable("parks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  state: text("state").notNull(), 
  yearEstablished: integer("year_established").notNull(),
  rating: integer("rating").notNull().default(1500), // ELO rating, default 1500
  parkType: text("park_type").notNull(), // forest, canyon, mountain, etc.
});

// Votes table
export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  winnerId: integer("winner_id").notNull(),
  loserId: integer("loser_id").notNull(),
  winnerPrevRating: integer("winner_prev_rating").notNull(),
  loserPrevRating: integer("loser_prev_rating").notNull(),
  winnerNewRating: integer("winner_new_rating").notNull(),
  loserNewRating: integer("loser_new_rating").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Park rankings snapshot (for tracking position changes)
export const parkRankings = pgTable("park_rankings", {
  id: serial("id").primaryKey(),
  parkId: integer("park_id").notNull(),
  position: integer("position").notNull(),
  rating: integer("rating").notNull(),
  previousPosition: integer("previous_position"),
  snapshotDate: timestamp("snapshot_date").notNull().defaultNow(),
});

// Insert schemas
export const insertParkSchema = createInsertSchema(parks).omit({ id: true, rating: true });
export const insertVoteSchema = createInsertSchema(votes).omit({ 
  id: true, 
  createdAt: true,
  winnerPrevRating: true,
  loserPrevRating: true,
  winnerNewRating: true,
  loserNewRating: true
});
export const insertParkRankingSchema = createInsertSchema(parkRankings).omit({ id: true, snapshotDate: true });

// Types
export type Park = typeof parks.$inferSelect;
export type InsertPark = z.infer<typeof insertParkSchema>;

export type Vote = typeof votes.$inferSelect;
export type InsertVote = z.infer<typeof insertVoteSchema>;

export type ParkRanking = typeof parkRankings.$inferSelect;
export type InsertParkRanking = z.infer<typeof insertParkRankingSchema>;

// Park type for frontend with position change info
export type ParkWithRanking = Park & {
  position: number;
  change: number;
};

// Vote type for frontend with park details
export type VoteWithParks = Vote & {
  winner: Park;
  loser: Park;
};
