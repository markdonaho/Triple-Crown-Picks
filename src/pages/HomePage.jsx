import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, getDocs, query, orderBy, where, documentId, Timestamp } from 'firebase/firestore';
import { calculateScores } from '../utils/scoring'; // Import the scoring function

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
  const [allPicks, setAllPicks] = useState([]);
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

        // 3. Fetch ALL picks
        const allPicksSnapshot = await getDocs(collection(db, 'picks'));
        const picksData = allPicksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllPicks(picksData);

        // 4. Fetch ALL users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const userMapData = new Map();
        usersSnapshot.docs.forEach(doc => userMapData.set(doc.id, { id: doc.id, ...doc.data() }));
        setUsersMap(userMapData);

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
    return allRaces
           .filter(race => race.status === 'open' || isToday(race.date))
           .map(race => ({ ...race, scratchedHorses: race.scratchedHorses || [] })); // Also ensure array exists here
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

  // Group ALL picks by raceId for efficient lookup in relevant races section
  const allPicksByRace = useMemo(() => {
      const grouped = {};
      allPicks.forEach(pick => {
          if (!grouped[pick.raceId]) {
              grouped[pick.raceId] = [];
          }
          grouped[pick.raceId].push(pick);
      });
      return grouped;
  }, [allPicks]);

  // --- Scoreboard Calculation ---
  const finishedRaces = useMemo(() => {
      return allRaces.filter(race => race.status === 'finished' && race.results && race.results.first);
  }, [allRaces]);

  const scoreboardData = useMemo(() => {
      const userScores = new Map(); // Map<userId, { userName: string, totalScore: number, raceScores: Map<raceId, number> }>

      // Initialize all registered users with 0 scores
      usersMap.forEach((user, userId) => {
          userScores.set(userId, {
              userName: user.displayName || `User ${userId.substring(0,5)}?`,
              totalScore: 0,
              raceScores: new Map() // Map<raceId, score>
          });
      });

      // Calculate scores for each finished race
      finishedRaces.forEach(race => {
          const racePicks = allPicksByRace[race.id] || [];
          const raceScores = calculateScores(
              racePicks,
              race.results,
              {}, // Pass empty map for usersMap argument to calculateScores as it's not needed here
              race.scratchedHorses || []
          ); // Returns { userId: score }

          // Add race score to each user's total and race-specific scores
          Object.entries(raceScores).forEach(([userId, score]) => {
              if (userScores.has(userId)) {
                  const userData = userScores.get(userId);
                  userData.totalScore += score;
                  userData.raceScores.set(race.id, score);
                  userScores.set(userId, userData);
              }
              // If a pick exists for a user not in usersMap (shouldn't happen with current logic), ignore it
          });
      });

      // Convert map to array and sort by total score descending
      return Array.from(userScores.values()).sort((a, b) => b.totalScore - a.totalScore);

  }, [allRaces, allPicks, usersMap, finishedRaces, allPicksByRace]);
  // --- End Scoreboard Calculation ---

  // Group picks by raceId (Used for the 'Today/Open' section display)
  const picksByRace = useMemo(() => {
      const grouped = {};
      // Filter allPicks to only include picks for relevant (open/today) races
      allPicks.forEach(pick => {
          if (relevantRaces.some(race => race.id === pick.raceId)) {
             if (!grouped[pick.raceId]) {
                 grouped[pick.raceId] = [];
             }
             grouped[pick.raceId].push(pick);
          }
      });
      return grouped;
  }, [allPicks, relevantRaces]); // Depends on allPicks and relevantRaces

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
            const scratchedSet = new Set(race.scratchedHorses || []); // Use a Set for efficient lookup

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
                            {sortedRaceHorses.map((horse, index) => {
                                const isScratched = scratchedSet.has(horse.id);
                                return (
                                    <tr key={horse.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${isScratched ? 'opacity-60' : ''}`}>
                                        <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900 text-center">{horse.postPosition ?? '-'}</td>
                                        <td className={`px-4 py-2 whitespace-nowrap text-gray-700 text-center ${isScratched ? 'line-through' : ''}`}>{horse.name}{isScratched ? ' (SCR)' : ''}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-gray-500 text-center">{horse.odds ?? '-'}</td>
                                    </tr>
                                );
                            })}
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
                        {racePicks.map(pick => {
                            // Check if picked horses are scratched
                            const firstScratched = scratchedSet.has(pick.first);
                            const secondScratched = scratchedSet.has(pick.second);
                            const thirdScratched = scratchedSet.has(pick.third);
                            return (
                                <li key={pick.id} className="p-2 bg-gray-50 rounded">
                                    <strong className="font-semibold text-gray-800">{getUserName(pick.userId)}:</strong>{' '}
                                    <span className="text-gray-600">
                                        <span className={firstScratched ? 'line-through opacity-70' : ''}>{getHorseName(pick.first)}{firstScratched ? '(SCR)' : ''}</span> / {' '}
                                        <span className={secondScratched ? 'line-through opacity-70' : ''}>{getHorseName(pick.second)}{secondScratched ? '(SCR)' : ''}</span> / {' '}
                                        <span className={thirdScratched ? 'line-through opacity-70' : ''}>{getHorseName(pick.third)}{thirdScratched ? '(SCR)' : ''}</span>
                                    </span>
                                </li>
                            );
                        })}
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

      {/* --- Scoreboard Section --- */}
      <section className="bg-white p-6 rounded-lg shadow mb-12">
        <h2 className="text-2xl font-bold mb-6 border-b pb-3 text-gray-800">Overall Standings</h2>
        {loading && <p className="text-center text-gray-500">Loading scores...</p>}
        {error && <p className="text-center text-red-600 font-semibold">{error}</p>}
        {!loading && !error && (
          <div className="overflow-x-auto rounded-md shadow-sm border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600 uppercase tracking-wider sticky left-0 bg-gray-100 z-10">User</th>
                  {/* Add columns for ALL races */}
                  {allRaces.map(race => (
                    <th key={race.id} className="px-4 py-2 text-center font-semibold text-gray-600 uppercase tracking-wider" title={race.name}>
                      {/* Abbreviate long race names for header */}
                      {race.name.length > 15 ? race.name.substring(0, 12) + '...' : race.name}
                    </th>
                  ))}
                  <th className="px-4 py-2 text-right font-semibold text-gray-600 uppercase tracking-wider sticky right-0 bg-gray-100 z-10">Total Score</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scoreboardData.length > 0 ? (
                  scoreboardData.map((userData, index) => (
                    <tr key={userData.userName} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900 sticky left-0 bg-inherit z-10">{userData.userName}</td>
                      {/* Display score for each race, showing 0 if not finished or no score */}
                      {allRaces.map(race => (
                        <td key={race.id} className="px-4 py-2 whitespace-nowrap text-gray-500 text-center">
                          {(finishedRaces.some(fr => fr.id === race.id) && userData.raceScores.get(race.id)) || 0}
                        </td>
                      ))}
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700 text-right font-semibold sticky right-0 bg-inherit z-10">
                        {userData.totalScore}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    {/* Adjust colspan to account for all races + user + total */}
                    <td colSpan={allRaces.length + 2} className="px-4 py-4 text-center text-gray-500 italic">
                      No scores calculated yet. Ensure races are marked 'finished' and results are entered.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {/* --- End Scoreboard Section --- */}

    </div>
  );
}

export default HomePage; 