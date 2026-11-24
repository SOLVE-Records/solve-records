/* ============================================================
   SOLVE RECORDS — A/B-PLAYER „Vorher / Nachher“
   ------------------------------------------------------------
   ES-Modul ohne globale Variablen. Sucht beim Start alle
   [data-ab-player]-Elemente und baut dort je einen Player auf.

     <div data-ab-player="vorhang"></div>              ein Song (id)
     <div data-ab-player="collection:mastering"></div> alle Songs mit
                                                       collections ⊇ "mastering"

   Daten: ../audio/vorher-nachher/songs.json (relativ zu diesem Modul,
   unabhängig davon, wie tief die einbindende Seite liegt).
   Audio: ../audio/vorher-nachher/<song.dir || song.id>/<stage.src>

   Ablauf: Beim Seitenaufruf wird nur songs.json geladen (< 1 KB).
   Audio erst nach Klick (fetch + decodeAudioData → AudioBuffer).
   Alle Stufen eines Songs laufen gleichzeitig, sample-synchron, je über
   einen eigenen GainNode; Umschalten = nur Gain-Rampe, keine Quelle wird
   dafür neu gestartet. Es spielt immer nur eine Instanz pro Seite.
   ============================================================ */

const DATA_URL = new URL('../audio/vorher-nachher/songs.json', import.meta.url);
const AUDIO_BASE = new URL('../audio/vorher-nachher/', import.meta.url);

const SWITCH_RAMP = 0.015;   // s, Umschalten zwischen Stufen (linear)
const TRANSPORT_RAMP = 0.012; // s, Play/Pause/Seek ein-/ausblenden
const VOLUME_RAMP = 0.03;    // s, Gesamtpegel
const VOL_MIN_DB = -30;
const VOL_MAX_DB = 0;
const FALLBACK_COLOR = '#d4a24a';
const PREVIEW = new URLSearchParams(location.search).get('preview') === '1';

const instances = new Set();
let sharedCtx = null;

/* ---------- Hilfsfunktionen ---------- */

const dbToGain = db => Math.pow(10, db / 20);

function fmtTime(s) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ':' + String(sec).padStart(2, '0');
}

function fmtDb(db) {
  const r = Math.round(db * 100) / 100;
  return (r > 0 ? '+' : r < 0 ? '−' : '') + String(Math.abs(r)).replace('.', ',') + ' dB';
}

function el(tag, attrs, children) {
  const node = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === false || v == null) continue;
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else node.setAttribute(k, v === true ? '' : v);
    }
  }
  if (children) for (const c of children) if (c) node.append(c);
  return node;
}

function getCtx() {
  if (!sharedCtx || sharedCtx.state === 'closed') {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    sharedCtx = new Ctx();
    // iOS: Ton auch bei Stummschalter (wie im Stimmgerät), nur wo vorhanden
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* egal */ }
  }
  return sharedCtx;
}

// Gain-Rampe ab dem aktuellen Wert, auch mitten in einer laufenden Rampe
function rampTo(param, value, ctx, dur) {
  const t = ctx.currentTime;
  if (typeof param.cancelAndHoldAtTime === 'function') {
    param.cancelAndHoldAtTime(t);
  } else {
    const cur = param.value;
    param.cancelScheduledValues(t);
    param.setValueAtTime(cur, t);
  }
  param.linearRampToValueAtTime(value, t + dur);
}

// decodeAudioData: Promise-Variante und alte Callback-Variante (webkitAudioContext)
function decode(ctx, arrayBuffer) {
  return new Promise((resolve, reject) => {
    let done = false;
    const ok = b => { if (!done) { done = true; resolve(b); } };
    const fail = e => { if (!done) { done = true; reject(e || new Error('decode')); } };
    try {
      const p = ctx.decodeAudioData(arrayBuffer, ok, fail);
      if (p && typeof p.then === 'function') p.then(ok, fail);
    } catch (e) { fail(e); }
  });
}

class LoadError extends Error {
  constructor(message) { super(message); this.name = 'LoadError'; }
}

async function fetchWithProgress(url, signal, onProgress) {
  let res;
  try {
    res = await fetch(url, { signal });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new LoadError('Netzwerkfehler beim Laden von ' + url.pathname.split('/').pop() + '.');
  }
  const name = decodeURIComponent(url.pathname.split('/').pop());
  if (!res.ok) throw new LoadError('Datei nicht gefunden: ' + name + ' (HTTP ' + res.status + ').');
  const total = Number(res.headers.get('Content-Length')) || 0;
  if (!res.body || typeof res.body.getReader !== 'function') {
    const buf = await res.arrayBuffer();
    onProgress(buf.byteLength, buf.byteLength);
    return buf;
  }
  const reader = res.body.getReader();
  const chunks = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    onProgress(loaded, Math.max(total, loaded));
  }
  const out = new Uint8Array(loaded);
  let pos = 0;
  for (const c of chunks) { out.set(c, pos); pos += c.byteLength; }
  return out.buffer;
}

