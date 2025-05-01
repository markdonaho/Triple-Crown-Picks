import React, { useState, useEffect } from 'react';

// TODO: Implement form state management
// TODO: Populate dropdowns with horses
// TODO: Add validation (e.g., can't pick same horse twice)
function PicksForm({ horses = [], initialPicks, onSubmit, raceStatus }) {
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [third, setThird] = useState('');

  useEffect(() => {
    // Pre-fill form if initialPicks exist
    if (initialPicks) {
      setFirst(initialPicks.first || '');
      setSecond(initialPicks.second || '');
      setThird(initialPicks.third || '');
    }
  }, [initialPicks]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!first || !second || !third) {
      alert('Please select a horse for 1st, 2nd, and 3rd place.');
      return;
    }
    if (first === second || first === third || second === third) {
      alert('Please select three different horses.');
      return;
    }
    onSubmit({ first, second, third });
  };

  const canSubmit = raceStatus === 'upcoming' || raceStatus === 'open';

  return (
    <form onSubmit={handleSubmit}>
      <h3>Submit/Update Your Picks</h3>
      <div>
        <label>1st Place: </label>
        <select value={first} onChange={e => setFirst(e.target.value)} disabled={!canSubmit}>
          <option value="">-- Select Horse --</option>
          {horses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
      </div>
      <div>
        <label>2nd Place: </label>
        <select value={second} onChange={e => setSecond(e.target.value)} disabled={!canSubmit}>
          <option value="">-- Select Horse --</option>
          {horses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
      </div>
      <div>
        <label>3rd Place: </label>
        <select value={third} onChange={e => setThird(e.target.value)} disabled={!canSubmit}>
          <option value="">-- Select Horse --</option>
          {horses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
      </div>
      <button type="submit" disabled={!canSubmit}>
        {initialPicks ? 'Update Picks' : 'Submit Picks'}
      </button>
      {!canSubmit && <p>Picking is currently closed ({raceStatus}).</p>}
    </form>
  );
}

export default PicksForm; 