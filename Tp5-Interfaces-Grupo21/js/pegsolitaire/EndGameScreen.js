class EndGameScreen {
    constructor(ctx, canvasWidth, canvasHeight) {
        this.ctx = ctx;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        this.active = false;
        this.title = '';
        this.message = '';
        const spacing = 18;

        this.overlayWidth = Math.min(canvasWidth * 0.8, 600);
        this.overlayHeight = 130;
        this.overlayX = Math.round((canvasWidth - this.overlayWidth) / 2);
        this.overlayY = Math.round((canvasHeight - this.overlayHeight) / 2);

        this.retryBtn = new Button(ctx, Math.round((canvasWidth - 180) / 2), this.overlayY + this.overlayHeight + spacing, 180, 46 , 12);
        this.retryBtn.setLayout(Math.round((canvasWidth - 180) / 2), this.overlayY + this.overlayHeight + spacing)
    }

    //Settea el titulo de la pantalla final del juego
    show(message, won) {
        this.active = true;
        this.title = won ? '¡Ganaste!' : 'Perdiste :(';
        this.message = message;
    }

    //Esconde la pantalla
    hide() {
        this.active = false;
    }

    isActive() {
        return this.active;
    }


    isRetryClicked(px, py) {
        return this.retryBtn.isInButton(px, py);
    }

    //Dibuja la pantalla final del juego
    draw() {
        if (!this.active) return;

        const ctx = this.ctx;
        const canvasWidth = this.canvasWidth;
        const canvasHeight = this.canvasHeight;

        ctx.save();

        // Fondo oscuro global
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Caja central
        this.#roundRectPath(this.overlayX, this.overlayY, this.overlayWidth, this.overlayHeight, 25);
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fill();
        ctx.strokeStyle = '#FFD54F';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Título
        ctx.fillStyle = '#FFD54F';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.title, canvasWidth / 2, this.overlayY + 44);

        // Mensaje
        ctx.font = '18px sans-serif';
        ctx.fillText(this.message, canvasWidth / 2, this.overlayY + 96);

        //Boton Reiniciar
        this.retryBtn.draw();

        ctx.restore();
    }

    //Metodo auxiliar para dibujar el rectangulo con bordes redondeados 
    #roundRectPath(x, y, w, h, r) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }
}