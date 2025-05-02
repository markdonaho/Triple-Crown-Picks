import React, { useState, useEffect } from 'react';

// TODO: Implement form submission logic
// TODO: Populate horse dropdowns
// TODO: Fetch current race status and results to pre-fill
function ResultsAdminForm({ raceId, horses = [], currentStatus, currentResults, onSetStatus, onSetResults, onClearResults }) {
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

  // Determine if results are currently set
  const resultsAreSet = !!(currentResults && currentResults.first && currentResults.second && currentResults.third);

  return (
    // Use Tailwind for basic layout and styling improvements
    <div className="p-4 border rounded-lg bg-gray-50 my-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Admin Controls for Race: {raceId}</h3>
      
      {/* Status Control */}
      <form onSubmit={handleStatusSubmit} className="mb-4 p-4 border rounded bg-white">
          <h4 className="text-md font-medium mb-2 text-gray-700">Set Race Status</h4>
          <label className="mr-2 text-sm text-gray-600">Status: </label>
          <select 
            value={status} 
            onChange={e => setStatus(e.target.value)}
            className="p-1 border border-gray-300 rounded text-sm"
          >
              <option value="upcoming">Upcoming</option>
              <option value="open">Open (Picks Allowed)</option>
              <option value="locked">Locked (Race in Progress)</option>
              <option value="finished">Finished (Results Set)</option>
          </select>
          <button 
            type="submit" 
            className="ml-3 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition duration-150"
          >
            Update Status
          </button>
      </form>

      {/* Results Control */}
      <form onSubmit={handleResultsSubmit} className="p-4 border rounded bg-white">
          <h4 className="text-md font-medium mb-2 text-gray-700">Set/Update Race Results</h4>
          <p className="text-xs text-gray-500 mb-3">Note: Setting results automatically sets status to 'finished' and triggers winner calculation.</p>
          <div className="mb-2">
              <label className="mr-2 text-sm text-gray-600 w-16 inline-block text-right">1st Place: </label>
              <select 
                value={first} 
                onChange={e => setFirst(e.target.value)}
                className="p-1 border border-gray-300 rounded text-sm"
              >
              <option value="">-- Select Winner --</option>
              {horses.map(h => <option key={h.id} value={h.id}>{h.name} ({h.postPosition ?? 'N/A'})</option>)}
              </select>
          </div>
          <div className="mb-2">
              <label className="mr-2 text-sm text-gray-600 w-16 inline-block text-right">2nd Place: </label>
              <select 
                value={second} 
                onChange={e => setSecond(e.target.value)}
                className="p-1 border border-gray-300 rounded text-sm"
              >
              <option value="">-- Select Place --</option>
              {horses.map(h => <option key={h.id} value={h.id}>{h.name} ({h.postPosition ?? 'N/A'})</option>)}
              </select>
          </div>
          <div className="mb-2">
              <label className="mr-2 text-sm text-gray-600 w-16 inline-block text-right">3rd Place: </label>
              <select 
                value={third} 
                onChange={e => setThird(e.target.value)}
                className="p-1 border border-gray-300 rounded text-sm"
              >
              <option value="">-- Select Show --</option>
              {horses.map(h => <option key={h.id} value={h.id}>{h.name} ({h.postPosition ?? 'N/A'})</option>)}
              </select>
          </div>
          <div className="mt-4">
            <button 
              type="submit" 
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition duration-150 shadow-sm"
            >
              Set Results
            </button>
            {/* Add Clear Results Button */}
            <button 
              type="button" // Important: type="button" to prevent form submission
              onClick={onClearResults} 
              disabled={!resultsAreSet} // Disable if results are not currently set
              className={`ml-4 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded transition duration-150 shadow-sm ${
                  !resultsAreSet 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-green-700'
              }`}
            >
              Clear Results
            </button>
          </div>
      </form>
    </div>
  );
}

export default ResultsAdminForm; 