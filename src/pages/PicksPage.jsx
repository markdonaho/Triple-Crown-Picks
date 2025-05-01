import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RaceSelector from '../components/RaceSelector';
import PicksForm from '../components/PicksForm';
import PicksDisplay from '../components/PicksDisplay';

function PicksPage() {
  const { raceId: initialRaceId } = useParams();
  const navigate = useNavigate();
  const [selectedRaceId, setSelectedRaceId] = useState(initialRaceId || '');
  
  // TODO: Get current userId
  const userId = 'testUser123'; // Placeholder

  // TODO: Fetch races, horses for selected race, user's current picks for race, race status
  const races = []; // Placeholder e.g., [{ id: 'derby-2024', name: 'Kentucky Derby 2024', status: 'open' }, ...]
  const horses = []; // Placeholder e.g., [{ id: 'h1', name: 'Fierceness' }, ...]
  const currentPicks = null; // Placeholder e.g., { first: 'h1', second: 'h2', third: 'h3', submittedAt: ... }
  const raceStatus = 'open'; // Placeholder: 'upcoming', 'open', 'locked', 'finished'

  useEffect(() => {
    setSelectedRaceId(initialRaceId || '');
    // TODO: Fetch data when initialRaceId or selectedRaceId changes
    // Fetch races list
    // If selectedRaceId, fetch horses for that race
    // If selectedRaceId and userId, fetch user's picks for that race
    // If selectedRaceId, fetch race status

  }, [initialRaceId, userId]); // Dependency on userId ensures picks are fetched when user logs in

  const handleRaceSelect = (newRaceId) => {
    setSelectedRaceId(newRaceId);
    // Fetch horses and picks for the newly selected race
    // Navigate to the new race URL
    navigate(`/picks/${newRaceId}`);
  };

  const handlePicksSubmit = (picks) => {
    console.log('Submitting picks for race', selectedRaceId, ':', picks);
    // TODO: Implement Firestore create/update logic for picks
    // Check raceStatus before submitting
    if (raceStatus === 'upcoming' || raceStatus === 'open') {
      // Save picks to Firestore `picks` collection
      // Associate with userId and selectedRaceId
      // Update timestamps
    } else {
      console.warn('Cannot submit picks, race status is:', raceStatus);
      // Show error message to user
    }
  };

  const canEditPicks = raceStatus === 'upcoming' || raceStatus === 'open';

  return (
    <div>
      <h1>Make Your Picks</h1>
      <RaceSelector
        races={races}
        selectedRaceId={selectedRaceId}
        onSelectRace={handleRaceSelect}
      />

      {selectedRaceId ? (
        <>
          <h2>{races.find(r => r.id === selectedRaceId)?.name || 'Selected Race'}</h2>
          <p>Status: {raceStatus}</p>
          
          <PicksDisplay picks={currentPicks} horses={horses} />

          {canEditPicks ? (
            <PicksForm 
              horses={horses}
              initialPicks={currentPicks} // Pass current picks to pre-fill form
              onSubmit={handlePicksSubmit} 
              raceStatus={raceStatus}
            />
          ) : (
            <p>Picking is closed for this race ({raceStatus}).</p>
          )}

        </>
      ) : (
        <p>Please select a race to make your picks.</p>
      )}
    </div>
  );
}

export default PicksPage; 