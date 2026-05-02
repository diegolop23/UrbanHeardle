import express from "express";
import cors from "cors";
import genManifest from "./utils/generateManifest.js";
import compression from "compression";
import router from "./routes/index.js";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 5240; // No 3000 or 7000

app.use(cors());
app.use(compression());
app.use(express.json());
app.use("/", router);

export function startServer() {
  // Pre-populate song caches from existing DB before manifest generation starts
  // This allows /songs endpoints to work immediately while manifest updates in background
  try {
    const dbPath = path.join(__dirname, "../../public/manifest.db");
    const db = new Database(dbPath);
    
    // Initialize all caches from existing DB
    const allSongs = db.prepare("SELECT title, artist, file, coverUrl FROM songs").all();
    const songsWithLyrics = db.prepare("SELECT title, artist, file, coverUrl, lyrics FROM songs WHERE lyrics IS NOT NULL").all();
    
    console.log(`[startup] Pre-loaded ${allSongs.length} songs from DB`);
    console.log(`[startup] Pre-loaded ${songsWithLyrics.length} songs with lyrics`);
    
    // Share these with router by setting them as global state
    global.initialCachedSongs = allSongs;
    global.initialCachedLyricsSongs = songsWithLyrics;
    
    db.close();
  } catch (err) {
    console.error("[startup] Error pre-loading song cache:", err.message);
  }

  // Start manifest generation in background (don't wait for it)
  genManifest().catch((err) => {
    console.error("Manifest generation error:", err);
  });

  app.listen(PORT, () => {
    console.log(
      `Local API server running at http://localhost:${PORT}/api/songs`
    );
  });
}
