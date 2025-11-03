class Chip {

    constructor(x, y, size, img, ctx) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.img = img;
        this.clicked = false;
        this.ctx = ctx;

        this.cellRow = null;
        this.cellCol = null;

        this.originalX = x;
        this.originalY = y;
        this.originalRow = null;
        this.originalCol = null;
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    getPosition() {
        return { 
            x: this.x,
            y: this.y 
        };
    }

    getPositionX() {
        return this.x;
    }

    getPositionY() {
        return this.y;
    }

    setClicked(clicked) {
        this.clicked = clicked;
    }

    //Dibuja la ficha
    draw() {
        this.ctx.drawImage(this.img, this.x, this.y, this.size, this.size);

        if (this.clicked) {
            this.ctx.lineWidth = 3;
            this.ctx.strokeStyle = "yellow";
            this.ctx.stroke();
        }
    }


    // - Detecta si las coordenadas del mouse están dentro del radio de la ficha.
    // - Usamos el centro de la ficha (x + size/2, y + size/2) para la comprobación,
    //   ya que la imagen se dibuja con topleft en (x,y) pero la ficha es circular.
    isMouseInside(mouseX, mouseY) { 
        const centerX = this.x + this.size / 2;
        const centerY = this.y + this.size / 2;
        const dx = mouseX - centerX;
        const dy = mouseY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= this.size / 2;
    }
}