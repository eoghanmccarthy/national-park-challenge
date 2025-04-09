/**
 * ELO Rating System implementation for park rankings
 * Based on the chess ELO formula with modifications for our use case
 */

export class EloRatingSystem {
  // K-factor determines the maximum possible adjustment per game
  // Higher values make the ratings more volatile
  private kFactor: number;
  
  constructor(kFactor = 32) {
    this.kFactor = kFactor;
  }
  
  /**
   * Calculate expected score for a player based on ratings
   * @param ratingA - Rating of player A
   * @param ratingB - Rating of player B
   * @returns Expected score for player A (between 0 and 1)
   */
  calculateExpectedScore(ratingA: number, ratingB: number): number {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  }
  
  /**
   * Calculate new ratings for both players after a game
   * @param winnerRating - Current rating of the winner
   * @param loserRating - Current rating of the loser
   * @returns Object containing new ratings for both players
   */
  calculateNewRatings(winnerRating: number, loserRating: number): { 
    newWinnerRating: number;
    newLoserRating: number;
  } {
    // Calculate expected scores
    const expectedWinnerScore = this.calculateExpectedScore(winnerRating, loserRating);
    const expectedLoserScore = this.calculateExpectedScore(loserRating, winnerRating);
    
    // Calculate rating adjustments
    // Winner gets a score of 1, loser gets 0
    const winnerAdjustment = Math.round(this.kFactor * (1 - expectedWinnerScore));
    const loserAdjustment = Math.round(this.kFactor * (0 - expectedLoserScore));
    
    // Return new ratings
    return {
      newWinnerRating: winnerRating + winnerAdjustment,
      newLoserRating: loserRating + loserAdjustment
    };
  }
}

// Export a singleton instance
export const eloSystem = new EloRatingSystem();
