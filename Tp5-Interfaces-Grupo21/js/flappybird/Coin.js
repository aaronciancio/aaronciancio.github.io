class Coin {
  constructor(x, y, size = 32) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.r = size / 2;
    this.collected = false;

    // --- ANIMACIÓN ---
    this.anim = {
      img: new Image(),
      ready: false,
      frameW: 16,    // ancho real de cada frame en el spritesheet
      frameH: 16,    // alto real
      frames: 15,     // cantidad de frames del spritesheet
      idx: 0,
      t: 0,
      FPS: 12        // velocidad de animación
    };

    // Cargar sprite
    this.anim.img.src = "../images_cards/Flappy Bird/Coin/coin.png";
    this.anim.img.onload = () => (this.anim.ready = true);
  }

  update(dt, speed) {
    // Movimiento igual que antes
    this.x -= speed * dt;

    // --- Actualizar animación ---
    const a = this.anim;
    if (!a.ready) return;

    a.t += dt;
    const frameTime = 1 / a.FPS;

    // avanzar frames si pasó suficiente tiempo
    while (a.t >= frameTime) {
      a.t -= frameTime;
      a.idx = (a.idx + 1) % a.frames;
    }
  }

  draw(ctx) {
    if (this.collected) return;
    const a = this.anim;
    if (!a.ready) return;

    // dónde está tu frame dentro del spritesheet
    const sx = a.idx * a.frameW;
    const sy = 0;

    ctx.drawImage(
      a.img,
      sx, sy, a.frameW, a.frameH,
      this.x - this.r, this.y - this.r,
      this.size, this.size
    );
  }

  collidesWith(bird) {
    const dx = this.x - bird.x;
    const dy = this.y - bird.y;
    return dx * dx + dy * dy <= (this.r + bird.r) ** 2;
  }
}
