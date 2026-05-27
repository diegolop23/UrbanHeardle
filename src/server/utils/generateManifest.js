import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import jsmediatags from "jsmediatags";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const songsDir = path.join(__dirname, "../../../public/songs");

const db = new Database(path.join(songsDir, "../manifest.db"));

// Create table if it doesn't exist
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    artist TEXT,
    file TEXT UNIQUE,
    coverUrl TEXT,
    popularity INTEGER,
    modified INTEGER,
    lyrics TEXT,
    albumCover TEXT,
    releaseYear INTEGER,
    genre TEXT,
    bpm INTEGER
  )
`
).run();

db.prepare("CREATE INDEX IF NOT EXISTS idx_songs_file ON songs(file)").run();
db.prepare("CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist)").run();
db.prepare("CREATE INDEX IF NOT EXISTS idx_songs_year ON songs(releaseYear)").run();
db.prepare("CREATE INDEX IF NOT EXISTS idx_songs_genre ON songs(genre)").run();

const insertOrReplace = db.prepare(`
  INSERT OR REPLACE INTO songs (title, artist, file, coverUrl, popularity, modified, lyrics, albumCover, releaseYear, genre, bpm)
  VALUES (@title, @artist, @file, @coverUrl, @popularity, @modified, @lyrics, @albumCover, @releaseYear, @genre, @bpm)
`);

// Ensure lyrics column exists (non-destructive)
const tableInfo = db.prepare("PRAGMA table_info('songs')").all();
if (!tableInfo.find((c) => c.name === "lyrics")) {
  try {
    db.prepare("ALTER TABLE songs ADD COLUMN lyrics TEXT").run();
    console.log("Added 'lyrics' column to songs table.");
  } catch (err) {
    console.error("Failed to add lyrics column:", err.message);
  }
}

// Ensure albumCover column exists (non-destructive)
if (!tableInfo.find((c) => c.name === "albumCover")) {
  try {
    db.prepare("ALTER TABLE songs ADD COLUMN albumCover TEXT").run();
    console.log("Added 'albumCover' column to songs table.");
  } catch (err) {
    console.error("Failed to add albumCover column:", err.message);
  }
}

// Ensure releaseYear column exists (non-destructive)
if (!tableInfo.find((c) => c.name === "releaseYear")) {
  try {
    db.prepare("ALTER TABLE songs ADD COLUMN releaseYear INTEGER").run();
    console.log("Added 'releaseYear' column to songs table.");
  } catch (err) {
    console.error("Failed to add releaseYear column:", err.message);
  }
}

// Ensure genre column exists (non-destructive)
if (!tableInfo.find((c) => c.name === "genre")) {
  try {
    db.prepare("ALTER TABLE songs ADD COLUMN genre TEXT").run();
    console.log("Added 'genre' column to songs table.");
  } catch (err) {
    console.error("Failed to add genre column:", err.message);
  }
}

// Ensure bpm column exists (non-destructive)
if (!tableInfo.find((c) => c.name === "bpm")) {
  try {
    db.prepare("ALTER TABLE songs ADD COLUMN bpm INTEGER").run();
    console.log("Added 'bpm' column to songs table.");
  } catch (err) {
    console.error("Failed to add bpm column:", err.message);
  }
}

// Recreate insertOrReplace to include all metadata fields
const insertOrReplaceWithLyrics = db.prepare(`
  INSERT OR REPLACE INTO songs (title, artist, file, coverUrl, popularity, modified, lyrics, albumCover, releaseYear, genre, bpm)
  VALUES (@title, @artist, @file, @coverUrl, @popularity, @modified, @lyrics, @albumCover, @releaseYear, @genre, @bpm)
