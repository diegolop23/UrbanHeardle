import { useState, useEffect } from "react";

const GuessAutocompleteInput = ({ fetchSuggestions, onSubmit, disabled }) => {
  disabled = false;
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);

  useEffect(() => {
    // Clear timer on unmount
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  const handleChange = async (e) => {
    const value = e.target.value;
    setQuery(value);

    if (!value.trim()) {
      setFiltered([]);
      return;
    }

    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer for debounce
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const suggestions = await fetchSuggestions(value);
        setFiltered(suggestions.slice(0, 50));
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setFiltered([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce delay

    setDebounceTimer(timer);
  };

  const handleSelect = (song) => {
    const fullText = `${song.title} (${song.artist})`;
    setQuery(fullText);
    setFiltered([]);
    //onSubmit({ artist: song.artist, title: song.title });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Parse "Title (Artist)" format
    const match = query.match(/^(.+?)\s*\(([^)]+)\)$/);
    if (match) {
      const title = match[1].trim();
      const artist = match[2].trim();
      if (title && artist) {
        onSubmit({ artist, title });
        setQuery("");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative mb-8">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Escribe para buscar..."
          disabled={disabled}
          className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {isLoading && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-48 overflow-auto">
          {filtered.map((song) => (
            <li
              key={`${song.artist}-${song.title}`}
              className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
              onClick={() => handleSelect(song)}
            >
              <span className="font-semibold text-white">{song.title}</span>{" "}
              <span className="text-gray-400 text-sm font-normal">({song.artist})</span>
            </li>
          ))}
        </ul>
      )}

      <button
        type="submit"
        disabled={disabled || !query.trim()}
        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition disabled:opacity-50"
      >
        Adivinar
      </button>
    </form>
  );
};

export default GuessAutocompleteInput;
