import React, { useState, useEffect } from 'react';

// TODO: Implement form state management
// TODO: Populate dropdowns with horses
// TODO: Add validation (e.g., can't pick same horse twice)
function PicksForm({ horses = [], initialPicks, onSubmit, raceStatus, isSubmitting = false }) {
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [third, setThird] = useState('');

  useEffect(() => {
    // Pre-fill form if initialPicks exist
    if (initialPicks) {
      setFirst(initialPicks.first || '');
      setSecond(initialPicks.second || '');
      setThird(initialPicks.third || '');
    } else {
      // Clear form if initialPicks becomes null (e.g., after submitting a new pick for a race)
      setFirst('');
      setSecond('');
      setThird('');
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
  const isDisabled = !canSubmit || isSubmitting; // Combine conditions for disabling

  return (
    <form onSubmit={handleSubmit}>
      <h3>Submit/Update Your Picks</h3>
      <div>
        <label>1st Place: </label>
        <select value={first} onChange={e => setFirst(e.target.value)} disabled={isDisabled}>
          <option value="">-- Select Horse --</option>
          {horses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
      </div>
      <div>
        <label>2nd Place: </label>
        <select value={second} onChange={e => setSecond(e.target.value)} disabled={isDisabled}>
          <option value="">-- Select Horse --</option>
          {horses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
      </div>
      <div>
        <label>3rd Place: </label>
        <select value={third} onChange={e => setThird(e.target.value)} disabled={isDisabled}>
          <option value="">-- Select Horse --</option>
          {horses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
      </div>
      <button 
        type="submit" 
        disabled={isDisabled}
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
      >
        {isSubmitting ? 'Submitting...' : (initialPicks ? 'Update Picks' : 'Submit Picks')}
      </button>
      {!canSubmit && <p className="mt-2 text-sm text-red-600">Picking is currently closed ({raceStatus}).</p>}
    </form>
  );
}

export default PicksForm; 