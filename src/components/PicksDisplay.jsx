import React, { useMemo } from 'react';

// TODO: Fetch horse names based on IDs
function PicksDisplay({ picks, horses = [], scratchedHorses = [] }) {
  if (!picks) {
    return <p>You haven't made picks for this race yet.</p>;
  }

  // Create a map for faster horse lookups
  const horseMap = useMemo(() => {
    const map = new Map();
    horses.forEach(h => map.set(h.id, h.name));
    return map;
  }, [horses]);

  // Create a set for faster scratched horse lookups
  const scratchedSet = useMemo(() => new Set(scratchedHorses), [scratchedHorses]);

  const getHorseNameWithStatus = (horseId) => {
    const name = horseMap.get(horseId) || `Horse ${horseId?.substring(0,5)}?`;
    const isScratched = scratchedSet.has(horseId);
    return `${name}${isScratched ? ' (SCR)' : ''}`;
  };

  return (
    <div>
      <h3>Your Current Picks:</h3>
      <ul>
        <li>1st: <span className={scratchedSet.has(picks.first) ? 'line-through opacity-70' : ''}>{getHorseNameWithStatus(picks.first)}</span></li>
        <li>2nd: <span className={scratchedSet.has(picks.second) ? 'line-through opacity-70' : ''}>{getHorseNameWithStatus(picks.second)}</span></li>
        <li>3rd: <span className={scratchedSet.has(picks.third) ? 'line-through opacity-70' : ''}>{getHorseNameWithStatus(picks.third)}</span></li>
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