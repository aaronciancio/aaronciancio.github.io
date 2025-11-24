class Score {
    constructor(goal) {
      this.score = 0;
      this.best = 0;
      this.goal = goal;
    }
    
    increase(increase, animationMode) {
      if (animationMode === 'death' || animationMode === 'hit') return;
      this.score += increase;
      if (this.score > this.best) this.best = this.score;
    }

    reset() {
      this.score = 0;
    }

    hasWon() {
    return this.score >= this.goal;
    }

    draw(ctx, alive, w, won = false) {
    ctx.save();
    
    const DPR = window.devicePixelRatio || 1;
    const canvasWidth  = w ?? ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    // Estilo HUD
    const panelBg     = 'rgba(40, 22, 60, 0.85)';
    const panelBorder = '#8c2f3b';
    const textColor   = '#ffffff';

    // ----- PANEL SCORE (arriba izquierda) -----
    const px = 16;
    const py = 16;
    const pw = 225;
    const ph = 80;

    roundRect(ctx, px, py, pw, ph, 10);
    ctx.fillStyle   = panelBg;
    ctx.fill();
    ctx.lineWidth   = 2;
    ctx.strokeStyle = panelBorder;
    ctx.stroke();

    ctx.fillStyle    = textColor;
    ctx.textBaseline = 'top';

    ctx.font = 'bold 18px system-ui';
    ctx.fillText(`Puntaje Actual: ${this.score}`, px + 12, py + 10);

    ctx.font = '14px system-ui';
    ctx.fillText(`Mejor Puntaje: ${this.best}`,  px + 12, py + 32);

    
    ctx.font = '14px system-ui';
    ctx.fillText(`¡Consigue 50 puntos para ganar!`,  px + 12, py + 52);

    // ----- GAME OVER (centrado) -----
    if (!alive || won) {
      const isWin = !!won;
      const title = isWin ? '¡GANASTE!' : 'GAME OVER';
      const hint  = 'Space / Click para reiniciar';

      ctx.textAlign = 'center';

      ctx.font = 'bold 28px system-ui';
      const twTitle = ctx.measureText(title).width;
      ctx.font = '16px system-ui';
      const twHint  = ctx.measureText(hint).width;

      const boxW = Math.max(twTitle, twHint) + 40;
      const boxH = 110;
      const boxX = (canvasWidth  - boxW) / 2;
      const boxY = (canvasHeight - boxH) / 2;

      roundRect(ctx, boxX, boxY, boxW, boxH, 12);
      ctx.fillStyle   = 'rgba(40, 22, 60, 0.92)';
      ctx.fill();
      ctx.lineWidth   = 2;
      ctx.strokeStyle = panelBorder;
      ctx.stroke();

      ctx.fillStyle = isWin ? '#ffdd88' : textColor;;
      ctx.font = 'bold 28px system-ui';
      ctx.fillText(title, canvasWidth / 2, boxY + 20);

      ctx.fillStyle = textColor;
      ctx.font = '16px system-ui';
      ctx.fillText(hint,  canvasWidth / 2, boxY + 60);
    }

    ctx.restore();
  }
 
  }

  function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}