/* ---------- Daten ---------- */

function normalizeSongs(raw) {
  if (!Array.isArray(raw)) throw new Error('songs.json: Array erwartet');
  const out = [];
  const seen = new Set();
  for (const s of raw) {
    if (!s || typeof s.id !== 'string' || !s.id || seen.has(s.id)) {
      console.warn('[ab-player] Song ohne gültige/eindeutige id übersprungen', s);
      continue;
    }
    const stages = Array.isArray(s.stages) ? s.stages.filter(st => st && st.id && st.src) : [];
    if (stages.length < 2 || stages.length > 4 || new Set(stages.map(st => st.id)).size !== stages.length) {
      console.warn('[ab-player] Song „' + s.id + '“: stages braucht 2–4 Einträge mit eindeutiger id und src');
      continue;
    }
    const offsets = {};
    if (s.stageOffsetsDb && typeof s.stageOffsetsDb === 'object') {
      for (const st of stages) {
        const v = Number(s.stageOffsetsDb[st.id]);
        if (isFinite(v) && v !== 0) offsets[st.id] = v;
      }
    }
    seen.add(s.id);
    out.push({
      id: s.id,
      title: String(s.title || s.id),
      subtitle: s.subtitle ? String(s.subtitle) : '',
      genre: s.genre ? String(s.genre) : '',
      published: s.published === true,
      dir: s.dir ? String(s.dir) : s.id,
      collections: Array.isArray(s.collections) ? s.collections.map(String) : [],
      sizeMB: Number(s.sizeMB) > 0 ? Number(s.sizeMB) : 0,
      offsets,
      hasOffsets: Object.keys(offsets).length > 0,
      stages: stages.map(st => ({
        id: String(st.id),
        label: String(st.label || st.id),
        hint: st.hint ? String(st.hint) : '',
        src: String(st.src),
        color: /^#[0-9a-f]{3,8}$/i.test(st.color || '') ? st.color : FALLBACK_COLOR
      }))
    });
  }
  return out;
}

function resolveMount(value, songs) {
  const visible = songs.filter(s => s.published || PREVIEW);
  const v = (value || '').trim();
  if (v.startsWith('collection:')) {
    const name = v.slice('collection:'.length).trim();
    return visible.filter(s => s.collections.includes(name));
  }
  return visible.filter(s => s.id === v);
}

/* ---------- Player ---------- */

class ABPlayer {
  constructor(mount, songs) {
    this.mount = mount;
    this.songs = songs;
    this.song = songs[0];
    this.active = 0;            // Index der aktiven Stufe
    this.mode = 'equal';        // 'equal' | 'original'
    this.volumeDb = 0;
    this.loop = true;
    this.state = 'idle';        // idle | loading | ready | error
    this.playing = false;
    this.offset = 0;            // Position beim letzten Start/Pause (s)
    this.startedAt = 0;         // ctx.currentTime beim letzten Start
    this.buffers = null;
    this.duration = 0;
    this.peaks = null;
    this.nodes = null;          // { stageGains[], transport, volume }
    this.sources = null;
    this.abort = null;
    this.loadToken = 0;
    this.raf = 0;
    this.dragging = false;
    this.build();
    instances.add(this);
  }

  /* --- DOM --- */

