/* ================================================================
   APP DATA
   Structure: artists[] > works[] > movements[]
   An artist's data is not here: it is read from the artist.js file in
   its assets folder, listed in artistFiles (see ARTIST AND WORK FILES),
   and becomes APP_DATA.artists = [artist, ...] once loaded.
   Likewise a work's data is read from the work.js file in its assets
   folder, listed in its artist's workFiles, and becomes
   artist.works = [work, ...] once loaded.
   A movement's lyrics are not here: they are read from the .timing.js
   file next to its audio (see LYRICS TIMING), and become
   movement.lyrics = [{ text, translation }] once loaded.
   If any line has a translation, the lyrics panel shows two columns:
   each line's original text beside its translation, highlighted together
   (see BILINGUAL LYRICS DIVIDER), unless the Original or Translation
   check box is unchecked (see LYRICS SHOWN). The work's language and
   translationLanguage tell which column is the Chinese one, which gets
   the narrower share of the width.
   Auto mode highlights by the timing in that file (or recorded in this
   browser), else by linear interpolation (approximate sync).
================================================================ */
const APP_DATA = {
  version: "1.0",
  artistFiles: [
    "assets/AsleepWiegenlied/artist.js",
    "assets/Handel/artist.js",
    "assets/HuangAnlun/artist.js",
    "assets/Mozart/artist.js",
    "assets/Verdi/artist.js"
    /* Add more artists' artist.js files here */
  ],
  artists: []  // filled from artistFiles
};

/* ================================================================
   ARTIST AND WORK FILES
   An artist.js file holds one artist (name, bio, thumbnail, workFiles, ...)
   wrapped in one onePageMp3Artist(...) call; a work.js file holds one work
   (title, description, movements, ...) wrapped in one onePageMp3Work(...)
   call. An artist's thumbnail and workFiles are named relative to its artist.js
   file (workFiles: ["Messiah/work.js"]), a work's thumbnail and a movement's audio
   and pictures relative to its work.js file (audio: "Chapter1.mp3"); only
   artistFiles are relative to index.html. So a <script> can load them when the page is opened as file://
   (fetch of local files is blocked).
================================================================ */
const ARTIST_CALLBACK = 'onePageMp3Artist';  // what an artist.js file calls
const WORK_CALLBACK   = 'onePageMp3Work';    // what a work.js file calls
const loadedData      = new Map();           // <script> element -> { callback, data } it handed over

window[ARTIST_CALLBACK] = data => loadedData.set(document.currentScript, { callback: ARTIST_CALLBACK, data });
window[WORK_CALLBACK]   = data => loadedData.set(document.currentScript, { callback: WORK_CALLBACK, data });

// Run one artist.js or work.js file, which must call `callback`.
// Resolves to the data it handed over, or null if the file is missing or broken.
function loadDataFile(url, callback) {
  return new Promise(resolve => {
    const script = document.createElement('script');
    script.src = url + (location.protocol === 'file:' ? '' : `?t=${Date.now()}`);
    script.onerror = () => {
      script.remove();
      console.warn(`Cannot load ${url}`);
      resolve(null);
    };
    script.onload = () => {
      script.remove();
      const loaded = loadedData.get(script);
      loadedData.delete(script);
      if (loaded?.callback !== callback) console.warn(`${url} did not call ${callback}(...)`);
      const data = loaded?.callback === callback ? loaded.data : null;
      if (data && callback === WORK_CALLBACK) resolveWorkPaths(data, url);
      if (data && callback === ARTIST_CALLBACK) resolveArtistPaths(data, url);
      resolve(data);
    };
    document.head.append(script);
  });
}

// The folder of a data file's URL, with its trailing slash
function dirOf(url) {
  return url.slice(0, url.lastIndexOf('/') + 1);
}

// An artist's thumbnail and workFiles are named relative to its artist.js file
function resolveArtistPaths(artist, artistUrl) {
  const dir = dirOf(artistUrl);
  artist.workFiles = (artist.workFiles ?? []).map(file => dir + file);
  if (Array.isArray(artist.thumbnail)) artist.thumbnail = artist.thumbnail.map(file => dir + file);
  else if (artist.thumbnail) artist.thumbnail = dir + artist.thumbnail;
}

// A work's files (its thumbnail, its movements' audio, thumbnail, background, background2) are named
// relative to its work.js file: make them relative to index.html, as the rest of app.js uses them.
// A background may be a list of files (see BACKGROUND)
function resolveWorkPaths(work, workUrl) {
  const dir = dirOf(workUrl);
  const resolve = (item, key) => {
    const value = item[key];
    if (Array.isArray(value)) item[key] = value.map(file => dir + file);
    else if (value) item[key] = dir + value;
  };
  resolve(work, 'thumbnail');
  (work.movements ?? []).forEach(movement => {
    ['audio', 'thumbnail', 'background', 'background2'].forEach(key => resolve(movement, key));
  });
}

// Load all files listed in urls, keeping the listed order and dropping those that fail
async function loadDataFiles(urls, callback) {
  return (await Promise.all((urls ?? []).map(url => loadDataFile(url, callback)))).filter(Boolean);
}

// Fill APP_DATA.artists from artistFiles, then each artist's works from its workFiles
async function loadArtists() {
  APP_DATA.artists = await loadDataFiles(APP_DATA.artistFiles, ARTIST_CALLBACK);
  await Promise.all(APP_DATA.artists.map(async artist => {
    artist.works = await loadDataFiles(artist.workFiles, WORK_CALLBACK);
  }));
}

/* ================================================================
   CONFIGURATION — apply URL params to CSS custom properties
   Example: index.html?above-color=%238888aa&below-bg=rgba(0,0,0,0.2)
   Lyrics highlight mode, audio mute, lyrics shown and font size are kept in the URL too
   (mute is used only by index.html; index1.html is always silent, see MUTE):
   index.html?highlight-mode=auto&mute=0&show=both&font=80&chinese-width=45&timing=collapsed&bg=image
   (see VIEW OPTIONS IN URL)
   The lyrics background's picture, dimming and blur: index.html?bg=image&bg-image=pic.jpg&bg-dim=70&bg-blur=4
   (see BACKGROUND)
   Selected movement: index.html?movement=<artist id>/<work id>/<movement id>
   (see MOVEMENT IN URL), at a position in whole seconds: &t=83 (see POSITION IN URL);
   or a selected work, index.html?work=<artist id>/<work id>, or artist, index.html?artist=<artist id>
================================================================ */
(function applyConfig() {
  const params = new URLSearchParams(window.location.search);
  const propMap = {
    'above-color': '--lyrics-above-color',
    'above-bg':    '--lyrics-above-bg',
    'below-color': '--lyrics-below-color',
    'below-bg':    '--lyrics-below-bg'
  };
  Object.entries(propMap).forEach(([param, prop]) => {
    const val = params.get(param);
    if (val) document.documentElement.style.setProperty(prop, val);
  });
})();

/* ================================================================
   STATE
================================================================ */
const state = {
  composerIdx:  null,
  workIdx:      null,  // null with an artist selected (see SELECT ARTIST)
  movementIdx:  null,  // null with a work or an artist selected (see SELECT WORK)
  isPlaying:    false,
  lastLyricIdx: -1,
  allMovements: [],  // flat list for prev/next
  lyricsShown:  { original: true, translation: true },  // see LYRICS SHOWN
  highlightMode: 'auto'  // set from the URL, see VIEW OPTIONS IN URL
};

const audio = document.getElementById('audio');

/* ================================================================
   BUILD FLAT MOVEMENT LIST  (used for Prev/Next navigation)
================================================================ */
function buildFlatList() {
  state.allMovements = [];
  APP_DATA.artists.forEach((composer, ci) => {
    composer.works.forEach((work, wi) => {
      work.movements.forEach((movement, mi) => {
        state.allMovements.push({ composerIdx: ci, workIdx: wi, movementIdx: mi,
          data: movement, composer, work });
      });
    });
  });
}

/* ================================================================
   BUILD NAVIGATION TREE
================================================================ */
// Artists, and an artist's works, in tree order (alphabetical)
function sortedArtists() {
  return [...APP_DATA.artists].sort((a, b) =>
    (a.nameSort || a.name).localeCompare(b.nameSort || b.name)
  );
}

function sortedWorks(composer) {
  return [...composer.works].sort((a, b) =>
    (a.titleSort || a.title).localeCompare(b.titleSort || b.title)
  );
}

function buildTree() {
  const tree = document.getElementById('composer-tree');
  tree.innerHTML = '';

  sortedArtists().forEach(composer => {
    const composerEl = document.createElement('div');
    composerEl.className = 'tree-composer';  // artist and work folders start collapsed

    const composerHeader = document.createElement('div');
    composerHeader.className = 'tree-composer-header';
    composerHeader.dataset.key = composer.id;
    composerHeader.innerHTML =
      `<span class="tree-toggle">&#9658;</span><span>${escHtml(composer.name)}</span>`;
    // Opening an artist selects it, unless music is playing (see SELECT ARTIST); closing it changes nothing
    composerHeader.addEventListener('click', () => {
      const opened = composerEl.classList.toggle('open');
      if (opened && !state.isPlaying) loadArtist(composer);
    });

    const worksEl = document.createElement('div');
    worksEl.className = 'tree-works';

    sortedWorks(composer).forEach(work => {
      const workEl = document.createElement('div');
      workEl.className = 'tree-work';

      const workHeader = document.createElement('div');
      workHeader.className = 'tree-work-header';
      workHeader.dataset.key = workKey(composer, work);
      workHeader.innerHTML =
        `<span class="tree-toggle">&#9658;</span><span>${escHtml(work.title)}</span>`;
      // Opening a work selects it, unless music is playing (see SELECT WORK); closing it changes nothing
      workHeader.addEventListener('click', () => {
        const opened = workEl.classList.toggle('open');
        if (opened && !state.isPlaying) loadWork(composer, work);
      });

      const movementsEl = document.createElement('div');
      movementsEl.className = 'tree-movements';

      work.movements.forEach(movement => {
        const movEl = document.createElement('div');
        movEl.className = 'tree-movement';
        movEl.dataset.key = movementKey(movement);  // movement ids are only unique within a work
        movEl.textContent = `${movement.number}. ${movement.title}`;
        movEl.addEventListener('click', () => loadMovement(composer, work, movement));
        movementsEl.appendChild(movEl);
      });

      workEl.appendChild(workHeader);
      workEl.appendChild(movementsEl);
      worksEl.appendChild(workEl);
    });

    composerEl.appendChild(composerHeader);
    composerEl.appendChild(worksEl);
    tree.appendChild(composerEl);
  });
}

// On page load: select the movement named in the URL (see MOVEMENT IN URL), at the
// position in the URL (see POSITION IN URL), else the work named in the URL, else the
// artist named in the URL, else the first movement of the first artist's first work in
// the tree (skipping any without one), opening their folders to show it
function selectInitialItem() {
  const fromUrl = movementFromUrl();
  const workEntry = fromUrl ? null : workFromUrl();
  const artist = fromUrl || workEntry ? null : artistFromUrl();
  if (workEntry) {
    loadWork(workEntry.composer, workEntry.work);
  } else if (artist) {
    loadArtist(artist);
  } else {
    const entry = fromUrl ?? firstTreeMovement();
    if (!entry) return;
    loadMovement(entry.composer, entry.work, entry.data);
    if (fromUrl) startAtTimeFromUrl();
  }
  const el = document.querySelector('.tree-movement.active, .tree-work-header.active, .tree-composer-header.active');
  el?.closest('.tree-work')?.classList.add('open');
  el?.closest('.tree-composer').classList.add('open');
}

