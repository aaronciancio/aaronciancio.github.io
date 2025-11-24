(() => {
  const canvas = document.getElementById('flappybird');
  const ctx = canvas.getContext('2d');

  const layers = document.getElementsByClassName('game-background');

  // Al cargar, dejar las capas en estado "stopped" (fondo detenido)
  for (let i = 0; i < layers.length; i++) {
    layers[i].classList.add('stopped');
  }

  // --- HiDPI ---
  const DPR = window.devicePixelRatio || 1;
  canvas.style.width  = canvas.width + 'px';
  canvas.style.height = canvas.height + 'px';
  canvas.width  *= DPR;
  canvas.height *= DPR;
  ctx.scale(DPR, DPR);
  ctx.imageSmoothingEnabled = false;

  // ==========================
  //     CONFIGURACIÓN JUEGO
  // ==========================
  const GRAVITY = 2400;
  const JUMP_IMPULSE = -720;
  const VY_MAX = 1400;
  const PIPE_WIDTH = 90;
  const PIPE_MIN_TOP = 80;
  const PIPE_MIN_BOTTOM = 110;
  const COIN_SAFE_MARGIN = 64;

  // ==========================
  //        FUNCIONES ÚTILES
  // ==========================
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t){ return a + (b - a) * t; }
  function randRange(min, max){ return min + Math.random() * (max - min); }

  function circleIntersectsRect(cx, cy, cr, rect) {
    const rx = rect.x, ry = rect.y, rw = rect.w, rh = rect.h;
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return (dx * dx + dy * dy) <= (cr * cr);
  }

  function getDifficulty(sc) {
    const t = clamp(sc / 50, 0, 1);
    const pipeSpeed = lerp(325, 480, t);
    const pipeGap = lerp(220, 150, t);
    const spawnEvery = lerp(1.45, 1.00, t);
    return { pipeSpeed, pipeGap, spawnEvery };
  }

  // ==========================
  //         GAME LOOP
  // ==========================
  const WALK_SRC = '../images_cards/Flappy Bird/Vulture/Vulture_Walk.png';
  const COIN_SRC = '../images_cards/Flappy Bird/Vulture/Vulture_Coin.png';
  const HIT_SRC = '../images_cards/Flappy Bird/Vulture/Vulture_Hurt.png';
  const DEATH_SRC = '../images_cards/Flappy Bird/Vulture/Vulture_Death.png';
  const bird = new Bird(350, 320, 18, WALK_SRC, DEATH_SRC, HIT_SRC, COIN_SRC, JUMP_IMPULSE);
  const pipes = [];
  const coins = [];
  let coinSpawnTimer = 0;
  let won = false;
  const score = new Score(50); // objetivo 50 puntos
  // Nueva bandera de pausa: el juego arranca pausado pero bird.alive permanece true
  let paused = true;
  // Pulso de salto (onda circular)
  const jumpPulse = {
    t: 999,         // tiempo actual (999 = apagado)
    duration: 0.22  // duración en segundos (~220 ms)
  };

  let spawnTimer = 0;
  let last = performance.now();

  function gameOver() {
    bird.alive = false;
    for (let i = 0; i < layers.length; i++) {
      layers[i].classList.add('paused');
    }
  }

  function startGame() {
    for (let i = 0; i < layers.length; i++) {
      layers[i].classList.add('stopped');
    }
    setTimeout(() => {
      paused = false;
      // eliminar clases de fondo que detienen/pausan la animación
      for (let i = 0; i < layers.length; i++) {
        layers[i].classList.remove('stopped');
        layers[i].classList.remove('paused');
      }
      last = performance.now();
    }, 1);
  }

  function resetGame() {
    for (let i = 0; i < layers.length; i++) {
      layers[i].classList.add('stopped');
    }
    bird.reset();
    pipes.length = 0;
    spawnTimer = 0;
    won = false;
    score.reset();
    bird.alive = true;
    startGame();
    last = performance.now();
  }

  // --- Input ---
  function flap() {
    if (!paused && bird.flapAnim.mode !== 'death' && bird.flapAnim.mode !== 'hit') {
      bird.flap(); 
      // Reiniciamos la animación del pulso
      jumpPulse.t = 0;
    }
  }

  let btnPlay = document.getElementById("play");
  btnPlay.addEventListener("click", function() {
    btnPlay.classList.add("fade-out");
    let btnFriends = document.getElementById("friends-id");
    if (btnFriends) btnFriends.classList.add("move-right");
    setTimeout(() => {
        if (btnFriends) {
            btnFriends.classList.add("default-position");
            btnFriends.classList.remove("move-right");
        }
        btnPlay.classList.add("disabled");
    }, 300);
    startGame();
  });

  window.addEventListener('mousedown', (e) => {
    if (!paused) flap();
  });
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); flap(); }
    // Si el pájaro está muerto (game over), Space/Enter reinicia
    if (!bird.alive && (e.code === 'Space' || e.code === 'Enter')) resetGame();
  });
  window.addEventListener('mousedown', () => { if (!bird.alive) resetGame(); });

  // --- Loop ---
  function loop(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function update(dt) {
    const w = canvas.width / DPR;
    const h = canvas.height / DPR;
    const { pipeSpeed, pipeGap, spawnEvery } = getDifficulty(score.score);

    // Pausado o muerto: no avanzar la simulación
    if (!bird.alive || paused) return;

    bird.update(dt, GRAVITY, VY_MAX, 0, h, gameOver);
    // Avanzar el tiempo del pulso, si está activo
    if (jumpPulse.t < jumpPulse.duration) {
      jumpPulse.t += dt;
    }

    // Si el pájaro dejó de estar "alive", no generamos ni movemos entidades
    if (!bird.alive) return;

    // === SPAWN PIPES ===
    spawnTimer += dt;
    if (spawnTimer >= spawnEvery) {
      spawnTimer = 0;
      const gapMin = PIPE_MIN_TOP + pipeGap / 2;
      const gapMax = h - PIPE_MIN_BOTTOM - pipeGap / 2;
      const gapY = randRange(gapMin, gapMax);
      pipes.push(new Pipe(w + PIPE_WIDTH, gapY));
    }

    // === SPAWN COINS ===
    coinSpawnTimer += dt;
    if (coinSpawnTimer >= 3.2) {
      coinSpawnTimer = 0;

      // si no hay tubos todavía, no generamos moneda
      if (pipes.length > 0 && score.score < 40) {
        const { pipeGap } = getDifficulty(score.score);  // ya lo usás arriba
        const lastPipe = pipes[pipes.length - 1];        // último tubo creado

        const gapCenterY = lastPipe.gapY;
        const gapSpread  = pipeGap * 0.2; // la moneda se mueve un poco dentro del hueco

        // Y aleatoria pero siempre DENTRO del hueco
        const coinY = randRange(gapCenterY - gapSpread, gapCenterY + gapSpread);

        // X un poco después del tubo
        const coinX = lastPipe.x + PIPE_WIDTH + 40;

        coins.push(new Coin(coinX, coinY));
      }
    }

    for (let i = pipes.length - 1; i >= 0; i--) {
      const p = pipes[i];
      p.x -= pipeSpeed * dt;

      // pasar por el pipe (score)
      if (!p.passed && bird.x > p.x + PIPE_WIDTH) {
        p.passed = true;
        if (!won) {
            score.increase(1, bird.flapAnim.mode);
            if (score.score >= 45) {
              coins.splice(0, coins.length); // eliminar todas las monedas restantes
            }
          if (score.hasWon()) {
            won = true;
            bird.alive = false;
            for (let k = 0; k < layers.length; k++) layers[k].classList.add('paused');
          }
        }
      }

      // colisión con pipe (solo si está dentro del rango X)
      const withinX = bird.x + bird.r > p.x && bird.x - bird.r < p.x + PIPE_WIDTH;
      if (withinX) {
        const topRect = { x: p.x, y: 1, w: PIPE_WIDTH, h: p.gapY - pipeGap / 2 };
        const botRect = { x: p.x, y: p.gapY + pipeGap / 2 - 1, w: PIPE_WIDTH, h: h - (p.gapY + pipeGap / 2) };
        if (circleIntersectsRect(bird.x, bird.y + 10, bird.r - 5, topRect) ||
            circleIntersectsRect(bird.x, bird.y - 10, bird.r - 5, botRect)) {
          if (bird.flapAnim.mode !== 'death' && bird.flapAnim.mode !== 'hit') {
            // Iniciar animación de "hit" primero; luego Bird pasará a 'death' automáticamente
            bird.flapAnim.mode = 'hit';
            bird.flapAnim.idx = 0;
            bird.flapAnim.t = 0;
            bird.flapAnim.animFinished = false;
            bird.flapAnim.gameOverCalled = false;
          }
        }
      }

      // eliminar pipes fuera de pantalla
      if (p.x + PIPE_WIDTH < -2) {
        pipes.splice(i, 1);
      }
    }

    // === UPD & COLLISIONS FOR COINS ===
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];

      // mover (misma velocidad base que los pipes)
      c.update(dt, pipeSpeed);

      // colisión con pájaro
      if (!c.collected && c.collidesWith(bird)) {
        c.collected = true;

        if(bird.flapAnim.mode !== 'coin'){
          bird.flapAnim.mode = 'coin';
          bird.flapAnim.idx = 0;
          bird.flapAnim.t = 0;
          bird.flapAnim.coinAnimFinished = false;
        }
        
        // sumar puntos
        score.increase(5, bird.flapAnim.mode);
        if (score.score >= 45) {
          coins.splice(0, coins.length); // eliminar todas las monedas restantes
        }
        if (score.hasWon()) {
          won = true;
          bird.alive = false;
          for (let k = 0; k < layers.length; k++) layers[k].classList.add('paused');
        }
      }

      // limpiar monedas fuera de pantalla o ya tomadas
      if (c.x < -50 || c.collected) {
        coins.splice(i, 1);
      }
    } 
  }

  function drawJumpPulse(ctx) {
    // Si ya terminó la animación, no dibujamos nada
    if (jumpPulse.t >= jumpPulse.duration) return;

    const u = jumpPulse.t / jumpPulse.duration; // 0 → 1
    const inv = 1 - u;

    // Radio del círculo: arranca chico y se agranda
    const maxR = 70; // podés tunear este valor
    const r = maxR * (0.3 + 0.7 * u);

    const x = bird.x;
    const y = bird.y;

    // Alpha se desvanece hacia el final
    const alphaCenter = 0.65 * inv;

    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0.0, `rgba(255,255,255,${alphaCenter})`);
    grad.addColorStop(0.4, `rgba(255,255,0,${0.5 * inv})`);
    grad.addColorStop(1.0, `rgba(255,200,0,0)`);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter'; // suma luz, queda más "energía"
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    const w = canvas.width / DPR;
    const h = canvas.height / DPR;
    ctx.clearRect(0, 0, w, h);

    const { pipeGap } = getDifficulty(score.score);
    for (const p of pipes) p.draw(ctx, pipeGap, PIPE_WIDTH, h);
    for (const c of coins) c.draw(ctx);
    // Luego el pulso (detrás del pájaro, pero encima de tubos/monedas)
    drawJumpPulse(ctx);
    bird.draw(ctx);
    score.draw(ctx, bird.alive, w, won);
  }

  requestAnimationFrame(loop);
})();