  build() {
    const uid = 'abp-' + Math.random().toString(36).slice(2, 8);
    this.uid = uid;
    this.mount.textContent = '';
    this.mount.classList.add('abp-mount');

    const root = this.root = el('div', { class: 'abp' });

    if (this.songs.length > 1) {
      this.songList = el('div', { class: 'abp-songs', role: 'group', 'aria-label': 'Song wählen' });
      this.songBtns = this.songs.map((s, i) => {
        const b = el('button', { type: 'button', class: 'abp-song', 'aria-pressed': i === 0 ? 'true' : 'false' }, [
          el('span', { class: 'abp-song-title', text: s.title }),
          s.genre ? el('span', { class: 'abp-song-genre', text: s.genre }) : null
        ]);
        b.addEventListener('click', () => this.selectSong(i));
        return b;
      });
      this.songList.append(...this.songBtns);
      root.append(this.songList);
    }

    this.head = el('div', { class: 'abp-head' });
    this.titleEl = el('p', { class: 'abp-title' });
    this.metaEl = el('p', { class: 'abp-meta' });
    this.head.append(this.titleEl, this.metaEl);

    this.stageGroup = el('div', { class: 'abp-stages', role: 'radiogroup', 'aria-label': 'Bearbeitungsstufe' });
    this.hintEl = el('p', { class: 'abp-hint', id: uid + '-hint' });

    // Wellenform + Seek
    this.canvas = el('canvas', { class: 'abp-wave', 'aria-hidden': 'true' });
    this.waveEmpty = el('p', { class: 'abp-wave-empty' }, [el('span', { text: 'Wellenform erscheint nach dem Laden' })]);
    this.waveBox = el('div', { class: 'abp-wavebox' }, [this.canvas, this.waveEmpty]);

    this.playBtn = el('button', { type: 'button', class: 'abp-play' }, [
      el('span', { class: 'abp-play-icon', 'aria-hidden': 'true' }),
      el('span', { class: 'abp-play-label' }, [
        el('span', { class: 'abp-play-text' }),
        el('span', { class: 'abp-play-size', hidden: true })
      ])
    ]);
    this.timeEl = el('p', { class: 'abp-time', 'aria-hidden': 'true' });
    this.seek = el('input', {
      type: 'range', class: 'abp-seek', min: '0', max: '1000', step: '1', value: '0',
      'aria-label': 'Position im Ausschnitt', disabled: true
    });
    this.loopBtn = el('button', { type: 'button', class: 'abp-chip abp-loop', 'aria-pressed': 'true', text: 'Loop' });
    const transport = el('div', { class: 'abp-transport' }, [
      this.playBtn,
      el('div', { class: 'abp-seekwrap' }, [this.seek, this.timeEl]),
      this.loopBtn
    ]);

    this.progress = el('div', { class: 'abp-progress', hidden: true }, [
      el('div', { class: 'abp-progress-bar' })
    ]);
    this.status = el('p', { class: 'abp-status', role: 'status', 'aria-live': 'polite' });
    this.error = el('div', { class: 'abp-error', role: 'alert', hidden: true });

    // Optionen
    this.modeWrap = el('div', { class: 'abp-option abp-modes' });
    this.modeBtns = [
      el('button', { type: 'button', class: 'abp-chip', 'data-mode': 'equal', text: 'Gleiche Lautstärke' }),
      el('button', { type: 'button', class: 'abp-chip', 'data-mode': 'original', text: 'Originallautstärke' })
    ];
    this.modeNote = el('p', { class: 'abp-note' });
    const modeRow = el('div', { class: 'abp-chips', role: 'group', 'aria-label': 'Lautstärkevergleich' }, this.modeBtns);
    this.modeWrap.append(modeRow, this.modeNote);
    this.modeBtns.forEach(b => b.addEventListener('click', () => this.setMode(b.dataset.mode)));

    this.vol = el('input', {
      type: 'range', class: 'abp-vol', id: uid + '-vol', min: String(VOL_MIN_DB), max: String(VOL_MAX_DB),
      step: '1', value: '0'
    });
    this.volOut = el('output', { class: 'abp-vol-out', for: uid + '-vol' });
    const volWrap = el('div', { class: 'abp-option abp-volume' }, [
      el('label', { class: 'abp-label', for: uid + '-vol', text: 'Gesamtpegel' }),
      el('div', { class: 'abp-vol-row' }, [this.vol, this.volOut])
    ]);

    root.append(
      this.head, this.stageGroup, this.hintEl, this.waveBox, transport,
      this.progress, this.status, this.error,
      el('div', { class: 'abp-options' }, [this.modeWrap, volWrap])
    );
    this.mount.append(root);

    // Events
    this.playBtn.addEventListener('click', () => this.togglePlay());
    this.loopBtn.addEventListener('click', () => this.setLoop(!this.loop));
    this.seek.addEventListener('input', () => {
      if (this.state !== 'ready') return;
      this.seekTo(this.seek.value / 1000 * this.duration);
    });
    this.vol.addEventListener('input', () => this.setVolume(Number(this.vol.value)));
    root.addEventListener('keydown', e => this.onKey(e));
    this.canvas.addEventListener('pointerdown', e => this.onPointer(e));
    this.canvas.addEventListener('pointermove', e => { if (this.dragging) this.onPointer(e); });
    const endDrag = () => { this.dragging = false; };
    this.canvas.addEventListener('pointerup', endDrag);
    this.canvas.addEventListener('pointercancel', endDrag);

    if ('ResizeObserver' in window) {
      this.ro = new ResizeObserver(() => this.draw());
      this.ro.observe(this.waveBox);
    }

    this.renderSong();
    this.setVolume(0);
  }

