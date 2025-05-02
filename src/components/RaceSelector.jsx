import React from 'react';

// TODO: Fetch races from Firestore
// TODO: Implement select dropdown logic
function RaceSelector({ races = [], selectedRaceId, onSelectRace }) {
  return (
    <div>
      <label htmlFor="race-select">Select Race: </label>
      <select 
        id="race-select"
        value={selectedRaceId}
        onChange={(e) => onSelectRace(e.target.value)}
      >
        <option value="">-- Select a Race --</option>
        {races.map(race => (
          <option key={race.id} value={race.id}>{race.name}</option>
        ))}
      </select>
      {/* Display basic selected race info if needed */}
    </div>
  );
}

export default RaceSelector; 