`);

let cachedPlaceholder = null;
const getPlaceholderImage = () => {
  if (!cachedPlaceholder) {
    const placeholderPath = path.join(
      __dirname,
      "../../../public/assets/cover/placeholder-cover.jpg"
    );
    const placeholderImage = fs.readFileSync(placeholderPath);
    cachedPlaceholder = `data:image/jpeg;base64,${placeholderImage.toString(
      "base64"
    )}`;
  }
  return cachedPlaceholder;
};

const extractCoverImage = async (songPath) => {
  return new Promise((resolve) => {
    jsmediatags.read(songPath, {
      onSuccess: (tag) => {
        const picture = tag.tags.picture;
        if (picture) {
          const base64Image = `data:${picture.format};base64,${Buffer.from(
            picture.data
          ).toString("base64")}`;
          resolve(base64Image);
        } else {
          resolve(getPlaceholderImage());
        }
      },
      onError: () => {
        resolve(getPlaceholderImage());
      },
    });
  });
};

// Helper to get Spotify API access token (Client Credentials Flow)
async function getSpotifyAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const creds = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${creds}`,
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  return data.access_token;
}

async function getSpotifyData(artist, title, accessToken) {
  try {
    const q = encodeURIComponent(`${artist} ${title}`);
    const url = `https://api.spotify.com/v1/search?q=${q}&type=track&limit=1`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return { popularity: 0, albumCover: null, releaseYear: null };
    const data = await res.json();
    const track = data.tracks && data.tracks.items && data.tracks.items[0];
    if (!track) return { popularity: 0, albumCover: null, releaseYear: null };
    const popularity = typeof track.popularity === "number" ? Math.round(track.popularity) : 0;
    const albumCover = track.album && track.album.images && track.album.images[0] && track.album.images[0].url ? track.album.images[0].url : null;
    const releaseYear = track.album && track.album.release_date ? parseInt(track.album.release_date.substring(0, 4), 10) : null;
    return { popularity, albumCover, releaseYear };
  } catch (err) {
    return { popularity: 0, albumCover: null, releaseYear: null };
  }
}