  renderSong() {
    const s = this.song;
    this.titleEl.textContent = s.title;
    this.metaEl.textContent = [s.genre, s.subtitle].filter(Boolean).join(' · ');
    if (!s.published) this.metaEl.append(el('span', { class: 'abp-preview', text: 'Vorschau, nicht veröffentlicht' }));
    if (this.songBtns) this.songBtns.forEach((b, i) => b.setAttribute('aria-pressed', this.songs[i] === s ? 'true' : 'false'));

    this.stageGroup.textContent = '';
    this.stageGroup.style.setProperty('--abp-cols', s.stages.length);
    this.stageBtns = s.stages.map((st, i) => {
      const b = el('button', {
        type: 'button', role: 'radio', class: 'abp-stage',
        'aria-describedby': this.uid + '-hint'
      }, [
        el('span', { class: 'abp-stage-key', 'aria-hidden': 'true', text: String(i + 1) }),
        el('span', { class: 'abp-stage-label', text: st.label })
      ]);
      b.style.setProperty('--abp-stage', st.color);
      b.addEventListener('click', () => this.setStage(i));
      return b;
    });
    this.stageGroup.append(...this.stageBtns);

    this.modeWrap.hidden = !s.hasOffsets;
    if (s.hasOffsets) {
      const parts = s.stages.filter(st => s.offsets[st.id]).map(st => st.label + ' ' + fmtDb(s.offsets[st.id]));
      this.modeNote.textContent = 'Standard: gleiche Lautstärke, du hörst nur den Klangunterschied. ' +
        'Original: Pegel wie in der Produktion (' + parts.join(', ') + ').';
    }
    if (!s.hasOffsets) this.mode = 'equal';
    this.active = Math.min(this.active, s.stages.length - 1);
    this.renderStage();
    this.renderMode();
    this.renderTransport();
    this.draw();
  }

  renderStage() {
    const st = this.song.stages[this.active];
    this.stageBtns.forEach((b, i) => {
      const on = i === this.active;
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    this.hintEl.textContent = st.hint;
    this.root.style.setProperty('--abp-color', st.color);
  }

  renderMode() {
    this.modeBtns.forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === this.mode ? 'true' : 'false'));
  }

  renderTransport() {
    const text = this.playBtn.querySelector('.abp-play-text');
    let label;
    if (this.state === 'loading') label = 'Lädt …';
    else if (this.state !== 'ready') label = 'Laden & abspielen';
    else label = this.playing ? 'Pause' : 'Abspielen';
    text.textContent = label;
    // Hinweis auf das Datenvolumen, nur vor dem Laden und nur mit sizeMB in songs.json
    const size = this.playBtn.querySelector('.abp-play-size');
    const mb = this.song.sizeMB;
    size.hidden = !(mb && this.state !== 'ready' && this.state !== 'loading');
    size.textContent = mb ? 'lädt ca. ' + (mb >= 10 ? Math.round(mb) : String(Math.round(mb * 10) / 10).replace('.', ',')) + ' MB' : '';
    this.playBtn.classList.toggle('is-playing', this.playing);
    this.playBtn.classList.toggle('is-idle', this.state !== 'ready');
    this.root.classList.toggle('is-idle', this.state !== 'ready');
    this.playBtn.disabled = this.state === 'loading';
    this.seek.disabled = this.state !== 'ready';
    this.waveEmpty.hidden = this.state === 'ready';
    this.updateTime();
  }

  updateTime() {
    const pos = this.position();
    const dur = this.duration || 0;
    this.timeEl.textContent = fmtTime(pos) + ' / ' + (dur ? fmtTime(dur) : '–:––');
    if (!this.dragging && dur) this.seek.value = String(Math.round(pos / dur * 1000));
    this.seek.setAttribute('aria-valuetext', fmtTime(pos) + ' von ' + (dur ? fmtTime(dur) : 'unbekannt'));
  }

  setStatus(msg) { this.status.textContent = msg || ''; }

  showError(msg) {
    this.error.textContent = '';
    if (!msg) { this.error.hidden = true; return; }
    const retry = el('button', { type: 'button', class: 'abp-chip', text: 'Erneut versuchen' });
    retry.addEventListener('click', () => { this.showError(''); this.load(true); });
    this.error.append(el('p', { text: msg }), retry);
    this.error.hidden = false;
  }

  /* --- Bedienung --- */

