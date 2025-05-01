import React from 'react';

// TODO: Fetch horse names based on IDs
function ResultsDisplay({ results, horses = [] }) {
  if (!results) {
    return <p>Official results are not yet available.</p>;
  }

  // Helper to find horse name by ID
  const getHorseName = (id) => horses.find(h => h.id === id)?.name || `Unknown Horse (${id})`;

  return (
    <div>
      <h3>Official Results</h3>
      <ul>
        <li>1st: {getHorseName(results.first)}</li>
        <li>2nd: {getHorseName(results.second)}</li>
        <li>3rd: {getHorseName(results.third)}</li>
      </ul>
      {results.resultsSetAt && <p><small>Results posted: {new Date(results.resultsSetAt?.toDate()).toLocaleString()}</small></p>}
    </div>
  );
}

export default ResultsDisplay; 