function firstTreeMovement() {
  for (const composer of sortedArtists()) {
    for (const work of sortedWorks(composer)) {
      const movement = work.movements?.[0];
      if (movement) return movementEntry(movement);
    }
  }
  return null;
}

/* ================================================================
   MOVEMENT IN URL
   The selected movement is kept in the URL parameter movement, as
   <artist id>/<work id>/<movement id>, so reloading or sharing the link
   opens the same movement:
   index.html?movement=anlun-huang/chinese-requiem/ch2
   A selected work (see SELECT WORK) is kept in the URL parameter work
   instead, as <artist id>/<work id>:
   index.html?work=anlun-huang/chinese-requiem
   and a selected artist (see SELECT ARTIST) in the URL parameter artist,
   as <artist id>:
   index.html?artist=anlun-huang
================================================================ */
const MOVEMENT_PARAM = 'movement';
const WORK_PARAM     = 'work';
const ARTIST_PARAM   = 'artist';

// The flat-list entry of the movement named in the URL, or null
function movementFromUrl() {
  const key = new URLSearchParams(location.search).get(MOVEMENT_PARAM);
  if (!key) return null;
  const entry = state.allMovements.find(e => movementKey(e.data) === key);
  if (!entry) console.warn(`No movement "${key}" (URL parameter ${MOVEMENT_PARAM})`);
  return entry ?? null;
}

// The work named in the URL, as { composer, work }, or null
function workFromUrl() {
  const key = new URLSearchParams(location.search).get(WORK_PARAM);
  if (!key) return null;
  for (const composer of APP_DATA.artists) {
    const work = composer.works.find(w => workKey(composer, w) === key);
    if (work) return { composer, work };
  }
  console.warn(`No work "${key}" (URL parameter ${WORK_PARAM})`);
  return null;
}

// The artist named in the URL, or null
function artistFromUrl() {
  const key = new URLSearchParams(location.search).get(ARTIST_PARAM);
  if (!key) return null;
  const artist = APP_DATA.artists.find(a => a.id === key);
  if (!artist) console.warn(`No artist "${key}" (URL parameter ${ARTIST_PARAM})`);
  return artist ?? null;
}

// Rewrite the URL to name the movement; selecting another movement drops the position
// (see POSITION IN URL)
function setMovementInUrl(movement) {
  const key = movementKey(movement);
  const values = { [MOVEMENT_PARAM]: key, [WORK_PARAM]: null, [ARTIST_PARAM]: null };
  if (new URLSearchParams(location.search).get(MOVEMENT_PARAM) !== key) values[TIME_PARAM] = null;
  rewriteUrlParams(values);
}

// Rewrite the URL to name the selected work (see SELECT WORK), with no movement or position
function setWorkInUrl(composer, work) {
  rewriteUrlParams({ [WORK_PARAM]: workKey(composer, work), [ARTIST_PARAM]: null,
    [MOVEMENT_PARAM]: null, [TIME_PARAM]: null });
}

// Rewrite the URL to name the selected artist (see SELECT ARTIST), with no work, movement or position
function setArtistInUrl(composer) {
  rewriteUrlParams({ [ARTIST_PARAM]: composer.id, [WORK_PARAM]: null,
    [MOVEMENT_PARAM]: null, [TIME_PARAM]: null });
}

// Set the URL parameters (null removes one), keeping the others and adding no history
// entry
function rewriteUrlParams(values) {
  const params = new URLSearchParams(location.search);
  Object.entries(values).forEach(([name, value]) => {
    if (value == null) params.delete(name);
    else params.set(name, value);
  });
  if (params.has(TIME_PARAM)) {  // the position, which changes most often, goes last
    const time = params.get(TIME_PARAM);
    params.delete(TIME_PARAM);
    params.set(TIME_PARAM, time);
  }
  const search = params.toString().replace(/%2F/g, '/');  // keep the movement key readable
  try {
    history.replaceState(history.state, '', `?${search}${location.hash}`);
  } catch (err) {
    console.warn('Cannot rewrite the URL:', err.message);
  }
}

/* ================================================================
   POSITION IN URL
   The audio position of the selected movement is kept in the URL parameter t,
   in seconds rounded down, so reloading or sharing the link continues from there:
   index.html?movement=anlun-huang/chinese-requiem/ch2&t=83
   It is used only with the movement parameter, and dropped (as at 0) when another
   movement is selected. Browsers limit how often history.replaceState may be
   called, so it is rewritten at most once every TIME_URL_INTERVAL ms.
================================================================ */
const TIME_PARAM = 't';
const TIME_URL_INTERVAL = 1000;  // ms

const timeInUrl = {
  start:   null,  // seconds to seek to once the audio is loaded; the URL is kept until then
  written: 0,     // Date.now() of the last rewrite
  timer:   null   // pending rewrite, for a position given within the interval
};

// Seek the movement just loaded to the position in the URL, once its audio is loaded
// (see the loadedmetadata listener); a position that isn't a number above 0 is dropped
function startAtTimeFromUrl() {
  const time = Number(new URLSearchParams(location.search).get(TIME_PARAM));
  if (time > 0 && isFinite(time)) timeInUrl.start = time;
  else rewriteUrlParams({ [TIME_PARAM]: null });
}

// Write the audio position to the URL: now, or when the interval since the last
// rewrite ends (then it writes the position at that moment)
function updateTimeInUrl() {
  if (timeInUrl.start !== null || timeInUrl.timer) return;
  const wait = timeInUrl.written + TIME_URL_INTERVAL - Date.now();
  if (wait > 0) {
    timeInUrl.timer = setTimeout(() => {
      timeInUrl.timer = null;
      updateTimeInUrl();
    }, wait);
    return;
  }
  timeInUrl.written = Date.now();
  const time = Math.floor(audio.currentTime);
  rewriteUrlParams({ [TIME_PARAM]: time > 0 ? time : null });
}

/* ================================================================
   VIEW OPTIONS IN URL
   The view options are kept in URL parameters, always written in full, so
   reloading or sharing the link restores them (a missing or invalid value
   gives the default):
     highlight-mode  auto | manual                 (default auto; see LYRICS HIGHLIGHT MODE)
     mute            1 | 0                         (default 0, unmuted; ignored on a mobile device; see MUTE)
     show            original | translation | both (default both; see LYRICS SHOWN)
     font            lyrics font size in percent, 10-250 (default 80; see LYRICS FONT SIZE)
     chinese-width   the Chinese lyrics column's percent of the width, 20-80 (default 45;
                     see BILINGUAL LYRICS DIVIDER)
     songs           open | collapsed, the Songs panel with the tree (default open; see
                     setTreePanelOpen)
     timing          open | collapsed, the Lyrics Timing panel (default collapsed; see
                     setTimingPanelOpen)
     view-options    open | collapsed, the View Options panel, which only a smartphone layout can
                     collapse (default collapsed; see setViewPanelOpen)
     bg              none | graphics | image, the lyrics background (default graphics; see BACKGROUND)
     pictures        1 | 2, which version of the movements' pictures the image background shows
                     (default 1; see PICTURE VERSIONS)
   index.html?highlight-mode=manual&mute=1&show=translation&font=150&chinese-width=45&songs=open&timing=open&view-options=open&bg=image
================================================================ */
function urlParam(name) {
  return new URLSearchParams(location.search).get(name);
}

/* ================================================================
   LOAD MOVEMENT
================================================================ */
// On a mobile device (a touch screen without a mouse) or in a window as narrow as a
// phone's (the same media query as the CSS rule that hides the timing panel), the
// now-playing header has no room for the full titles: it leaves out the work titles
// and cuts each movement title (with its number) to its first 20 characters
const compactNowPlaying = matchMedia('(max-width: 700px), (pointer: coarse) and (hover: none)');
const COMPACT_TITLE_CHARS = 20;

function nowPlayingTitle(text) {
  if (!compactNowPlaying.matches) return text;
  return Array.from(text).slice(0, COMPACT_TITLE_CHARS).join('').trimEnd();  // whole characters, even outside the BMP
}

// Resizing the window across the phone width switches between the full and the compact titles
compactNowPlaying.addEventListener('change', () => {
  if (currentArtist()) updateNowPlaying(currentWork(), currentMovement());
});

// Now-playing header, following the Show check boxes (see LYRICS SHOWN): Original
// shows the work and movement titles, Translation their titleTranslations (if any)
// after them; Translation alone shows only the translations (a title without one
// shows its original). Compact (see above): the movement titles only, cut short.
// A selected work (no movement, see SELECT WORK) shows its titles in the movement's place,
// and a selected artist (no work, see SELECT ARTIST) its name
function updateNowPlaying(work, movement) {
  const { original: showOriginal, translation: showTranslation } = state.lyricsShown;
  const compact = compactNowPlaying.matches;
  if (!work) {
    document.getElementById('np-label').textContent = '';
    document.getElementById('np-title').textContent = nowPlayingTitle(currentArtist()?.name ?? '');
    document.getElementById('np-label-translation').textContent = '';
    document.getElementById('np-title-translation').textContent = '';
    document.getElementById('np-translation').hidden = true;
    return;
  }
  if (!movement) {
    document.getElementById('np-label').textContent = '';
    document.getElementById('np-title').textContent =
      nowPlayingTitle(showOriginal ? work.title : work.titleTranslation || work.title);
    document.getElementById('np-label-translation').textContent = '';
    document.getElementById('np-title-translation').textContent =
      work.titleTranslation ? nowPlayingTitle(work.titleTranslation) : '';
    document.getElementById('np-translation').hidden = !showOriginal || !showTranslation || !work.titleTranslation;
    return;
  }
  const [workTitle, movementTitle] = showOriginal
    ? [work.title, movement.title]
    : [work.titleTranslation || work.title, movement.titleTranslation || movement.title];
  document.getElementById('np-label').textContent = compact ? '' : workTitle;
  document.getElementById('np-title').textContent = nowPlayingTitle(`${movement.number}. ${movementTitle}`);
  document.getElementById('np-label-translation').textContent = compact ? '' : work.titleTranslation || '';
  document.getElementById('np-title-translation').textContent =
    movement.titleTranslation ? nowPlayingTitle(`${movement.number}. ${movement.titleTranslation}`) : '';
  document.getElementById('np-translation').hidden = !showOriginal || !showTranslation ||
    (!movement.titleTranslation && (compact || !work.titleTranslation));  // compact: nothing else to show
}

function loadMovement(composer, work, movement, autoplay = false) {
  // Update state
  const flatEntry = movementEntry(movement);
  if (flatEntry) {
    state.composerIdx  = flatEntry.composerIdx;
    state.workIdx      = flatEntry.workIdx;
    state.movementIdx  = flatEntry.movementIdx;
  }
  state.lastLyricIdx = -1;
  timeInUrl.start = null;
  setMovementInUrl(movement);

  markActiveTreeNode();
  updateNowPlaying(work, movement);
  updateBackground();  // and the picture over the lyrics (see PICTURE BEFORE PLAYBACK)
  updateInfoPane(composer, work);

  // Load audio
  audio.src = movement.audio;
  audio.load();  // stops what was playing, without a 'pause' event
  showPlaying(false);
  pickLineOnPlay = false;
  resetProgress();
  showPictureOverlay();

  // Render lyrics (none until they are loaded)
  renderLyrics(movement);
  updateNavButtons();
  updateTimingPanel();

  // Lyrics come from the timing file next to the audio, loaded on first use
  if (!movement.lyrics) {
    loadTiming(movement).then(() => {
      if (currentMovement() !== movement) return;
      renderLyrics(movement);
      updateTimingPanel();
    });
  }

  if (autoplay) {
    audio.play().catch(() => {});
  }
}

