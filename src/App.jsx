import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet, // Used for nested layouts if needed
  Navigate // Used for redirects
} from 'react-router-dom';

import Navbar from './components/Navbar'; // Assuming Navbar component exists
import HomePage from './pages/HomePage'; // Placeholder
import PicksPage from './pages/PicksPage';
import ResultsPage from './pages/ResultsPage';
import LoginPage from './pages/LoginPage'; // Import real component
import SignupPage from './pages/SignupPage'; // Import real component
import HorseAdminPage from './pages/HorseAdminPage'; // Placeholder
// import NotFoundPage from './pages/NotFoundPage'; // Placeholder
import { useAuth } from './hooks/useAuth'; // Import the real hook

import './App.css';

// --- Placeholder Pages --- (Remove Login/Signup)
// const LoginPage = () => <div>Login Page Placeholder</div>;
// const SignupPage = () => <div>Sign Up Page Placeholder</div>;
// const HorseAdminPage = () => <div>Horse Admin Page Placeholder (Admin Only)</div>; // Keep this one for now
const NotFoundPage = () => <div>404 Not Found</div>;
// --- End Placeholder Pages ---

// Basic layout component including the Navbar
function Layout() {
  return (
    <>
      <Navbar />
      <main style={{ padding: '0 1rem' }}> {/* Add some padding */}
        <Outlet /> {/* Nested routes will render here */}
      </main>
    </>
  );
}

// Protected route component (uses the real hook)
function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isAdmin, loading } = useAuth(); // Use the imported hook

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    // Redirect to home or an unauthorized page if admin required but user is not admin
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}> {/* Main layout with Navbar */} 
          {/* Public Routes */}
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} /> {/* Use real component */}
          <Route path="signup" element={<SignupPage />} /> {/* Use real component */}

          {/* Routes requiring authentication */}
          <Route path="picks" element={<ProtectedRoute><PicksPage /></ProtectedRoute>} />
          <Route path="picks/:raceId" element={<ProtectedRoute><PicksPage /></ProtectedRoute>} />
          <Route path="results" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
          <Route path="results/:raceId" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />

          {/* Routes requiring admin privileges */}
          <Route 
            path="admin/horses" 
            element={(
              <ProtectedRoute adminOnly={true}>
                <HorseAdminPage />
              </ProtectedRoute>
            )}
          />

          {/* Catch-all 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
