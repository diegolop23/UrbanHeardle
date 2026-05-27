# Povlao Guess - Feature Implementation Summary

## ✅ Implemented Features

### 1. Statistics Dashboard
**File:** `src/components/StatisticsDashboard.jsx`

A comprehensive statistics tracking system that records:
- **Games Played** - Total number of games played
- **Win Rate** - Percentage of won games
- **Average Guesses** - Mean number of guesses needed to solve songs
- **Current/Best/Worst Streaks** - Streak tracking
- **Favorite Artists** - Most frequently encountered artists
- **Genre Breakdown** - Distribution of music genres played
- **Activity by Hour** - Heatmap showing when you play most
- **Recent Games** - Last 10 games with details

**Usage:**
- Click the "📊 Stats" button in the GameModeBar
- Keyboard shortcut: `Ctrl+S` (or `Cmd+S` on Mac)
- Press `Escape` to close

**Data Storage:** LocalStorage (client-side, persists across sessions)

---

### 2. Keyboard Shortcuts
**File:** `src/App.jsx`

Implemented keyboard shortcuts for better accessibility:
- **Ctrl/Cmd + S**: Open Statistics Dashboard
- **Escape**: Close Statistics Dashboard (when open)

**Technical Details:**
- Uses React `useEffect` hook to attach global keydown listener
- Prevents default browser behavior for Ctrl+S (normally saves page)
- Automatically cleans up event listeners on unmount

---

### 3. Song Metadata Enrichment (Database Schema)
**Files Modified:**
- `src/server/utils/generateManifest.js`
- `src/server/routes/songs.js`

**New Database Columns Added:**
```sql
ALTER TABLE songs ADD COLUMN releaseYear INTEGER;
ALTER TABLE songs ADD COLUMN genre TEXT;
ALTER TABLE songs ADD COLUMN bpm INTEGER;
```

**Enhanced Spotify Integration:**
- Now fetches `releaseYear` from Spotify API album release date
- Ready infrastructure for genre and BPM (can be extended with additional APIs)

**API Response Updates:**
All song endpoints now return enriched metadata:
- `/api/songs/list` - Includes releaseYear, genre, bpm
- `/api/songs/random` - Full metadata in song objects
- `/api/songs/random/lyrics` - Full metadata for lyrics game
- `/api/songs/` - Paginated list with all metadata

**Indexes Created:**
```sql
CREATE INDEX idx_songs_artist ON songs(artist);
CREATE INDEX idx_songs_year ON songs(releaseYear);
CREATE INDEX idx_songs_genre ON songs(genre);
```

---

### 4. Fisher-Yates Shuffle Algorithm
**File:** `src/server/routes/songs.js`

**Replaced biased shuffle:**
```javascript
// ❌ OLD (biased): 
array.sort(() => Math.random() - 0.5)

// ✅ NEW (unbiased Fisher-Yates):
function fisherYatesShuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
```

**Benefits:**
- **Truly random** - Every permutation has equal probability
- **No bias** - Old algorithm favored certain positions
- **Better user experience** - Songs don't repeat patterns
- **Industry standard** - Used in professional applications

**Applied to:**
- Main song playlist (`shuffledPlaylist`)
- Lyrics game playlist (`shuffledPlaylistLyrics`)

---

## 🎵 Mashup Madness - AI-Created Mashups Explained

### Concept
A game mode where players hear an AI-generated mashup of 2 songs and must identify **both** songs.

### How It Would Work Technically

#### Option 1: Server-Side Audio Processing (Recommended)
**Tools Required:**
- `ffmpeg` or `fluent-ffmpeg` (Node.js wrapper)
- Music separation AI (optional, for cleaner mashups)

**Implementation Steps:**
```javascript
// 1. Select two compatible songs from database
const song1 = getRandomSong();
const song2 = getRandomSong();

// 2. Extract 30-second clips using ffmpeg
await ffmpeg(song1.file)
  .setStartTime(15) // Start at 15 seconds
  .setDuration(30)  // 30 second clip
  .save('/tmp/clip1.mp3');

// 3. Mix the two clips together
await ffmpeg()
  .input('/tmp/clip1.mp3')
  .input('/tmp/clip2.mp3')
  .complexFilter([
    '[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=2'
  ])
  .save('/tmp/mashup.mp3');

// 4. Stream to frontend
res.sendFile('/tmp/mashup.mp3');
```

**Pros:**
- Full control over mixing
- No external API costs
- Can create custom transitions

**Cons:**
- Requires server CPU for processing
- Need to manage temporary files
- Latency for real-time generation

---

#### Option 2: Pre-Generated Mashups
**Approach:**
Generate mashups offline during manifest generation:

```javascript
// In generateManifest.js
async function createMashups() {
  const songs = getAllSongs();
  const mashups = [];
  
  for (let i = 0; i < 50; i++) {
    const pair = selectCompatiblePair(songs);
    const mashupFile = await generateMashup(pair.song1, pair.song2);
    mashups.push({
      file: mashupFile,
      song1: pair.song1,
      song2: pair.song2,
      difficulty: calculateDifficulty(pair)
    });
  }
  
  saveMashupsToDB(mashups);
}
```

**Pros:**
- Instant playback (no processing delay)
- Consistent quality
- Can manually curate best mashups

**Cons:**
- Storage intensive
- Less variety (finite pool)
- Needs periodic regeneration

