import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../services/firebase'; // Adjust path if necessary
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

function HomePage() {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRaces = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch races ordered by date (or name, adjust as needed)
        const racesCollection = collection(db, 'races');
        const q = query(racesCollection, orderBy('date', 'asc')); // Assuming a 'date' field exists
        const querySnapshot = await getDocs(q);
        const racesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRaces(racesData);
      } catch (err) {
        console.error("Error fetching races:", err);
        setError('Failed to load races. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRaces();
  }, []);

  return (
    <div>
      <h1>Welcome to Triple Crown Picks!</h1>
      <p>Select a race below to view or make your picks.</p>

      <h2>Upcoming Races</h2>
      {loading && <p>Loading races...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <ul>
          {races.length > 0 ? (
            races.map(race => (
              <li key={race.id}>
                <Link to={`/picks/${race.id}`}>
                  {race.name} - {race.date ? new Date(race.date.seconds * 1000).toLocaleDateString() : 'Date TBD'}
                  {/* Optionally display status: ({race.status}) */}
                </Link>
              </li>
            ))
          ) : (
            <p>No races found.</p>
          )}
        </ul>
      )}
      {/* You might want to add links to Results page or Horse Admin page here later */}
    </div>
  );
}

export default HomePage; 