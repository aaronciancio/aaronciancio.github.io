class Bird {
    constructor(x, y, radius, walkSpriteSrc, deathSpriteSrc, hitSpriteSrc, coinSpriteSrc, jump) {
      this.x = x;
      this.y = y;
      this.vy = 0;
      this.r = radius;
      this.jump = jump;
      this.alive = true;
      this.deathGroundOffset = 2; // cuánto más arriba queda el "suelo" cuando está en death

      // Objeto para la animacion del aleteo, moneda, hit y muerte
      this.flapAnim = {
        img: new Image(),
        deathImg: new Image(),
        coinImg: new Image(),
        hitImg: new Image(),
        ready: false,
        coinReady: false,
        hitReady: false,
        deathReady: false,
        idx: 2,
        t: 0,
        mode: 'flap',
        flapFPS: 18,
        coinFPS: 14,
        hitFPS: 14,
        deathFPS: 12,
        frameW: 48,
        frameH: 48,
        frames: 4,
        coinFrames: 4,
        hitFrames: 4,
        deathFrames: 4,
        animFinished: false,
        coinAnimFinished: false,
        // flags para invertir la lectura del spritesheet
        framesReverse: false,    // para "flap" (izq->der)
        coinFramesReverse: false, // para "coin" (izq->der)
        hitFramesReverse: false, // para "hit" (izq->der)
        deathFramesReverse: true, // para "death" (der->izq)
        // evitar llamar gameOver dos veces
        gameOverCalled: false,
        // saber si tocó suelo tras morir y si ya ajustamos la posición final
        touchedGround: false,
        finalPosAdjusted: false
      };

      // Carga del sprite de aleteo/caminata
      this.flapAnim.img.src = walkSpriteSrc;
      this.flapAnim.img.onload = () => this.flapAnim.ready = true;
      
      // Carga del sprite de moneda
      this.flapAnim.coinImg.src = coinSpriteSrc;
      this.flapAnim.coinImg.onload = () => this.flapAnim.coinReady = true;

      // Carga del sprite de "hit" (colisión con pipe)
      this.flapAnim.hitImg.src = hitSpriteSrc;
      this.flapAnim.hitImg.onload = () => this.flapAnim.hitReady = true;

      // Carga del sprite de muerte
      this.flapAnim.deathImg.src = deathSpriteSrc;
      this.flapAnim.deathImg.onload = () => this.flapAnim.deathReady = true;

    }

    flap() {
      if (!this.alive) return;
      this.vy = this.jump;
      this.flapAnim.idx = 0;
      this.flapAnim.t = 0;
    }

    update(dt, gravity, vyMax, topMargin, groundY, gameOverCallback) {
      // 1. Control de Caída para pájaro muerto
      // Si el pájaro está muerto y la animación de muerte ha terminado, 
      // detenemos cualquier movimiento si ya tocó el suelo.
      const effectiveGroundEarly = groundY - (this.flapAnim.mode === 'death' ? this.deathGroundOffset : 0);
      if (!this.alive && this.flapAnim.animFinished) {
          if (this.y + this.r >= effectiveGroundEarly) return;
      }

      // 2. Aplicar Física (Gravedad)
      this.vy += gravity * dt;
      if (this.vy > vyMax) this.vy = vyMax;
      this.y += this.vy * dt;

      // 3. Colisión con el Techo (Top Limit)
      if (this.y - this.r < topMargin) {
          this.y = topMargin + this.r;
          this.vy = 0;
      }

      // 4. Colisión con el Suelo (Ground Collision)
      if (this.y + this.r > groundY) {
          this.y = groundY - this.r;
          this.vy = 0;
          
          // Si la animación de muerte no estaba ya iniciada, la iniciamos.
          // NO llamamos a gameOverCallback aquí: la llamada se hará cuando
          // la animación termine y el pájaro esté en el suelo.
          if (this.flapAnim.mode !== 'death') {
              this.flapAnim.mode = 'death';
              this.flapAnim.idx = 0;
              this.flapAnim.t = 0;
              this.flapAnim.animFinished = false;
              this.flapAnim.gameOverCalled = false;
          }
          // Siempre marcar que tocó el suelo (si la muerte empezó por pipe, esto ocurrirá aquí)
          this.flapAnim.touchedGround = true;
      }

      // 5. Actualizar Animación
      this.updateAnim(dt);

      // Si la animación de muerte terminó Y el pájaro tocó el suelo,
      // primero ajustamos la posición final una vez y luego ejecutamos gameOverCallback una sola vez.
      const s = this.flapAnim;
      if (s.mode === 'death' && s.animFinished && s.touchedGround) {
        const FINAL_RAISE = 18; // px: cuánto dejar arriba al pájaro en el último frame
        if (!s.finalPosAdjusted) {
          // dejarlo un poco más arriba para que no quede oculto
          this.y = groundY - this.r - FINAL_RAISE;
          this.vy = 0;
          s.finalPosAdjusted = true;
        }
        if (!s.gameOverCalled) {
          s.gameOverCalled = true;
          // gameOverCallback pondrá bird.alive = false y pausará capas
          if (typeof gameOverCallback === 'function') gameOverCallback();
        }
      }
    }

    updateAnim(dt) {
      const s = this.flapAnim;
      // Verificamos si la imagen del modo actual está lista
      if (s.mode === 'flap' && !s.ready) return;
      if (s.mode === 'coin' && !s.coinReady) return;
      if (s.mode === 'hit' && !s.hitReady) return;
      if (s.mode === 'death' && !s.deathReady) return;

      switch(s.mode){
        case 'flap':
          s.t += dt;
          const frameTime = 1 / s.flapFPS;
          while (s.t >= frameTime) {
            s.t -= frameTime;
            s.idx++;
          }
        break;

        case 'coin':
          if (!s.coinReady) return;
          
          if (s.coinAnimFinished) {
            // Volver automáticamente a walk (flap)
            s.mode = 'flap';
            s.idx = 2;
            s.t = 0;
            s.coinAnimFinished = false;
            return;
          }

          s.t += dt;
          const frameTimeCoin = 1 / s.coinFPS;
          while (s.t >= frameTimeCoin) {
            s.t -= frameTimeCoin;
            s.idx++;
            if (s.idx >= s.coinFrames) {
              s.idx = s.coinFrames - 1;     // quedarse en último frame
              s.coinAnimFinished = true;    // marcar finalizada
            }
          }
        break;

        case 'hit':
          // Reproducir animación de hit una sola vez y luego TRANSICIONAR a 'death'
          if (s.animFinished) return;
          s.t += dt;
          const frameTimeHit = 1 / s.hitFPS;
          while (s.t >= frameTimeHit) {
            s.t -= frameTimeHit;
            s.idx++;
            if (s.idx >= s.hitFrames) {
              // terminar hit y pasar a death
              s.idx = 0;
              s.t = 0;
              s.animFinished = false;
              // cambiar a death
              s.mode = 'death';
              // preparar death
              s.idx = 0;
              s.t = 0;
              s.animFinished = false;
              // asegurarse finalPosAdjusted se resetee para la futura elevación en 'death'
              s.finalPosAdjusted = false;
              return;
            }
          }
        break;

        case 'death':
          if (s.animFinished) return;
          s.t += dt;
          const frameTimeDeath = 1 / s.deathFPS;
          while (s.t >= frameTimeDeath) {
            s.t -= frameTimeDeath;
            s.idx++;
            if (s.idx >= s.deathFrames) {
                s.idx = s.deathFrames - 1;
                s.animFinished = true;
            }
          }
        break;

        default:
          s.idx = 2; // Frame de aleteo estático por defecto
        break;
      }
    }

    draw(ctx) {
      const s = this.flapAnim;
      let angle = 0;
      let currentImage = s.img;
      let currentFrames = s.frames;

      if (s.mode === 'flap') {
        // Rotación normal de aleteo
        angle = Math.max(-0.6, Math.min(0.8, this.vy / 900));
        currentImage = s.img;
        currentFrames = s.frames;
      } else if (s.mode === 'coin') {
        angle = Math.max(-0.6, Math.min(0.8, this.vy / 900)); 
        currentImage = s.coinImg;
        currentFrames = s.coinFrames;
      } else if (s.mode === 'hit') {
        // Congelar la rotación y usar el sprite de hit
        angle = 0; // 90 grados (boca abajo)
        currentImage = s.hitImg;
        currentFrames = s.hitFrames;
      } else if (s.mode === 'death') { // Ahora se activa al chocar.
        // Congelar la rotación y usar el sprite de muerte
        angle = 0; // 90 grados (boca abajo)
        currentImage = s.deathImg;
        currentFrames = s.deathFrames;
      }

      const size = this.r * 4;
      const half = size / 2;

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(angle);

      if ((s.mode === 'flap' && s.ready) || (s.mode === 'death' && s.deathReady) || (s.mode === 'hit' && s.hitReady) || (s.mode === 'coin' && s.coinReady)) {
        // CAMBIO: calcular sx respetando la dirección por animación
        const reverse = (s.mode === 'death') ? s.deathFramesReverse : (s.mode === 'hit' ? s.hitFramesReverse : s.framesReverse);
        let frameIndex = s.idx % currentFrames;
        if (reverse) frameIndex = (currentFrames - 1) - frameIndex;
        const sx = frameIndex * s.frameW;

        ctx.drawImage(currentImage, sx, 0, s.frameW, s.frameH, -half, -half, size, size);
      } else {
        ctx.fillStyle = '#ffcc33';
        ctx.fillRect(-half, -half, size, size);
      }
      ctx.restore();
    }

    reset() {
      this.y = 320;
      this.vy = 0;
      this.alive = true;
      this.flapAnim.mode = 'flap';
      this.flapAnim.idx = 2;
      this.flapAnim.t = 0;
      this.flapAnim.animFinished = false;
      this.flapAnim.gameOverCalled = false;
      this.flapAnim.touchedGround = false;
      this.flapAnim.finalPosAdjusted = false;
      // asegurar hit ready/reset no persista
      this.flapAnim.hitReady = !!this.flapAnim.hitImg.src ? this.flapAnim.hitReady : false;
    }
  }