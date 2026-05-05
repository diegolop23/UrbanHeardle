import { useState, useEffect } from "react";
import { getRandomSongLyrics, getSongList } from "../utils/songs";
import GuessAutocompleteInput from "./GuessAutocompleteInput";
import ResultDisplay from "./ResultDisplay";

const MAX_GUESSES = 6;

const getLinesSubset = (lyrics) => {
  const lines = lyrics
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length <= 4) {
    // fallback: repeat or return what we have
    return lines.slice(0, 4);
  }

  // avoid first and last 3 lines
  const startMin = 3;
  const startMax = Math.max(3, lines.length - 3 - 4);
  const start = Math.min(
    Math.max(startMin, Math.floor(Math.random() * (startMax + 1))),
    Math.max(startMin, lines.length - 4 - 3)
  );

  return lines.slice(start, start + 4);
};

export default function LyricsGame({ username, streak, setStreak }) {
  const [currentSong, setCurrentSong] = useState(null);
  const [subset, setSubset] = useState([]);
  const [gameState, setGameState] = useState({ step: 1, guesses: [], isRevealed: false });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const song = await getRandomSongLyrics();
      if (song) {
        setCurrentSong(song);
        const s = getLinesSubset(song.lyrics || "");
        setSubset(s);
      }
      setGameState({ step: 1, guesses: [], isRevealed: false });
      setIsLoading(false);
    };

    init();
  }, []);

  const nextStep = () => {
    setGameState((prev) => {
      const next = Math.min(6, prev.step + 1);
      const guesses = prev.guesses;
      // no automatic guess entry here; nextStep only advances reveal
      return { ...prev, step: next, guesses };
    });
  };

  const handleGuessSubmit = (guess) => {
    if (gameState.guesses.length >= MAX_GUESSES || gameState.isRevealed) return;

    const isCorrectArtist = guess.artist.toLowerCase() === currentSong.artist.toLowerCase();
    const isCorrectTitle = guess.title.toLowerCase() === currentSong.title.toLowerCase();

    const newGuesses = [
      ...gameState.guesses,
      { ...guess, isCorrectArtist, isCorrectTitle },
    ];

    const maxGuessesReached = newGuesses.length >= MAX_GUESSES;
    const isCorrect = isCorrectArtist && isCorrectTitle;

    if (!isCorrect && !maxGuessesReached) {
      nextStep();
    }

    if (isCorrect) {
      setStreak((s) => s + 1);
    }

    if (!isCorrect && maxGuessesReached) {
      setStreak(0);
    }

    setGameState((prev) => ({ ...prev, guesses: newGuesses, isRevealed: isCorrect || maxGuessesReached }));
  };

  const handleSkip = () => {
    if (gameState.guesses.length >= MAX_GUESSES || gameState.isRevealed) return;
    const skipped = {
      artist: "Skip",
      title: "❌",
      isCorrectArtist: false,
      isCorrectTitle: false,
      isSkipped: true,
    };

    const newGuesses = [...gameState.guesses, skipped];
    const maxGuessesReached = newGuesses.length >= MAX_GUESSES;

    // advance a step when skipping
    setGameState((prev) => ({
      ...prev,
      guesses: newGuesses,
      step: Math.min(6, prev.step + 1),
      isRevealed: maxGuessesReached || prev.isRevealed,
    }));

    if (maxGuessesReached) {
      setStreak(0);
    }
  };

  const revealAll = () => {
    setGameState((prev) => ({ ...prev, isRevealed: true }));
  };

  const resetGame = async () => {
    setIsLoading(true);
    const hasWon = gameState.guesses.some(
      (guess) => guess.isCorrectArtist && guess.isCorrectTitle
    );
    const song = await getRandomSongLyrics();
    if (song) {
      setCurrentSong(song);
      setSubset(getLinesSubset(song.lyrics || ""));
    }
    setGameState({ step: 1, guesses: [], isRevealed: false });
    setIsLoading(false);

    if (!hasWon) {
      setStreak(0);
    }
  };

  if (isLoading || !currentSong) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p>Loading lyrics game...</p>
      </div>
    );
  }

  // Determine visible lines per step
  const showCover = gameState.step >= 5 || gameState.isRevealed;
  const showArtist = gameState.step >= 6 || gameState.isRevealed;
  const showFullTitle = gameState.isRevealed;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: song card + lyrics */}
        <div className="md:col-span-2">
          {/* Song card */}
          <div className="bg-gray-800 rounded-xl p-4 flex flex-col gap-4 glitch-card">
            {/* Top row: cover and metadata */}
            <div className="flex flex-row items-start gap-4">
              {/* Cover: on the left */}
              <div className="w-40 h-40 rounded-lg overflow-hidden flex-shrink-0 bg-black flex items-center justify-center">
                {showCover && currentSong.albumCover ? (
                  <img src={currentSong.albumCover} alt="album cover" className="w-full h-full object-cover" />
                ) : (showCover || gameState.isRevealed) && currentSong.coverUrl ? (
                  <img src={currentSong.coverUrl} alt="cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-black" />
                )}
              </div>

              {/* Title and artist: stacked on the right */}
              <div className="flex-1">
                <div>
                  {!showFullTitle && gameState.step >= 3 ? (
                    <div className="text-2xl font-bold text-white">{currentSong.title.charAt(0)}...</div>
                  ) : (
                    <div className={`text-2xl font-bold text-white transition-opacity duration-500 ${showFullTitle ? "opacity-100" : "opacity-0"}`}>
                      {currentSong.title}
                    </div>
                  )}
                </div>

                <div className={`text-base text-gray-300 mt-1 transition-opacity duration-500 ${showArtist ? "opacity-100" : "opacity-0"}`}>
                  {currentSong.artist}
                </div>
              </div>
            </div>

            {/* Lyrics box: inside card, below top row */}
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 min-h-[11rem]">
              {[subset[0], subset[1], subset[2], subset[3]].map((ln, i) => (
                <p
                  key={i}
                  className={`text-white text-lg font-medium mb-3 leading-relaxed transition-opacity duration-500 ${gameState.step >= (i === 0 ? 1 : i === 1 ? 2 : i === 2 ? 4 : 6) ? "opacity-100" : "opacity-0"}`}
                >
                  {ln || ""}
                </p>
              ))}
            </div>
          </div>

          {/* Button: outside card, below it */}
          <div className="mt-4">
            {!gameState.isRevealed && gameState.guesses.length < 5 && (
              <button
                onClick={handleSkip}
                className="mx-auto block bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-md w-40"
              >
                Siguiente pista
              </button>
            )}
          </div>
        </div>

        {/* Right column: ResultDisplay */}
        <div>
          <ResultDisplay
            guesses={gameState.guesses}
            song={gameState.isRevealed ? currentSong : null}
            hasLost={
              gameState.isRevealed &&
              !gameState.guesses.some(
                (g) =>
                  g.artist.toLowerCase() === currentSong.artist.toLowerCase() &&
                  g.title.toLowerCase() === currentSong.title.toLowerCase()
              )
            }
            streak={streak}
          />
        </div>
      </div>

      {/* Full-width guess input below both columns */}
      {!gameState.isRevealed && gameState.guesses.length < MAX_GUESSES && (
        <div className="mt-6">
          <GuessAutocompleteInput
            onSubmit={handleGuessSubmit}
            disabled={false}
            fetchSuggestions={async (query) => {
              const songs = await getSongList();

              const removeAccents = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              const normalizedQuery = query.toLowerCase();

              return songs.filter((song) => {
                return (
                  song.title.toLowerCase().includes(normalizedQuery) ||
                  song.artist.toLowerCase().includes(normalizedQuery)
                );
              });
            }}
          />
        </div>
      )}

      {/* Nuevo juego button centered below the guess input, always visible at bottom */}
      <div className="mt-4 flex justify-center">
        <button onClick={resetGame} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md">Nuevo juego</button>
      </div>
    </div>
  );
}
