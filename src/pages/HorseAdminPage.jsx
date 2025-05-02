import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase'; // Adjust path if necessary
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  arrayUnion, // For adding to array
  arrayRemove // For removing from array (though we'll overwrite the whole array here)
} from 'firebase/firestore';

// TODO: Fetch horses from Firestore
// TODO: Implement Add/Edit/Delete horse logic
// TODO: Implement associating horses with races

function HorseAdminPage() {
  const [horses, setHorses] = useState([]);
  const [races, setRaces] = useState([]); // Added state for races
  const [loading, setLoading] = useState(true); // Start loading initially
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null); // For add/update errors

  // Form state for Add Horse
  const [newHorseName, setNewHorseName] = useState('');
  const [newHorseOdds, setNewHorseOdds] = useState('');
  const [newHorsePostPosition, setNewHorsePostPosition] = useState('');
  const [newHorseRaceIds, setNewHorseRaceIds] = useState([]); // Added state for add form

  // Form state for Edit Horse
  const [editHorseId, setEditHorseId] = useState(null);
  const [editHorseName, setEditHorseName] = useState('');
  const [editHorseOdds, setEditHorseOdds] = useState('');
  const [editHorsePostPosition, setEditHorsePostPosition] = useState('');
  const [editHorseRaceIds, setEditHorseRaceIds] = useState([]);

  // Combined fetch function
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch horses
      const horsesCollection = collection(db, 'horses');
      const hq = query(horsesCollection, orderBy('name', 'asc'));
      const horsesSnapshot = await getDocs(hq);
      const horsesData = horsesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setHorses(horsesData);

      // Fetch races
      const racesCollection = collection(db, 'races');
      const rq = query(racesCollection, orderBy('date', 'asc')); // Order races by date
      const racesSnapshot = await getDocs(rq);
      const racesData = racesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRaces(racesData);

    } catch (err) {
      console.error("Error fetching data:", err);
      setError('Failed to load data. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handler for race checkbox changes in ADD form
  const handleNewRaceSelectionChange = (raceId) => {
    setNewHorseRaceIds(prevRaceIds =>
      prevRaceIds.includes(raceId)
        ? prevRaceIds.filter(id => id !== raceId) // Remove if already included
        : [...prevRaceIds, raceId] // Add if not included
    );
  };

  const handleAddHorse = async (e) => {
    e.preventDefault();
    if (!newHorseName.trim()) return;
    setFormError(null);
    try {
      const horsesCollection = collection(db, 'horses');
      const postPositionValue = newHorsePostPosition.trim() === '' ? null : parseInt(newHorsePostPosition, 10);
      await addDoc(horsesCollection, {
        name: newHorseName.trim(),
        odds: newHorseOdds.trim() || '',
        postPosition: isNaN(postPositionValue) ? null : postPositionValue,
        raceIds: newHorseRaceIds, // Use state for selected races
        createdAt: serverTimestamp(),
      });
      setNewHorseName('');
      setNewHorseOdds('');
      setNewHorsePostPosition('');
      setNewHorseRaceIds([]); // Clear selected races for add form
      fetchData();
    } catch (err) {
      console.error("Error adding horse:", err);
      setFormError('Failed to add horse.');
    }
  };

  const handleEditHorse = (horse) => {
    setEditHorseId(horse.id);
    setEditHorseName(horse.name);
    setEditHorseOdds(horse.odds || ''); // Populate odds
    setEditHorsePostPosition(horse.postPosition?.toString() || ''); // Populate post position
    setEditHorseRaceIds(horse.raceIds || []); // Populate selected races
    setFormError(null);
  };

  // Handler for race checkbox changes in edit form
  const handleRaceSelectionChange = (raceId) => {
    setEditHorseRaceIds(prevRaceIds =>
      prevRaceIds.includes(raceId)
        ? prevRaceIds.filter(id => id !== raceId) // Remove if already included
        : [...prevRaceIds, raceId] // Add if not included
    );
  };

  const handleUpdateHorse = async (e) => {
    e.preventDefault();
    if (!editHorseName.trim() || !editHorseId) return;
    setFormError(null);
    try {
      const horseDocRef = doc(db, 'horses', editHorseId);
      const postPositionValue = editHorsePostPosition.trim() === '' ? null : parseInt(editHorsePostPosition, 10);
      await updateDoc(horseDocRef, {
        name: editHorseName.trim(),
        odds: editHorseOdds.trim() || '', // Update odds
        postPosition: isNaN(postPositionValue) ? null : postPositionValue, // Update post position
        raceIds: editHorseRaceIds // Update the raceIds array
      });
      setEditHorseId(null);
      setEditHorseName('');
      setEditHorseOdds(''); // Clear field
      setEditHorsePostPosition(''); // Clear field
      setEditHorseRaceIds([]);
      fetchData(); // Use combined fetch
    } catch (err) {
      console.error("Error updating horse:", err);
      setFormError('Failed to update horse.');
    }
  };

  const handleDeleteHorse = async (horseId) => {
    if (window.confirm('Are you sure you want to delete this horse? This cannot be undone.')) {
      setError(null); // Clear previous general errors
      try {
        const horseDocRef = doc(db, 'horses', horseId);
        await deleteDoc(horseDocRef);
        fetchData(); // Use combined fetch
      } catch (err) {
        console.error("Error deleting horse:", err);
        setError('Failed to delete horse.'); // Use general error display for delete issues
      }
    }
  };

  // Function to get race names from IDs for display
  const getRaceNames = (raceIds) => {
    if (!raceIds || raceIds.length === 0) return 'None';
    return raceIds.map(id => races.find(r => r.id === id)?.name || 'Unknown Race').join(', ');
  };

  if (loading) return <p>Loading data...</p>; // Updated loading text
  if (error) return <p>Error loading data: {error}</p>; // Simplified error message

  return (
    <div>
      <h1>Manage Horses</h1>

      {/* Add Horse Form */}
      <form onSubmit={handleAddHorse} style={{ marginBottom: '1rem', border: '1px solid green', padding: '1rem' }}>
        <h3>Add New Horse</h3>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>Name: </label>
          <input
            type="text"
            value={newHorseName}
            onChange={(e) => setNewHorseName(e.target.value)}
            placeholder="Horse name"
            required
          />
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>Odds: </label>
          <input
            type="text"
            value={newHorseOdds}
            onChange={(e) => setNewHorseOdds(e.target.value)}
            placeholder="e.g., 5-1"
          />
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>Post Position: </label>
          <input
            type="number"
            value={newHorsePostPosition}
            onChange={(e) => setNewHorsePostPosition(e.target.value)}
            placeholder="Gate number"
            min="1"
          />
        </div>

        {/* Race Association Checkboxes for ADD form */}
         <div style={{ marginBottom: '1rem', marginTop: '1rem' }}>
            <label>Associate with Races:</label>
            {races.length > 0 ? (
              races.map(race => (
                <div key={`add-${race.id}`}> {/* Ensure unique key */}
                  <input
                    type="checkbox"
                    id={`add-race-${race.id}`}
                    checked={newHorseRaceIds.includes(race.id)} // Use state for new horse
                    onChange={() => handleNewRaceSelectionChange(race.id)} // Use handler for new horse
                  />
                  <label htmlFor={`add-race-${race.id}`}>{race.name}</label>
                </div>
              ))
            ) : (
              <p>No races found to associate.</p>
            )}
          </div>

        {/* Add Tailwind classes */}
        <button 
          type="submit" 
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition duration-150"
        >
          Add Horse
        </button>
        {formError && <p style={{ color: 'red', marginTop: '0.5rem' }}>{formError}</p>}
      </form>

      {/* Edit Horse Form */}
      {editHorseId && (
        <form onSubmit={handleUpdateHorse} style={{ marginBottom: '1rem', border: '1px solid blue', padding: '1rem' }}>
          <h4>Editing: {horses.find(h => h.id === editHorseId)?.name || 'Horse'}</h4>
          <div style={{ marginBottom: '0.5rem' }}>
             <label>Name: </label>
             <input
              type="text"
              value={editHorseName}
              onChange={(e) => setEditHorseName(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <label>Odds: </label>
            <input
              type="text"
              value={editHorseOdds}
              onChange={(e) => setEditHorseOdds(e.target.value)}
              placeholder="e.g., 5-1"
            />
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <label>Post Position: </label>
            <input
              type="number"
              value={editHorsePostPosition}
              onChange={(e) => setEditHorsePostPosition(e.target.value)}
              placeholder="Gate number"
              min="1"
            />
          </div>

          {/* Race Association Checkboxes */}
          <div style={{ marginBottom: '1rem', marginTop: '1rem' }}>
            <label>Associate with Races:</label>
            {races.length > 0 ? (
              races.map(race => (
                <div key={`edit-${race.id}`}>
                  <input
                    type="checkbox"
                    id={`edit-race-${race.id}`}
                    checked={editHorseRaceIds.includes(race.id)}
                    onChange={() => handleRaceSelectionChange(race.id)}
                  />
                  <label htmlFor={`edit-race-${race.id}`}>{race.name}</label>
                </div>
              ))
            ) : (
              <p>No races found to associate.</p>
            )}
          </div>

          {/* Add Tailwind classes */}
          <button 
            type="submit" 
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mr-2 transition duration-150"
          >
            Update Horse
          </button>
          {/* Add Tailwind classes */}
          <button 
            type="button" // Prevent form submission
            onClick={() => setEditHorseId(null)} // Simple cancel action
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition duration-150"
          >
            Cancel
          </button>
          {formError && <p style={{ color: 'red', marginTop: '0.5rem' }}>{formError}</p>}
        </form>
      )}

      {/* Horse List */}
      <h2 className="text-xl font-semibold mt-8 mb-4">Existing Horses</h2>
      {loading && <p>Loading horses...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && horses.length === 0 ? (
        <p>No horses added yet.</p>
      ) : !loading && !error ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {horses.map(horse => (
            <li key={horse.id} style={{ borderBottom: '1px solid #eee', padding: '0.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                <strong>{horse.name}</strong> (PP: {horse.postPosition ?? 'N/A'}, Odds: {horse.odds || 'N/A'}) - Races: {getRaceNames(horse.raceIds)}
              </span>
              <div>
                {/* Add Tailwind classes */}
                <button 
                  onClick={() => handleEditHorse(horse)} 
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 mr-2 transition duration-150"
                  disabled={!!editHorseId} // Disable if another edit is in progress
                >
                  Edit
                </button>
                {/* Add Tailwind classes */}
                <button 
                  onClick={() => handleDeleteHorse(horse.id)} 
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 transition duration-150" 
                  disabled={!!editHorseId} // Disable if an edit is in progress
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default HorseAdminPage; 