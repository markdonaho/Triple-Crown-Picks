import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, collection, getDocs, getDoc, doc, query, where, orderBy, limit, setDoc, serverTimestamp } from 'firebase/firestore'; // Import Firestore functions
import { useAuth } from '../hooks/useAuth'; // Import useAuth
import { db } from '../services/firebase'; // Import db instance
import RaceSelector from '../components/RaceSelector';
import PicksForm from '../components/PicksForm';
import PicksDisplay from '../components/PicksDisplay';

// Helper function to sort horses
const sortHorsesByPost = (horsesToSort) => {
    if (!horsesToSort) return [];
    return [...horsesToSort].sort((a, b) => {
        const posA = typeof a.postPosition === 'number' ? a.postPosition : Infinity;
        const posB = typeof b.postPosition === 'number' ? b.postPosition : Infinity;
        return posA - posB;
    });
};

function PicksPage() {
  const { raceId: initialRaceId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth(); // Use the auth hook
  const [selectedRaceId, setSelectedRaceId] = useState(initialRaceId || '');
  const [races, setRaces] = useState([]); // State for races list
  const [loadingRaces, setLoadingRaces] = useState(false); // Loading state for races
  const [errorRaces, setErrorRaces] = useState(null); // Error state for races

  // Placeholder states - will be implemented next
  const [horses, setHorses] = useState([]); // Placeholder
  const [currentPicks, setCurrentPicks] = useState(null); // Placeholder
  const [raceStatus, setRaceStatus] = useState(''); // Placeholder: 'upcoming', 'open', 'locked', 'finished'
  const [loadingRaceDetails, setLoadingRaceDetails] = useState(false); // Placeholder
  const [errorRaceDetails, setErrorRaceDetails] = useState(null); // Placeholder
  const [isSubmitting, setIsSubmitting] = useState(false); // State for submission loading
  const [submitError, setSubmitError] = useState(null); // State for submission error
  const [scratchedHorses, setScratchedHorses] = useState([]); // State for scratched horses

  // Memoize the sorted horses list
  const sortedHorses = useMemo(() => sortHorsesByPost(horses), [horses]);

  useEffect(() => {
    setSelectedRaceId(initialRaceId || '');
    
    // Fetch races list only once or when needed
    const fetchRaces = async () => {
      setLoadingRaces(true);
      setErrorRaces(null);
      try {
        const racesCol = collection(db, 'races');
        // Optional: Order races, e.g., by date
        const q = query(racesCol, orderBy('date', 'asc')); // Assuming 'date' field exists
        const raceSnapshot = await getDocs(q);
        const racesList = raceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRaces(racesList);
      } catch (err) {
        console.error("Error fetching races:", err);
        setErrorRaces("Failed to load races.");
      } finally {
        setLoadingRaces(false);
      }
    };

    fetchRaces();

    // TODO: Fetch other data based on selectedRaceId and user
    // If selectedRaceId, fetch horses for that race
    // If selectedRaceId and user?.uid, fetch user's picks for that race
    // If selectedRaceId, fetch race status

  }, [initialRaceId]); // Fetch races on initial load/route change

  // Effect to fetch details when selectedRaceId or user changes
  useEffect(() => {
    if (!selectedRaceId || !user) {
        // Clear details if no race selected or user not loaded
        setHorses([]);
        setCurrentPicks(null);
        setRaceStatus('');
        setScratchedHorses([]); // Clear scratched horses
        return;
    }

    const fetchRaceDetails = async () => {
        setLoadingRaceDetails(true);
        setErrorRaceDetails(null);
        const userId = user.uid; // Get userId from authenticated user

        try {
            // Define promises for fetching data in parallel
            const raceDocRef = doc(db, 'races', selectedRaceId);
            const raceDocPromise = getDoc(raceDocRef);

            const horsesQuery = query(
                collection(db, 'horses'), 
                where('raceIds', 'array-contains', selectedRaceId)
                // Optional: Add orderBy('postPosition') or orderBy('name') if needed
            );
            const horsesPromise = getDocs(horsesQuery);

            const picksQuery = query(
                collection(db, 'picks'), 
                where('raceId', '==', selectedRaceId), 
                where('userId', '==', userId),
                limit(1) // Expect only one pick document per user per race
            );
            const picksPromise = getDocs(picksQuery);

            // Execute promises concurrently
            const [raceDocSnap, horsesSnapshot, picksSnapshot] = await Promise.all([
                raceDocPromise,
                horsesPromise,
                picksPromise
            ]);

            // Process race data
            if (raceDocSnap.exists()) {
                const raceData = raceDocSnap.data();
                setRaceStatus(raceData.status || 'unknown');
                setScratchedHorses(raceData.scratchedHorses || []); // Set scratched horses
            } else {
                console.error("Race document not found!");
                throw new Error(`Race with ID ${selectedRaceId} not found.`); // Throw error to be caught below
            }

            // Process horses data
            const horsesList = horsesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setHorses(horsesList);

            // Process picks data
            if (!picksSnapshot.empty) {
                const pickDoc = picksSnapshot.docs[0];
                setCurrentPicks({ id: pickDoc.id, ...pickDoc.data() });
            } else {
                setCurrentPicks(null); // No picks found for this user/race
            }

        } catch (err) {
            console.error("Error fetching race details:", err);
            setErrorRaceDetails("Failed to load details for this race.");
            // Clear potentially stale data on error
            setHorses([]);
            setCurrentPicks(null);
            setRaceStatus('');
            setScratchedHorses([]); // Clear scratched on error too
        } finally {
            setLoadingRaceDetails(false);
        }
    };

    fetchRaceDetails();

  }, [selectedRaceId, user]); // Re-fetch if race selection or user changes


  const handleRaceSelect = (newRaceId) => {
    setSelectedRaceId(newRaceId);
    setSubmitError(null); // Clear previous submission errors on race change
    navigate(`/picks/${newRaceId}`);
  };

  const handlePicksSubmit = async (picks) => {
    if (!user) {
      setSubmitError("Please log in to submit picks.");
      return;
    }
    if (raceStatus !== 'upcoming' && raceStatus !== 'open') {
      setSubmitError(`Picking is closed for this race (status: ${raceStatus}).`);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    const userId = user.uid;

    try {
      let docRef;
      const dataToSave = {
        ...picks, // { first, second, third }
        userId: userId,
        raceId: selectedRaceId,
        updatedAt: serverTimestamp(),
      };

      if (currentPicks && currentPicks.id) {
        // Update existing pick
        docRef = doc(db, 'picks', currentPicks.id);
        console.log('Updating pick:', currentPicks.id);
        await setDoc(docRef, dataToSave, { merge: true }); // Merge to only update fields
      } else {
        // Create new pick
        docRef = doc(collection(db, 'picks')); // Auto-generate ID
        dataToSave.submittedAt = serverTimestamp(); // Add submittedAt only for new picks
        console.log('Creating new pick');
        await setDoc(docRef, dataToSave);
      }

      // Update local state immediately for better UX
      // Note: Timestamps will be estimates until confirmed by Firestore listener (if implemented)
      const updatedPickData = {
          ...dataToSave,
          id: docRef.id,
          // Use JS Dates for immediate local feedback. PicksDisplay will handle conversion.
          submittedAt: (currentPicks?.submittedAt?.toDate ? currentPicks.submittedAt.toDate() : null) || new Date(), // Use previous or now
          updatedAt: new Date() // Always use now for updated
      };
      
      setCurrentPicks(updatedPickData);

      alert("Picks saved successfully!"); // Simple success feedback

    } catch (error) {
      console.error("Error saving picks:", error);
      setSubmitError("Failed to save picks. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canEditPicks = raceStatus === 'upcoming' || raceStatus === 'open';
  const selectedRaceName = races.find(r => r.id === selectedRaceId)?.name || 'Selected Race';

  // --- Check for scratched horses in user's picks --- 
  const userHasScratchedPick = useMemo(() => {
    if (!currentPicks || scratchedHorses.length === 0) {
        return false;
    }
    const scratchedSet = new Set(scratchedHorses);
    return scratchedSet.has(currentPicks.first) || 
           scratchedSet.has(currentPicks.second) || 
           scratchedSet.has(currentPicks.third);
  }, [currentPicks, scratchedHorses]);

  const showScratchWarning = userHasScratchedPick && (raceStatus === 'open' || raceStatus === 'upcoming');
  // --- End check ---

  // Handle loading states
  if (authLoading) {
      return <p>Loading user information...</p>;
  }
  // Optional: Add specific loading for races if needed
  // if (loadingRaces) {
  //    return <p>Loading races...</p>;
  // }


  return (
    <div>
      <h1>Make Your Picks</h1>
      {/* Display error if races failed to load */}
      {errorRaces && <p style={{ color: 'red' }}>{errorRaces}</p>}

      <RaceSelector
        races={races}
        selectedRaceId={selectedRaceId}
        onSelectRace={handleRaceSelect}
        disabled={loadingRaces} // Disable selector while loading races
      />

      {selectedRaceId ? (
        <>
          <h2>{selectedRaceName}</h2>

          {/* Handle loading/error state for race details */}
          {loadingRaceDetails && <p>Loading race details...</p>}
          {errorRaceDetails && <p style={{ color: 'red' }}>{errorRaceDetails}</p>}

          {/* Only render form/display if details are loaded */}
          {!loadingRaceDetails && !errorRaceDetails && (
            <>
              <p>Status: {raceStatus.toUpperCase()}</p>

              {/* --- Scratch Warning Message --- */}
              {showScratchWarning && (
                <div style={{ border: '2px solid red', padding: '10px', margin: '1rem 0', backgroundColor: '#fff0f0', borderRadius: '4px' }}>
                  <strong style={{color: 'red'}}>Warning:</strong> One or more of your selected horses have been scratched. Please update your picks!
                </div>
              )}
              {/* --- End Warning Message --- */}

              {/* Display Horses Table */}
              <h3>Horses Entered</h3>
              {sortedHorses.length > 0 ? (
                <div className="mb-6 flex justify-center">
                    <div className="overflow-x-auto rounded-md shadow-sm">
                        <table className="divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-2 py-2 text-center font-semibold text-gray-600 uppercase tracking-wider">PP</th>
                                    <th className="px-2 py-2 text-center font-semibold text-gray-600 uppercase tracking-wider">Horse</th>
                                    <th className="px-2 py-2 text-center font-semibold text-gray-600 uppercase tracking-wider">Odds</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sortedHorses.map((horse, index) => {
                                    const isScratched = scratchedHorses.includes(horse.id);
                                    return (
                                        <tr key={horse.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${isScratched ? 'opacity-60' : ''}`}>
                                            <td className="px-2 py-2 whitespace-nowrap font-medium text-gray-900 text-center">{horse.postPosition ?? '-'}</td>
                                            <td className={`px-2 py-2 whitespace-nowrap text-gray-700 text-center ${isScratched ? 'line-through' : ''}`}>{horse.name}{isScratched ? ' (SCR)' : ''}</td>
                                            <td className="px-2 py-2 whitespace-nowrap text-gray-500 text-center">{horse.odds ?? '-'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
              ) : (
                <p>No horses entered for this race yet.</p>
              )}

              <PicksDisplay picks={currentPicks} horses={horses} scratchedHorses={scratchedHorses} />

              {canEditPicks ? (
                <PicksForm
                  horses={horses}
                  initialPicks={currentPicks}
                  onSubmit={handlePicksSubmit}
                  raceStatus={raceStatus}
                  isSubmitting={isSubmitting} // Pass submitting state
                  scratchedHorses={scratchedHorses} // <-- Pass scratched horses
                />
              ) : (
                raceStatus && <p>Picking is closed for this race ({raceStatus}).</p>
              )}
              
              {/* Display submission errors */}
              {submitError && <p style={{ color: 'red' }}>{submitError}</p>}
            </>
          )}
        </>
      ) : (
        <p>Please select a race to make your picks.</p>
      )}
    </div>
  );
}

export default PicksPage; 