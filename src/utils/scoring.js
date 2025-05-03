// Scoring constants - keep these consistent with ResultsPage or import them
const POINTS_FIRST = 5;
const POINTS_SECOND = 3;
const POINTS_THIRD = 1;
const POINTS_CORRECT_HORSE_WRONG_PLACE = 0.5;

/**
 * Calculates scores for each user based on their picks and official race results.
 * @param {Array} picks - Array of pick objects, e.g., { userId: '...', first: 'h1', second: 'h2', third: 'h3' }
 * @param {Object} officialResults - Object with official winners, e.g., { first: 'h1', second: 'h2', third: 'h3' }
 * @param {Object} usersMap - Map or Object mapping userId to user data (optional, for debugging/future use)
 * @param {Array<String>} [scratchedHorses=[]] - Array of horse IDs that were scratched from the race.
 * @returns {Object} - Object mapping userId to their calculated score.
 */
export function calculateScores(picks, officialResults, usersMap = {}, scratchedHorses = []) {
  if (!picks || picks.length === 0 || !officialResults || !officialResults.first || !officialResults.second || !officialResults.third) {
    return {}; // Return empty scores if no picks or incomplete results
  }

  const scores = {};
  const winningHorses = new Set([
      officialResults.first,
      officialResults.second,
      officialResults.third
  ]);
  const scratchedSet = new Set(scratchedHorses); // Set for efficient lookup

  picks.forEach(pick => {
    let currentScore = 0;
    // Ensure pick values are valid before comparison
    const pickFirst = pick.first || null;
    const pickSecond = pick.second || null;
    const pickThird = pick.third || null;

    // Check exact matches, ignoring scratched horses
    if (pickFirst && !scratchedSet.has(pickFirst)) { // Check if NOT scratched
      if (pickFirst === officialResults.first) {
        currentScore += POINTS_FIRST;
      } else if (winningHorses.has(pickFirst)) { // Horse was in top 3, but wrong place
        currentScore += POINTS_CORRECT_HORSE_WRONG_PLACE;
      }
    }

    if (pickSecond && !scratchedSet.has(pickSecond)) { // Check if NOT scratched
      if (pickSecond === officialResults.second) {
        currentScore += POINTS_SECOND;
      } else if (winningHorses.has(pickSecond)) { // Horse was in top 3, but wrong place
        currentScore += POINTS_CORRECT_HORSE_WRONG_PLACE;
      }
    }

    if (pickThird && !scratchedSet.has(pickThird)) { // Check if NOT scratched
      if (pickThird === officialResults.third) {
        currentScore += POINTS_THIRD;
      } else if (winningHorses.has(pickThird)) { // Horse was in top 3, but wrong place
        currentScore += POINTS_CORRECT_HORSE_WRONG_PLACE;
      }
    }

    // Aggregate scores per user
    const userId = pick.userId;
    if (userId) { // Only add score if userId is present
        scores[userId] = (scores[userId] || 0) + currentScore;
    }
  });

  return scores;
}

// Optional: Function to find winners from scores (handles ties)
/**
 * Determines the winner(s) from a scores object.
 * @param {Object} scores - Object mapping userId to score.
 * @param {Object} usersMap - Map or Object mapping userId to user data { displayName: '...' }.
 * @returns {Array} - Array of winner objects { userId, userName, score }, empty if no winner.
 */
export function findWinnersFromScores(scores, usersMap) {
    let maxScore = -1;
    for (const userId in scores) {
        if (scores[userId] > maxScore) {
            maxScore = scores[userId];
        }
    }

    // No winner if max score is 0 or less, or if scores object is empty
    if (maxScore <= 0 || Object.keys(scores).length === 0) {
        console.log("Maximum score was 0 or less, or no scores calculated. No winner declared.");
        return [];
    }

    const winners = [];
    for (const userId in scores) {
        if (scores[userId] === maxScore) {
            winners.push({
                userId: userId,
                userName: usersMap[userId]?.displayName || `User (${userId.substring(0, 5)}...)`,
                score: scores[userId],
            });
        }
    }
    return winners;
} 