  onKey(e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target;
    const isStage = t.getAttribute && t.getAttribute('role') === 'radio';
    const isRange = t.tagName === 'INPUT' && t.type === 'range';
    if (/^[1-4]$/.test(e.key)) {
      const i = Number(e.key) - 1;
      if (i < this.song.stages.length) { e.preventDefault(); this.setStage(i, isStage); }
      return;
    }
    if (e.key === ' ' && (isStage || isRange)) {
      e.preventDefault();
      this.togglePlay();
      return;
    }
    if (isStage) {
      const n = this.song.stages.length;
      let i = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') i = (this.active + 1) % n;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') i = (this.active - 1 + n) % n;
      else if (e.key === 'Home') i = 0;
      else if (e.key === 'End') i = n - 1;
      if (i !== null) { e.preventDefault(); this.setStage(i, true); }
    }
  }

  onPointer(e) {
    if (this.state !== 'ready') return;
    if (e.type === 'pointerdown') {
      this.dragging = true;
      try { this.canvas.setPointerCapture(e.pointerId); } catch (err) { /* egal */ }
    }
    const r = this.canvas.getBoundingClientRect();
    const x = Math.min(Math.max(0, e.clientX - r.left), r.width);
    this.seekTo(x / r.width * this.duration);
  }

  setStage(i, focus) {
    this.active = i;
    this.renderStage();
    if (focus) this.stageBtns[i].focus();
    this.applyStageGains(SWITCH_RAMP);
    this.draw();
  }

  setMode(mode) {
    this.mode = mode === 'original' && this.song.hasOffsets ? 'original' : 'equal';
    this.renderMode();
    this.applyStageGains(SWITCH_RAMP);
  }

  setLoop(on) {
    this.loop = on;
    this.loopBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (this.sources) {
      // Position festhalten, dann neu takten (loop lässt sich nicht exakt umschalten)
      const pos = this.position();
      if (this.playing) this.restart(pos);
      else this.offset = pos;
    }
  }

  setVolume(db) {
    this.volumeDb = Math.min(VOL_MAX_DB, Math.max(VOL_MIN_DB, db));
    this.vol.value = String(this.volumeDb);
    const txt = fmtDb(this.volumeDb);
    this.volOut.textContent = txt;
    this.vol.setAttribute('aria-valuetext', txt);
    if (this.nodes) rampTo(this.nodes.volume.gain, dbToGain(this.volumeDb), sharedCtx, VOLUME_RAMP);
  }

  stageTarget(i) {
    if (i !== this.active) return 0;
    const id = this.song.stages[i].id;
    return this.mode === 'original' ? dbToGain(this.song.offsets[id] || 0) : 1;
  }

  applyStageGains(dur) {
    if (!this.nodes) return;
    this.nodes.stageGains.forEach((g, i) => rampTo(g.gain, this.stageTarget(i), sharedCtx, dur));
  }

  selectSong(i) {
    const s = this.songs[i];
    if (!s || s === this.song) return;
    this.unload();
    this.song = s;
    this.active = 0;
    this.renderSong();
    this.setStatus(s.title + ' ausgewählt. Laden startet nach Klick auf „Laden & abspielen“.');
  }

  /* --- Laden --- */

  async togglePlay() {
    if (this.state === 'loading') return;
    if (this.state !== 'ready') {
      // AudioContext muss in der Nutzergeste entstehen bzw. fortgesetzt werden (iOS/Safari)
      const ctx = getCtx();
      if (!ctx) { this.fail('Dein Browser unterstützt die Web Audio API nicht. Bitte einen aktuellen Browser verwenden.'); return; }
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const ok = await this.load();
      if (ok) this.play();
      return;
    }
    if (this.playing) this.pause();
    else this.play();
  }

  fail(msg) {
    this.state = 'error';
    this.progress.hidden = true;
    this.setStatus('');
    this.showError(msg);
    this.renderTransport();
  }

  async load(fromRetry) {
    const ctx = getCtx();
    if (!ctx) { this.fail('Dein Browser unterstützt die Web Audio API nicht.'); return false; }
    if (fromRetry && ctx.state === 'suspended') ctx.resume().catch(() => {});
    const song = this.song;
    const token = ++this.loadToken;
    if (this.abort) this.abort.abort();
    const abort = this.abort = ('AbortController' in window) ? new AbortController() : null;
    this.state = 'loading';
    this.showError('');
    this.renderTransport();
    this.progress.hidden = false;
    const bar = this.progress.firstChild;
    bar.style.width = '0%';
    this.setStatus('Lade ' + song.stages.length + ' Audiodateien …');

    const n = song.stages.length;
    const loaded = new Array(n).fill(0);
    const totals = new Array(n).fill(0);
    let lastPct = -1;
    const report = () => {
      const t = totals.reduce((a, b) => a + b, 0);
      const l = loaded.reduce((a, b) => a + b, 0);
      // Solange nicht alle Größen bekannt sind, je Datei gleich gewichten
      const pct = totals.every(Boolean) && t
        ? l / t
        : loaded.reduce((a, b, i) => a + (totals[i] ? b / totals[i] : 0), 0) / n;
      const p = Math.min(99, Math.floor(pct * 90));
      bar.style.width = p + '%';
      if (p >= lastPct + 10 || p === 90) {
        lastPct = p;
        this.setStatus('Lade Audio … ' + p + ' %' + (t ? ' (' + (t / 1048576).toFixed(1).replace('.', ',') + ' MB)' : ''));
      }
    };

    try {
      const raw = await Promise.all(song.stages.map((st, i) => {
        const url = new URL(encodeURIComponent(song.dir) + '/' + encodeURIComponent(st.src), AUDIO_BASE);
        return fetchWithProgress(url, abort && abort.signal, (l, t) => {
          loaded[i] = l; totals[i] = t; report();
        });
      }));
      if (token !== this.loadToken) return false;
      this.setStatus('Dekodiere …');
      const buffers = [];
      for (let i = 0; i < n; i++) {
        try {
          buffers.push(await decode(ctx, raw[i]));
        } catch (e) {
          throw new LoadError('Die Datei ' + song.stages[i].src + ' konnte nicht dekodiert werden. ' +
            'Dein Browser spielt FLAC eventuell nicht ab (nötig: Safari/iOS ab Version 11, aktuelles Chrome, Firefox oder Edge).');
        }
        raw[i] = null; // komprimierte Daten sofort freigeben
        bar.style.width = (90 + Math.round((i + 1) / n * 10)) + '%';
        if (token !== this.loadToken) return false;
      }
      const lens = buffers.map(b => b.length);
      if (Math.max(...lens) - Math.min(...lens) > 1) {
        console.warn('[ab-player] Stufen von „' + song.id + '“ sind unterschiedlich lang (Samples):', lens);
      }
      this.buffers = buffers;
      this.duration = Math.min(...buffers.map(b => b.duration));
      this.peaks = computePeaks(buffers[buffers.length - 1], 2048);
      this.offset = 0;
      this.buildGraph(ctx);
      this.state = 'ready';
      this.progress.hidden = true;
      this.setStatus('Geladen. ' + song.stages.map((s, i) => (i + 1) + ' ' + s.label).join(', ') + '. Leertaste spielt und pausiert.');
      this.renderTransport();
      this.draw();
      return true;
    } catch (e) {
      if (e && e.name === 'AbortError') return false;
      if (token !== this.loadToken) return false;
      console.error('[ab-player]', e);
      this.unload(true);
      this.fail(e instanceof LoadError ? e.message : 'Der Ausschnitt konnte nicht geladen werden.');
      return false;
    }
  }

  buildGraph(ctx) {
    const volume = ctx.createGain();
    volume.gain.value = dbToGain(this.volumeDb);
    volume.connect(ctx.destination);
    const transport = ctx.createGain();
    transport.gain.value = 0;
    transport.connect(volume);
    const stageGains = this.buffers.map((b, i) => {
      const g = ctx.createGain();
      g.gain.value = this.stageTarget(i);
      g.connect(transport);
      return g;
    });
    this.nodes = { volume, transport, stageGains };
  }

  /* --- Transport --- */

  position() {
    if (!this.duration) return 0;
    if (!this.playing || !sharedCtx) return this.offset;
    let p = this.offset + (sharedCtx.currentTime - this.startedAt);
    if (this.loop) p %= this.duration;
    return Math.min(Math.max(0, p), this.duration);
  }

  startSources(offset, when) {
    const ctx = sharedCtx;
    const off = Math.min(Math.max(0, offset), Math.max(0, this.duration - 0.001));
    this.sources = this.buffers.map((buf, i) => {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = this.loop;
      if (this.loop) { src.loopStart = 0; src.loopEnd = this.duration; }
      src.connect(this.nodes.stageGains[i]);
      src.start(when, off);
      return src;
    });
    // Ende ohne Loop: an einer Quelle hängen (alle sind gleich lang)
    const first = this.sources[0];
    first.onended = () => {
      if (this.sources && this.sources[0] === first && this.playing && !this.loop) {
        this.playing = false;
        this.sources = null;
        this.offset = 0;
        stopRaf(this);
        this.renderTransport();
        this.draw();
      }
    };
    this.startedAt = when;
    this.offset = off;
  }

  stopSources(at) {
    if (!this.sources) return;
    for (const s of this.sources) {
      s.onended = null;
      try { s.stop(at); } catch (e) { /* schon gestoppt */ }
      // Trennen nach dem Stopp, damit der Graph aufgeräumt wird
      const t = Math.max(0, (at - sharedCtx.currentTime) * 1000) + 50;
      setTimeout(() => { try { s.disconnect(); } catch (e) { /* egal */ } }, t);
    }
    this.sources = null;
  }

  play() {
    if (this.state !== 'ready' || this.playing) return;
    const ctx = sharedCtx;
    for (const other of instances) if (other !== this) other.pause();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const when = ctx.currentTime + 0.02;
    let off = this.offset;
    if (off >= this.duration - 0.01) off = 0;
    this.startSources(off, when);
    const g = this.nodes.transport.gain;
    g.cancelScheduledValues(0);
    g.setValueAtTime(0, when);
    g.linearRampToValueAtTime(1, when + TRANSPORT_RAMP);
    this.playing = true;
    startRaf(this);
    this.renderTransport();
  }

  pause() {
    if (!this.playing) return;
    const ctx = sharedCtx;
    const pos = this.position();
    rampTo(this.nodes.transport.gain, 0, ctx, TRANSPORT_RAMP);
    this.stopSources(ctx.currentTime + TRANSPORT_RAMP + 0.005);
    this.playing = false;
    this.offset = pos;
    stopRaf(this);
    this.renderTransport();
    this.draw();
  }

  restart(pos) {
    const ctx = sharedCtx;
    const t = ctx.currentTime;
    const g = this.nodes.transport.gain;
    rampTo(g, 0, ctx, TRANSPORT_RAMP);
    const when = t + TRANSPORT_RAMP + 0.005;
    this.stopSources(when);
    this.startSources(pos, when);
    g.setValueAtTime(0, when);
    g.linearRampToValueAtTime(1, when + TRANSPORT_RAMP);
  }

  seekTo(sec) {
    if (this.state !== 'ready') return;
    const pos = Math.min(Math.max(0, sec), this.duration);
    if (this.playing) this.restart(pos);
    else this.offset = pos;
    this.updateTime();
    this.draw();
  }

  /* --- Aufräumen --- */

  unload(keepError) {
    this.loadToken++;
    if (this.abort) { this.abort.abort(); this.abort = null; }
    if (this.playing) this.pause();
    stopRaf(this);
    if (this.sources && sharedCtx) this.stopSources(sharedCtx.currentTime);
    if (this.nodes) {
      const n = this.nodes;
      setTimeout(() => {
        n.stageGains.forEach(g => { try { g.disconnect(); } catch (e) { /* egal */ } });
        try { n.transport.disconnect(); n.volume.disconnect(); } catch (e) { /* egal */ }
      }, 80);
    }
    this.nodes = null;
    this.buffers = null;
    this.peaks = null;
    this.duration = 0;
    this.offset = 0;
    this.playing = false;
    this.state = 'idle';
    this.progress.hidden = true;
    if (!keepError) this.showError('');
    this.setStatus('');
    this.renderTransport();
    this.draw();
  }

  destroy() {
    this.unload();
    if (this.ro) this.ro.disconnect();
    instances.delete(this);
  }

  /* --- Wellenform --- */

  draw() {
    const c = this.canvas;
    const w = c.clientWidth;
    const h = c.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const W = Math.round(w * dpr);
    const H = Math.round(h * dpr);
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    const g = c.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, W, H);
    const color = this.song.stages[this.active].color;
    const mid = H / 2;
    if (!this.peaks) {
      g.fillStyle = withAlpha(color, 0.35);
      g.fillRect(0, Math.round(mid), W, Math.max(1, Math.round(dpr)));
      return;
    }
    const peaks = this.peaks;
    const prog = this.duration ? this.position() / this.duration : 0;
    const bar = Math.max(1, Math.round(2 * dpr));
    const gap = Math.max(1, Math.round(1 * dpr));
    const step = bar + gap;
    const cols = Math.floor(W / step);
    const playedX = prog * W;
    for (let x = 0; x < cols; x++) {
      const a = Math.floor(x / cols * peaks.length);
      const b = Math.max(a + 1, Math.floor((x + 1) / cols * peaks.length));
      let v = 0;
      for (let k = a; k < b; k++) if (peaks[k] > v) v = peaks[k];
      const bh = Math.max(dpr, v * (H - 2 * dpr));
      const px = x * step;
      g.fillStyle = px + bar <= playedX ? color : withAlpha(color, 0.38);
      g.fillRect(px, mid - bh / 2, bar, bh);
    }
    // Abspielposition
    g.fillStyle = '#f3e7c8';
    g.fillRect(Math.min(W - dpr, Math.round(playedX)), 0, Math.max(1, Math.round(dpr)), H);
  }
}

