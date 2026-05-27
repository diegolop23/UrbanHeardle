import { useState, useEffect } from "react";

const StatisticsDashboard = ({ onClose }) => {
  const [stats, setStats] = useState({
    totalGamesPlayed: 0,
    totalWins: 0,
    winRate: 0,
    averageGuesses: 0,
    bestStreak: 0,
    currentStreak: 0,
    worstStreak: 0,
    favoriteArtists: [],
    genreBreakdown: [],
    gamesByHour: Array(24).fill(0),
    recentGames: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      // Load from localStorage (client-side stats tracking)
      const storedStats = localStorage.getItem("gameStatistics");
      if (storedStats) {
        const parsed = JSON.parse(storedStats);
        setStats(parsed);
      }
    } catch (error) {
      console.error("Error loading statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveStatistics = (newStats) => {
    localStorage.setItem("gameStatistics", JSON.stringify(newStats));
  };

  // This function should be called after each game to update stats
  const recordGame = (result) => {
    setStats((prev) => {
      const newStats = {
        ...prev,
        totalGamesPlayed: prev.totalGamesPlayed + 1,
        totalWins: result.isWin ? prev.totalWins + 1 : prev.totalWins,
        winRate: Math.round(
          ((result.isWin ? prev.totalWins + 1 : prev.totalWins) /
            (prev.totalGamesPlayed + 1)) *
            100
        ),
        averageGuesses: Math.round(
          (prev.averageGuesses * prev.totalGamesPlayed + result.guesses) /
            (prev.totalGamesPlayed + 1)
        ),
        bestStreak: Math.max(prev.bestStreak, result.streak),
        currentStreak: result.streak,
        worstStreak: result.streak === 0 ? Math.max(prev.worstStreak, 0) : prev.worstStreak,
        gamesByHour: (() => {
          const hour = new Date().getHours();
          const updated = [...prev.gamesByHour];
          updated[hour]++;
          return updated;
        })(),
        recentGames: [
          {
            date: new Date().toISOString(),
            isWin: result.isWin,
            guesses: result.guesses,
            streak: result.streak,
            artist: result.artist,
            title: result.title,
          },
          ...prev.recentGames.slice(0, 9),
        ],
      };
      saveStatistics(newStats);
      return newStats;
    });
  };

  // Expose recordGame globally for other components to use
  useEffect(() => {
    window.recordGameStatistics = recordGame;
    return () => {
      delete window.recordGameStatistics;
    };
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-8 max-w-4xl w-full mx-4">
          <p className="text-center text-gray-400">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 overflow-y-auto z-50">
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto bg-gray-800 rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-700">
            <h2 className="text-3xl font-bold text-white">📊 Statistics Dashboard</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
            <StatCard
              label="Games Played"
              value={stats.totalGamesPlayed}
              icon="🎮"
            />
            <StatCard
              label="Win Rate"
              value={`${stats.winRate}%`}
              icon="🏆"
            />
            <StatCard
              label="Avg Guesses"
              value={stats.averageGuesses.toFixed(1)}
              icon="🎯"
            />
            <StatCard
              label="Current Streak"
              value={stats.currentStreak}
              icon="🔥"
            />
            <StatCard
              label="Best Streak"
              value={stats.bestStreak}
              icon="⭐"
            />
            <StatCard
              label="Total Wins"
              value={stats.totalWins}
              icon="✅"
            />
          </div>

          {/* Detailed Sections */}
          <div className="grid md:grid-cols-2 gap-6 p-6 pt-0">
            {/* Favorite Artists */}
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-xl font-semibold mb-4 text-white">
                🎤 Favorite Artists
              </h3>
              {stats.favoriteArtists.length > 0 ? (
                <ul className="space-y-2">
                  {stats.favoriteArtists.slice(0, 5).map((artist, idx) => (
                    <li
                      key={idx}
                      className="flex justify-between items-center text-gray-300"
                    >
                      <span>{artist.name}</span>
                      <span className="bg-gray-700 px-2 py-1 rounded text-sm">
                        {artist.count} games
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No data yet</p>
              )}
            </div>

            {/* Genre Breakdown */}
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-xl font-semibold mb-4 text-white">
                🎵 Genre Breakdown
              </h3>
              {stats.genreBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {stats.genreBreakdown.slice(0, 5).map((genre, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm text-gray-300 mb-1">
                        <span>{genre.name}</span>
                        <span>{genre.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                          style={{ width: `${genre.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No data yet</p>
              )}
            </div>

            {/* Games by Hour */}
            <div className="bg-gray-900 rounded-lg p-4 md:col-span-2">
              <h3 className="text-xl font-semibold mb-4 text-white">
                🕐 Activity by Hour
              </h3>
              <div className="flex items-end space-x-1 h-32">
                {stats.gamesByHour.map((count, idx) => {
                  const maxCount = Math.max(...stats.gamesByHour, 1);
                  const heightPercent = (count / maxCount) * 100;
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center group"
                    >
                      <div
                        className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all group-hover:from-blue-500 group-hover:to-blue-300"
                        style={{ height: `${Math.max(heightPercent, 4)}%` }}
                      />
                      <span className="text-xs text-gray-500 mt-1">
                        {idx}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Games */}
            <div className="bg-gray-900 rounded-lg p-4 md:col-span-2">
              <h3 className="text-xl font-semibold mb-4 text-white">
                📜 Recent Games
              </h3>
              {stats.recentGames.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="pb-2 text-gray-400">Date</th>
                        <th className="pb-2 text-gray-400">Song</th>
                        <th className="pb-2 text-gray-400">Result</th>
                        <th className="pb-2 text-gray-400">Guesses</th>
                        <th className="pb-2 text-gray-400">Streak</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentGames.map((game, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-gray-800 text-gray-300"
                        >
                          <td className="py-2 text-sm">
                            {new Date(game.date).toLocaleDateString()}
                          </td>
                          <td className="py-2">
                            {game.title} - {game.artist}
                          </td>
                          <td className="py-2">
                            {game.isWin ? (
                              <span className="text-green-400">✓ Win</span>
                            ) : (
                              <span className="text-red-400">✗ Loss</span>
                            )}
                          </td>
                          <td className="py-2">{game.guesses}/6</td>
                          <td className="py-2">
                            <span className="text-orange-400">🔥 {game.streak}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No games played yet</p>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-700 flex justify-between">
            <button
              onClick={() => {
                localStorage.removeItem("gameStatistics");
                setStats({
                  totalGamesPlayed: 0,
                  totalWins: 0,
                  winRate: 0,
                  averageGuesses: 0,
                  bestStreak: 0,
                  currentStreak: 0,
                  worstStreak: 0,
                  favoriteArtists: [],
                  genreBreakdown: [],
                  gamesByHour: Array(24).fill(0),
                  recentGames: [],
                });
              }}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              Reset Statistics
            </button>
            <button
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ label, value, icon }) => (
  <div className="bg-gray-900 rounded-lg p-4 text-center hover:bg-gray-850 transition-colors">
    <div className="text-3xl mb-2">{icon}</div>
    <div className="text-2xl font-bold text-white mb-1">{value}</div>
    <div className="text-sm text-gray-400">{label}</div>
  </div>
);

export default StatisticsDashboard;
