
class HintAnimator {
  
  constructor({ board, ctx }) {
    this.board = board;
    this.ctx = ctx;

    // Estado
    this.active = false;
    this.t = 0;                // tiempo acumulado (seg)
    this.source = null;        // {row,col} (guardamos, aunque no se usa para dibujar)
    this.targets = [];         // [{row,col}, ...]
    
    // Constantes EXACTAS del main viejo
    this.col = '#FFD54F';
    this.ringBaseRel = 0.35;   // radio base relativo a cellSize
    this.ringBaseCap = 26;     // tope para radio base
    this.ringPulseAmp = 0.12;  // amplitud de pulso en radio
    this.alphaBase = 0.75;     // alpha base
    this.alphaPulse = 0.20;    // alpha pulsante
    this.bounceAmpRel = 0.18;  // rebote vertical relativo a cellSize
    this.targetRingRel = 0.22; // diana opcional (si la quisieras, pero el viejo NO la usaba)
    this.shadowCap = 10;       // radio del estabilizador
    this.arrowCap = 16;        // tamaño máx. de la flecha
  }

  // Muestra hints para un origen y una lista de destinos (rows/cols)
  show(sourceCell, targetCells) {
    this.source = sourceCell ? { row: sourceCell.row, col: sourceCell.col } : null;
    this.targets = Array.isArray(targetCells) ? targetCells.map(c => ({ row: c.row, col: c.col })) : [];
    this.t = 0;
    this.active = !!(this.targets && this.targets.length);
  }

  //Oculta Animacion
  hide() {
    this.active = false;
    this.source = null;
    this.targets = [];
    this.t = 0;
  }

  //Actualiza el tiempo acumulado
  update(dt) {
    if (!this.active) return;
    this.t += dt;
  }

  // Dibuja: círculos pulsantes sobre CADA destino + flecha triángulo con bounce
  render(ctx = this.ctx) {
    if (!this.active || !this.targets.length) return;

    const cellSize = this.board.cellSize;

    // Parámetros animados (idénticos al main viejo: hintTick ≈ t)
    const pulse = 1 + this.ringPulseAmp * Math.sin(this.t * 6.0);
    const alpha = this.alphaBase + this.alphaPulse * Math.sin(this.t * 6.0);
    const arrowBounce = Math.sin(this.t * 6.0);
    const arrowOffsetY = -cellSize * this.bounceAmpRel * (0.5 + 0.5 * arrowBounce);

    // Radio pulsante
    const baseR = Math.min(cellSize * this.ringBaseRel, this.ringBaseCap);
    const r = baseR * pulse;

    for (const t of this.targets) {
      const { x: cx, y: cy } = this._centerOf(t.row, t.col);

      // Círculo pulsante sobre el destino
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = this.col;
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = alpha * 0.25; // muy tenue
      ctx.beginPath();
      ctx.arc(
        cx,
        cy + arrowOffsetY - 4,
        Math.min(cellSize * 0.14, this.shadowCap),
        0,
        Math.PI * 2
      );
      ctx.fillStyle = '#000000';
      ctx.fill();
      ctx.restore();

      // Flecha triángulo apuntando hacia ABAJO (igual que el main viejo)
      ctx.save();
      ctx.globalAlpha = alpha;
      const ax = cx;
      const ay = cy + arrowOffsetY;
      const w = Math.min(cellSize * 0.22, this.arrowCap);
      const h = Math.min(cellSize * 0.22, this.arrowCap);

      ctx.beginPath();
      ctx.moveTo(ax, ay + h);   // punta ABAJO
      ctx.lineTo(ax - w, ay);   // base izquierda (arriba)
      ctx.lineTo(ax + w, ay);   // base derecha  (arriba)
      ctx.closePath();
      ctx.fillStyle = this.col;
      ctx.fill();
      ctx.restore();
    }
  }

  // ================== helpers ==================
  _centerOf(row, col) {
    const { x, y, cellSize } = this.board;
    return {
      x: x + col * cellSize + cellSize / 2,
      y: y + row * cellSize + cellSize / 2,
    };
  }
}