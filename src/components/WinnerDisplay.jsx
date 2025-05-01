import React from 'react';

// TODO: Fetch user display names based on IDs
// TODO: Handle ties (winnerData might be an array)
function WinnerDisplay({ winnerData }) {
  if (!winnerData) {
    return <p>Winner calculation pending or not available.</p>;
  }

  // Simple display, assumes winnerData is { userId: '...', score: ..., userName: '...' }
  // Needs adjustment if handling multiple winners (ties)
  const isArray = Array.isArray(winnerData);

  return (
    <div>
      <h3>Race Winner(s)</h3>
      {isArray ? (
        <ul>
          {winnerData.map(winner => (
            <li key={winner.userId}>
              {winner.userName || `User (${winner.userId})`} - Score: {winner.score}
            </li>
          ))}
        </ul>
      ) : (
        <p>
          Winner: {winnerData.userName || `User (${winnerData.userId})`} <br />
          Score: {winnerData.score}
        </p>
      )}
    </div>
  );
}

export default WinnerDisplay; 