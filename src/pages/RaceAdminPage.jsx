import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, getDocs, doc, getDoc, query, where, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import RaceSelector from '../components/RaceSelector'; // Import RaceSelector

function RaceAdminPage() {
  // --- State for Creating Races ---
  const [newRaceName, setNewRaceName] = useState('');
  const [newRaceDate, setNewRaceDate] = useState(''); // Store date as string YYYY-MM-DD
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(null);

  // --- State for Managing Existing Races (Scratches) ---
  const [races, setRaces] = useState([]); // List of all races for selector
  const [selectedRaceId, setSelectedRaceId] = useState('');
  const [raceDetails, setRaceDetails] = useState(null); // Details of selected race (status, existing scratches)
  const [raceHorses, setRaceHorses] = useState([]); // Horses associated with the selected race
  const [currentScratches, setCurrentScratches] = useState([]); // IDs of horses currently marked as scratched in the UI
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);

  // --- Fetch all races for the selector ---
  useEffect(() => {
    const fetchRaces = async () => {
      try {
        const racesCol = collection(db, 'races');
        // Fetch races that are not finished to manage scratches, or all for creation context?
        // Let's fetch all for now, selector might be used for other actions later.
        const raceSnapshot = await getDocs(query(racesCol)); 
        const racesList = raceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort races, maybe by date?
        racesList.sort((a, b) => (a.date?.toDate() || 0) - (b.date?.toDate() || 0));
        setRaces(racesList);
      } catch (err) {
        console.error("Error fetching races for admin:", err);
        // Display fetch error in the scratch management section? Or a general error?
        setFetchError("Failed to load races list for selector."); 
      }
    };
    fetchRaces();
  }, []);

  // --- Fetch details & horses when a race is selected ---
  useEffect(() => {
    if (!selectedRaceId) {
      setRaceDetails(null);
      setRaceHorses([]);
      setCurrentScratches([]);
      setFetchError(null); // Clear specific errors when selection changes
      setSaveError(null);
      setSaveSuccess(null);
      return;
    }

    const fetchDetails = async () => {
      setFetchLoading(true);
      setFetchError(null);
      setRaceDetails(null);
      setRaceHorses([]);
      setCurrentScratches([]);
      try {
        // 1. Fetch Race Details
        const raceDocRef = doc(db, 'races', selectedRaceId);
        const raceDocSnap = await getDoc(raceDocRef);
        if (!raceDocSnap.exists()) {
          throw new Error("Selected race not found.");
        }
        const raceData = raceDocSnap.data();
        setRaceDetails(raceData);
        setCurrentScratches(raceData.scratchedHorses || []); // Initialize scratches from DB

        // 2. Fetch Associated Horses
        const horsesQuery = query(
            collection(db, 'horses'),
            where('raceIds', 'array-contains', selectedRaceId)
        );
        const horsesSnapshot = await getDocs(horsesQuery);
        const horsesList = horsesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort horses by post position
        horsesList.sort((a, b) => (a.postPosition ?? Infinity) - (b.postPosition ?? Infinity));
        setRaceHorses(horsesList);

      } catch (err) {
        console.error("Error fetching race details/horses for admin:", err);
        setFetchError(err.message || "Failed to load race details or horses.");
        setRaceDetails(null); // Clear data on error
        setRaceHorses([]);
        setCurrentScratches([]);
      } finally {
        setFetchLoading(false);
      }
    };

    fetchDetails();
  }, [selectedRaceId]);

  // --- Handlers ---
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newRaceName || !newRaceDate) {
      setCreateError('Please provide both race name and date.');
      return;
    }
    setCreateLoading(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      const dateObject = new Date(newRaceDate + 'T12:00:00'); // Add time to avoid timezone issues
      if (isNaN(dateObject)) {
          throw new Error("Invalid date format. Please use YYYY-MM-DD.");
      }

      const racesCollection = collection(db, 'races');
      const docRef = await addDoc(racesCollection, {
        name: newRaceName,
        date: dateObject, // Store as Firestore Timestamp
        status: 'upcoming',
        createdAt: serverTimestamp(),
        scratchedHorses: [] // Initialize empty array
      });

      // Add new race to local list and clear form
      const newRaceData = { id: docRef.id, name: newRaceName, date: dateObject, status: 'upcoming', scratchedHorses: [] };
      setRaces(prev => [...prev, newRaceData].sort((a,b) => (a.date?.toDate() || 0) - (b.date?.toDate() || 0))); 
      setCreateSuccess(`Race "${newRaceName}" created successfully!`);
      setNewRaceName('');
      setNewRaceDate('');
    } catch (err) {
      console.error("Error creating race:", err);
      setCreateError(err.message || 'Failed to create race. Please check console.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleRaceSelect = (raceId) => {
    setSelectedRaceId(raceId);
    // Clear status messages when changing selection
    setSaveSuccess(null); 
    setSaveError(null);
    setFetchError(null);
  };

  // Toggle horse scratch status in local state
  const handleScratchToggle = (horseId) => {
    setCurrentScratches(prev => 
      prev.includes(horseId)
        ? prev.filter(id => id !== horseId) // Remove if present
        : [...prev, horseId] // Add if not present
    );
    // Clear save status when making changes
    setSaveSuccess(null);
    setSaveError(null);
  };

  // Save the current scratch list to Firestore
  const handleSaveScratches = async () => {
    if (!selectedRaceId) return;
    setSaveLoading(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const raceDocRef = doc(db, 'races', selectedRaceId);
      await updateDoc(raceDocRef, {
        scratchedHorses: currentScratches
      });
      setSaveSuccess("Scratched horses updated successfully!");
      // Update local race details state to match DB
      setRaceDetails(prev => prev ? {...prev, scratchedHorses: currentScratches } : null);
    } catch (err) { 
        console.error("Error saving scratches:", err);
        setSaveError("Failed to update scratches. Please check console.");
    } finally {
        setSaveLoading(false);
    }
  };

  // --- Render Logic ---
  const inputClasses = "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline";
  const buttonClasses = (loading) => 
    `text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 w-full ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`;
  const createButtonClasses = (loading) => 
    `text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 w-full ${loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`;

  return (
    <div className="container mx-auto px-4 py-8 space-y-12"> {/* Add overall spacing */}
      {/* --- Create Race Section --- */}
      <section>
        <h2 className="text-2xl font-bold mb-4 text-center">Create New Race</h2>
        <form onSubmit={handleCreateSubmit} className="max-w-md mx-auto bg-white p-6 rounded shadow-md space-y-4"> {/* Use space-y for spacing */}
          {createError && <p className="text-red-500 text-sm">{createError}</p>}
          {createSuccess && <p className="text-green-500 text-sm">{createSuccess}</p>}
          <div> {/* Wrap label/input */} 
            <label htmlFor="newRaceName" className="block text-gray-700 font-bold mb-1">Name:</label>
            <input 
              type="text" 
              id="newRaceName" 
              value={newRaceName} 
              onChange={(e) => setNewRaceName(e.target.value)} 
              required 
              className={inputClasses} 
              placeholder="e.g., Preakness Stakes 2025"
            />
          </div>
          <div> {/* Wrap label/input */} 
            <label htmlFor="newRaceDate" className="block text-gray-700 font-bold mb-1">Date:</label>
            <input 
              type="date" 
              id="newRaceDate" 
              value={newRaceDate} 
              onChange={(e) => setNewRaceDate(e.target.value)} 
              required 
              className={inputClasses} 
            />
          </div>
          <button type="submit" disabled={createLoading} className={createButtonClasses(createLoading)}>
            {createLoading ? 'Creating...' : 'Create Race'}
          </button>
        </form>
      </section>

      {/* Divider */} 
      <hr /> 

      {/* --- Manage Scratches Section --- */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-center">Manage Scratches</h2>
        <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow-md">
          {/* Display general fetch error for the selector here? */} 
          {fetchError && !selectedRaceId && <p className="text-red-500 mb-4 text-sm">{fetchError}</p>} 
          
          <div className="mb-4">
            <label htmlFor="race-select-admin" className="block text-gray-700 font-bold mb-1">Select Race to Manage:</label>
            <RaceSelector 
              id="race-select-admin" // Add id for label
              races={races} // Pass fetched races
              selectedRaceId={selectedRaceId}
              onSelectRace={handleRaceSelect}
            />
          </div>

          {/* Display loading indicator for race details/horses */} 
          {fetchLoading && <p className="text-center text-gray-500">Loading race details...</p>}

          {/* Display fetch error specific to the selected race */}
          {fetchError && selectedRaceId && <p className="text-red-500 mb-4 text-sm">{fetchError}</p>}

          {/* Only show horse list and save button if a race is selected, not loading, and no fetch error for it */}
          {selectedRaceId && !fetchLoading && !fetchError && raceDetails && (
            <div className="mt-6"> {/* Add margin top */} 
              <h3 className="text-xl font-semibold mb-4">Horses for {races.find(r=>r.id === selectedRaceId)?.name}</h3>
              
              {/* Display save status messages */} 
              {saveError && <p className="text-red-500 mb-4 text-sm">{saveError}</p>}
              {saveSuccess && <p className="text-green-500 mb-4 text-sm">{saveSuccess}</p>}

              {raceHorses.length > 0 ? (
                <div className="space-y-2 mb-4 border rounded p-3 bg-gray-50"> {/* Add background/border */} 
                  {raceHorses.map(horse => (
                    <div key={horse.id} className="flex items-center">
                      <input 
                        type="checkbox"
                        id={`scratch-${horse.id}`}
                        checked={currentScratches.includes(horse.id)}
                        onChange={() => handleScratchToggle(horse.id)}
                        className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label 
                        htmlFor={`scratch-${horse.id}`} 
                        className={`flex-1 cursor-pointer ${currentScratches.includes(horse.id) ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                        {horse.postPosition ? `(${horse.postPosition}) ` : ''}{horse.name}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic mb-4">No horses found associated with this race. Add them via the Horse Management page.</p>
              )}

              {/* Only enable save if there are horses */}
              <button
                onClick={handleSaveScratches}
                disabled={saveLoading || raceHorses.length === 0} 
                className={buttonClasses(saveLoading)} >
                {saveLoading ? 'Saving...' : 'Save Scratches for this Race'}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default RaceAdminPage; 