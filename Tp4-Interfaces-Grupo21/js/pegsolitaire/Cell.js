class Cell {
    constructor(x, y, size, img, ctx) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.img = img;
        this.ctx = ctx;
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

    //Dibuja la casilla
    draw() {
        this.ctx.drawImage(this.img, this.x, this.y, this.size, this.size);
    }
}