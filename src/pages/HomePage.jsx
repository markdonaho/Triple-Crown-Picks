import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, getDocs, query, orderBy, where, documentId, Timestamp } from 'firebase/firestore';

// Helper to check if a Firestore Timestamp is today
const isToday = (timestamp) => {
  if (!timestamp?.toDate) return false;
  const date = timestamp.toDate();
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

function HomePage() {
  const [allRaces, setAllRaces] = useState([]);
  const [allHorsesMap, setAllHorsesMap] = useState(new Map());
  const [relevantPicks, setRelevantPicks] = useState([]);
  const [usersMap, setUsersMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch all races ordered by date
        const racesQuery = query(collection(db, 'races'), orderBy('date', 'asc'));
        const racesSnapshot = await getDocs(racesQuery);
        const racesData = racesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllRaces(racesData);

        // 2. Fetch all horses into a map
        const horsesSnapshot = await getDocs(collection(db, 'horses'));
        const horsesMap = new Map();
        horsesSnapshot.docs.forEach(doc => horsesMap.set(doc.id, { id: doc.id, ...doc.data() }));
        setAllHorsesMap(horsesMap);

        // 3. Identify relevant races ('open' or 'today')
        const relevantRaceIds = racesData
          .filter(race => race.status === 'open' || isToday(race.date))
          .map(race => race.id);

        let picksData = [];
        let userMapData = new Map();

        if (relevantRaceIds.length > 0) {
          // 4. Fetch picks for relevant races
          const picksQuery = query(collection(db, 'picks'), where('raceId', 'in', relevantRaceIds));
          const picksSnapshot = await getDocs(picksQuery);
          picksData = picksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setRelevantPicks(picksData);

          // 5. Get unique user IDs from picks
          const userIds = [...new Set(picksData.map(pick => pick.userId))];

          if (userIds.length > 0) {
            // 6. Fetch user data for those IDs
            // Firestore 'in' query limit is 30 - fetch in chunks if necessary
            const MAX_IDS_PER_QUERY = 30;
            for (let i = 0; i < userIds.length; i += MAX_IDS_PER_QUERY) {
                const chunkUserIds = userIds.slice(i, i + MAX_IDS_PER_QUERY);
                const usersQuery = query(collection(db, 'users'), where(documentId(), 'in', chunkUserIds));
                const usersSnapshot = await getDocs(usersQuery);
                usersSnapshot.docs.forEach(doc => userMapData.set(doc.id, { id: doc.id, ...doc.data() }));
            }
            setUsersMap(userMapData);
          }
        }

      } catch (err) {
        console.error("Error fetching homepage data:", err);
        setError('Failed to load required data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Memoize relevant races based on allRaces
  const relevantRaces = useMemo(() => {
    return allRaces.filter(race => race.status === 'open' || isToday(race.date));
  }, [allRaces]);

  // Helper function to get horse details
  const getHorse = (id) => allHorsesMap.get(id);
  const getHorseName = (id) => getHorse(id)?.name || `Horse ${id?.substring(0,5)}?`;

  // Helper function to get user name
  const getUserName = (id) => usersMap.get(id)?.displayName || `User ${id?.substring(0,5)}?`;

  // Helper to get horses for a specific race, sorted by PP
  const getSortedHorsesForRace = (raceId) => {
      const horses = [];
      allHorsesMap.forEach(horse => {
          if (horse.raceIds && horse.raceIds.includes(raceId)) {
              horses.push(horse);
          }
      });
      return horses.sort((a, b) => {
          const posA = typeof a.postPosition === 'number' ? a.postPosition : Infinity;
          const posB = typeof b.postPosition === 'number' ? b.postPosition : Infinity;
          return posA - posB;
      });
  };

  // Group picks by raceId
  const picksByRace = useMemo(() => {
      const grouped = {};
      relevantPicks.forEach(pick => {
          if (!grouped[pick.raceId]) {
              grouped[pick.raceId] = [];
          }
          grouped[pick.raceId].push(pick);
      });
      return grouped;
  }, [relevantPicks]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Welcome to Triple Crown Picks!</h1>

      {/* Section for automatically displayed races */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Today's Races & Open Picks</h2>
        {loading && <p>Loading race data...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && relevantRaces.length === 0 && (
          <p>No races currently open for picking or running today.</p>
        )}
        {!loading && !error && relevantRaces.map(race => {
          const sortedRaceHorses = getSortedHorsesForRace(race.id);
          const racePicks = picksByRace[race.id] || [];

          return (
            <div key={race.id} className="mb-8 p-4 border rounded shadow-sm bg-white">
              <h3 className="text-xl font-bold mb-3">{race.name} ({race.status})</h3>
              
              {/* Horse Table for this race */}
              <h4 className="text-lg font-semibold mb-2">Entries</h4>
              {sortedRaceHorses.length > 0 ? (
                  <div className="overflow-x-auto shadow-md rounded-lg mb-4">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">PP</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">Horse</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">Odds</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sortedRaceHorses.map((horse) => (
                          <tr key={horse.id}>
                            <td className="px-3 py-2 whitespace-nowrap font-medium">{horse.postPosition ?? 'N/A'}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{horse.name}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-gray-600">{horse.odds ?? 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 mb-4">No horses found for this race.</p>
              )}

              {/* Picks List for this race */}
              <h4 className="text-lg font-semibold mb-2">Current Picks</h4>
              {racePicks.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {racePicks.map(pick => (
                    <li key={pick.id}>
                      <strong>{getUserName(pick.userId)}:</strong>{' '}
                      {getHorseName(pick.first)} / {getHorseName(pick.second)} / {getHorseName(pick.third)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No picks submitted for this race yet.</p>
              )}
            </div>
          );
        })}
      </section>

      {/* Section for selecting any race */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Select a Race to View/Pick</h2>
        {loading && allRaces.length === 0 && <p>Loading races...</p>}
        {error && allRaces.length === 0 && <p className="text-red-500">{error}</p>}
        {!loading && !error && (
          <ul className="space-y-2">
            {allRaces.length > 0 ? (
              allRaces.map(race => (
                <li key={race.id}>
                  <Link to={`/picks/${race.id}`} className="text-blue-600 hover:underline">
                    {race.name} - {race.date ? new Date(race.date.seconds * 1000).toLocaleDateString() : 'Date TBD'}
                     ({race.status})
                  </Link>
                </li>
              ))
            ) : (
              <p>No races found.</p>
            )}
          </ul>
        )}
      </section>

      {/* Keep links to other pages */}
       <div className="text-center mt-8 space-x-4">
          <Link to="/picks" className="text-blue-600 hover:underline">Go to Picks Page</Link>
          <Link to="/results" className="text-blue-600 hover:underline">View Results Page</Link>
      </div>

    </div>
  );
}

export default HomePage; 