---

#### Option 3: Third-Party AI Services
**Available Tools:**

| Service | Capability | Cost |
|---------|-----------|------|
| **Stemroller** | Separate vocals/instruments | Free tier |
| **Moises.ai** | Track separation + BPM detection | $3-13/mo |
| **Fadr** | AI remixing + mashups | Free tier |
| **AudioShake** | Professional stem separation | Enterprise |
| **Basic Pitch** (Spotify) | Note transcription | Free/Open |

**Example with Moises.ai API:**
```javascript
const moises = require('moises-api');

async function createSmartMashup(song1, song2) {
  // Upload both tracks
  const track1 = await moises.upload(song1.file);
  const track2 = await moises.upload(song2.file);
  
  // Separate into stems (vocals, drums, bass, other)
  const stems1 = await moises.separate(track1);
  const stems2 = await moises.separate(track2);
  
  // Create mashup: vocals from song1 + instrumental from song2
  const mashup = await moises.mix({
    vocals: stems1.vocals,
    instrumental: stems2.instrumental
  });
  
  return mashup.url;
}
```

**Pros:**
- Professional quality
- Smart separation (vocals vs instruments)
- Additional features (BPM sync, key detection)

**Cons:**
- API costs
- Rate limits
- Dependency on external service

---

### Recommended Implementation Path

**Phase 1: MVP (Minimum Viable Product)**
1. Use **server-side ffmpeg** for basic mixing
2. Random song pairing (same BPM range if possible)
3. Simple 50/50 volume mix
4. Store pre-generated mashups for common pairs

**Phase 2: Enhanced Quality**
1. Integrate **Moises.ai** or **Fadr** API
2. Separate vocals from instrumentation
3. Match songs by compatible keys (Camelot wheel)
4. Sync BPM automatically

**Phase 3: Advanced Features**
1. User-requested mashups
2. Difficulty levels (obvious vs subtle mixes)
3. Community voting on best mashups
4. Shareable mashup links

---

### Technical Requirements for Mashup Mode

**Dependencies to Add:**
```json
{
  "dependencies": {
    "fluent-ffmpeg": "^2.1.2",
    "music-metadata": "^8.0.0",
    "key-detection": "^1.0.0"
  }
}
```

**Server Requirements:**
- ffmpeg installed on server: `apt-get install ffmpeg`
- ~2GB RAM for processing
- Temporary storage: `/tmp/mashups/`

**Database Changes:**
```sql
CREATE TABLE mashups (
  id INTEGER PRIMARY KEY,
  file TEXT UNIQUE,
  song1_id INTEGER,
  song2_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  plays INTEGER DEFAULT 0,
  difficulty TEXT
);
```

---

## 🚀 Future Enhancement Ideas

### Quick Wins (< 1 day each)
1. **Hint System** - Show first letter after 3 wrong guesses
2. **Daily Challenge** - Same song for all users per day
3. **Share Results** - Generate image with streak/stats
4. **Sound Controls** - Playback speed, volume boost

### Medium Projects (1-3 days)
1. **Achievement System** - Badges for milestones
2. **Artist Filter** - Play only specific artists
3. **Decade Mode** - Guess songs from specific era
4. **Multiplayer** - Real-time racing with friends

### Major Features (1+ week)
1. **Mobile App** - React Native version
2. **Social Features** - Friends, challenges, leaderboards
3. **Custom Playlists** - User-created song collections
4. **AI-Powered Recommendations** - "You might like..."

---

## 📋 Testing Checklist

### Statistics Dashboard
- [ ] Play multiple games and verify stats update
- [ ] Check localStorage persistence (close/reopen browser)
- [ ] Test keyboard shortcuts (Ctrl+S, Escape)
- [ ] Verify responsive design on mobile
- [ ] Test reset functionality

### Database Metadata
- [ ] Run manifest generator: `npm run generate-manifest`
- [ ] Verify new columns exist: `sqlite3 public/manifest.db ".schema songs"`
- [ ] Check API responses include new fields
- [ ] Test with songs that have missing metadata

### Fisher-Yates Shuffle
- [ ] Play multiple games, check for repetition patterns
- [ ] Verify all songs eventually appear (large sample)
- [ ] Compare distribution before/after implementation

### Keyboard Shortcuts
- [ ] Test Ctrl+S opens stats (Windows/Linux)
- [ ] Test Cmd+S opens stats (Mac)
- [ ] Verify Escape closes modal
- [ ] Ensure no conflicts with browser shortcuts

---

## 🔧 Maintenance Notes

### Database Migration
The new columns are added non-destructively using `ALTER TABLE`. Existing databases will automatically gain the new fields on next startup.

### Backwards Compatibility
All API changes are additive - existing clients will continue to work, just receiving additional fields they can ignore.

### Performance Considerations
- Statistics stored client-side (no server load)
- Fisher-Yates is O(n) - same complexity as old shuffle
- Metadata queries use indexes for fast lookups
- Consider caching Spotify API responses (already partially implemented)

---

## 📞 Support & Documentation

For questions about implementing Mashup Madness or other features:
1. Check the code comments in relevant files
2. Review the Spotify API documentation: https://developer.spotify.com/documentation/web-api
3. FFmpeg documentation: https://ffmpeg.org/documentation.html
4. Moises.ai API: https://moises.ai/api-docs

**Happy coding! 🎵**
