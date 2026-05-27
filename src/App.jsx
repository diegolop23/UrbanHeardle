import { useState, useEffect, useRef } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { getRandomSong, getSongList } from "./utils/songs";
import AudioPlayer from "./components/AudioPlayer";
import ResultDisplay from "./components/ResultDisplay";
import GuessAutocompleteInput from "./components/GuessAutocompleteInput";
import FeedbackWidget from "./components/FeedbackWidget";
import GameModeBar from "./components/GameModeBar";
import ThemeSwitcher from "./components/ThemeSwitcher";
import LyricsGame from "./components/LyricsGame";
import StatisticsDashboard from "./components/StatisticsDashboard";
//import Leaderboard from "./components/Leaderboard";
import { submitStreakScore } from "./utils/score";

function HeardleGame({ streak, setStreak }) {
  const [currentSong, setCurrentSong] = useState(null);
  const [gameState, setGameState] = useState({
    step: 1,
    isPlaying: false,
    guesses: [],
    isRevealed: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const didSubmitRef = useRef(false);

  useEffect(() => {
    const initializeGame = async () => {
      setCurrentSong(await getRandomSong());
      setIsLoading(false);
    };

    initializeGame();
  }, []);

  const nextStep = () => {
    if (gameState.step < 6) {
      setGameState((prev) => ({
        ...prev,
        step: prev.step + 1,
        //isPlaying: false,
      }));
    }
  };

  const handleGuessSubmit = (guess) => {
    if (gameState.guesses.length >= 6 || gameState.isRevealed) return;

    const isCorrectArtist =
      guess.artist.toLowerCase() === currentSong.artist.toLowerCase();
    const isCorrectTitle =
      guess.title.toLowerCase() === currentSong.title.toLowerCase();

    const newGuesses = [
      ...gameState.guesses,
      {
        ...guess,
        isCorrectArtist,
        isCorrectTitle,
      },
    ];

    const maxGuessesReached = newGuesses.length >= 6;
    const isCorrect = isCorrectArtist && isCorrectTitle;

    if (!isCorrect && !maxGuessesReached) {
      nextStep();
    }

    if (isCorrect) {
      setStreak((prev) => prev + 1);
    }

    if (!isCorrect && maxGuessesReached) {
      setStreak(0);
    }

    setGameState((prev) => ({
      ...prev,
      guesses: newGuesses,
      isRevealed: isCorrect || maxGuessesReached,
    }));

    // Record game statistics
    if (window.recordGameStatistics) {
      window.recordGameStatistics({
        isWin: isCorrect,
        guesses: newGuesses.length,
        streak: isCorrect ? streak + 1 : 0,
        artist: currentSong?.artist,
        title: currentSong?.title,
      });
    }
  };

  useEffect(() => {
    // no-op: removed artist selector
  }, []);

  useEffect(() => {
    if (!didSubmitRef.current) {
      didSubmitRef.current = true;
      return;
    }

    const username = localStorage.getItem("username") || "Guest";

    if (!username || streak === 0) return;

    submitStreakScore(username, streak).catch((error) => {
      console.error("Error submitting heardle streak score:", error);
    });
  }, [streak]);

  const resetGame = async () => {
    const previousGuesses = gameState.guesses;
    const newSong = await getRandomSong();
    setCurrentSong(newSong);
    setGameState({
      step: 1,
      isPlaying: false,
      guesses: [],
      isRevealed: false,
    });

    if (
      !previousGuesses.some(
        (g) => g.isCorrectArtist && g.isCorrectTitle
      )
    ) {
      setStreak(0);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <div className="animate-pulse mb-6"></div>
        <p className="text-lg font-medium animate-pulse tracking-widest">
          Cargando canciones...
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col md:flex-row mb-6">
        <div className="flex-1 md:mr-[-100px]">
          <AudioPlayer
            song={currentSong}
            gameState={gameState}
            setGameState={setGameState}
            handleGuessSubmit={handleGuessSubmit}
            setCurrentSong={setCurrentSong}
            getRandomSong={getRandomSong}
          />
        </div>
        <div className="hidden md:block w-px bg-gray-600 opacity-50 mx-10"></div>{" "}
        <div className="w-full md:w-1/3 md:pl-4">
          <ResultDisplay
            guesses={gameState.guesses}
            song={gameState.isRevealed ? currentSong : null}
            hasLost={
              gameState.isRevealed &&
              !gameState.guesses.some(
                (g) =>
                  g.artist.toLowerCase() ===
                    currentSong.artist.toLowerCase() &&
                  g.title.toLowerCase() === currentSong.title.toLowerCase()
              )
            }
            streak={streak}
          />
        </div>
      </div>

      {!gameState.isRevealed && gameState.guesses.length < 6 && (
        <GuessAutocompleteInput
          onSubmit={handleGuessSubmit}
          disabled={gameState.isPlaying}
          fetchSuggestions={async (query) => {
            const songs = await getSongList();

            // Helper function to remove accents and diacritics
            const removeAccents = (str) => {
              return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            };

            const normalizedQuery = removeAccents(query.toLowerCase());

            return songs.filter((song) => {
              const normalizedTitle = removeAccents(song.title.toLowerCase());
              const normalizedArtist = removeAccents(
                song.artist.toLowerCase()
              );
              return (
                normalizedTitle.includes(normalizedQuery) ||
                normalizedArtist.includes(normalizedQuery)
              );
            });
          }}
        />
      )}
      <div className="mt-6 flex justify-center">
        <button
          onClick={resetGame}
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md"
        >
          Nuevo juego
        </button>
      </div>
      <FeedbackWidget />
    </>
  );
}

function App() {
  const [username] = useState(() => localStorage.getItem("username") || "Guest");
  const [heardleStreak, setHeardleStreak] = useState(() => {
    const storedStreak = Number(localStorage.getItem("heardleStreak"));
    return Number.isFinite(storedStreak) && storedStreak > 0 ? storedStreak : 0;
  });
  const [lyricsStreak, setLyricsStreak] = useState(() => {
    const storedStreak = Number(localStorage.getItem("lyricsStreak"));
    return Number.isFinite(storedStreak) && storedStreak > 0 ? storedStreak : 0;
  });
  const [showStats, setShowStats] = useState(false);
  const heardleSubmitRef = useRef(false);
  const lyricsSubmitRef = useRef(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + S: Open statistics
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        setShowStats(true);
      }
      // Escape: Close statistics
      if (e.key === 'Escape' && showStats) {
        setShowStats(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showStats]);

  useEffect(() => {
    localStorage.setItem("heardleStreak", String(heardleStreak));
  }, [heardleStreak]);

  useEffect(() => {
    localStorage.setItem("lyricsStreak", String(lyricsStreak));
  }, [lyricsStreak]);

  useEffect(() => {
    if (!heardleSubmitRef.current) {
      heardleSubmitRef.current = true;
      return;
    }

    if (!username || heardleStreak === 0) return;
    submitStreakScore(username, heardleStreak).catch((error) => {
      console.error("Error submitting heardle streak score:", error);
    });
  }, [heardleStreak, username]);

  useEffect(() => {
    if (!lyricsSubmitRef.current) {
      lyricsSubmitRef.current = true;
      return;
    }

    if (!username || lyricsStreak === 0) return;
    submitStreakScore(username, lyricsStreak).catch((error) => {
      console.error("Error submitting lyrics streak score:", error);
    });
  }, [lyricsStreak, username]);

  return (
    <div className="relative">
      <GameModeBar onOpenStats={() => setShowStats(true)} />
      {/* Theme Switcher - fixed position in top-right */}
      <div className="fixed top-4 right-4 z-40">
        <ThemeSwitcher />
      </div>
      {/* Statistics Dashboard Modal */}
      {showStats && (
        <StatisticsDashboard onClose={() => setShowStats(false)} />
      )}
      {/* Floating Leaderboard Bubble
      <div className="hidden md:block fixed left-4 top-1/2 transform -translate-y-1/2 z-10">
        <div className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-700 w-60 hover:w-64 transition-all duration-200">
          <Leaderboard username={username} setUsername={setUsername} />
        </div>
      </div>*/}
      {/* Floating ChooseArtist Bubble */}
      {/* ChooseArtist panel removed per request */}
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <header className="max-w-4xl mx-auto text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 glitch-title">Povlao Guess</h1>
        </header>
        <main className="max-w-4xl mx-auto">
          <Routes>
            <Route
              path="/heardle"
              element={
                <HeardleGame streak={heardleStreak} setStreak={setHeardleStreak} />
              }
            />
            <Route
              path="/lyrics"
              element={
                <LyricsGame
                  username={username}
                  streak={lyricsStreak}
                  setStreak={setLyricsStreak}
                />
              }
            />
            <Route path="*" element={<Navigate to="/heardle" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
