import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RaceSelector from '../components/RaceSelector';
import ResultsAdminForm from '../components/ResultsAdminForm';
import ResultsDisplay from '../components/ResultsDisplay';
import WinnerDisplay from '../components/WinnerDisplay';

function ResultsPage() {
  const { raceId: initialRaceId } = useParams();
  const navigate = useNavigate();
  const [selectedRaceId, setSelectedRaceId] = useState(initialRaceId || '');

  // TODO: Fetch races, horses, official results, winner data
  // TODO: Check if user is admin
  const races = []; // Placeholder
  const horses = []; // Placeholder
  const officialResults = null; // Placeholder { first: 'h1', second: 'h2', third: 'h3', resultsSetAt: ...}
  const winnerData = null; // Placeholder { userId: '...', score: ..., userName: '...' } or array
  const raceStatus = 'finished'; // Placeholder
  const isAdmin = true; // Placeholder

  useEffect(() => {
    setSelectedRaceId(initialRaceId || '');
    // TODO: Fetch data based on selectedRaceId
  }, [initialRaceId]);

  const handleRaceSelect = (newRaceId) => {
    setSelectedRaceId(newRaceId);
    navigate(`/results/${newRaceId}`);
  };

  const handleSetStatus = (newStatus) => {
    console.log('Setting status for', selectedRaceId, 'to', newStatus);
    // TODO: Implement Firestore update logic for race status (Admin only)
  };

  const handleSetResults = (results) => {
    console.log('Setting results for', selectedRaceId, ':', results);
    // TODO: Implement Firestore update logic for race results (Admin only)
    // TODO: Trigger winner calculation after setting results
  };

  // TODO: Implement winner calculation logic (or call a cloud function)
  const calculateWinner = (raceId) => {
      console.log("Calculating winner for", raceId)
      // fetch picks, fetch results, calculate score, return winner(s)
      return { userId: 'adminUser', score: 9, userName: 'Admin McAdminface' }; // Placeholder
  }

  // Fetch/Calculate winner when results are available and status is finished
  // useEffect(() => {
  //   if (selectedRaceId && officialResults && raceStatus === 'finished') {
  //      const winner = calculateWinner(selectedRaceId);
  //      setWinnerData(winner); // Need state for winnerData
  //   }
  // }, [selectedRaceId, officialResults, raceStatus]);

  return (
    <div>
      <h1>Race Results</h1>
      <RaceSelector
        races={races}
        selectedRaceId={selectedRaceId}
        onSelectRace={handleRaceSelect}
      />

      {selectedRaceId ? (
        <>
          {isAdmin && (
            <ResultsAdminForm
              raceId={selectedRaceId}
              horses={horses}
              currentStatus={raceStatus} // Fetch actual status
              currentResults={officialResults}
              onSetStatus={handleSetStatus}
              onSetResults={handleSetResults}
            />
          )}
          <hr />
          <ResultsDisplay results={officialResults} />
          <WinnerDisplay winnerData={winnerData} />
          {/* TODO: Maybe display all user picks and scores here? */}
        </>
      ) : (
        <p>Please select a race above.</p>
      )}
    </div>
  );
}

export default ResultsPage; 