/* ================================================================
   SELECT WORK
   Opening a work in the tree selects it (unless music is playing, so
   browsing the tree never stops it): nothing is loaded to play, the
   work's thumbnail covers the lyrics area (see PICTURE BEFORE PLAYBACK)
   and the info pane shows the work. ▶, Space or a click on the picture
   plays its first movement, Next selects it, Prev the movement before
   it (see PLAYBACK CONTROLS).
================================================================ */
function loadWork(composer, work) {
  state.composerIdx  = APP_DATA.artists.indexOf(composer);
  state.workIdx      = composer.works.indexOf(work);
  state.movementIdx  = null;
  state.lastLyricIdx = -1;
  timeInUrl.start = null;
  setWorkInUrl(composer, work);

  markActiveTreeNode();
  updateNowPlaying(work, null);
  updateBackground();
  updateInfoPane(composer, work);

  audio.removeAttribute('src');
  audio.load();  // stops what was playing, without a 'pause' event
  showPlaying(false);
  pickLineOnPlay = false;
  resetProgress();
  showPictureOverlay();

  renderLyrics(null);
  updateNavButtons();
  updateTimingPanel();
}

/* ================================================================
   SELECT ARTIST
   Opening an artist in the tree selects it (unless music is playing),
   as opening a work does (see SELECT WORK): nothing is loaded to play,
   the artist's thumbnail covers the lyrics area (see PICTURE BEFORE
   PLAYBACK) and the info pane shows the artist's name and bio. ▶, Space
   or a click on the picture plays the artist's first movement, Next
   selects it, Prev the movement before it (both in data order, see
   PLAYBACK CONTROLS).
================================================================ */
function loadArtist(composer) {
  state.composerIdx  = APP_DATA.artists.indexOf(composer);
  state.workIdx      = null;
  state.movementIdx  = null;
  state.lastLyricIdx = -1;
  timeInUrl.start = null;
  setArtistInUrl(composer);

  markActiveTreeNode();
  updateNowPlaying(null, null);
  updateBackground();
  updateArtistInfoPane(composer);

  audio.removeAttribute('src');
  audio.load();  // stops what was playing, without a 'pause' event
  showPlaying(false);
  pickLineOnPlay = false;
  resetProgress();
  showPictureOverlay();

  renderLyrics(null);
  updateNavButtons();
  updateTimingPanel();
}

// Highlight the selected tree node: the movement, or the work's header when a work is selected,
// or the artist's header when an artist is selected
function markActiveTreeNode() {
  const artist = currentArtist();
  const work = currentWork();
  const movement = currentMovement();
  const movKey = movement && movementKey(movement);
  const wKey = work && !movement ? workKey(artist, work) : null;
  const aKey = artist && !work ? artist.id : null;
  document.querySelectorAll('.tree-movement').forEach(el => {
    el.classList.toggle('active', el.dataset.key === movKey);
  });
  document.querySelectorAll('.tree-work-header').forEach(el => {
    el.classList.toggle('active', el.dataset.key === wKey);
  });
  document.querySelectorAll('.tree-composer-header').forEach(el => {
    el.classList.toggle('active', el.dataset.key === aKey);
  });
}

// A selected artist (see SELECT ARTIST): its name and bio
function updateArtistInfoPane(composer) {
  document.getElementById('info-composer').textContent = composer.name;
  document.getElementById('info-work').textContent = '';
  document.getElementById('info-dates').textContent = '';
  document.getElementById('info-description').textContent = composer.bio || '';
}

function updateInfoPane(composer, work) {
  document.getElementById('info-composer').textContent = composer.name;
  document.getElementById('info-work').textContent =
    `${work.title}${work.opusNumber ? ' ' + work.opusNumber : ''}${work.year ? ' (' + work.year + ')' : ''}`;
  document.getElementById('info-dates').textContent =
    work.premiered ? `Premiere: ${work.premiered}` : '';
  document.getElementById('info-description').textContent = work.description || '';
}

/* ================================================================
   RENDER LYRICS
================================================================ */
// keepHighlight: re-rendering the same movement (the lyrics shown changed), so the
// highlighted line stays. No movement (a work or an artist is selected): a hint to pick one
function renderLyrics(movement, keepHighlight = false) {
  const inner = document.getElementById('lyrics-inner');
  inner.innerHTML = '';
  const hasTranslation = !!movement?.lyrics?.some(l => l.translation);
  const { original: showOriginal, translation: showTranslation } = state.lyricsShown;
  // Two columns only when both are checked; Translation alone shows one column of
  // translations (a line without one shows its original)
  const bilingual       = hasTranslation && showOriginal && showTranslation;
  const translationOnly = hasTranslation && !showOriginal;
  inner.classList.toggle('bilingual', bilingual);
  // The Chinese column keeps its width on either side (see BILINGUAL LYRICS DIVIDER)
  inner.classList.toggle('chinese-translation', bilingual && translationIsChinese(currentWork()));
  if (bilingual) inner.appendChild(lyricsDivider);

  const topSpacer = document.createElement('div');
  topSpacer.className = 'lyrics-spacer';
  inner.appendChild(topSpacer);

  if (!movement) {
    const msg = document.createElement('p');
    msg.className = 'no-song-msg';
    msg.textContent = currentWork()
      ? 'Select a movement, or press ▶ to play the work from its first movement.'
      : 'Select a work or a movement, or press ▶ to play from the first movement.';
    inner.appendChild(msg);
  } else if (!movement.lyrics) {
    // Still loading (see loadMovement)
  } else if (movement.lyrics.length === 0) {
    const msg = document.createElement('p');
    msg.className = 'no-song-msg';
    msg.textContent = 'No lyrics available for this movement.';
    inner.appendChild(msg);
  } else {
    // Movement heading (bilingual: the translated heading heads the translation column)
    const meta = document.createElement('div');
    meta.className = 'lyric-meta';
    const heading = translationOnly
      ? movementHeading(movement.number, movement.titleTranslation || movement.title,
          movement.subtitleTranslation || movement.subtitle, movement.voicingTranslation || movement.voicing)
      : movementHeading(movement.number, movement.title, movement.subtitle, movement.voicing);
    if (bilingual) {
      const original    = document.createElement('span');
      const translation = document.createElement('span');
      original.className    = 'lyric-original';
      translation.className = 'lyric-translation';
      original.textContent    = heading;
      translation.textContent = movementHeading(movement.number, movement.titleTranslation,
        movement.subtitleTranslation, movement.voicingTranslation);
      meta.append(original, translation);
    } else {
      meta.textContent = heading;
    }
    meta.style.whiteSpace = 'pre-line';
    inner.appendChild(meta);

    // Lyric lines (bilingual: one row of two cells, so both are highlighted together)
    movement.lyrics.forEach((lyric, idx) => {
      const el = document.createElement('div');
      el.className = 'lyric-line';
      el.dataset.index = idx;
      if (bilingual) {
        const original    = document.createElement('span');
        const translation = document.createElement('span');
        original.className    = 'lyric-original';
        translation.className = 'lyric-translation';
        original.textContent    = lyric.text;
        translation.textContent = lyric.translation;
        el.append(original, translation);
      } else {
        el.textContent = translationOnly ? lyric.translation || lyric.text : lyric.text;
      }
      // Clicking seeks to where the line starts (see lyricLineStartTime); in manual mode it
      // also jumps the highlight to this line. While recording it doesn't seek: the click
      // records the line's time from where the audio is.
      el.addEventListener('click', () => {
        if (state.highlightMode === 'manual') selectLyricLine(idx);
        if (timing.recording) return;
        const time = lyricLineStartTime(movement, idx);
        if (time != null) audio.currentTime = time;
      });
      inner.appendChild(el);
    });
  }

  const bottomSpacer = document.createElement('div');
  bottomSpacer.className = 'lyrics-spacer';
  inner.appendChild(bottomSpacer);

  // Manual mode starts with no line highlighted; the first key press highlights line 0
  const idx = keepHighlight                   ? state.lastLyricIdx
            : state.highlightMode === 'manual' ? -1 : getCurrentLyricIdx();
  highlightLyricLine(idx, true);
}

// "number. title [subtitle]", then voicing on a second line; missing parts are left out
function movementHeading(number, title, subtitle, voicing) {
  const firstLine = [title && `${number}. ${title}`, subtitle && `[${subtitle}]`].filter(Boolean).join(' ');
  return [firstLine, voicing].filter(Boolean).join('\n');
}

/* ================================================================
   HIGHLIGHT LYRIC LINE   (idx -1 = nothing highlighted yet)
================================================================ */
function highlightLyricLine(idx, force = false) {
  if (idx === state.lastLyricIdx && !force) return;
  state.lastLyricIdx = idx;

  const lines = document.querySelectorAll('.lyric-line');
  lines.forEach((el, i) => {
    el.classList.remove('before', 'current', 'after', 'distant');
    const diff = i - idx;
    if (diff === 0)        el.classList.add('current');
    else if (diff < 0)     el.classList.add(Math.abs(diff) <= 4 ? 'before' : 'distant');
    else                   el.classList.add(diff <= 4 ? 'after' : 'distant');
  });

  updateSelectedLineTime();
  centerCurrentLine();
}

// Scroll the current line to vertical center of container (top if none); smooth, or at once
// (behavior 'instant': 'auto' would follow the CSS scroll-behavior, smooth)
function centerCurrentLine(smooth = true) {
  const currentEl = document.querySelector('.lyric-line.current');
  const container = document.getElementById('lyrics-container');
  const behavior  = smooth ? 'smooth' : 'instant';
  if (currentEl && container) {
    const cRect = container.getBoundingClientRect();
    const eRect = currentEl.getBoundingClientRect();
    const desired = container.scrollTop + (eRect.top - cRect.top)
                    - cRect.height / 2 + eRect.height / 2;
    container.scrollTo({ top: desired, behavior });
  } else if (container) {
    container.scrollTo({ top: 0, behavior });
  }
}

/* ================================================================
   KEEP THE CURRENT LINE CENTERED
   The lyrics are centered when the highlight moves, but the layout can change
   between lines, more often on a phone, where the panels above the lyrics
   share their column: opening or closing the Songs tree or View Options,
   turning the phone, A+ / A-, Max, dragging the bilingual divider. Each moves
   the current line, even out of sight, until the next line. So whenever the
   lyrics panel or its content changes size, it is centered again, at once (a
   smooth scroll would lag behind, e.g. frame by frame through the font-size
   transition); at most once a frame. Also when the page is shown again (the
   phone unlocked, or back from another app or tab): scrolling may not have
   run while it was hidden.
================================================================ */
(() => {
  let frame = 0;
  const recenter = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => { frame = 0; centerCurrentLine(false); });
  };
  const observer = new ResizeObserver(recenter);
  observer.observe(document.getElementById('lyrics-container'));
  observer.observe(document.getElementById('lyrics-inner'));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) recenter(); });
})();

