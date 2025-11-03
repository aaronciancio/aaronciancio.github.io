class Button {
    constructor(ctx, x, y, width, height, radius) {
        this.ctx = ctx;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.radius = radius;
    }

    setLayout(px, py) {
        this.x = px;
        this.y = py;
    }

    //Comprueba si el mouse esta en el boton
    isInButton(px, py) {
        return px >= this.x && px <= this.x + this.width && py >= this.y && py <= this.y + this.height;
    }

    //Se dibuja el boton
    draw() {
        ctx.save();
        // Fondo semitransparente
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        this.#roundRectPath(this.x, this.y, this.width, this.height, this.radius);
        ctx.fill();

        // Borde amarillo
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#FFD54F';
        ctx.stroke();
            
        // Texto
        ctx.fillStyle = '#FFD54F';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Reintentar', this.x + this.width / 2, this.y + this.height / 2);
        ctx.restore();
    }

    //Metodo auxiliar para dibujar el rectangulo con bordes redondeados 
    #roundRectPath(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }
}