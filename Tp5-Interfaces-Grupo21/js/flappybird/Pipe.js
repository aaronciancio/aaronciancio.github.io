class Pipe {
    constructor(x, gapY) {
      this.x = x;
      this.gapY = gapY;
      this.passed = false;
    }

    draw(ctx, pipeGap, pipeWidth, h) {
      const topH = this.gapY - pipeGap / 2;
      const botY = this.gapY + pipeGap / 2;
      const botH = h - botY;

      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(this.x + 6, 0, 12, topH);
      ctx.fillRect(this.x + 6, botY, 12, botH);

      ctx.fillStyle = '#ba6a72';
      ctx.fillRect(this.x, 0, pipeWidth, topH);
      ctx.fillRect(this.x, botY, pipeWidth, botH);

      ctx.fillStyle = '#8e4f56';
      ctx.fillRect(this.x - 2, topH - 14, pipeWidth + 4, 14);
      ctx.fillRect(this.x - 2, botY, pipeWidth + 4, 14);

      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(this.x + 8, 0, 10, topH);
      ctx.fillRect(this.x + 8, botY, 10, botH);
    }
  }