/* ================================================================
   LYRICS HIGHLIGHT MODE
   auto:   current line follows audio time (timestamps or interpolation)
   manual: operator moves the highlight with the keyboard (see KEYBOARD
           SHORTCUTS) or by clicking a line (which also seeks there, unless
           recording); audio time doesn't move the highlight
================================================================ */
function setHighlightMode(mode) {
  state.highlightMode = mode;
  rewriteUrlParams({ 'highlight-mode': mode });
  document.querySelectorAll('#mode-toggle .ctrl-btn').forEach(btn => {
    const on = btn.dataset.mode === mode;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', on);
  });
  document.getElementById('manual-hint').hidden = mode !== 'manual';
  document.getElementById('lyrics-container').dataset.mode = mode;  // swipes only in manual (see SWIPE)

  // Recording captures manual selections only
  if (mode !== 'manual' && timing.recording) setRecording(false);

  // Back to auto: resync the highlight to the audio position
  if (mode === 'auto' && state.composerIdx !== null) {
    highlightLyricLine(getCurrentLyricIdx());
  }
}

function stepLyricLine(delta) {
  const movement = currentMovement();
  if (!movement || !movement.lyrics || movement.lyrics.length === 0) return;
  const idx = Math.max(-1, Math.min(movement.lyrics.length - 1, state.lastLyricIdx + delta));
  selectLyricLine(idx);
  // Lyrics may be driven without audio (e.g. live singing) — don't leave them hidden
  pictureOverlay.classList.add('hidden');
}

// Operator moved the highlight (key or click) in manual mode
function selectLyricLine(idx) {
  const prevIdx = state.lastLyricIdx;
  highlightLyricLine(idx);
  recordLineTime(idx, prevIdx);
}

/* ================================================================
   SWIPE
   Touch screens have no arrow keys, so in manual mode a swipe on the lyrics
   steps the highlight like them: up or left = next line (↓ →), down or
   right = previous (↑ ←). A tap on a line still selects it. The lyrics
   do not scroll by touch in manual mode (touch-action: none in
   common.css); the highlighted line is kept centered anyway.
================================================================ */
const SWIPE_MIN = 40;  // px
(() => {
  const container = document.getElementById('lyrics-container');
  let start = null;
  container.addEventListener('pointerdown', e => {
    start = e.pointerType === 'touch' && e.isPrimary && !e.target.closest('.lyrics-divider')
      ? { x: e.clientX, y: e.clientY } : null;
  });
  container.addEventListener('pointercancel', () => { start = null; });
  container.addEventListener('pointerup', e => {
    if (!start || state.highlightMode !== 'manual') { start = null; return; }
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    start = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_MIN) return;  // a tap
    const delta = Math.abs(dy) >= Math.abs(dx) ? (dy < 0 ? 1 : -1) : (dx < 0 ? 1 : -1);
    stepLyricLine(delta);
  });
})();

document.querySelectorAll('#mode-toggle .ctrl-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    setHighlightMode(btn.dataset.mode);
    btn.blur();  // so Space doesn't re-activate the button
  });
});

/* ================================================================
   MAXIMIZE LYRICS PANEL
   Max (last in the playback controls) hides the left nav pane,
   the playback controls (including Max), the song navigation buttons and
   the info pane; lyrics font grows (CSS). The top bar shows its own play /
   pause, Sync and restore buttons. Esc restores. Space / arrow keys still
   control playback.
================================================================ */
function setLyricsMaximized(on) {
  const app = document.getElementById('app');
  if (app.classList.contains('lyrics-maximized') === on) return;
  app.classList.toggle('lyrics-maximized', on);
  // Also full screen at browser window level (not available everywhere, e.g. iPhone Safari)
  try {
    if (on && !document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (!on && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  } catch (_) { /* ignore */ }
  // The lyrics panel and font size change: the current line is re-centered (see KEEP THE CURRENT LINE CENTERED)
}

// The browser's own Esc (or F11-style exit) leaves full screen: leave maximized too
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) setLyricsMaximized(false);
});

document.getElementById('btn-maximize').addEventListener('click', e => {
  e.currentTarget.blur();
  setLyricsMaximized(true);
});

document.getElementById('btn-restore').addEventListener('click', e => {
  e.currentTarget.blur();
  setLyricsMaximized(false);
});

/* ================================================================
   LYRICS SHOWN
   The Original / Translation check boxes: both checked shows the two
   columns (for a movement with a translation), Original alone the
   original lyrics, Translation alone the translations (a line without
   one shows its original). The top bar's titles follow them too (see
   updateNowPlaying). At least one stays checked: the last checked box
   is disabled. Kept in the URL parameter show (see VIEW OPTIONS IN URL).
================================================================ */
const lyricsShownBoxes = [...document.querySelectorAll('#lyrics-shown input')];

// Sync state, the disabled flags and the URL with the check boxes
function syncLyricsShown() {
  lyricsShownBoxes.forEach(b => { state.lyricsShown[b.value] = b.checked; });
  const checked = lyricsShownBoxes.filter(b => b.checked);
  lyricsShownBoxes.forEach(b => { b.disabled = checked.length === 1 && b.checked; });
  rewriteUrlParams({ show: checked.length === 1 ? checked[0].value : 'both' });
}

{
  const show = urlParam('show');
  lyricsShownBoxes.forEach(b => { b.checked = show !== 'original' && show !== 'translation' || b.value === show; });
  syncLyricsShown();
}

lyricsShownBoxes.forEach(box => {
  box.addEventListener('change', () => {
    syncLyricsShown();
    box.blur();  // so Space / arrow keys keep controlling playback and lyrics

    if (currentArtist()) {
      renderLyrics(currentMovement(), true);
      updateNowPlaying(currentWork(), currentMovement());
    }
  });
});

/* ================================================================
   MUTE
   The Mute check box silences the audio without stopping it: playback
   goes on, so the lyrics, the progress bar and timing recording follow
   it as usual. The audio is unmuted by default: check the box to silence it.
   The box's state stays from one movement to the next. Kept in the URL
   parameter mute (see VIEW OPTIONS IN URL).

   index1.html (the silent page) ships the box checked and disabled (and
   hidden): the audio is then always silent, the URL parameter mute is ignored
   and not written, and the user cannot unmute. index.html (the default page)
   has the usual, visible, unchecked box, except on a mobile device (a touch
   screen without a mouse), where the CSS hides it (the device's volume buttons
   do that job): the audio is then never muted, whatever the URL parameter mute
   says, so a link with mute=1 shared from a computer isn't silent on a phone.

   The silent page (index1.html) does NOT set audio.muted: on mobile browsers (iOS Safari
   in particular) an element that is muted from the start gets no audio
   output to keep time with, and its currentTime races to the end of the
   movement as soon as ▶ is pressed. Instead the element plays normally,
   into a Web Audio gain node set to 0, which keeps a real audio output
   (and so a real clock) running while nothing is heard. Browsers keep an
   AudioContext suspended until a user gesture, so it is resumed on the
   first gesture (and again after an interruption, e.g. a phone call).
   Without Web Audio the page falls back to audio.muted.
================================================================ */
const muteBox = document.getElementById('chk-mute');
const muteLocked = muteBox.disabled;

// Make the audio silent without muting the element; false if Web Audio is not available
function silenceAudioViaWebAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return false;
  try {
    const context = new AudioContextClass();
    const gain = context.createGain();
    gain.gain.value = 0;
    context.createMediaElementSource(audio).connect(gain);
    gain.connect(context.destination);

    const resume = () => { if (context.state !== 'running') context.resume().catch(() => {}); };
    ['pointerdown', 'touchend', 'click', 'keydown'].forEach(type =>
      document.addEventListener(type, resume, { capture: true, passive: true }));
    document.addEventListener('visibilitychange', () => { if (!document.hidden) resume(); });
    audio.addEventListener('play', resume);
    return true;
  } catch (err) {
    console.warn('Cannot silence the audio with Web Audio, muting it instead:', err);
    return false;
  }
}

// The same media query as the CSS rule that hides the Mute box on a mobile device
const muteBoxHidden = matchMedia('(pointer: coarse) and (hover: none)').matches;
audio.muted = muteLocked ? !silenceAudioViaWebAudio() : !muteBoxHidden && urlParam('mute') === '1';
muteBox.checked = muteLocked || audio.muted;  // also overrides a box state a reload brings back (Firefox)
if (!muteLocked) rewriteUrlParams({ mute: audio.muted ? 1 : 0 });

muteBox.addEventListener('change', () => {
  if (muteLocked) return;
  audio.muted = muteBox.checked;
  rewriteUrlParams({ mute: audio.muted ? 1 : 0 });
  muteBox.blur();  // so Space / arrow keys keep controlling playback and lyrics
});

/* ================================================================
   LYRICS FONT SIZE
   A+ / A- scale the lyrics (--lyrics-font-scale, 10%-250%, steps of 10%);
   default 80%, which clicking the percentage restores. Kept in the URL parameter font (see
   VIEW OPTIONS IN URL).
================================================================ */
(function () {
  const DEFAULT_PCT = 80;
  let pct = DEFAULT_PCT;
  const label = document.getElementById('font-size-value');
  function apply(v) {
    pct = Math.max(10, Math.min(250, v));
    document.documentElement.style.setProperty('--lyrics-font-scale', pct / 100);
    label.textContent = pct + '%';
    rewriteUrlParams({ font: pct });
  }
  [['btn-font-down', -10], ['btn-font-up', 10]].forEach(([id, d]) => {
    const b = document.getElementById(id);
    b.addEventListener('click', () => { apply(pct + d); b.blur(); });
  });
  label.addEventListener('click', () => apply(DEFAULT_PCT));
  const fromUrl = Number(urlParam('font'));
  apply(urlParam('font') && isFinite(fromUrl) ? Math.round(fromUrl) : DEFAULT_PCT);
})();

/* ================================================================
   BACKGROUND
   What is behind the lyrics panel, picked with the Background buttons:
     none      the plain page color
     graphics  soft colored lights that drift slowly while the music
               plays; their hue comes from the movement, so each
               movement has its own colors
     image     a picture: the one in the URL parameter bg-image (named
               relative to index.html, the same for every movement), else
               the movement's background in work.js (or its background2,
               see PICTURE VERSIONS), else its thumbnail, else its work's.
               A movement without one, or whose pictures can't be loaded,
               gets the graphics instead. A selected work or artist (see
               SELECT WORK, SELECT ARTIST) has none: its thumbnail is shown
               over the lyrics area instead (see PICTURE BEFORE PLAYBACK).
   A background (or background2) may be a list of files: they are tried
   in order until one loads. So a work can name first a picture kept only
   on this computer (in a git-ignored local/ folder: e.g. a copyrighted
   one, never published) and then the published one, which a server
   without the local file shows instead.

   PICTURE VERSIONS
   A movement may have a second set of pictures: background2 beside
   background in work.js. The Image set buttons (1 | 2, shown in Image
   mode for a movement that has a background2; their tooltips come from
   the work's pictureVersions) pick which set Image mode shows. The choice
   applies to every movement that has a background2 and is kept in the URL
   parameter pictures (see VIEW OPTIONS IN URL).
   The page color covers the background at bg-dim percent (0-95, default
   70) and the picture is blurred by bg-blur px (0-40, default 4), so the
   lyrics stay easy to read; both come from the URL only (see common.css
   for the defaults, --bg-dim and --bg-blur). Graphics is the default; the
   choice is kept in the URL parameter bg (see VIEW OPTIONS IN URL).
================================================================ */
const BACKGROUNDS     = ['none', 'graphics', 'image'];
const songDisplay     = document.getElementById('song-display');
const lyricsBg        = document.getElementById('lyrics-bg');
const lyricsBgImage   = lyricsBg.querySelector('.bg-image');
const backgroundBtns  = [...document.querySelectorAll('#background-toggle .ctrl-btn')];
const picturesRow     = document.getElementById('pictures-toggle');
const picturesBtns    = [...picturesRow.querySelectorAll('.ctrl-btn')];
const PICTURE_VERSIONS = ['1', '2'];
let pictureVersion    = '1';
let bgCandidates      = [];  // pictures still to try after the one loading or shown (see showNextBackground)

