import React from 'react';

// TODO: Fetch horse names based on IDs
function PicksDisplay({ picks, horses = [] }) {
  if (!picks) {
    return <p>You haven't made picks for this race yet.</p>;
  }

  // Helper to find horse name by ID (replace with more efficient lookup if needed)
  const getHorseName = (id) => horses.find(h => h.id === id)?.name || `Unknown Horse (${id})`;

  return (
    <div>
      <h3>Your Current Picks:</h3>
      <ul>
        <li>1st: {getHorseName(picks.first)}</li>
        <li>2nd: {getHorseName(picks.second)}</li>
        <li>3rd: {getHorseName(picks.third)}</li>
      </ul>
      {/* Handle both Firestore Timestamps and JS Dates */}
      {picks.submittedAt && 
        <p><small>Submitted: { 
          new Date(picks.submittedAt.toDate ? picks.submittedAt.toDate() : picks.submittedAt).toLocaleString() 
        }</small></p>}
      {picks.updatedAt && 
        <p><small>Last Updated: { 
          new Date(picks.updatedAt.toDate ? picks.updatedAt.toDate() : picks.updatedAt).toLocaleString() 
        }</small></p>}
    </div>
  );
}

export default PicksDisplay; 