function computePeaks(buffer, n) {
  const chans = [];
  for (let c = 0; c < buffer.numberOfChannels; c++) chans.push(buffer.getChannelData(c));
  const len = buffer.length;
  const peaks = new Float32Array(n);
  let max = 0;
  for (let i = 0; i < n; i++) {
    const a = Math.floor(i / n * len);
    const b = Math.floor((i + 1) / n * len);
    let p = 0;
    for (const d of chans) {
      for (let k = a; k < b; k += 4) { // jedes 4. Sample genügt für die Optik
        const v = d[k] < 0 ? -d[k] : d[k];
        if (v > p) p = v;
      }
    }
    peaks[i] = p;
    if (p > max) max = p;
  }
  if (max > 0) for (let i = 0; i < n; i++) peaks[i] /= max;
  return peaks;
}

function withAlpha(hex, a) {
  let h = hex.replace('#', '');
  if (h.length === 3 || h.length === 4) h = h.split('').map(ch => ch + ch).join('');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

function startRaf(p) {
  stopRaf(p);
  let last = 0;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tick = now => {
    if (!p.playing) return;
    // Bei reduzierter Bewegung nur ca. 4× pro Sekunde aktualisieren
    if (!reduce || now - last > 250) {
      last = now;
      p.updateTime();
      p.draw();
    }
    p.raf = requestAnimationFrame(tick);
  };
  p.raf = requestAnimationFrame(tick);
}

function stopRaf(p) {
  if (p.raf) cancelAnimationFrame(p.raf);
  p.raf = 0;
}

/* ---------- Start ---------- */

function hideMount(mount) {
  const section = mount.closest('[data-ab-player-section]');
  (section || mount).hidden = true;
}

// Deep Link (#vorher-nachher): Bereich mit dem Player fokussieren, ohne zu springen
function focusFromHash(mounts) {
  if (location.hash.length < 2) return;
  let target = null;
  try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) { return; }
  if (!target || target.hidden) return;
  if (!mounts.some(m => target === m || target.contains(m))) return;
  const focusEl = target.querySelector('h2, h3, [data-ab-focus]') || target;
  if (!focusEl.hasAttribute('tabindex')) focusEl.setAttribute('tabindex', '-1');
  target.scrollIntoView({ block: 'start' });
  focusEl.focus({ preventScroll: true });
}

