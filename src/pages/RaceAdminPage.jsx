import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

function RaceAdminPage() {
  const [raceName, setRaceName] = useState('');
  const [raceDate, setRaceDate] = useState(''); // Store date as string YYYY-MM-DD
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!raceName || !raceDate) {
      setError('Please provide both race name and date.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Convert date string to Firestore Timestamp
      const dateObject = new Date(raceDate + 'T12:00:00'); // Assume noon on the given date
      if (isNaN(dateObject)) {
          throw new Error("Invalid date format. Please use YYYY-MM-DD.");
      }

      const racesCollection = collection(db, 'races');
      await addDoc(racesCollection, {
        name: raceName,
        date: dateObject, // Store as Timestamp
        status: 'upcoming', // Default status
        createdAt: serverTimestamp(),
      });

      setSuccess(`Race "${raceName}" created successfully!`);
      setRaceName('');
      setRaceDate('');
    } catch (err) {
      console.error("Error creating race:", err);
      setError(err.message || 'Failed to create race. Please check console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Admin: Create New Race</h1>
      <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white p-6 rounded shadow-md">
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-500 mb-4">{success}</p>}

        <div className="mb-4">
          <label htmlFor="raceName" className="block text-gray-700 font-bold mb-2">
            Race Name:
          </label>
          <input
            type="text"
            id="raceName"
            value={raceName}
            onChange={(e) => setRaceName(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="e.g., Kentucky Derby 2025"
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="raceDate" className="block text-gray-700 font-bold mb-2">
            Race Date:
          </label>
          <input
            type="date" // Use type="date" for better UX
            id="raceDate"
            value={raceDate}
            onChange={(e) => setRaceDate(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 w-full"
        >
          {loading ? 'Creating...' : 'Create Race'}
        </button>
      </form>
    </div>
  );
}

export default RaceAdminPage; 