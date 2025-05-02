// scoring.test.js
import { describe, it, expect } from 'vitest';
import { calculateScores, findWinnersFromScores } from './scoring';

// Mock data
const usersMap = {
    user1: { displayName: 'Alice' },
    user2: { displayName: 'Bob' },
    user3: { displayName: 'Charlie' },
};

const officialResults = {
    first: 'horseA',
    second: 'horseB',
    third: 'horseC'
};

// Test Suite for calculateScores
describe('calculateScores', () => {

    it('should return empty object for no picks', () => {
        const picks = [];
        expect(calculateScores(picks, officialResults)).toEqual({});
    });

    it('should return empty object for incomplete official results', () => {
        const picks = [{ userId: 'user1', first: 'horseA', second: 'horseB', third: 'horseC' }];
        const incompleteResults = { first: 'horseA', second: 'horseB' }; // Missing third
        expect(calculateScores(picks, incompleteResults)).toEqual({});
    });

    it('should calculate scores correctly for exact matches', () => {
        const picks = [
            { userId: 'user1', first: 'horseA', second: 'horseB', third: 'horseC' }, // 5 + 3 + 1 = 9
            { userId: 'user2', first: 'horseX', second: 'horseY', third: 'horseZ' }, // 0
        ];
        const expectedScores = { user1: 9, user2: 0 };
        expect(calculateScores(picks, officialResults)).toEqual(expectedScores);
    });

    it('should calculate scores correctly for partial matches (correct horse, wrong place)', () => {
        const picks = [
            { userId: 'user1', first: 'horseB', second: 'horseA', third: 'horseD' }, // 0.5 (B) + 0.5 (A) + 0 = 1
            { userId: 'user2', first: 'horseA', second: 'horseX', third: 'horseC' }, // 5 (A) + 0 + 1 (C) = 6
        ];
        const expectedScores = { user1: 1, user2: 6 };
        expect(calculateScores(picks, officialResults)).toEqual(expectedScores);
    });

    it('should handle mixed exact and partial matches', () => {
        const picks = [
            { userId: 'user1', first: 'horseA', second: 'horseC', third: 'horseB' }, // 5 (A) + 0.5 (C) + 0.5 (B) = 6
        ];
        const expectedScores = { user1: 6 };
        expect(calculateScores(picks, officialResults)).toEqual(expectedScores);
    });

    it('should calculate score as 0 if no picks match winning horses', () => {
        const picks = [
            { userId: 'user1', first: 'horseX', second: 'horseY', third: 'horseZ' },
        ];
        const expectedScores = { user1: 0 };
        expect(calculateScores(picks, officialResults)).toEqual(expectedScores);
    });

    it('should aggregate scores for multiple picks from the same user (though not expected in current design)', () => {
        const picks = [
            { userId: 'user1', first: 'horseA', second: 'horseB', third: 'horseC' }, // 9
            { userId: 'user1', first: 'horseA', second: 'X', third: 'Y' },          // 5
        ];
        const expectedScores = { user1: 14 };
        expect(calculateScores(picks, officialResults)).toEqual(expectedScores);
    });

    it('should handle picks with missing horses gracefully', () => {
        const picks = [
            { userId: 'user1', first: 'horseA', second: null, third: 'horseC' }, // 5 + 0 + 1 = 6
            { userId: 'user2', first: undefined, second: 'horseB', third: 'horseD' }, // 0 + 3 + 0 = 3
        ];
        const expectedScores = { user1: 6, user2: 3 };
        expect(calculateScores(picks, officialResults)).toEqual(expectedScores);
    });
});

// Test Suite for findWinnersFromScores
describe('findWinnersFromScores', () => {

    it('should return an empty array if scores object is empty', () => {
        expect(findWinnersFromScores({}, usersMap)).toEqual([]);
    });

    it('should return an empty array if the max score is 0', () => {
        const scores = { user1: 0, user2: 0 };
        expect(findWinnersFromScores(scores, usersMap)).toEqual([]);
    });

    it('should return an empty array if the max score is negative (should not happen)', () => {
        const scores = { user1: -1, user2: -5 };
        expect(findWinnersFromScores(scores, usersMap)).toEqual([]);
    });

    it('should find a single winner correctly', () => {
        const scores = { user1: 9, user2: 6, user3: 1 };
        const expectedWinners = [
            { userId: 'user1', userName: 'Alice', score: 9 },
        ];
        expect(findWinnersFromScores(scores, usersMap)).toEqual(expectedWinners);
    });

    it('should find multiple winners in case of a tie', () => {
        const scores = { user1: 9, user2: 9, user3: 1 };
        const expectedWinners = [
            { userId: 'user1', userName: 'Alice', score: 9 },
            { userId: 'user2', userName: 'Bob', score: 9 },
        ];
        // Use expect(...).toEqual(expect.arrayContaining(...)) for arrays where order doesn't matter
        expect(findWinnersFromScores(scores, usersMap)).toEqual(expect.arrayContaining(expectedWinners));
        expect(findWinnersFromScores(scores, usersMap).length).toBe(2);
    });

    it('should handle users not present in usersMap gracefully', () => {
        const scores = { user1: 9, user4: 5 }; // user4 not in usersMap
        const expectedWinners = [
            { userId: 'user1', userName: 'Alice', score: 9 },
        ];
        expect(findWinnersFromScores(scores, usersMap)).toEqual(expectedWinners);
    });

     it('should handle ties where one user is not in usersMap', () => {
        const scores = { user1: 9, user4: 9 }; // user4 not in usersMap
        const expectedWinners = [
            { userId: 'user1', userName: 'Alice', score: 9 },
            { userId: 'user4', userName: 'User (user4...)', score: 9 },
        ];
        expect(findWinnersFromScores(scores, usersMap)).toEqual(expect.arrayContaining(expectedWinners));
        expect(findWinnersFromScores(scores, usersMap).length).toBe(2);
    });
}); 