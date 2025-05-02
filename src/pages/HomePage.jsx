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
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold mb-2 tracking-tight text-gray-900 sm:text-5xl">
          Welcome to Triple Crown Picks!
        </h1>
        <p className="text-lg text-gray-600">
          Make your picks for the biggest races of the year.
        </p>
      </div>

      <section className="mb-16 bg-gray-50 p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6 border-b pb-3 text-gray-800">Today's Races & Open Picks</h2>
        {loading && <p className="text-center text-gray-500">Loading race data...</p>}
        {error && <p className="text-center text-red-600 font-semibold">{error}</p>}
        {!loading && !error && relevantRaces.length === 0 && (
          <p className="text-center text-gray-500">No races currently open for picking or running today.</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {!loading && !error && relevantRaces.map(race => {
            const sortedRaceHorses = getSortedHorsesForRace(race.id);
            const racePicks = picksByRace[race.id] || [];

            return (
              <div key={race.id} className="p-6 rounded-lg shadow-md bg-white hover:shadow-lg transition-shadow duration-200">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold text-gray-800">{race.name}</h3>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${
                        race.status === 'open' ? 'bg-green-100 text-green-800' :
                        race.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                        race.status === 'locked' ? 'bg-yellow-100 text-yellow-800' :
                        race.status === 'finished' ? 'bg-gray-100 text-gray-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                        {race.status.toUpperCase()}
                    </span>
                </div>

                <div className="mb-6 flex justify-center">
                    {sortedRaceHorses.length > 0 ? (
                        <div className="overflow-x-auto rounded-md shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-2 text-center font-semibold text-gray-600 uppercase tracking-wider">PP</th>
                                <th className="px-4 py-2 text-center font-semibold text-gray-600 uppercase tracking-wider">Horse</th>
                                <th className="px-4 py-2 text-center font-semibold text-gray-600 uppercase tracking-wider">Odds</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {sortedRaceHorses.map((horse, index) => (
                                <tr key={horse.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900 text-center">{horse.postPosition ?? '-'}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-gray-700 text-center">{horse.name}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-gray-500 text-center">{horse.odds ?? '-'}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">No horse entries available for this race yet.</p>
                    )}
                </div>

                <div>
                    <h4 className="text-lg font-medium mb-2 text-gray-700">Current Picks</h4>
                    {racePicks.length > 0 ? (
                    <ul className="space-y-2 text-sm list-none pl-0">
                        {racePicks.map(pick => (
                        <li key={pick.id} className="p-2 bg-gray-50 rounded">
                            <strong className="font-semibold text-gray-800">{getUserName(pick.userId)}:</strong>{' '}
                            <span className="text-gray-600">
                            {getHorseName(pick.first)} / {getHorseName(pick.second)} / {getHorseName(pick.third)}
                            </span>
                        </li>
                        ))}
                    </ul>
                    ) : (
                    <p className="text-gray-500 italic">No picks submitted for this race yet.</p>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-gray-50 p-6 rounded-lg shadow mb-12">
        <h2 className="text-2xl font-bold mb-6 border-b pb-3 text-gray-800">All Races</h2>
        {loading && allRaces.length === 0 && <p className="text-center text-gray-500">Loading races...</p>}
        {error && allRaces.length === 0 && <p className="text-center text-red-600 font-semibold">{error}</p>}
        {!loading && !error && (
          <ul className="space-y-3 list-none pl-0">
            {allRaces.length > 0 ? (
              allRaces.map(race => (
                <li key={race.id} className="p-3 bg-white rounded-md shadow-sm hover:bg-blue-50 transition-colors duration-150">
                  <Link to={`/picks/${race.id}`} className="flex justify-between items-center text-blue-700 hover:text-blue-900 group">
                    <div>
                        <span className="font-medium group-hover:underline">{race.name}</span>
                        <span className="text-sm text-gray-500 ml-2"> - {race.date ? new Date(race.date.seconds * 1000).toLocaleDateString() : 'Date TBD'}</span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        race.status === 'open' ? 'bg-green-100 text-green-800' :
                        race.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                        race.status === 'locked' ? 'bg-yellow-100 text-yellow-800' :
                        race.status === 'finished' ? 'bg-gray-100 text-gray-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                         {race.status.toUpperCase()}
                    </span>
                  </Link>
                </li>
              ))
            ) : (
              <p className="text-center text-gray-500">No races found.</p>
            )}
          </ul>
        )}
      </section>

    </div>
  );
}

export default HomePage; 