function setBackground(kind) {
  songDisplay.dataset.bg = kind;
  rewriteUrlParams({ bg: kind });
  backgroundBtns.forEach(btn => {
    const on = btn.dataset.bg === kind;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', on);
  });
  updateBackground();
}

function setPictureVersion(version) {
  pictureVersion = version;
  rewriteUrlParams({ pictures: version });
  picturesBtns.forEach(btn => {
    const on = btn.dataset.pictures === version;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', on);
  });
  updateBackground();
}

// A picture field of work.js (one file, a list of them, or none) as a list
function pictureList(value) {
  return [value ?? []].flat();
}

// A movement's own pictures, in the order to try them: its background (after its background2 in image
// set 2, see PICTURE VERSIONS), then its thumbnail, else its work's thumbnail
function movementPictures(movement, work) {
  const version2 = pictureVersion === '2' ? pictureList(movement.background2) : [];
  return [...version2, ...pictureList(movement.background), ...pictureList(movement.thumbnail ?? work?.thumbnail)];
}

// A work's thumbnail: its own, else its first movement's (a work whose movements have pictures of their own)
function workThumbnail(work) {
  return pictureList(work?.thumbnail ?? work?.movements?.[0]?.thumbnail);
}

// An artist's thumbnail (see SELECT ARTIST): its own, else its first work's
function artistThumbnail(artist) {
  return artist?.thumbnail ? pictureList(artist.thumbnail) : workThumbnail(artist?.works?.[0]);
}

// The pictures Image mode tries for the selected movement, in order (see BACKGROUND and PICTURE
// VERSIONS); none for a selected work or artist
function backgroundCandidates(movement, work) {
  if (!movement) return [];
  if (urlParam('bg-image')) return [urlParam('bg-image')];
  return movementPictures(movement, work);
}

// Fit the background to the current movement: the graphics' hue, the Image set buttons, and in image
// mode its picture; and the picture over the lyrics before playback (see PICTURE BEFORE PLAYBACK).
// The same pictures as before are kept as they are, without a flash.
function updateBackground() {
  const movement = currentMovement();
  updateOverlayPicture();
  songDisplay.style.setProperty('--bg-hue', movement ? backgroundHue(movementKey(movement)) : 220);
  picturesRow.hidden = songDisplay.dataset.bg !== 'image' || !movement?.background2;
  const names = currentWork()?.pictureVersions ?? [];
  picturesBtns.forEach((btn, i) => { btn.title = names[i] || `Image set ${i + 1}`; });
  if (songDisplay.dataset.bg === 'image') updateBackgroundImage(movement);
  updatePictureCaption();
}

// Image mode: show the movement's picture, unless it is the one already shown or loading
function updateBackgroundImage(movement) {
  const candidates = backgroundCandidates(movement, currentWork());
  if (candidates.join('\n') === lyricsBg.dataset.candidates) return;
  lyricsBg.dataset.candidates = candidates.join('\n');
  bgCandidates = candidates;
  showNextBackground();
}

// Show the next picture to try, or none (the graphics) when none is left
function showNextBackground() {
  const src = bgCandidates.shift();
  if (!src) {
    lyricsBgImage.removeAttribute('src');
    lyricsBg.classList.remove('has-image');
  } else if (src === lyricsBgImage.getAttribute('src') && lyricsBgImage.complete && lyricsBgImage.naturalWidth) {
    lyricsBg.classList.add('has-image');  // already loaded: no new load event comes
  } else {
    lyricsBg.classList.remove('has-image');  // the graphics until it has loaded
    lyricsBgImage.src = src;
  }
}

lyricsBgImage.addEventListener('load', () => {
  lyricsBg.classList.add('has-image');
  updatePictureCaption();
});
lyricsBgImage.addEventListener('error', () => {
  if (!lyricsBgImage.getAttribute('src')) return;
  if (!bgCandidates.length) console.warn('Cannot load the background picture:', lyricsBgImage.getAttribute('src'));
  showNextBackground();  // e.g. a local/ picture that is not on this server: the published one
  updatePictureCaption();
});

/* ================================================================
   PICTURE BEFORE PLAYBACK
   Until playback starts, the thumbnail overlay covers the lyrics area
   with the selection's picture (a click on it plays): a selected artist's
   thumbnail (see SELECT ARTIST), a selected work's thumbnail (see SELECT
   WORK), or a selected movement's background (of
   the image set picked, see PICTURE VERSIONS), else its thumbnail, else
   its work's. Like the background, a picture that can't be loaded gives
   way to the next. Without any picture there is no overlay. In Image
   background mode a movement's background picture fills the area
   instead, sharp (see BACKGROUND and common.css).
================================================================ */
const pictureOverlay    = document.getElementById('thumbnail-overlay');
const pictureOverlayImg = document.getElementById('thumbnail-img');
let overlayCandidates   = [];  // pictures still to try after the one loading or shown

// The pictures the overlay tries for the selection, in order
function overlayPictures() {
  const work = currentWork();
  const movement = currentMovement();
  return movement ? movementPictures(movement, work)
       : work     ? workThumbnail(work)
       :            artistThumbnail(currentArtist());
}

// Show the selection's picture in the overlay (without showing the overlay: see showPictureOverlay)
function updateOverlayPicture() {
  const candidates = overlayPictures();
  if (candidates.join('\n') === pictureOverlayImg.dataset.candidates) return;
  pictureOverlayImg.dataset.candidates = candidates.join('\n');
  pictureOverlayImg.alt = currentMovement()?.title ?? currentWork()?.title ?? currentArtist()?.name ?? '';
  overlayCandidates = candidates;
  showNextOverlayPicture();
}

function showNextOverlayPicture() {
  const src = overlayCandidates.shift();
  if (src) pictureOverlayImg.src = src;
  else pictureOverlayImg.removeAttribute('src');
}

pictureOverlayImg.addEventListener('load', updatePictureCaption);
pictureOverlayImg.addEventListener('error', () => {
  if (!pictureOverlayImg.getAttribute('src')) return;
  if (!overlayCandidates.length) console.warn('Cannot load the picture:', pictureOverlayImg.getAttribute('src'));
  showNextOverlayPicture();
  updatePictureCaption();
});

// A new selection: the overlay covers the lyrics until playback starts, if there is a picture
function showPictureOverlay() {
  pictureOverlay.classList.toggle('hidden', overlayPictures().length === 0);
}

/* ================================================================
   PICTURE CAPTION
   While the selection's picture is shown before playback (in the overlay,
   or filling the area in Image mode), a caption below it (in Image mode
   over it, at the bottom) names it: its title, then "by" its painter (or
   maker), from work.js or artist.js — backgroundTitle and
   backgroundPainter for a movement's
   background, background2Title and background2Painter for its background2
   (see PICTURE VERSIONS), and thumbnailTitle and thumbnailPainter for a
   movement's, work's or artist's thumbnail (a work's thumbnail keeps its
   caption when a movement without a picture of its own shows it). The
   bg-image URL parameter's picture, or a picture without a title, has no
   caption. It goes with the overlay when the music starts.
================================================================ */
const pictureCaption = document.getElementById('picture-caption');

// The title and painter of a picture of the selection, or null: the selected movement's pictures,
// then its work's thumbnail, then its artist's
function pictureCaptionFor(src) {
  if (!src) return null;
  const pictures = [
    [currentMovement(), ['background2', 'background', 'thumbnail']],
    [currentWork(),     ['thumbnail']],
    [currentArtist(),   ['thumbnail']]
  ];
  for (const [item, keys] of pictures) {
    for (const key of keys) {
      if (item?.[`${key}Title`] && pictureList(item[key]).includes(src)) {
        return { title: item[`${key}Title`], painter: item[`${key}Painter`] };
      }
    }
  }
  return null;
}

// The picture shown before playback: Image mode's once it has loaded, else the overlay's once it has
function shownPicture() {
  if (songDisplay.dataset.bg === 'image' && lyricsBg.classList.contains('has-image')) {
    return lyricsBgImage.getAttribute('src');
  }
  const img = pictureOverlayImg;
  return img.complete && img.naturalWidth ? img.getAttribute('src') : null;
}

function updatePictureCaption() {
  const caption = pictureCaptionFor(shownPicture());
  pictureCaption.hidden = !caption;
  pictureCaption.replaceChildren();
  if (!caption) return;
  const title = document.createElement('cite');
  title.textContent = caption.title;
  pictureCaption.append(title);
  if (caption.painter) pictureCaption.append(` by ${caption.painter}`);
}

// A hue from 190 (cyan) through blue and violet to 330 (magenta), picked by the movement key,
// so neighboring movements get unrelated colors and the gold highlight stays apart from them
function backgroundHue(key) {
  let h = 0;
  for (const ch of key) h = Math.imul(h, 31) + ch.codePointAt(0) | 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);  // mix the bits (MurmurHash3's finalizer)
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return 190 + ((h ^ (h >>> 16)) >>> 0) % 141;
}

// bg-dim and bg-blur, from the URL only; a missing or invalid value keeps common.css's default
{
  const number = name => (urlParam(name) && isFinite(Number(urlParam(name)))) ? Number(urlParam(name)) : null;
  const dim  = number('bg-dim');
  const blur = number('bg-blur');
  if (dim  !== null) document.documentElement.style.setProperty('--bg-dim', Math.min(95, Math.max(0, dim)) / 100);
  if (blur !== null) document.documentElement.style.setProperty('--bg-blur', `${Math.min(40, Math.max(0, blur))}px`);
}

backgroundBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    setBackground(btn.dataset.bg);
    btn.blur();  // so Space doesn't re-activate the button
  });
});

picturesBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    setPictureVersion(btn.dataset.pictures);
    btn.blur();  // so Space doesn't re-activate the button
  });
});

setPictureVersion(PICTURE_VERSIONS.includes(urlParam('pictures')) ? urlParam('pictures') : '1');
setBackground(BACKGROUNDS.includes(urlParam('bg')) ? urlParam('bg') : 'graphics');

/* ================================================================
   BILINGUAL LYRICS DIVIDER
   The width belongs to the Chinese column, on whichever side it is: the
   original (left) column when the work's language is Chinese, the
   translation (right) column when its translationLanguage is. With no
   Chinese column it is the original's.
   Drag the line between the original and translation columns to set
   that column's share of the width (DIVIDER_MIN–DIVIDER_MAX percent);
   double-click it to go back to the default (45%, DEFAULT_CHINESE_WIDTH;
   keep --lyrics-chinese-width in common.css the same). The width is kept in
   the URL parameter chinese-width (see VIEW OPTIONS IN URL).
================================================================ */
const DIVIDER_MIN = 20;
const DIVIDER_MAX = 80;
const DEFAULT_CHINESE_WIDTH = 45;  // percent; the other column gets the rest

// True when the Chinese lyrics are the work's translations (the right column): its
// translationLanguage is Chinese ("zh", "zh-Hant", ...) and its language is not
function translationIsChinese(work) {
  const isChinese = language => /^zh\b/i.test(language ?? '');
  return isChinese(work?.translationLanguage) && !isChinese(work?.language);
}

