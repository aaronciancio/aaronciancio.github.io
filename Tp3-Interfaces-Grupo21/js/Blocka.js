// ../js/blocka.js
// Blocka Sinisters – 3 niveles con selección animada en canvas
// Fondo persistente borroso, HUD lateral removido, botones amarillos con radius 15
// Carga asíncrona con onload/Promise y filtros de imagen en bajo nivel (doble for)

(() => {
  // ---------- DOM ----------
  const canvas = document.getElementById('blocka');
  if (!canvas) { console.warn('No se encontró #blocka'); return; }
  const ctx = canvas.getContext('2d');
  
  const BG_SRC = '../images_cards/Blocka/6Siniestros.jfif'; // fondo borroso
  const SELECT_GRID = [6, 1]; // carrusel 6x1
  const LEVELS = [
    { grid: [2, 2], timeLimitMs: 0 },          // Nivel 1: sin límite
    { grid: [3, 2], timeLimitMs: 60 * 1000 },  // Nivel 2: 60s
    { grid: [4, 2], timeLimitMs: 30 * 1000 },  // Nivel 3: 30s
  ];

  const TIMING = {
    introToSelect: 900,
    thumbStagger: 110,
    glowPerThumb: 220,
    glowPasses: 2,
    focusPause: 900,
    selectToLevel: 600
  };

  // penalización/beneficio por usar la ayudita (ms)
  const HELP_PENALTY_MS = 5 * 1000;

  // ---------- Tamaño / HiDPI ----------
  let cssW = canvas.getAttribute('width');
  let cssH = canvas.getAttribute('height');

  window.addEventListener('load', () => { draw(); });

  // ---------- Utilidades ----------
  const randInt = (n) => Math.floor(Math.random() * n);
  const now = () => performance.now();
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => t*t*(3 - 2*t); // smoothstep
  const formatMs = (ms) => {
    const sTot = Math.floor(ms/1000);
    const m = Math.floor(sTot/60);
    const s = sTot % 60;
    const cs = Math.floor((ms % 1000)/10);
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;
  };

  function roundRectPath(x, y, w, h, r) {
    const rr = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+rr, y);
    ctx.arcTo(x+w, y, x+w, y+h, rr);
    ctx.arcTo(x+w, y+h, x, y+h, rr);
    ctx.arcTo(x, y+h, x, y, rr);
    ctx.arcTo(x, y, x+w, y, rr);
    ctx.closePath();
  }
  
  function coverToSquare(img, size) {
    const s = Math.max(size / img.width, size / img.height);
    const dw = img.width * s;
    const dh = img.height * s;
    return { dw, dh, dx: -dw/2, dy: -dh/2 };
  }

  function getContainRect(img, dstRect) {
    const rImg = img.width / img.height;
    const rDst = dstRect.w / dstRect.h;
    let dw, dh, dx, dy;
    if (rImg > rDst) {
      dw = dstRect.w;
      dh = dw / rImg;
      dx = dstRect.x;
      dy = dstRect.y + (dstRect.h - dh)/2;
    } else {
      dh = dstRect.h;
      dw = dh * rImg;
      dx = dstRect.x + (dstRect.w - dw)/2;
      dy = dstRect.y;
    }
    return { x: dx, y: dy, w: dw, h: dh };
  }
  
  // ---------- Recursos ----------
  function getPlayableSources() {
    let srcs = [
      '../images_cards/Blocka/DoctorOctopus.jpg',
      '../images_cards/Blocka/Electro.webp',
      '../images_cards/Blocka/GreenGoblin.jpeg',
      '../images_cards/Blocka/Kraven.webp',
      '../images_cards/Blocka/Mysterio.png',
      '../images_cards/Blocka/Vulture.jpg',
    ];
    return srcs.slice(0, 6);
  }

  //Carga de Varias Imagenes
  function loadImagesAsync(srcs) {
    return Promise.all(
      srcs.map(src => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = src;
      }))
    );
  }

  //Carga de Una Imagen
  function loadImageAsync(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });
  }
  
  const SOURCES = getPlayableSources();
  let IMGS = [];         // se carga asíncrona
  let bgImg = null;      // se carga asíncrona

  // Fondo offscreen
  let bgOff = document.createElement('canvas');
  let bgOffCtx = bgOff.getContext('2d');
  let bgReady = false;
  let bgDirty = true;

  function paintBlurredBackgroundOffscreen() {
    if (!bgImg) return;
    if (!bgImg.complete) return;
    bgOff.width = Math.max(1, Math.round(cssW));
    bgOff.height = Math.max(1, Math.round(cssH));
    bgOffCtx.setTransform(1,0,0,1,0,0);
    bgOffCtx.filter = 'blur(12px)';

    const rImg = bgImg.width / bgImg.height;
    const rCanvas = bgOff.width / bgOff.height;
    let dw, dh, dx, dy;
    if (rImg > rCanvas) {
      dh = bgOff.height; dw = dh * rImg; dx = -(dw - bgOff.width) / 2; dy = 0;
    } else {
      dw = bgOff.width; dh = dw / rImg; dx = 0; dy = -(dh - bgOff.height) / 2;
    }
    bgOffCtx.drawImage(bgImg, dx, dy, dw, dh);
    bgOffCtx.filter = 'none';
    bgOffCtx.fillStyle = 'rgba(0,0,0,0.22)';
    bgOffCtx.fillRect(0,0,bgOff.width,bgOff.height);
    bgReady = true;
    bgDirty = false;
  }

  // ---------- Filtros (bajo nivel, doble for sobre ImageData) ----------
  function clamp255(v) { return Math.max(0, Math.min(255, v|0)); }

  function forEachPixelDoubleFor(imageData, fn) {
    const { width: w, height: h, data } = imageData;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4; // RGBA
        const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
        const out = fn(r, g, b, a, x, y, w, h);
        data[i]   = clamp255(out.r);
        data[i+1] = clamp255(out.g);
        data[i+2] = clamp255(out.b);
        data[i+3] = out.a === undefined ? a : clamp255(out.a);
      }
    }
  }

  // 1) Brillo +30%
  function filterBrightness30(imageData) {
    const factor = 1.3; // si quisieras oscurecer, usar 0.7
    forEachPixelDoubleFor(imageData, (r,g,b,a) => ({ r: r*factor, g: g*factor, b: b*factor, a }));
  }

  // 2) Escala de grises (luma perceptual)
  function filterGrayscale(imageData) {
    forEachPixelDoubleFor(imageData, (r,g,b,a) => {
      const y = 0.299*r + 0.587*g + 0.114*b;
      return { r: y, g: y, b: y, a };
    });
  }
  
  // 3) Negativo
  function filterNegative(imageData) {
    forEachPixelDoubleFor(imageData, (r,g,b,a) => ({ r: 255-r, g: 255-g, b: 255-b, a }));
  }

  // Genera copia filtrada con dimensiones nativas de la imagen
  function makeFilteredCopySameSize(img, levelIdx) {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    const octx = off.getContext('2d');

    // Base
    octx.drawImage(img, 0, 0, w, h);

    // Leer píxeles
    const id = octx.getImageData(0, 0, w, h);

    // Aplicar filtro del nivel
    switch (levelIdx) {
      case 0: filterBrightness30(id); break;
      case 1: filterGrayscale(id); break;
      case 2: filterNegative(id); break;
    }

    // Escribir de vuelta
    octx.putImageData(id, 0, 0);

    // Devolvemos el canvas offscreen ya "horneado"
    return off;
  }

  // ---------- Estado ----------
  const STATE = {
    screen: 'intro',       // intro → select → level → win → end → lose
    levelIndex: 0,
    pool: [],              // se llena con ...IMGS cuando termine la carga
    currentImg: null,
    currentImgFiltered: null, // copia horneada con el filtro del nivel
    rotations: [],
    playing: false,
    solved: false,
    startTime: 0,
    elapsedMs: 0,
    rafId: null,
    // ayudita / piezas bloqueadas
    lockedIndices: [],     // indices ya fijados por la ayudita
    helpUsed: false,
    // selección
    selection: {
      cells: [],           // { img, x,y,w,h, delay }
      glowIndex: -1,
      chosenIdx: -1,
      startedAt: 0,
      focusing: false,
      focusStart: 0
    },
    // botones
    buttons: {
      play:   {x:0,y:0,w:0,h:0, text:'JUGAR'},
      next:   {x:0,y:0,w:0,h:0, text:'SIGUIENTE NIVEL'},
      again:  {x:0,y:0,w:0,h:0, text:'JUGAR NUEVAMENTE'},
      retry:  {x:0,y:0,w:0,h:0, text:'REINTENTAR NIVEL'},
      help:   {x:0,y:0,w:0,h:0, text:'AYUDITA'},
    }
  };

  // ---------- Timer ----------
  function startTimer() { stopTimer(); STATE.startTime = now(); STATE.rafId = requestAnimationFrame(tick); }
  function stopTimer() { if (STATE.rafId) cancelAnimationFrame(STATE.rafId); STATE.rafId = null; }
  function tick(ts) {
    if (STATE.playing) {
      STATE.elapsedMs = ts - STATE.startTime;
      const curLimit = (LEVELS[STATE.levelIndex] && LEVELS[STATE.levelIndex].timeLimitMs) || 0;
      if (curLimit > 0 && STATE.elapsedMs >= curLimit) {
        STATE.elapsedMs = curLimit;
        STATE.playing = false;
        stopTimer();
        goLose();
        return;
      }
      draw();
      STATE.rafId = requestAnimationFrame(tick);
    }
  }

  // ---------- Navegación ----------
  function goIntro() { STATE.screen = 'intro'; draw(); }

  function goSelect() {
    STATE.screen = 'select';
    buildSelectionGrid();
    STATE.selection.glowIndex = -1;
    STATE.selection.chosenIdx = -1;
    STATE.selection.startedAt = now();
    STATE.selection.focusing = false;
    STATE.selection.focusStart = 0;

    setTimeout(() => runGlowRunner(() => {
      STATE.selection.chosenIdx = randInt(STATE.selection.cells.length);
      STATE.selection.focusing = true;
      STATE.selection.focusStart = now();
      draw();
      setTimeout(() => {
        const img = STATE.selection.cells[STATE.selection.chosenIdx].img;
        const idxPool = STATE.pool.indexOf(img);
        if (idxPool >= 0) STATE.pool.splice(idxPool,1);
        STATE.currentImg = img;
        setTimeout(() => goLevel(), TIMING.selectToLevel);
      }, TIMING.focusPause);
    }), TIMING.introToSelect);
  }

  function goLevel() {
    STATE.screen = 'level';
    initLevel(STATE.levelIndex);

    // Hornear imagen filtrada en bajo nivel (doble for) para este nivel
    STATE.currentImgFiltered = makeFilteredCopySameSize(STATE.currentImg, STATE.levelIndex);

    STATE.playing = true;
    startTimer();
    draw();
  }

  function goWin() {
    STATE.screen = 'win';
    STATE.playing = false;
    stopTimer();
    draw();
  }

  function goLose() {
    STATE.screen = 'lose';
    STATE.playing = false;
    stopTimer();
    draw();
  }

  // ---------- Selección (carrusel centrado, 200x200) ----------
  function buildSelectionGrid() {
    const maxCols = SELECT_GRID[0]; // 6
    const size = 200;
    const gap  = 25;

    const imgs = STATE.pool.slice(0, Math.min(maxCols, STATE.pool.length));
    const count = imgs.length;

    const totalW = count * size + Math.max(0, count - 1) * gap;
    const startX = Math.max(0, (cssW - totalW) / 2);
    const startY = (cssH - size) / 2;

    STATE.selection.cells = [];
    for (let i = 0; i < count; i++) {
      STATE.selection.cells.push({
        img: imgs[i],
        x: startX + i * (size + gap),
        y: startY,
        w: size,
        h: size,
        delay: i * TIMING.thumbStagger
      });
    }
  }

  function runGlowRunner(done) {
    const totalThumbs = STATE.selection.cells.length;
    const perThumb = TIMING.glowPerThumb;
    const passes = Math.max(1, TIMING.glowPasses);

    function shuffled(n) {
      const a = Array.from({ length: n }, (_, i) => i);
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    const sequence = [];
    for (let p = 0; p < passes; p++) {
      if (totalThumbs > 1) sequence.push(...shuffled(totalThumbs));
      else sequence.push(0);
    }

    let step = 0;
    function advance() {
      if (step >= sequence.length) {
        STATE.selection.glowIndex = -1;
        draw();
        done && done();
        return;
      }
      STATE.selection.glowIndex = sequence[step++];
      draw();
      setTimeout(advance, perThumb);
    }
    advance();
  }

  // ---------- Lógica de nivel ----------
  function initLevel(levelIdx) {
    const [gx, gy] = LEVELS[levelIdx].grid;
    STATE.rotations = new Array(gx*gy).fill(0).map(()=>randInt(4));
    if (STATE.rotations.every(r=>r===0)) STATE.rotations[randInt(gx*gy)] = 1;
    STATE.solved = false;
    STATE.elapsedMs = 0;
    STATE.lockedIndices = [];
    STATE.helpUsed = false;
  }
  function isSolved() { return STATE.rotations.every(r => r === 0); }
  function rotateAt(index, dir) {
    // si la pieza está bloqueada por la ayudita, no permitir rotarla
    if (STATE.lockedIndices.includes(index)) return;
    STATE.rotations[index] = (STATE.rotations[index] + (dir===-1?3:1)) % 4;
  }

  // Aplica la ayudita: fija una subimagen correcta y aplica penalización
  function applyHelp() {
     if (STATE.helpUsed || STATE.screen !== 'level' || STATE.solved) return;
     // elegir piezas desalineadas no bloqueadas
     const candidates = STATE.rotations
       .map((r,i)=>({r,i}))
       .filter(o => !STATE.lockedIndices.includes(o.i) && o.r !== 0)
       .map(o => o.i);
     const anyCandidates = candidates.length ? candidates :
       STATE.rotations.map((_,i)=>i).filter(i => !STATE.lockedIndices.includes(i));
     if (anyCandidates.length === 0) return;
     const chosen = anyCandidates[randInt(anyCandidates.length)];
     // fijar correctamente
     STATE.rotations[chosen] = 0;
     STATE.lockedIndices.push(chosen);
     STATE.helpUsed = true;
    // aumentar elapsedMs (funciona tanto para niveles sin límite — counter up — como con límite — countdown se reduce)
    STATE.elapsedMs += HELP_PENALTY_MS;
    // aplicar penalización de 5s ajustando startTime (evita que tick sobrescriba elapsedMs)
    STATE.startTime = (STATE.startTime || now()) - HELP_PENALTY_MS;
    // recalcular elapsedMs ahora para que draw() y las comprobaciones usen el valor actualizado
    STATE.elapsedMs = now() - STATE.startTime;
    console.log(`Ayudita aplicada en índice ${chosen}, +${HELP_PENALTY_MS}ms -> elapsedMs=${STATE.elapsedMs}ms`);
     // si hay límite, comprobar pérdida inmediata
    const curLimit = LEVELS[STATE.levelIndex]?.timeLimitMs ?? 0;
     if (curLimit > 0 && STATE.elapsedMs >= curLimit) {
       STATE.elapsedMs = curLimit;
       STATE.playing = false;
       stopTimer();
       goLose();
       return;
     }
     // si quedó resuelto, ganar
     if (isSolved()) { STATE.solved = true; setTimeout(goWin, 180); return; }
     draw();
  }

  // ---------- Layout puzzle centrado (sin HUD de columna) ----------
  function getLayoutRects() {
    const pad = 24;
    const maxW = Math.min(cssW * 0.70, cssW - pad*2);
    const maxH = Math.min(cssH * 0.75, cssH - pad*2);
    const puzzleRect = {
      x: (cssW - maxW) / 2,
      y: (cssH - maxH) / 2,
      w: maxW,
      h: maxH
    };
    return { hudRect: null, puzzleRect };
  }

  // ---------- Interacción ----------
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  function hitButton(x,y,btn) { return x>=btn.x && x<=btn.x+btn.w && y>=btn.y && y<=btn.y+btn.h; }

  function puzzlePickIndex(x,y) {
    const { puzzleRect } = getLayoutRects();
    const level = LEVELS[STATE.levelIndex];
    const [gx, gy] = level.grid;

    let baseImg;
    if (STATE.solved) {
      baseImg = STATE.currentImg;
    } else {
      if (STATE.currentImgFiltered) {
        baseImg = STATE.currentImgFiltered;
      } else {
        baseImg = STATE.currentImg;
      }
    }
    const { x:dx, y:dy, w:dw, h:dh } = getContainRect(baseImg, puzzleRect);
    if (x<dx || x>dx+dw || y<dy || y>dy+dh) return -1;

    const cellW = dw / gx;
    const cellH = dh / gy;
    const cx = Math.floor((x - dx) / cellW);
    const cy = Math.floor((y - dy) / cellH);
    return cy*gx + cx;
  }

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;

    if (STATE.screen === 'intro') {
      if (hitButton(x,y,STATE.buttons.play)) goSelect();
      return;
    }
    if (STATE.screen === 'win') {
      if (STATE.levelIndex < LEVELS.length - 1) {
        if (hitButton(x,y,STATE.buttons.next)) { STATE.levelIndex++; goSelect(); }
      } else {
        if (hitButton(x,y,STATE.buttons.again)) {
          STATE.levelIndex = 0; STATE.pool = [...IMGS]; goIntro();
        }
      }
      return;
    }
    if (STATE.screen === 'lose') {
      if (hitButton(x,y,STATE.buttons.retry)) {
        goLevel();
      }
      return;
    }
    if (STATE.screen === 'level') {
      // ayuda
      if (hitButton(x,y,STATE.buttons.help)) { applyHelp(); return; }
    }
    if (STATE.screen !== 'level') return;

    const idx = puzzlePickIndex(x,y);
    if (idx < 0) return;
    const dir = (e.button === 2) ? +1 : -1;
    rotateAt(idx, dir);
    if (isSolved()) { STATE.solved = true; setTimeout(goWin, 180); } else draw();
  });

  // ---------- Dibujo ----------
  function drawBackground() {
    if (bgDirty) paintBlurredBackgroundOffscreen();
    if (bgReady) {
      ctx.drawImage(bgOff, 0, 0, bgOff.width, bgOff.height, 0, 0, cssW, cssH);
    } else {
      ctx.fillStyle = '#0E1116';
      ctx.fillRect(0,0,cssW,cssH);
    }
  }

  function drawButton(btn, label) {
    const w = clamp(cssW * 0.36, 220, 420);
    const h = clamp(cssH * 0.10, 52, 64);
    btn.w = w; btn.h = h; 
    btn.x = (cssW - w) / 2; 
    btn.y = cssH * 0.5 + 32;

    roundRectPath(btn.x, btn.y, w, h, 15);
    ctx.fillStyle = '#FFEB3B';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFEB3B';
    ctx.stroke();

    ctx.font = '700 22px Poppins, sans-serif';
    ctx.fillStyle = '#0E1116';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, btn.x + w/2, btn.y + h/2);
  }

  function drawIntro() {
    drawBackground();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFEB3B';

    ctx.font = '600 20px Poppins, sans-serif';
    ctx.fillText('RESUELVE 3 IMÁGENES ALEATORIAS', cssW/2, cssH*0.5 - 24);

    drawButton(STATE.buttons.play, 'JUGAR');
  }

  function drawSelection() {
    drawBackground();

    const tNow = now();
    const glowIdx = STATE.selection.glowIndex;
    const focusing = STATE.selection.focusing;
    const chosenIdx = STATE.selection.chosenIdx;

    STATE.selection.cells.forEach((cell, idx) => {
      const appearT = clamp((tNow - STATE.selection.startedAt - cell.delay) / 450, 0, 1);
      const baseS = lerp(0.85, 1.0, ease(appearT));

      let extraS = 0;
      if (focusing && idx === chosenIdx) {
        const t = (tNow - STATE.selection.focusStart) / 1000;
        extraS = 0.08 * Math.sin(t * 6.283);
      }

      const size = cell.w;
      const x = cell.x + size/2, y = cell.y + size/2;
      const drawSize = size * (baseS + extraS);

      ctx.save();
      ctx.translate(x, y);

      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = 18;

      roundRectPath(-drawSize/2, -drawSize/2, drawSize, drawSize, 10);
      ctx.clip();

      const im = cell.img;
      const { dw, dh, dx, dy } = coverToSquare(im, drawSize);
      ctx.drawImage(im, dx, dy, dw, dh);
      ctx.restore();

      ctx.save();
      ctx.translate(x, y);
      roundRectPath(-drawSize/2, -drawSize/2, drawSize, drawSize, 10);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      if (glowIdx === idx && !focusing) {
        ctx.save();
        ctx.translate(x, y);
        roundRectPath(-drawSize/2, -drawSize/2, drawSize, drawSize, 12);
        ctx.strokeStyle = 'rgba(255,235,59,0.85)';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
      }

      if (focusing && idx === chosenIdx) {
        ctx.save();
        ctx.translate(x, y);
        roundRectPath(-drawSize/2, -drawSize/2, drawSize, drawSize, 12);
        ctx.strokeStyle = 'rgba(255,235,59,0.95)';
        ctx.lineWidth = 5;
        ctx.shadowBlur = 18;
        ctx.shadowColor = 'rgba(255,235,59,0.75)';
        ctx.stroke();
        ctx.restore();
      }
    });
    requestAnimationFrame(draw);
  }

  function drawLevel() {
    drawBackground();

    const { puzzleRect } = getLayoutRects();

    // HUD textual
    ctx.save();
    ctx.beginPath();
    roundRectPath(12, 12, 280, 100, 10);
    ctx.fillStyle = '#FFEB3B';
    ctx.fill();

    ctx.fillStyle = '#0E1116';
    ctx.textAlign = 'left';
    ctx.font = '700 22px Poppins, sans-serif';
    const baseX = 24, baseY = 32;
    ctx.fillText(`Nivel ${STATE.levelIndex+1}/3`, baseX, baseY);

    ctx.font = '600 18px Poppins, sans-serif';
    const timeLimit = (LEVELS[STATE.levelIndex] && LEVELS[STATE.levelIndex].timeLimitMs) || 0;
    if (timeLimit > 0) {
      const remaining = Math.max(0, timeLimit - STATE.elapsedMs);
      ctx.fillText(`Tiempo restante: ${formatMs(remaining)}`, baseX, baseY + 28);
    } else {
      ctx.fillText(`Tiempo: ${formatMs(STATE.elapsedMs)}`, baseX, baseY + 28);
    }

    ctx.font = '500 14px Poppins, sans-serif';
    const instr = 'Controles: Click izq ↶ · Click der ↷';
    ctx.fillText(instr, baseX, baseY + 28 + 24);
    ctx.restore();

  // dibujar botón Ayudita (arriba-derecha)
  const helpBtn = STATE.buttons.help;
  {
    const w = clamp(cssW * 0.18, 110, 200);
    const h = clamp(cssH * 0.07, 36, 48);
    helpBtn.w = w; helpBtn.h = h;
    helpBtn.x = cssW - w - 18;
    helpBtn.y = 18;

    roundRectPath(helpBtn.x, helpBtn.y, w, h, 10);
    ctx.fillStyle = STATE.helpUsed ? 'rgba(160,160,160,0.9)' : '#FFEB3B';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = STATE.helpUsed ? 'rgba(120,120,120,0.9)' : '#FFEB3B';
    ctx.stroke();
    ctx.font = '700 14px Poppins, sans-serif';
    ctx.fillStyle = STATE.helpUsed ? '#222' : '#0E1116';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(helpBtn.text, helpBtn.x + w/2, helpBtn.y + h/2);
  }

    // Fuente: si está resuelto, original; si no, la copia filtrada
    const baseImg = STATE.solved ? STATE.currentImg : (STATE.currentImgFiltered || STATE.currentImg);
    const [gx, gy] = LEVELS[STATE.levelIndex].grid;

    const { x:dx, y:dy, w:dw, h:dh } = getContainRect(baseImg, puzzleRect);

    const sw = baseImg.width / gx;
    const sh = baseImg.height / gy;
    const cellW = dw / gx;
    const cellH = dh / gy;

    // SIN ctx.filter (ya está horneado)
    for (let r=0; r<gy; r++) {
      for (let c=0; c<gx; c++) {
        const idx = r*gx + c;
        const rot = STATE.rotations[idx];
        const sx = c*sw, sy = r*sh;
        const tx = dx + c*cellW, ty = dy + r*cellH;
 
        ctx.save();
        ctx.translate(tx + cellW/2, ty + cellH/2);
        ctx.rotate(rot * Math.PI/2);
        if (rot % 2 === 0) {
          ctx.drawImage(baseImg, sx, sy, sw, sh, -cellW/2, -cellH/2, cellW, cellH);
        } else {
          ctx.drawImage(baseImg, sx, sy, sw, sh, -cellH/2, -cellW/2, cellH, cellW);
        }
        ctx.restore();

        // dibujar indicador de pieza bloqueada por la ayudita
        if (STATE.lockedIndices.includes(idx)) {
          ctx.save();
          const pad = 6;
          const lockSize = Math.min(cellW, cellH) * 0.14;
          const lx = tx + cellW - lockSize - pad;
          const ly = ty + pad;
          roundRectPath(lx - 2, ly - 2, lockSize + 4, lockSize + 4, 6);
          ctx.fillStyle = 'rgba(0,0,0,0.55)';
          ctx.fill();
          ctx.font = `${Math.round(lockSize*0.9)}px Poppins, sans-serif`;
          ctx.fillStyle = '#FFEB3B';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🔒', lx + lockSize/2, ly + lockSize/2);
          ctx.restore();
        }
      }
    }

    // grid sutil
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    for (let i=1; i<gx; i++) { ctx.beginPath(); ctx.moveTo(dx + i*cellW, dy); ctx.lineTo(dx + i*cellW, dy + dh); ctx.stroke(); }
    for (let j=1; j<gy; j++) { ctx.beginPath(); ctx.moveTo(dx, dy + j*cellH); ctx.lineTo(dx + dw, dy + j*cellH); ctx.stroke(); }
  }

  function drawWin() {
    // mostrar puzzle como quedó
    drawLevel();

    // overlay suave
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0,0,cssW,cssH);

    // centrado respecto a la imagen
    const { puzzleRect } = getLayoutRects();
    const imgRect = getContainRect(STATE.currentImg, puzzleRect);
    const cx = imgRect.x + imgRect.w/2;

    // título
    ctx.textAlign = 'center';
    ctx.font = '700 34px Poppins, sans-serif';
    ctx.fillStyle = '#FFEB3B';
    ctx.fillText('¡RESUELTO!', cx, imgRect.y + imgRect.h * 0.35);

    // tiempo
    ctx.font = '600 20px Poppins, sans-serif';
    ctx.fillStyle = '#FFEB3B';
    ctx.fillText(`Tiempo: ${formatMs(STATE.elapsedMs)}`, cx, imgRect.y + imgRect.h * 0.35 + 40);

    // botón
    const btn = (STATE.levelIndex < LEVELS.length - 1) ? STATE.buttons.next : STATE.buttons.again;
    const label = (STATE.levelIndex < LEVELS.length - 1) ? 'SIGUIENTE NIVEL' : 'JUGAR NUEVAMENTE';

    const w = clamp(cssW * 0.36, 220, 420);
    const h = clamp(cssH * 0.10, 52, 64);
    btn.w = w; btn.h = h;
    btn.x = cx - w/2;
    btn.y = imgRect.y + imgRect.h * 0.55;

    roundRectPath(btn.x, btn.y, w, h, 15);
    ctx.fillStyle = '#FFEB3B';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFEB3B';
    ctx.stroke();
    ctx.font = '700 22px Poppins, sans-serif';
    ctx.fillStyle = '#0E1116';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, btn.x + w/2, btn.y + h/2);
  }

  function drawLose() {
    // mostrar puzzle tal como quedó
    drawLevel();

    // overlay
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0,0,cssW,cssH);

    const { puzzleRect } = getLayoutRects();
    const imgRect = getContainRect(STATE.currentImg, puzzleRect);
    const cx = imgRect.x + imgRect.w/2;

    ctx.textAlign = 'center';
    ctx.font = '700 34px Poppins, sans-serif';
    ctx.fillStyle = '#F44336';
    ctx.fillText('TIEMPO AGOTADO', cx, imgRect.y + imgRect.h * 0.35);

    ctx.font = '600 20px Poppins, sans-serif';
    ctx.fillStyle = '#FFEB3B';
    ctx.fillText(`Nivel ${STATE.levelIndex+1} no resuelto`, cx, imgRect.y + imgRect.h * 0.35 + 40);

    const btn = STATE.buttons.retry;
    const w = clamp(cssW * 0.36, 220, 420);
    const h = clamp(cssH * 0.10, 52, 64);
    btn.w = w; btn.h = h;
    btn.x = cx - w/2;
    btn.y = imgRect.y + imgRect.h * 0.55;

    roundRectPath(btn.x, btn.y, w, h, 15);
    ctx.fillStyle = '#FFEB3B';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFEB3B';
    ctx.stroke();
    ctx.font = '700 22px Poppins, sans-serif';
    ctx.fillStyle = '#0E1116';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.text, btn.x + w/2, btn.y + h/2);
  }

  function draw() {
    switch (STATE.screen) {
      case 'intro':   drawIntro(); break;
      case 'select':  drawSelection(); break;
      case 'level':
        if (isSolved() && !STATE.solved) { STATE.solved = true; setTimeout(goWin, 180); }
        else { drawLevel(); }
        break;
      case 'win':     drawWin(); break;
      case 'lose':    drawLose(); break;
    }
  }

  // ---------- Inicio (carga asíncrona con onload) ----------
  (async function boot() {
    try {
      const [imgs, bg] = await Promise.all([
        loadImagesAsync(SOURCES),
        loadImageAsync(BG_SRC)
      ]);
      IMGS = imgs;
      bgImg = bg;
      STATE.pool = [...IMGS];
      bgDirty = true;
      bgReady = false;
      goIntro();
      draw();
    } catch (err) {
      console.error('Error cargando recursos:', err);
      goIntro();
      draw();
    }
  })();
})();