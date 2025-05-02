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
  serverTimestamp,
  deleteField
} from 'firebase/firestore';
import { calculateScores, findWinnersFromScores } from '../utils/scoring';

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
    if (!raceIdToCalc || !officialResultsToUse || !officialResultsToUse.first || !officialResultsToUse.second || !officialResultsToUse.third) {
        console.warn("Attempted to calculate winner with incomplete data:", raceIdToCalc, officialResultsToUse);
        return null;
    }

    setCalculatingWinner(true);
    setWinnerData(null); // Clear previous winner
    setError(null); // Clear previous errors
    console.log("Calculating winner for", raceIdToCalc);

    try {
      // 1. Fetch all picks for the race
      const picksCollection = collection(db, 'picks');
      const pq = query(picksCollection, where('raceId', '==', raceIdToCalc));
      const picksSnapshot = await getDocs(pq);
      const picks = picksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (picks.length === 0) {
        console.log("No picks found for this race.");
        setWinnerData([]); // Set winner data to empty array for display
        return []; // Return empty array if no picks
      }

      // 2. Fetch all users (consider optimizing later if needed)
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersMap = usersSnapshot.docs.reduce((acc, doc) => {
        acc[doc.id] = doc.data();
        return acc;
      }, {});

      // 3. Calculate scores using the utility function
      const scores = calculateScores(picks, officialResultsToUse, usersMap);
      console.log("Calculated scores:", scores);

      // 4. Find winners using the utility function
      const winners = findWinnersFromScores(scores, usersMap);
      console.log("Winner calculation complete:", winners);

      setWinnerData(winners); // Update state
      return winners; // Return the result

    } catch (err) {
      console.error("Error calculating winner:", err);
      setError('Failed to calculate winner.');
      setWinnerData(null); // Ensure winner data is cleared on error
      return null; // Indicate error
    } finally {
        setCalculatingWinner(false);
    }
  }, [setError]);

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
  }, [selectedRaceId, calculateWinner, setError]);

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

    // Construct the results payload WITH the server timestamp placeholder
    const resultsPayloadForDb = {
        first: results.first,
        second: results.second,
        third: results.third,
        resultsSetAt: serverTimestamp() // Use the placeholder for writing
    };

    // Construct results payload for local calculation (without timestamp placeholder)
    const resultsPayloadForCalc = {
        first: results.first,
        second: results.second,
        third: results.third
        // resultsSetAt is not needed for calculation logic
    };

    try {
      const raceDocRef = doc(db, 'races', selectedRaceId);
      await updateDoc(raceDocRef, {
         results: resultsPayloadForDb, // Use payload with server timestamp
         status: 'finished'
      });
      console.log('Results set successfully');
      // Immediately trigger calculation with the known results, no need to wait for refetch
      // This avoids potential timing issues with fetchRaceDetails
      calculateWinner(selectedRaceId, resultsPayloadForCalc);
      // Optionally, still fetch details to update the UI completely, but calculation is done
      fetchRaceDetails();

    } catch (err) {
      console.error("Error setting results:", err);
      setError('Failed to set race results.');
    }
  };

  // Function to clear results for the current race
  const handleClearResults = async () => {
    if (!isAdmin || !selectedRaceId) return;

    // Optional: Add a confirmation dialog
    if (!window.confirm('Are you sure you want to clear the results for this race? This cannot be undone.')) {
        return;
    }

    setError(null); // Clear previous errors
    setWinnerData(null); // Clear winner display immediately

    try {
      const raceDocRef = doc(db, 'races', selectedRaceId);
      await updateDoc(raceDocRef, {
        results: deleteField(), // Use deleteField to remove the results map
        status: 'locked' // Revert status to 'locked' (or 'open' if preferred)
      });
      console.log('Results cleared successfully');
      // Refetch details to update the UI (remove results display, update status)
      fetchRaceDetails();
    } catch (err) {
      console.error("Error clearing results:", err);
      setError('Failed to clear race results.');
      // Consider refetching even on error to ensure UI consistency
      fetchRaceDetails();
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
              onClearResults={handleClearResults}
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