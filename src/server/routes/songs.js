import express from "express";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "../../../public/manifest.db");
const db = new Database(dbPath);

const router = express.Router();

let cachedSongs = null;
let shuffledPlaylist = [];
let currentIndex = 0;
let recentlyPlayed = [];
let cachedLyricsSongs = null;
let shuffledPlaylistLyrics = [];
let currentIndexLyrics = 0;

router.get("/list", (req, res) => {
  try {
    if (!cachedSongs) {
      // Try to use pre-loaded cache from startup
      if (global.initialCachedSongs) {
        cachedSongs = global.initialCachedSongs;
        console.log(`[songs/list] Using pre-loaded cache: ${cachedSongs.length} songs`);
      } else {
        const sql = "SELECT title, artist, releaseYear, genre, bpm FROM songs";
        console.log(`[songs/list] Running SQL: ${sql}`);
        cachedSongs = db.prepare(sql).all();
      }
    }

    res.json({
      songs: cachedSongs.map((song) => ({
        title: song.title,
        artist: song.artist,
        releaseYear: song.releaseYear,
        genre: song.genre,
        bpm: song.bpm,
      })),
    });
  } catch (err) {
    console.error("DB Error:", err.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/random", (req, res) => {
  try {
    if (!cachedSongs) {
      // Try to use pre-loaded cache from startup
      if (global.initialCachedSongs) {
        cachedSongs = global.initialCachedSongs;
        console.log(`[songs/random] Using pre-loaded cache: ${cachedSongs.length} songs`);
      } else {
        cachedSongs = db
          .prepare("SELECT title, artist, file, coverUrl, albumCover, releaseYear, genre, bpm FROM songs")
          .all();
        console.log(`[songs/random] Cached ${cachedSongs.length} songs from DB`);
      }
      shuffledPlaylist = fisherYatesShuffle([...cachedSongs]);
    }

    if (cachedSongs.length === 0) {
      return res.status(404).json({ error: "No songs available" });
    }

    const requestedArtist = req.query.artist?.toLowerCase();

    let nextSong = null;

    if (requestedArtist) {
      // Filter songs by artist only (no shuffling in this case)
      const artistSongs = cachedSongs.filter(
        (song) => song.artist.toLowerCase() === requestedArtist
      );

      const availableArtistSongs = artistSongs.filter(
        (song) => !recentlyPlayed.includes(song.file)
      );

      if (availableArtistSongs.length === 0) {
        return res.status(404).json({
          error: `No non-recent songs available for artist: ${requestedArtist}`,
        });
      }

      nextSong =
        availableArtistSongs[
          Math.floor(Math.random() * availableArtistSongs.length)
        ];
    } else {
      // Pick next from shuffled playlist using Fisher-Yates
      while (currentIndex < shuffledPlaylist.length) {
        const candidate = shuffledPlaylist[currentIndex];
        currentIndex++;

        if (!recentlyPlayed.includes(candidate.file)) {
          nextSong = candidate;
          break;
        }
      }

      // All songs exhausted or recently played, reshuffle with Fisher-Yates
      if (!nextSong) {
        shuffledPlaylist = fisherYatesShuffle([...cachedSongs]);
        currentIndex = 0;
        nextSong = shuffledPlaylist[currentIndex++];
      }
    }

    recentlyPlayed.unshift(nextSong.file);
    if (recentlyPlayed.length > 200) {
      recentlyPlayed.pop();
    }

    console.log(`[songs/random] Selected: ${nextSong.title} by ${nextSong.artist}`);

    res.json({ song: nextSong });
  } catch (err) {
    console.error("DB Error:", err.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Random song that has lyrics (for Guess by Lyrics gamemode)
router.get("/random/lyrics", (req, res) => {
  try {
    const sql = "SELECT title, artist, file, coverUrl, albumCover, lyrics, releaseYear, genre, bpm FROM songs WHERE lyrics IS NOT NULL";
    console.log(`[songs/random/lyrics] Running SQL: ${sql}`);
    if (!cachedLyricsSongs) {
      // Try to use pre-loaded cache from startup
      if (global.initialCachedLyricsSongs) {
        cachedLyricsSongs = global.initialCachedLyricsSongs;
        console.log(`[songs/random/lyrics] cache-fill: using pre-loaded ${cachedLyricsSongs.length} rows`);
      } else {
        cachedLyricsSongs = db.prepare(sql).all();
        console.log(`[songs/random/lyrics] cache-fill: returned ${cachedLyricsSongs.length} rows from DB`);
      }
      shuffledPlaylistLyrics = fisherYatesShuffle([...cachedLyricsSongs]);

      if (cachedLyricsSongs.length === 0) {
        try {
          const total = db.prepare("SELECT COUNT(*) as cnt FROM songs").get();
          const lyricsCount = db.prepare("SELECT COUNT(*) as cnt FROM songs WHERE lyrics IS NOT NULL").get();
          console.log(`[songs/random/lyrics] Debug counts: total songs=${total.cnt}, songs_with_lyrics=${lyricsCount.cnt}`);
        } catch (err) {
          console.error("[songs/random/lyrics] Error running debug counts:", err.message);
        }
      }
    }

    if (cachedLyricsSongs.length === 0) {
      return res.status(404).json({ error: "No songs with lyrics available" });
    }

    const requestedArtist = req.query.artist?.toLowerCase();

    let nextSong = null;

    if (requestedArtist) {
      const artistSongs = cachedLyricsSongs.filter(
        (song) => song.artist.toLowerCase() === requestedArtist
      );

      const availableArtistSongs = artistSongs.filter(
        (song) => !recentlyPlayed.includes(song.file)
      );

      if (availableArtistSongs.length === 0) {
        return res.status(404).json({
          error: `No non-recent songs available for artist: ${requestedArtist}`,
        });
      }

      nextSong =
        availableArtistSongs[
          Math.floor(Math.random() * availableArtistSongs.length)
        ];
    } else {
      while (currentIndexLyrics < shuffledPlaylistLyrics.length) {
        const candidate = shuffledPlaylistLyrics[currentIndexLyrics];
        currentIndexLyrics++;

        if (!recentlyPlayed.includes(candidate.file)) {
          nextSong = candidate;
          break;
        }
      }

      if (!nextSong) {
        shuffledPlaylistLyrics = fisherYatesShuffle([...cachedLyricsSongs]);
        currentIndexLyrics = 0;
        nextSong = shuffledPlaylistLyrics[currentIndexLyrics++];
      }
    }

    recentlyPlayed.unshift(nextSong.file);
    if (recentlyPlayed.length > 200) {
      recentlyPlayed.pop();
    }

    console.log(`[songs/random/lyrics] Selected: ${nextSong.title} by ${nextSong.artist}`);

    res.json({ song: nextSong });
  } catch (err) {
    console.error("DB Error:", err.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/", (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  if (!cachedSongs) {
    try {
      cachedSongs = db
        .prepare("SELECT title, artist, file, coverUrl, albumCover, releaseYear, genre, bpm FROM songs")
        .all();
      console.log(`Cached ${cachedSongs.length} songs`);
    } catch (err) {
      console.error("DB Error:", err.message);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  const pagedSongs = cachedSongs.slice(offset, offset + limit);
  res.json({ songs: pagedSongs });
});

function getSafeFilePath(filename) {
  const a = encodeURI(filename)
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29");

  console.log("Filename: ", filename, "Encoded: ", a);
  return a;
}

// Fisher-Yates shuffle algorithm - unbiased random permutation
function fisherYatesShuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default router;
