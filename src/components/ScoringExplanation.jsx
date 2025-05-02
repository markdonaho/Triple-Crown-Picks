import React, { useState } from 'react';

function ScoringExplanation() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #ccc', textAlign: 'center' }}>
      <button 
        onClick={toggleOpen} 
        style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--link-color)', 
            textDecoration: 'underline',
            cursor: 'pointer',
            fontSize: '0.9em'
        }}
      >
        {isOpen ? 'Hide Scoring Rules' : 'Show Scoring Rules'}
      </button>
      {isOpen && (
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--subtle-bg-color)', borderRadius: '4px', textAlign: 'left', display: 'inline-block' }}>
          <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Scoring System</h4>
          <ul style={{ listStyle: 'disc', paddingLeft: '20px', margin: 0 }}>
            <li>Correct 1st Place: <strong>5 points</strong></li>
            <li>Correct 2nd Place: <strong>3 points</strong></li>
            <li>Correct 3rd Place: <strong>1 point</strong></li>
            <li>Picked Horse in Top 3 (but wrong place): <strong>0.5 points</strong></li>
          </ul>
          <p style={{fontSize: '0.8em', color: '#666', marginTop: '0.75rem', marginBottom: 0}}>
            <em>Example: Results are H1/H2/H3. Your pick is H1/H3/H4. You score 5 points (H1) + 0.5 points (H3) = 5.5 points.</em>
          </p>
        </div>
      )}
    </div>
  );
}

export default ScoringExplanation; 