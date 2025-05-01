import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RaceSelector from '../components/RaceSelector';
import ResultsAdminForm from '../components/ResultsAdminForm';
import ResultsDisplay from '../components/ResultsDisplay';
import WinnerDisplay from '../components/WinnerDisplay';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

// --- Scoring Configuration ---
const POINTS_FIRST = 5;
const POINTS_SECOND = 3;
const POINTS_THIRD = 1;
const POINTS_CORRECT_HORSE_WRONG_PLACE = 0.5;
// ---------------------------

function ResultsPage() {
  const { raceId: initialRaceId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [selectedRaceId, setSelectedRaceId] = useState(initialRaceId || '');
  const [races, setRaces] = useState([]);
  const [horses, setHorses] = useState([]);
  const [selectedRaceData, setSelectedRaceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [winnerData, setWinnerData] = useState(null);
  const [calculatingWinner, setCalculatingWinner] = useState(false);

  useEffect(() => {
    const fetchRaces = async () => {
      try {
        const racesCollection = collection(db, 'races');
        const q = query(racesCollection, orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        const racesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRaces(racesData);
      } catch (err) {
        console.error("Error fetching races:", err);
        setError('Failed to load race list.');
      }
    };
    fetchRaces();
  }, []);

  const calculateWinner = useCallback(async (raceIdToCalc, officialResultsToUse) => {
    if (!raceIdToCalc || !officialResultsToUse) return null;

    setCalculatingWinner(true);
    setWinnerData(null); // Clear previous winner
    console.log("Calculating winner for", raceIdToCalc);

    try {
      // 1. Fetch all picks for the race
      const picksCollection = collection(db, 'picks');
      const pq = query(picksCollection, where('raceId', '==', raceIdToCalc));
      const picksSnapshot = await getDocs(pq);
      const picks = picksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (picks.length === 0) {
        console.log("No picks found for this race.");
        setCalculatingWinner(false);
        return []; // Return empty array if no picks
      }

      // 2. Fetch all users (for display names - assuming small number of users)
      // If many users, fetch individual names based on picks userIds later
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersMap = usersSnapshot.docs.reduce((acc, doc) => {
        acc[doc.id] = doc.data();
        return acc;
      }, {});

      // 3. Calculate scores
      const scores = {};
      const winningHorses = new Set([
          officialResultsToUse.first,
          officialResultsToUse.second,
          officialResultsToUse.third
      ]);

      picks.forEach(pick => {
        let currentScore = 0;
        const pickedHorses = [pick.first, pick.second, pick.third];

        // Check exact matches first
        if (pick.first === officialResultsToUse.first) {
          currentScore += POINTS_FIRST;
        } else if (winningHorses.has(pick.first)) { // Horse was in top 3, but wrong place
            currentScore += POINTS_CORRECT_HORSE_WRONG_PLACE;
        }

        if (pick.second === officialResultsToUse.second) {
          currentScore += POINTS_SECOND;
        } else if (winningHorses.has(pick.second)) { // Horse was in top 3, but wrong place
            currentScore += POINTS_CORRECT_HORSE_WRONG_PLACE;
        }

        if (pick.third === officialResultsToUse.third) {
          currentScore += POINTS_THIRD;
        } else if (winningHorses.has(pick.third)) { // Horse was in top 3, but wrong place
            currentScore += POINTS_CORRECT_HORSE_WRONG_PLACE;
        }

        // Aggregate scores per user
        scores[pick.userId] = (scores[pick.userId] || 0) + currentScore;
      });

      // 4. Find max score
      let maxScore = -1; // Initialize to -1 to handle zero scores correctly
      for (const userId in scores) {
        if (scores[userId] > maxScore) {
          maxScore = scores[userId];
        }
      }

      // 5. Find all users with max score (handle ties)
      const winners = [];
      // Handle case where no one scored any points
      if (maxScore <= 0 && Object.keys(scores).length > 0) {
          // Option 1: Declare no winner (return empty array)
          // Option 2: Declare everyone with 0 points a winner (if picks were made)
          // Let's go with Option 1: No winner if max score is 0 or less
          console.log("Maximum score was 0 or less. No winner declared.");
      } else if (maxScore > 0) {
          for (const userId in scores) {
            if (scores[userId] === maxScore) {
              winners.push({
                userId: userId,
                userName: usersMap[userId]?.displayName || `User (${userId.substring(0, 5)}...)`, // Get name from map
                score: scores[userId],
              });
            }
          }
      }

      console.log("Winner calculation complete:", winners);
      setWinnerData(winners); // Update state
      return winners; // Return the result

    } catch (err) {
      console.error("Error calculating winner:", err);
      setError('Failed to calculate winner.');
      return null; // Indicate error
    } finally {
        setCalculatingWinner(false);
    }
  }, [setError]); // Include setError in dependencies

  const fetchRaceDetails = useCallback(async () => {
    if (!selectedRaceId) {
      setSelectedRaceData(null);
      setHorses([]);
      setWinnerData(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setWinnerData(null);
    try {
      const raceDocRef = doc(db, 'races', selectedRaceId);
      const raceDocSnap = await getDoc(raceDocRef);

      if (!raceDocSnap.exists()) {
        setError('Selected race not found.');
        setSelectedRaceData(null);
        setHorses([]);
        setLoading(false);
        return;
      }
      const raceData = { id: raceDocSnap.id, ...raceDocSnap.data() };
      setSelectedRaceData(raceData);

      const horsesCollection = collection(db, 'horses');
      const hq = query(horsesCollection, where('raceIds', 'array-contains', selectedRaceId));
      const horsesSnapshot = await getDocs(hq);
      const horsesData = horsesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHorses(horsesData);

      // Trigger calculation if results exist and status is finished
      if (raceData.results && raceData.status === 'finished') {
         calculateWinner(selectedRaceId, raceData.results);
      }

    } catch (err) {
      console.error("Error fetching race details:", err);
      setError('Failed to load details for the selected race.');
      setSelectedRaceData(null);
      setHorses([]);
    } finally {
      setLoading(false);
    }
  }, [selectedRaceId, calculateWinner, setError]); // Add calculateWinner and setError

  useEffect(() => {
    fetchRaceDetails();
  }, [fetchRaceDetails]);

  useEffect(() => {
    setSelectedRaceId(initialRaceId || '');
  }, [initialRaceId]);

  const handleRaceSelect = (newRaceId) => {
    if (newRaceId !== selectedRaceId) {
        setSelectedRaceId(newRaceId);
        navigate(`/results/${newRaceId}`);
    }
  };

  const handleSetStatus = async (newStatus) => {
    if (!isAdmin || !selectedRaceId) return;
    setError(null);
    try {
      const raceDocRef = doc(db, 'races', selectedRaceId);
      await updateDoc(raceDocRef, { status: newStatus });
      fetchRaceDetails();
      console.log('Status updated successfully');
    } catch (err) {
      console.error("Error updating status:", err);
      setError('Failed to update race status.');
    }
  };

  const handleSetResults = async (results) => {
    if (!isAdmin || !selectedRaceId) return;
    if (!results.first || !results.second || !results.third) {
        setError("Please select 1st, 2nd, and 3rd place horses.");
        return;
    }
    setError(null);

    const resultsPayload = {
        ...results,
        resultsSetAt: serverTimestamp()
    };

    try {
      const raceDocRef = doc(db, 'races', selectedRaceId);
      await updateDoc(raceDocRef, {
         results: resultsPayload,
         status: 'finished'
      });
      console.log('Results set successfully');
      // Refetch data first to ensure resultsSetAt is a valid timestamp
      await fetchRaceDetails();
      // Now trigger calculation using the just-fetched (or about to be fetched) data
      // Note: fetchRaceDetails itself will call calculateWinner if conditions are met
      // We might need to pass the resultsPayload directly if fetchRaceDetails hasn't updated state yet
      // Let's rely on the fetchRaceDetails logic for now.
      // If it proves unreliable due to timing, we can call explicitly:
      // calculateWinner(selectedRaceId, resultsPayload);

    } catch (err) {
      console.error("Error setting results:", err);
      setError('Failed to set race results.');
    }
  };

  return (
    <div>
      <h1>Race Results</h1>
      <RaceSelector
        races={races}
        selectedRaceId={selectedRaceId}
        onSelectRace={handleRaceSelect}
      />

      {loading && <p>Loading race details...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {selectedRaceId && !loading && !error && selectedRaceData ? (
        <>
          {isAdmin && (
            <ResultsAdminForm
              raceId={selectedRaceId}
              horses={horses}
              currentStatus={selectedRaceData?.status}
              currentResults={selectedRaceData?.results}
              onSetStatus={handleSetStatus}
              onSetResults={handleSetResults}
            />
          )}
          <hr />
          <ResultsDisplay
             results={selectedRaceData?.results}
             horses={horses}
          />
          {calculatingWinner && <p>Calculating winner...</p>}
          <WinnerDisplay winnerData={winnerData} />
        </>
      ) : selectedRaceId && !loading && !error ? (
          <p>Race data could not be loaded.</p>
      ) : !selectedRaceId && !loading ? (
        <p>Please select a race above.</p>
      ) : null }
    </div>
  );
}

export default ResultsPage; 