const processFile = async (songFile, songsDirectory, existingMap, accessToken) => {
  try {
    const fullPath = path.join(songsDirectory, songFile);
    const stats = fs.statSync(fullPath);
    const modified = Math.floor(stats.mtimeMs);

      const dbEntry = existingMap.get(songFile);
        // Skip processing only if modified matches AND lyrics and albumCover already present
        if (
          dbEntry &&
          dbEntry.modified === modified &&
          dbEntry.lyrics != null &&
          dbEntry.albumCover != null
        ) {
          return;
        }

    const [artist, ...titleParts] = songFile.replace(".mp3", "").split(" - ");
    const title = titleParts.join(" - ");
    const coverUrl = await extractCoverImage(fullPath);

    // Get Spotify data (popularity + album cover + release year)
    let popularity = 0;
    let albumCover = null;
    let releaseYear = null;
    if (artist && title) {
      const spotifyData = await getSpotifyData(artist.trim(), title.trim(), accessToken);
      popularity = spotifyData.popularity || 0;
      albumCover = spotifyData.albumCover || null;
      releaseYear = spotifyData.releaseYear || null;
    }

    const song = {
      title: title.trim(),
      artist: artist.trim() || "Unknown Artist",
      file: songFile,
      coverUrl,
      popularity,
      albumCover,
      releaseYear,
      modified,
    };

    // Fetch lyrics only if DB value is null (or not present)
    let lyrics = null;
    try {
      const needsLyrics = !dbEntry || dbEntry.lyrics == null;
      if (needsLyrics && artist && title) {
        const lrclibUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(
          artist.trim()
        )}&track_name=${encodeURIComponent(title.trim())}`;
        console.log(`[lrclib] Fetching lyrics for: ${artist.trim()} - ${title.trim()}`);
        try {
          const res = await fetch(lrclibUrl);
          if (res.ok) {
            const raw = await res.text();
            let parsed = null;
            try {
              parsed = JSON.parse(raw);
            } catch (e) {
              // not JSON — log and continue
              console.error(`[lrclib] Invalid JSON for ${artist.trim()} - ${title.trim()}: ${e.message}`);
            }

            const plain = parsed && parsed.plainLyrics;
            if (plain && plain.trim()) {
              lyrics = plain;
              console.log(`[lrclib] Result: found ${plain.length} chars`);
            } else {
              console.log(`[lrclib] Result: not found`);
              // If parsed existed but plainLyrics empty, log truncated raw
              if (parsed) {
                const snippet = JSON.stringify(parsed).slice(0, 200);
                console.log(`[lrclib] Raw response (truncated): ${snippet}`);
              }
            }
            // If parsed existed but we did not set lyrics (edge case), log
            if (parsed && (!plain || !plain.trim())) {
              const snippet = JSON.stringify(parsed).slice(0, 200);
              console.log(`[lrclib] Parsed but no lyrics stored for ${artist.trim()} - ${title.trim()}: ${snippet}`);
            }
          } else {
            console.log(`[lrclib] HTTP ${res.status} for ${artist.trim()} - ${title.trim()}`);
          }
        } catch (err) {
          console.error(`[lrclib] Fetch error for ${artist.trim()} - ${title.trim()}: ${err.message}`);
        }
      } else if (dbEntry && dbEntry.lyrics != null) {
        lyrics = dbEntry.lyrics;
      }
    } catch (err) {
      console.error(`[lrclib] Unexpected error for ${artist} - ${title}: ${err.message}`);
    }

    song.lyrics = lyrics;

    // Insert or replace including all metadata fields
    insertOrReplaceWithLyrics.run(song);
  } catch (err) {
    console.error("Error processing file:", songFile, err);
  }
};

// Throttled concurrent processing
const processWithLimit = async (files, limit, songsDirectory, existingMap, accessToken) => {
  let index = 0;

  const next = async () => {
    if (index >= files.length) return;
    const current = index++;
    await processFile(files[current], songsDirectory, existingMap, accessToken);
    return next();
  };

  const workers = [];
  for (let i = 0; i < limit; i++) {
    workers.push(next());
  }

  await Promise.all(workers);
};

const generateManifest = async (songsDirectory, concurrency = 10) => {
  const allFiles = fs.readdirSync(songsDirectory);
  const songFiles = allFiles.filter(
    (file) => path.extname(file).toLowerCase() === ".mp3"
  );

  // Fetch existing DB entries (include lyrics)
  const existingEntries = db.prepare("SELECT file, modified, lyrics FROM songs").all();

  // Create map for quick access
  const existingMap = new Map(existingEntries.map((row) => [row.file, row]));

  // Identify removed files (present in DB but missing from FS)
  const currentFileSet = new Set(songFiles);
  const deletedFiles = existingEntries
    .filter((row) => !currentFileSet.has(row.file))
    .map((row) => row.file);

  // Delete them from DB
  if (deletedFiles.length > 0) {
    const deleteStmt = db.prepare("DELETE FROM songs WHERE file = ?");
    const deleteMany = db.transaction((files) => {
      for (const file of files) deleteStmt.run(file);
    });
    deleteMany(deletedFiles);
    console.log(`Removed ${deletedFiles.length} deleted song(s) from DB.`);
  }

  // Get Spotify access token once
  const accessToken = await getSpotifyAccessToken();

  // Process new or changed songs
  const newOrChangedSongs = songFiles.filter((file) => {
    const fullPath = path.join(songsDirectory, file);
    const stats = fs.statSync(fullPath);
    const modified = Math.floor(stats.mtimeMs);
    const existing = existingMap.get(file);
    // Reprocess if new, modified, OR lyrics is missing (null)
    return !existing || existing.modified !== modified || (existing && existing.lyrics == null);
  });

  console.log(
    `Found ${songFiles.length} mp3 files, ${newOrChangedSongs.length} need (re)processing...`
  );

  await processWithLimit(
    newOrChangedSongs,
    concurrency,
    songsDirectory,
    existingMap,
    accessToken
  );

  // After processing, log totals and how many songs have lyrics
  try {
    const totalSongsRow = db.prepare("SELECT COUNT(*) as cnt FROM songs").get();
    const lyricsCountRow = db.prepare("SELECT COUNT(*) as cnt FROM songs WHERE lyrics IS NOT NULL").get();
    console.log(`Manifest generation completed. Processed ${newOrChangedSongs.length} files.`);
    console.log(`Total songs in DB: ${totalSongsRow.cnt}. Songs with lyrics: ${lyricsCountRow.cnt}.`);
  } catch (err) {
    console.error("Error querying lyrics counts:", err.message);
  }

  console.log("Manifest generation completed.");
};

function init() {
  return generateManifest(songsDir); // You can pass a second arg to limit concurrency if needed
}

export default init;