// pct: the Chinese column's percent of the lyrics width, or null for the default;
// written to the URL
function setChineseWidth(pct) {
  if (pct === null) pct = DEFAULT_CHINESE_WIDTH;
  document.documentElement.style.setProperty('--lyrics-chinese-width', `${pct}%`);
  rewriteUrlParams({ 'chinese-width': pct });
}

{
  const fromUrl = Number(urlParam('chinese-width'));
  const valid = urlParam('chinese-width') && isFinite(fromUrl);
  setChineseWidth(valid ? Math.round(Math.min(DIVIDER_MAX, Math.max(DIVIDER_MIN, fromUrl)) * 10) / 10 : null);
}

// One divider, put back into #lyrics-inner by renderLyrics for bilingual lyrics
const lyricsDivider = (() => {
  const divider = document.createElement('div');
  divider.className = 'lyrics-divider';
  divider.setAttribute('role', 'separator');
  divider.setAttribute('aria-orientation', 'vertical');
  divider.title = 'Drag to resize the columns; double-click to reset';

  divider.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    e.preventDefault();  // no text selection while dragging
    divider.setPointerCapture(e.pointerId);
    divider.classList.add('dragging');
  });
  divider.addEventListener('pointermove', e => {
    if (!divider.hasPointerCapture(e.pointerId)) return;
    const inner = divider.parentElement;
    const rect  = inner.getBoundingClientRect();
    // The pointer is at the left column's right edge; the Chinese column may be the right one
    const left  = Math.min(DIVIDER_MAX, Math.max(DIVIDER_MIN, (e.clientX - rect.left) / rect.width * 100));
    const pct   = inner.classList.contains('chinese-translation') ? 100 - left : left;
    setChineseWidth(Math.round(pct * 10) / 10);
  });
  // Drag ended (pointer released or cancelled). While dragging, the lines re-wrap and the current
  // one is kept centered (see KEEP THE CURRENT LINE CENTERED)
  divider.addEventListener('lostpointercapture', () => divider.classList.remove('dragging'));
  divider.addEventListener('dblclick', () => setChineseWidth(null));
  return divider;
})();

/* ================================================================
   COMPUTE CURRENT LYRIC INDEX from audio time
================================================================ */
function getCurrentLyricIdx() {
  const movement = currentMovement();
  if (!movement || !movement.lyrics || movement.lyrics.length === 0) return 0;

  const lyrics   = movement.lyrics;
  const duration = isFinite(audio.duration) ? audio.duration : 1;
  const t        = audio.currentTime;

  // Timed lyrics: the line that started most recently (-1 before the first line).
  // Untimed lines are skipped; a partial re-recording may leave times out of order.
  const times = lyricTimes(movement);
  if (times) {
    let idx = -1, start = -Infinity;
    times.forEach((time, i) => {
      if (time !== null && time <= t && time >= start) { idx = i; start = time; }
    });
    return idx;
  }

  // Linear interpolation fallback
  return Math.min(
    Math.floor((t / duration) * lyrics.length),
    lyrics.length - 1
  );
}

// Audio time where lyric line idx starts, for seeking to it (null while the duration
// needed is unknown). A timed line starts at its time. An untimed line is placed evenly
// between the nearest timed lines around it — the audio's start and end stand in where
// there is none — so with no timing at all this inverts the linear interpolation above.
function lyricLineStartTime(movement, idx) {
  const times = lyricTimes(movement) ?? [];
  if (times[idx] != null) return times[idx];

  const n = movement.lyrics.length;
  let prev = idx, next = idx;
  while (prev >= 0 && times[prev] == null) prev--;
  while (next < n && times[next] == null) next++;
  const [prevIdx, prevTime] = prev >= 0 ? [prev, times[prev]] : [0, 0];
  const [nextIdx, nextTime] = next < n  ? [next, times[next]] : [n, audio.duration];
  if (!isFinite(nextTime)) return null;
  const t = prevTime + (idx - prevIdx) / (nextIdx - prevIdx) * (nextTime - prevTime);
  // A hair later, so rounding can't land the interpolated highlight on the line before
  return Math.min(t + 0.01, nextTime);
}

/* ================================================================
   LYRICS TIMING — the lyrics and their timing: load, record, save
   Each movement's lyrics live in <audio>.timing.js next to its MP3 (the
   only copy: edit the text there). Every line has a start time, or null
   until it is timed, and optionally a translation.
   Rec:   arms recording (switches to manual mode). While the audio
          plays, each line the operator advances to (key or click) gets
          the current audio time as its start time. Moving back is a
          correction and records nothing; advancing again overwrites.
   Save:  writes the current movement's timing to <audio>.timing.js
   Load:  reads .timing.js (or older .timing.json) file(s); each names
          its own movement
   Clear: discards the timing recorded in this browser for the current movement
   Clear all: discards the timing recorded in this browser for every movement
   Export: writes every timing kept in this browser to <audio>.timing.js
          in its MP3's folder (Chromium: folder access; others: downloads)
   Recordings persist in localStorage and override the file's times
   (never its text or translations) until Clear.
   The file's "audio" is named relative to the file itself, which sits next
   to its MP3, so it is just the MP3's name ("audio": "Chapter1.mp3"). It
   is informational: the app finds the file from the movement's audio.
   The file is the timing JSON wrapped in one onePageMp3Timing(...)
   call, so a <script> can load it when the page is opened as file://
   (fetch can't).
   Auto mode uses these times instead of linear interpolation.
================================================================ */
const TIMING_FORMAT      = 'onepagemp3-lyrics-timing';
const TIMING_STORAGE_KEY = 'onepagemp3.timing:';
const TIMING_CALLBACK    = 'onePageMp3Timing';  // what a .timing.js file calls

const timing = {
  recording: false,
  byKey:     {},  // movementKey -> { times: [seconds | null per lyric line], source: 'local' | 'file' }
  files:     {},  // movementKey -> timing document read from its .timing.js file
  loads:     {}   // movementKey -> Promise of loadTiming, so each file is read once
};

function movementEntry(movement) {
  return state.allMovements.find(e => e.data === movement);
}

function movementKey(movement) {
  const e = movementEntry(movement);
  return `${e.composer.id}/${e.work.id}/${movement.id}`;
}

function workKey(composer, work) {
  return `${composer.id}/${work.id}`;
}

// assets/.../Chapter1.mp3 -> assets/.../Chapter1.timing.js
function timingFileUrl(movement) {
  return (movement.audio ?? movement.id).replace(/\.[^./]+$/, '') + '.timing.js';
}

function timingFileName(movement) {
  return timingFileUrl(movement).split('/').pop();
}

// The movement's audio named relative to its .timing.js file, which sits next to the MP3
function timingFileAudio(movement) {
  return movement.audio?.split('/').pop();
}

// Start time (seconds or null) of each lyric line, or null if the movement has no timing
function lyricTimes(movement) {
  return timing.byKey[movementKey(movement)]?.times ?? null;
}

function recordLineTime(idx, prevIdx) {
  if (!timing.recording || audio.paused || idx < 0 || idx <= prevIdx) return;
  const movement = currentMovement();
  const key = movementKey(movement);
  // Build on existing timing so a section can be re-recorded
  const rec = timing.byKey[key] ??=
    { times: (lyricTimes(movement) ?? movement.lyrics.map(() => null)).slice() };
  rec.source = 'local';
  rec.times[idx] = Math.round(audio.currentTime * 1000) / 1000;
  storeTiming(movement);
  updateTimingPanel();
}

function timingDoc(movement) {
  const e = movementEntry(movement);
  const times = lyricTimes(movement) ?? [];
  return {
    format:   TIMING_FORMAT,
    version:  1,
    composer: e.composer.id,
    work:     e.work.id,
    movement: movement.id,
    audio:    timingFileAudio(movement),
    saved:    new Date().toISOString(),
    // A line without a translation has no "translation" key (JSON drops undefined)
    lines:    movement.lyrics.map((l, i) => ({ time: times[i] ?? null, text: l.text,
                                               translation: l.translation || undefined }))
  };
}

// Contents of a .timing.js file: the timing JSON wrapped in one TIMING_CALLBACK call,
// pretty-printed with one lyric line per row so it is easy to read and hand-edit
function timingFileText(doc) {
  const { lines, ...head } = doc;
  return `${TIMING_CALLBACK}(` + JSON.stringify(head, null, 2).slice(0, -2) + ',\n  "lines": [\n' +
    lines.map(l => '    ' + JSON.stringify(l)).join(',\n') + '\n  ]\n});\n';
}

// The timing document in a .timing.js file, or in a plain .timing.json one
function parseTimingFile(text) {
  const json = text.trim().replace(new RegExp(`^${TIMING_CALLBACK}\\(([\\s\\S]*)\\);?$`), '$1');
  return JSON.parse(json);
}

// The movement a timing document names; throws if it is not a valid timing document
function timingDocMovement(doc) {
  if (doc?.format !== TIMING_FORMAT || !Array.isArray(doc.lines)) {
    throw new Error('not a lyrics timing file');
  }
  const e = state.allMovements.find(m =>
    m.composer.id === doc.composer && m.work.id === doc.work && m.data.id === doc.movement);
  if (!e) throw new Error(`unknown movement ${doc.composer}/${doc.work}/${doc.movement}`);
  return e.data;
}

// Attach a timing document to the movement it names; returns that movement.
// The timing file (source 'file') supplies the lyrics; a recording (source 'local') only
// times them, unless the movement has no timing file.
function applyTimingDoc(doc, source) {
  const movement = timingDocMovement(doc);
  if (source === 'file' || !movement.lyrics?.length) {
    movement.lyrics = doc.lines.map(l => ({ text: String(l?.text ?? ''),
                                            translation: String(l?.translation ?? '') }));
  } else if (doc.lines.length !== movement.lyrics.length) {
    console.warn(`Timing for ${doc.movement} has ${doc.lines.length} lines, lyrics have ${movement.lyrics.length}`);
  }
  const times = movement.lyrics.map((_, i) => {
    const t = doc.lines[i]?.time;
    return typeof t === 'number' && isFinite(t) && t >= 0 ? t : null;
  });
  if (times.some(t => t !== null)) {
    timing.byKey[movementKey(movement)] = { times, source };
  } else if (source !== 'file') {
    throw new Error('no timed lines');  // a timing file may hold lyrics not timed yet
  }
  return movement;
}

function storeTiming(movement) {
  try {
    localStorage.setItem(TIMING_STORAGE_KEY + movementKey(movement), JSON.stringify(timingDoc(movement)));
  } catch (err) {
    console.warn('Could not store lyrics timing:', err);
  }
}

// Load a movement's lyrics and timing, once: the timing file next to its audio, then this
// browser's recording on top. Afterwards movement.lyrics is set ([] if there is no file).
function loadTiming(movement) {
  const key = movementKey(movement);
  return timing.loads[key] ??= (async () => {
    const doc = await loadTimingFile(movement);
    try {
      if (doc) applyTimingDoc(doc, 'file');
    } catch (err) {
      delete timing.files[key];
      console.warn(`Ignoring ${timingFileName(movement)}:`, err.message);
    }
    try {
      const stored = localStorage.getItem(TIMING_STORAGE_KEY + key);
      if (stored) applyTimingDoc(JSON.parse(stored), 'local');
    } catch (err) {
      console.warn('Ignoring stored lyrics timing:', err);
    }
    movement.lyrics ??= [];
  })();
}