async function init() {
  const mounts = Array.from(document.querySelectorAll('[data-ab-player]'));
  if (!mounts.length) return;

  let songs;
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    songs = normalizeSongs(await res.json());
  } catch (e) {
    console.error('[ab-player] songs.json nicht lesbar:', e);
    mounts.forEach(hideMount);
    return;
  }

  const live = [];
  for (const mount of mounts) {
    const list = resolveMount(mount.getAttribute('data-ab-player'), songs);
    if (!list.length) { hideMount(mount); continue; }
    const start = () => {
      if (mount._abp) return;
      mount._abp = new ABPlayer(mount, list);
    };
    // In einem zugeklappten <details>: erst beim Öffnen aufbauen, beim Schließen entladen
    const details = mount.closest('details');
    if (details) {
      if (details.open) start();
      details.addEventListener('toggle', () => {
        if (details.open) start();
        else if (mount._abp) mount._abp.unload();
      });
    } else {
      start();
    }
    live.push(mount);
  }

  if (live.length) {
    // Nicht bei Reload/Zurück: dort stellt der Browser die alte Scrollposition wieder her
    const navEntry = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    const navType = navEntry ? navEntry.type : 'navigate';
    if (navType === 'reload' || navType === 'back_forward') {
      window.addEventListener('hashchange', () => focusFromHash(live));
      return;
    }
    focusFromHash(live);
    window.addEventListener('hashchange', () => focusFromHash(live));
    // Webfonts verschieben das Layout nach dem Hash-Sprung: Ziel einmal nachziehen,
    // solange der Nutzer noch nicht selbst gescrollt hat
    if (location.hash.length > 1 && document.fonts && document.fonts.ready) {
      let moved = false;
      const mark = () => { moved = true; };
      ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(ev => window.addEventListener(ev, mark, { once: true, passive: true }));
      document.fonts.ready.then(() => { if (!moved) focusFromHash(live); });
    }
  }
}

// Seite verlassen: Ton aus, Speicher frei, AudioContext schließen
window.addEventListener('pagehide', () => {
  for (const p of instances) p.unload();
  if (sharedCtx && sharedCtx.state !== 'closed') {
    sharedCtx.close().catch(() => {});
    sharedCtx = null;
  }
});

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
