import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Import the hook

function Navbar() {
  const { user, isAdmin, loading, logout } = useAuth(); // Use the hook

  // Don't render until auth state is determined to avoid flickering
  if (loading) {
    return (
      <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc', marginBottom: '1rem' }}>
        Loading...
      </nav>
    );
  }

  return (
    <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc', marginBottom: '1rem' }}>
      <Link to="/" style={{ marginRight: '1rem' }}>Home</Link>
      {/* Show Picks/Results only if logged in, could adjust this rule */}
      {user && (
        <>
          <Link to="/picks" style={{ marginRight: '1rem' }}>Picks</Link>
          <Link to="/results" style={{ marginRight: '1rem' }}>Results</Link>
        </>
      )}

      {/* Show Admin link only if user is admin */}
      {user && isAdmin && (
        <>
          <Link to="/admin/horses" style={{ marginRight: '1rem' }}>Manage Horses</Link>
          <Link to="/admin/races" style={{ marginRight: '1rem' }}>Manage Races</Link>
        </>
      )}

      <span style={{ float: 'right' }}>
        {user ? (
          <>
            <span style={{marginRight: '1rem'}}>Welcome, {user.displayName || user.email}</span>
            <button 
              onClick={logout} 
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition duration-150"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-gray-700 hover:text-blue-600">Login</Link>
            <Link to="/signup" className="text-blue-600 hover:underline">Sign Up</Link>
          </>
        )}
      </span>
    </nav>
  );
}

export default Navbar; 