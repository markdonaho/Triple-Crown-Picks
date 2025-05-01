import React, { useState, useEffect } from 'react';

// TODO: Implement form submission logic
// TODO: Populate horse dropdowns
// TODO: Fetch current race status and results to pre-fill
function ResultsAdminForm({ raceId, horses = [], currentStatus, currentResults, onSetStatus, onSetResults }) {
  const [status, setStatus] = useState(currentStatus || 'upcoming');
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [third, setThird] = useState('');

  useEffect(() => {
      setStatus(currentStatus || 'upcoming');
      if (currentResults) {
          setFirst(currentResults.first || '');
          setSecond(currentResults.second || '');
          setThird(currentResults.third || '');
      }
  }, [raceId, currentStatus, currentResults]); // Re-run if race changes

  const handleStatusSubmit = (e) => {
    e.preventDefault();
    onSetStatus(status);
  };

  const handleResultsSubmit = (e) => {
    e.preventDefault();
    if (!first || !second || !third) {
      alert('Please select 1st, 2nd, and 3rd place winners.');
      return;
    }
    if (first === second || first === third || second === third) {
        alert('Results must be three different horses.');
        return;
      }
    onSetResults({ first, second, third });
  };

  return (
    <div>
      <h3>Admin Controls for Race: {raceId}</h3>
      
      {/* Status Control */}
      <form onSubmit={handleStatusSubmit} style={{ marginBottom: '1rem', border: '1px solid lightgrey', padding: '1rem' }}>
          <h4>Set Race Status</h4>
          <label>Status: </label>
          <select value={status} onChange={e => setStatus(e.target.value)}>
              <option value="upcoming">Upcoming</option>
              <option value="open">Open (Picks Allowed)</option>
              <option value="locked">Locked (Race in Progress)</option>
              <option value="finished">Finished (Results Set)</option>
          </select>
          <button type="submit" style={{ marginLeft: '1rem' }}>Update Status</button>
      </form>

      {/* Results Control */}
      <form onSubmit={handleResultsSubmit} style={{ border: '1px solid lightgrey', padding: '1rem' }}>
          <h4>Set Race Results</h4>
          <p>Note: Setting results should automatically trigger winner calculation.</p>
          <div>
              <label>1st Place: </label>
              <select value={first} onChange={e => setFirst(e.target.value)}>
              <option value="">-- Select Winner --</option>
              {horses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
          </div>
          <div>
              <label>2nd Place: </label>
              <select value={second} onChange={e => setSecond(e.target.value)}>
              <option value="">-- Select Place --</option>
              {horses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
          </div>
          <div>
              <label>3rd Place: </label>
              <select value={third} onChange={e => setThird(e.target.value)}>
              <option value="">-- Select Show --</option>
              {horses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
          </div>
          <button type="submit">Set Results</button>
      </form>
    </div>
  );
}

export default ResultsAdminForm; 