class Timer {
    constructor(ctx, timeLimit, x, y, bgSize, fill, fontFamily, fontColor, stroke) {
        this.ctx = ctx;
        this.timeLimit = timeLimit;
        this.x = x;
        this.y = y;
        this.bgSize = bgSize;
        this.fill = fill;
        this.fontFamily = fontFamily;
        this.fontColor = fontColor;
        this.stroke = stroke
        this.timeLeft = timeLimit;
        this.timerInterval = null;
        this.onEnd = null;
        this.onTick = null;
    }

    //Comienza el contador del timer
    startTimer() {
        this.stopTimer();
        if (typeof this.timeLeft === 'undefined' || this.timeLeft === null) {
            this.timeLeft = this.timeLimit;
        }

        if (typeof this.onTick === 'function') this.onTick();

        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            if (typeof this.onTick === 'function') this.onTick();
            if (this.timeLeft <= 0) {
                this.stopTimer();
                if (typeof this.onEnd === 'function') this.onEnd();
            }
        }, 1000);
    }

    //Pasa al formato de minutos y segundos
    formatTime(seconds) {
        const mm = Math.floor(seconds / 60).toString().padStart(2, "0");
        const ss = (seconds % 60).toString().padStart(2, "0");
        return `${mm}:${ss}`;
    }

    //Dibuja el recuadro del timer
    draw() {
        // Dibujar un rectángulo simple con el tiempo restante
        const ctx = this.ctx;
        const w = this.bgSize || 100;
        const h = Math.round(w / 2.5);
        const x = this.x || 10;
        const y = this.y || 10;

        // fondo semi-transparente con esquinas redondeadas
        ctx.save();
        ctx.fillStyle = this.fill || 'rgba(0,0,0,0.6)';
        const radius = 25;
        // limitar radio para no exceder la mitad de ancho/alto
        const r = Math.min(radius, w / 2, h / 2);

        // Path de rectángulo redondeado
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();

        ctx.fill();

        // Borde (delineado) alrededor del recuadro redondeado
        ctx.lineWidth = 2;
        ctx.strokeStyle = this.stroke || '#FFD54F';
        ctx.stroke();


        // texto
        ctx.fillStyle = this.fontColor;
        ctx.font = this.fontFamily || '16px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const time = 'Tiempo ' + this.formatTime(this.timeLeft);
        const controls = 'Click Izquierdo : Agarrar ficha';
        const controls2 = 'Soltar Click : Cae ficha';
        ctx.fillText(time, x + w / 2, y + h / 2 - 35);
        ctx.fillText(controls, x + w / 2, y + h / 2);
        ctx.fillText(controls2, x + w / 2, y + h / 2 + 35);
        ctx.restore();
    }

    //Detiene el timer
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    //Getters y Setters
    //#region 
    setOnEnd(cb) {
        this.onEnd = cb;
    }

    setOnTick(cb) {
        this.onTick = cb;
    }
    
    getTimeLeft() {
        return this.timeLeft;
    }

    getTimeLimit() {
        return this.timeLimit;
    }

    getTimeInterval() {
        return this.timerInterval;
    }

    setTimeLeft(time) {
        this.timeLeft = time;
    }

    setTimeLimit(time) {
        this.timeLimit = time;
    }

    setTimeInterval(interval) {
        this.timerInterval = interval;
    }

    //#endregion

}