// Run the .timing.js file next to the audio, which hands its document to TIMING_CALLBACK.
// Resolves to that document, or null if there is no file.
function loadTimingFile(movement) {
  const key = movementKey(movement);
  return new Promise(resolve => {
    const script = document.createElement('script');
    script.src = timingFileUrl(movement) + (location.protocol === 'file:' ? '' : `?t=${Date.now()}`);
    script.onerror = () => { script.remove(); resolve(null); };
    script.onload  = () => {
      script.remove();
      if (!timing.files[key]) console.warn(`${timingFileName(movement)} is not the timing of ${key}`);
      resolve(timing.files[key] ?? null);
    };
    document.head.append(script);
  });
}

window[TIMING_CALLBACK] = doc => {
  timing.files[`${doc?.composer}/${doc?.work}/${doc?.movement}`] = doc;
};

async function saveTimingFile() {
  const movement = currentMovement();
  if (!movement || !lyricTimes(movement)) return;
  const text = timingFileText(timingDoc(movement));
  const name = timingFileName(movement);

  // Chromium: let the user save straight into the assets folder next to the MP3
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: name,
        types: [{ description: 'Lyrics timing', accept: { 'text/javascript': ['.js'] } }]
      });
      const writable = await handle.createWritable();
      await writable.write(text);
      await writable.close();
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;  // user cancelled
      console.warn('Save picker failed, downloading instead:', err);
    }
  }
  downloadFile(name, text);
}

function downloadFile(name, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/javascript' }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// Movements whose timing is kept in this browser (localStorage)
function storedTimingMovements() {
  try {
    return state.allMovements.map(e => e.data)
      .filter(m => localStorage.getItem(TIMING_STORAGE_KEY + movementKey(m)) !== null);
  } catch {
    return [];
  }
}

let timingRootDir = null;  // folder picked for Export, reused for the rest of the session

// The MP3's folder inside the picked one: the picked folder is either the app folder
// (audio paths are relative to index.html) or the MP3's own folder
async function mp3Folder(root, movement) {
  const parts   = movement.audio.split('/');
  const mp3Name = parts.pop();
  try {
    let dir = root;
    for (const part of parts) dir = await dir.getDirectoryHandle(part);
    await dir.getFileHandle(mp3Name);
    return dir;
  } catch {
    await root.getFileHandle(mp3Name);  // throws NotFoundError if the MP3 isn't here either
    return root;
  }
}

// Write every timing kept in this browser next to its MP3, as <audio>.timing.js
async function exportStoredTimings() {
  let root = null;
  if (window.showDirectoryPicker) {
    try {
      root = timingRootDir ??= await window.showDirectoryPicker({ id: 'onepagemp3', mode: 'readwrite' });
    } catch (err) {
      if (err.name !== 'AbortError') alert('Could not open the folder:\n' + err.message);
      return;
    }
  }

  const written = [], failed = [];
  for (const movement of storedTimingMovements()) {
    await loadTiming(movement);  // not in memory yet if the movement wasn't opened this session
    const name = timingFileName(movement);
    const text = timingFileText(timingDoc(movement));
    if (!root) {
      // No folder access (Firefox / Safari): download, to be moved next to the MP3 by hand
      downloadFile(name, text);
      written.push(name);
      continue;
    }
    try {
      const dir = await mp3Folder(root, movement);
      const writable = await (await dir.getFileHandle(name, { create: true })).createWritable();
      await writable.write(text);
      await writable.close();
      written.push(timingFileUrl(movement));
    } catch (err) {
      failed.push(err.name === 'NotFoundError'
        ? `${name}: ${movement.audio.split('/').pop()} is not in the picked folder`
        : `${name}: ${err.message}`);
    }
  }
  if (root && written.length === 0) timingRootDir = null;  // wrong folder: ask again next time

  const report = [];
  if (written.length) {
    report.push(root ? `Exported ${written.length} lyrics timing file(s):`
                     : `Downloaded ${written.length} lyrics timing file(s); move each next to its MP3:`,
                ...written.map(f => '  ' + f));
  }
  if (failed.length) {
    report.push('Could not export (pick the folder that contains index.html):', ...failed.map(f => '  ' + f));
  }
  alert(report.join('\n'));
}

function setRecording(on) {
  timing.recording = on;
  const btn = document.getElementById('btn-record');
  btn.classList.toggle('recording', on);
  btn.setAttribute('aria-pressed', on);
  btn.innerHTML = on ? '&#9632; Stop' : '&#9679; Rec';
  document.getElementById('rec-indicator').hidden = !on;
  if (on && state.highlightMode !== 'manual') setHighlightMode('manual');
  updateTimingPanel();
}

// Under the buttons: number, elapsed time and start time of the selected (highlighted) lyric
// line; with no line selected, the audio time elapsed and a hint. Hidden without lyrics.
function updateSelectedLineTime() {
  const el       = document.getElementById('timing-line-time');
  const movement = currentMovement();
  const idx      = state.lastLyricIdx;
  if (!movement?.lyrics?.length) {
    el.hidden = true;
    return;
  }
  const selected = idx >= 0 && idx < movement.lyrics.length;
  // Times are seconds, in the same format as in the .timing.js file
  document.getElementById('line-elapse').textContent = String(Math.round(audio.currentTime * 1000) / 1000);
  document.getElementById('line-text').hidden  = !selected;
  document.getElementById('line-start').hidden = !selected;
  document.getElementById('line-hint').hidden  = selected;
  if (selected) {
    const time = lyricTimes(movement)?.[idx];
    // First 6 characters (by code point, so a Chinese or accented character is never split)
    const start = [...(movement.lyrics[idx].text ?? '').trim()].slice(0, 6).join('');
    document.getElementById('line-number').textContent = `Line ${idx + 1}`;
    document.getElementById('line-text').textContent   = start;
    document.getElementById('line-start').textContent  = time == null ? 'not timed' : String(time);
  } else {
    document.getElementById('line-number').textContent = 'Line –';
  }
  el.hidden = false;
}

function updateTimingPanel() {
  const movement  = currentMovement();
  const hasLyrics = !!movement?.lyrics?.length;
  const times     = hasLyrics ? lyricTimes(movement) : null;
  const rec       = hasLyrics ? timing.byKey[movementKey(movement)] : null;

  const lines = [];
  if (!hasLyrics) {
    lines.push(!movement         ? 'Select a movement to record its timing.'
             : !movement.lyrics ? 'Loading lyrics…'
             :                    `This movement has no lyrics (no ${timingFileName(movement)}).`);
  } else {
    const timed  = times ? times.filter(t => t !== null).length : 0;
    const origin = !times                ? ''
                 : rec.source === 'file' ? ` · ${timingFileName(movement)}`
                 :                         ' · this browser';
    lines.push(`${movement.number}. ${movement.title}`);
    lines.push(`${timed} / ${movement.lyrics.length} lines timed${origin}`);
  }
  if (timing.recording) {
    lines.push(audio.paused ? 'Play the audio, then press ↓ as each line starts.'
                            : '● Recording — press ↓ as each line starts.');
  }
  document.getElementById('timing-status').textContent = lines.join('\n');

  document.getElementById('btn-record').disabled       = !hasLyrics && !timing.recording;
  document.getElementById('btn-timing-save').disabled  = !times;
  document.getElementById('btn-timing-clear').disabled = rec?.source !== 'local';

  const stored = storedTimingMovements().length;
  document.getElementById('btn-timing-clear-all').disabled = stored === 0;
  const exportBtn = document.getElementById('btn-timing-export');
  exportBtn.disabled    = stored === 0;
  exportBtn.textContent = stored ? `Export ${stored} to MP3 folders` : 'Export to MP3 folders';

  updateSelectedLineTime();
}

// Timing of the current movement changed: refresh the panel and, in auto mode, the highlight
function refreshAfterTimingChange() {
  updateTimingPanel();
  if (state.highlightMode === 'auto' && currentMovement()) {
    highlightLyricLine(getCurrentLyricIdx());
  }
}

// The Songs panel (#tree-panel: the artist / work / movement tree) is open unless the URL says
// collapsed (see VIEW OPTIONS IN URL); its arrow button closes and opens it, and the URL follows
function setTreePanelOpen(open) {
  const btn = document.getElementById('btn-tree-toggle');
  document.getElementById('tree-panel').classList.toggle('collapsed', !open);
  btn.setAttribute('aria-expanded', open);
  btn.title = open ? 'Hide songs' : 'Show songs';
  rewriteUrlParams({ songs: open ? 'open' : 'collapsed' });
}

setTreePanelOpen(urlParam('songs') !== 'collapsed');

document.getElementById('btn-tree-toggle').addEventListener('click', e => {
  const btn = e.currentTarget;
  setTreePanelOpen(btn.getAttribute('aria-expanded') !== 'true');
  btn.blur();  // so Space doesn't re-activate the button
});

// The panel is collapsed to its arrow button unless the URL says open (see VIEW OPTIONS IN
// URL); the button opens and closes it, and the URL follows
function setTimingPanelOpen(open) {
  const btn = document.getElementById('btn-timing-toggle');
  document.getElementById('timing-panel').classList.toggle('collapsed', !open);
  btn.setAttribute('aria-expanded', open);
  btn.title = open ? 'Hide lyrics timing' : 'Show lyrics timing';
  rewriteUrlParams({ timing: open ? 'open' : 'collapsed' });
}

setTimingPanelOpen(urlParam('timing') === 'open');

document.getElementById('btn-timing-toggle').addEventListener('click', e => {
  const btn = e.currentTarget;
  setTimingPanelOpen(btn.getAttribute('aria-expanded') !== 'true');
  btn.blur();  // so Space doesn't re-activate the button
});

// The View Options panel (#view-panel: lyrics mode, Show, Audio / Font) can be collapsed
// on a smartphone only (the CSS shows its title bar and hides its body in a narrow window); it
// starts collapsed to its title and arrow unless the URL says open (see VIEW OPTIONS IN URL)
function setViewPanelOpen(open) {
  const btn = document.getElementById('btn-view-toggle');
  document.getElementById('view-panel').classList.toggle('collapsed', !open);
  btn.setAttribute('aria-expanded', open);
  btn.title = open ? 'Hide view options' : 'Show view options';
  rewriteUrlParams({ 'view-options': open ? 'open' : 'collapsed' });
}

setViewPanelOpen(urlParam('view-options') === 'open');

document.getElementById('btn-view-toggle').addEventListener('click', e => {
  const btn = e.currentTarget;
  setViewPanelOpen(btn.getAttribute('aria-expanded') !== 'true');
  btn.blur();  // so Space doesn't re-activate the button
});

document.getElementById('btn-record').addEventListener('click', e => {
  setRecording(!timing.recording);
  e.currentTarget.blur();  // so Space doesn't re-activate the button
});

document.getElementById('btn-timing-save').addEventListener('click', e => {
  e.currentTarget.blur();
  saveTimingFile();
});

document.getElementById('btn-timing-export').addEventListener('click', e => {
  e.currentTarget.blur();
  exportStoredTimings();
});

document.getElementById('btn-timing-load').addEventListener('click', e => {
  e.currentTarget.blur();
  document.getElementById('timing-file-input').click();
});

document.getElementById('timing-file-input').addEventListener('change', async e => {
  const errors = [];
  for (const file of e.target.files) {
    try {
      const doc = parseTimingFile(await file.text());
      await loadTiming(timingDocMovement(doc));  // its lyrics come from its own timing file
      storeTiming(applyTimingDoc(doc, 'local'));
    } catch (err) {
      errors.push(`${file.name}: ${err.message}`);
    }
  }
  e.target.value = '';  // allow re-loading the same file
  if (errors.length) alert('Could not load lyrics timing:\n' + errors.join('\n'));
  refreshAfterTimingChange();
});

// Discard the timing recorded in this browser for a movement, going back to the timing in
// the file next to its audio, if it has any
function discardBrowserTiming(movement) {
  const key = movementKey(movement);
  delete timing.byKey[key];
  try { localStorage.removeItem(TIMING_STORAGE_KEY + key); } catch { /* storage unavailable */ }
  if (timing.files[key]) applyTimingDoc(timing.files[key], 'file');
}

document.getElementById('btn-timing-clear').addEventListener('click', e => {
  e.currentTarget.blur();
  const movement = currentMovement();
  if (!movement || !confirm(`Discard the timing recorded in this browser for "${movement.number}. ${movement.title}"?`)) return;
  discardBrowserTiming(movement);
  refreshAfterTimingChange();
});

document.getElementById('btn-timing-clear-all').addEventListener('click', e => {
  e.currentTarget.blur();
  const movements = storedTimingMovements();
  if (!movements.length) return;
  if (!confirm(`Discard the timing recorded in this browser for all ${movements.length} movement(s)?\n\n` +
               'Export them first to keep them.')) return;
  movements.forEach(discardBrowserTiming);
  refreshAfterTimingChange();
});

/* ================================================================
   AUDIO EVENTS
================================================================ */
// Manual mode leaves the highlight to the operator, but when the audio starts playing with
// no line highlighted, it highlights the line being played (as Auto mode would), once: from
// then on the operator moves it. Not while recording, where the first line is timed by the
// operator's first key press.
let pickLineOnPlay = false;

function pickLineBeingPlayed() {
  if (state.lastLyricIdx >= 0 || timing.recording || state.composerIdx === null) {
    pickLineOnPlay = false;  // a line is selected already, or the operator is timing them
    return;
  }
  if (!currentMovement()?.lyrics?.length) return;  // lyrics not loaded yet
  const idx = getCurrentLyricIdx();
  if (idx < 0) return;  // before the first timed line: try again as the audio goes on
  pickLineOnPlay = false;
  highlightLyricLine(idx);
}

audio.addEventListener('timeupdate', () => {
  if (audio.duration && isFinite(audio.duration)) {
    setProgress(audio.currentTime / audio.duration);
    setTimeDisplay(audio.currentTime, audio.duration);
  }

  if (state.composerIdx !== null && state.highlightMode === 'auto') {
    highlightLyricLine(getCurrentLyricIdx());
  } else if (pickLineOnPlay) {
    pickLineBeingPlayed();
  }
  updateSelectedLineTime();  // the elapsed time
  updateTimeInUrl();
});

audio.addEventListener('loadedmetadata', () => {
  setTimeDisplay(0, audio.duration);
  if (timeInUrl.start !== null) {
    audio.currentTime = Math.min(timeInUrl.start, audio.duration);
    timeInUrl.start = null;
  }
});

// The play / pause button shows what a click does: ❚❚ while playing, ▶ otherwise. They are SVG drawings, not text
// characters, so they look the same on every device: no font has to supply them, and a phone can't draw ▶ as an emoji
const PLAY_ICON  = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 1.25 11 6l-8.5 4.75z"/></svg>';
const PAUSE_ICON = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M1.6 2h3.9v8H1.6zM7.1 2H11v8H7.1z"/></svg>';

function showPlaying(playing) {
  const icon = playing ? PAUSE_ICON : PLAY_ICON;
  document.getElementById('btn-play-pause').innerHTML = icon;
  document.getElementById('btn-play-pause-max').innerHTML = icon;  // top bar, maximized lyrics mode
  songDisplay.classList.toggle('playing', playing);  // the background graphics drift only then (see BACKGROUND)
  state.isPlaying = playing;
}

audio.addEventListener('play', () => {
  showPlaying(true);
  pickLineOnPlay = true;
  pictureOverlay.classList.add('hidden');
  updateTimingPanel();
  // Playing again after a pause: the lyrics may have been scrolled meanwhile, and the highlight
  // stays on the same line, so it wouldn't be centered until the next line. Center it now
  centerCurrentLine();
});

pictureOverlay.addEventListener('click', playSelection);

audio.addEventListener('pause', () => {
  showPlaying(false);
  updateTimingPanel();
});

audio.addEventListener('ended', () => {
  // Auto-advance to next movement
  const idx = currentFlatIdx();
  if (idx >= 0 && idx < state.allMovements.length - 1) {
    const next = state.allMovements[idx + 1];
    loadMovement(next.composer, next.work, next.data, true);
  }
});

audio.addEventListener('error', () => {
  // Gracefully handle a missing or unplayable audio file — lyrics still display.
  // "Format error" on an MP3 that plays elsewhere usually means the HTTP server (see README)
  console.warn('Cannot play audio:', audio.src, audio.error?.message || `error code ${audio.error?.code}`);
});

/* ================================================================
   PLAYBACK CONTROLS
================================================================ */
// Play the selected movement; a selected work (see SELECT WORK) plays from its first movement,
// and a selected artist (see SELECT ARTIST) from the first movement of its first work
function playSelection() {
  const work = currentWork();
  if (work && !currentMovement()) {
    const first = work.movements?.[0];
    if (first) loadMovement(currentArtist(), work, first, true);
  } else if (!work && currentArtist()) {
    const first = navNeighbors().next;
    if (first) loadMovement(first.composer, first.work, first.data, true);
  } else if (audio.src) {
    audio.play().catch(() => {});
  }
}

// ▶ / ❚❚ and Space
function togglePlay() {
  if (audio.src && !audio.paused) audio.pause();
  else playSelection();
}

['btn-play-pause', 'btn-play-pause-max'].forEach(id => {
  document.getElementById(id).addEventListener('click', e => {
    e.currentTarget.blur();  // so Space doesn't re-activate the button
    togglePlay();
  });
});

document.getElementById('btn-rewind-start').addEventListener('click', () => {
  audio.currentTime = 0;
  if (state.highlightMode === 'manual') highlightLyricLine(-1);
});

document.getElementById('btn-rewind-15').addEventListener('click', () => {
  audio.currentTime = Math.max(0, audio.currentTime - 15);
});

document.getElementById('btn-ff-15').addEventListener('click', () => {
  if (isFinite(audio.duration)) {
    audio.currentTime = Math.min(audio.duration, audio.currentTime + 15);
  }
});

document.getElementById('btn-ff-end').addEventListener('click', () => {
  if (isFinite(audio.duration)) audio.currentTime = audio.duration;
});

// Sync: back to the highlighted line (in auto mode the one being played), e.g. after scrolling the lyrics. The
// playback controls' button, and the top bar's in maximized lyrics mode (index1.html has neither)
['btn-sync', 'btn-sync-max'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', e => {
    e.currentTarget.blur();  // so Space doesn't re-activate the button
    centerCurrentLine();
  });
});

document.getElementById('progress-bar').addEventListener('input', e => {
  setProgress(e.target.value / 10000);
  if (isFinite(audio.duration)) {
    audio.currentTime = (e.target.value / 10000) * audio.duration;
  }
});

document.getElementById('btn-prev').addEventListener('click', () => {
  const entry = navNeighbors().prev;
  if (entry) loadMovement(entry.composer, entry.work, entry.data, state.isPlaying);
});

document.getElementById('btn-next').addEventListener('click', () => {
  const entry = navNeighbors().next;
  if (entry) loadMovement(entry.composer, entry.work, entry.data, state.isPlaying);
});

/* ================================================================
   KEYBOARD SHORTCUTS
   Both modes:
     Space:            Play / Pause
     Esc:              Leave maximized lyrics panel
   Auto mode:
     Left/Right:       ±5 seconds
     Shift+Left/Right: ±15 seconds
   Manual mode:
     Down / Right:     highlight next lyric line (recorded while Rec is on)
     Up / Left:        highlight previous lyric line
================================================================ */
const MANUAL_KEYS = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };

document.addEventListener('keydown', e => {
  const t = e.target;
  // Range inputs (progress bar) keep focus after dragging; don't let them swallow keys
  if (t.tagName === 'TEXTAREA' || (t.tagName === 'INPUT' && t.type !== 'range')) return;

  if (e.code === 'Escape') {
    setLyricsMaximized(false);
    return;
  }

  if (state.highlightMode === 'manual' && e.code in MANUAL_KEYS) {
    if (!e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      if (!e.repeat) stepLyricLine(MANUAL_KEYS[e.code]);  // holding a key advances one line only
    }
    return;
  }

  switch (e.code) {
    case 'Space':
      e.preventDefault();
      togglePlay();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      audio.currentTime = Math.max(0, audio.currentTime - (e.shiftKey ? 15 : 5));
      break;
    case 'ArrowRight':
      e.preventDefault();
      if (isFinite(audio.duration))
        audio.currentTime = Math.min(audio.duration, audio.currentTime + (e.shiftKey ? 15 : 5));
      break;
  }
});

/* ================================================================
   HELPERS
================================================================ */
function currentArtist() {
  if (state.composerIdx === null) return null;
  return APP_DATA.artists[state.composerIdx] ?? null;
}

// Null with an artist selected (see SELECT ARTIST)
function currentWork() {
  if (state.workIdx === null) return null;
  return currentArtist()?.works[state.workIdx] ?? null;
}

function currentMovement() {
  return currentWork()?.movements[state.movementIdx] ?? null;
}

function currentFlatIdx() {
  const m = currentMovement();
  if (!m) return -1;
  return state.allMovements.findIndex(e => e.data === m);
}

// The flat-list entries Prev and Next go to: those around the selected movement, or for a
// selected work (see SELECT WORK) or artist (see SELECT ARTIST) its first movement and the one before it
function navNeighbors() {
  const list = state.allMovements;
  if (currentMovement()) {
    const idx = currentFlatIdx();
    return idx < 0 ? {} : { prev: list[idx - 1], next: list[idx + 1] };
  }
  const work = currentWork();
  const artist = currentArtist();
  const first = work   ? list.findIndex(e => e.work === work)
              : artist ? list.findIndex(e => e.composer === artist)
              :          -1;
  return first < 0 ? {} : { prev: list[first - 1], next: list[first] };
}

function updateNavButtons() {
  const { prev, next } = navNeighbors();
  document.getElementById('btn-prev').disabled = !prev;
  document.getElementById('btn-next').disabled = !next;
}

function resetProgress() {
  setProgress(0);
  setTimeDisplay(0, 0);
}

// The progress bar at `ratio` (0 to 1) of the song. --progress, the same ratio, fills the played part of the track
// on a mobile device, where common.css draws the bar instead of the browser
function setProgress(ratio) {
  const bar = document.getElementById('progress-bar');
  bar.value = Math.round(ratio * 10000);
  bar.style.setProperty('--progress', bar.value / 10000);
}

function setTimeDisplay(current, duration) {
  document.getElementById('time-display').textContent =
    `${fmt(current)}/${fmt(duration)}`;
}

function fmt(s) {
  if (!isFinite(s) || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ================================================================
   INIT
================================================================ */
setHighlightMode(urlParam('highlight-mode') === 'manual' ? 'manual' : 'auto');
loadArtists().then(() => {
  buildFlatList();
  buildTree();
  updateNavButtons();
  updateTimingPanel();
  selectInitialItem();
});
