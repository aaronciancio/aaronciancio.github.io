class Board{
    constructor(x, y, size, cellSize, fill, img, ctx){
        this.x = x;
        this.y = y;
        this.size = size;
        this.cellSize = cellSize;
        this.ctx = ctx;
        this.fill = fill;
        this.img = img;
        this.cells = [];
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

    getCells() {
        return this.cells;
    }

    // - Comprueba límites y la condición que determina las esquinas inválidas.
    isValidCell(row, col) {
        if (row < 0 || col < 0 || row >= this.size || col >= this.size) return false;
        if ((row < 2 || row > 4) && (col < 2 || col > 4)) return false;
        return true;
    }

    // Devuelve la esquina superior izquierda de la celda (top-left)
    getCellTopLeft(row, col) {
        return {
            x: this.x + col * this.cellSize,
            y: this.y + row * this.cellSize
        };
    }

    // Devuelve los centros (x,y) de las casillas válidas del tablero
    getValidCellCenters() {
        const centers = [];
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if ((row < 2 || row > 4) && (col < 2 || col > 4)) {
                    continue;
                }
                const cellX = this.x + col * this.cellSize;
                const cellY = this.y + row * this.cellSize;
                centers.push({
                    row,
                    col,
                    x: cellX,
                    y: cellY,
                });
            }
        }
        return centers;
    }

    // - Comprueba que dst sea una celda jugable.
    // - Requiere un desplazamiento exactamente de 2 en fila o columna (no diagonales).
    // - Comprueba que en la casilla intermedia exista una ficha y que el destino esté vacío.
    // Devuelve true si el movimiento es salto ortogonal válido (2 celdas) y hay ficha intermedia
    isValidMove(srcRow, srcCol, dstRow, dstCol) { 
        if (!this.isValidCell(dstRow, dstCol)) return false;
        const dr = dstRow - srcRow;
        const dc = dstCol - srcCol;
        if (Math.abs(dr) === 2 && dc === 0) {
            const middle = this.getMiddleCell(srcRow, srcCol, dstRow, dstCol);
            if (!this.getChipAt(dstRow, dstCol) && this.getChipAt(middle.row, middle.col)) return true;
        }
        if (Math.abs(dc) === 2 && dr === 0) {
            const middle = this.getMiddleCell(srcRow, srcCol, dstRow, dstCol);
            if (!this.getChipAt(dstRow, dstCol) && this.getChipAt(middle.row, middle.col)) return true;
        }
        return false;
    }

    //Obtiene la celda del medio
    getMiddleCell(srcRow, srcCol, dstRow, dstCol) {
        return { row: (srcRow + dstRow) / 2, col: (srcCol + dstCol) / 2 };
    }

    //Obtiene la ficha en la fila y columna especificada
    getChipAt(row, col) {
        for (const c of chips) {
            if (c.cellRow === row && c.cellCol === col) return c;
        }
        return null;
    }

    //Metodo utilizado movimientos validos para una ficha y retorna un arrar con los movimientos validos
    computeValidDestinationsForChip(chip) {
        const r = chip.cellRow;
        const c = chip.cellCol;
        const cands = [
            { r: r - 2, c },  // arriba
            { r: r + 2, c },  // abajo
            { r, c: c - 2 },  // izquierda
            { r, c: c + 2 }   // derecha
        ];
        const out = [];
        for (const d of cands) {
            if (this && this.isValidCell(d.r, d.c) && this.isValidMove(r, c, d.r, d.c)) {
                const tl = this.getCellTopLeft(d.r, d.c);
                const cx = tl.x + this.cellSize / 2;
                const cy = tl.y + this.cellSize / 2;
                out.push({ row: d.r, col: d.c, cx, cy });
            }
        }
        return out;   
    }

    // Encuentra la celda válida más cercana al punto (cx,cy). Devuelve row,col o null
    findClosestCell(cx, cy) {
        if (!this) return null;
        const centers = this.getValidCellCenters();
        let best = null;
        let bestDist = Infinity;
        for (const c of centers) {
            const centerX = c.x + board.cellSize / 2;
            const centerY = c.y + board.cellSize / 2;
            const dx = cx - centerX;
            const dy = cy - centerY;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < bestDist) {
                bestDist = d;
                best = { row: c.row, col: c.col, x: c.x, y: c.y };
            }
        }

        if (bestDist <= board.cellSize * 1.0) {
            return best;
        }
        return null;
    }

    // Comprueba si existe al menos un movimiento posible para cualquier ficha
    // - Recorre todas las fichas existentes y para cada una prueba las 4 direcciones
    //   (dos celdas en cada dirección).
    // - Usa isValidMove para decidir si existe al menos un movimiento legal.
    // - Si no existe ninguno, la partida termina.
    checkAnyMoves() {
        for (const c of chips) {
            const r = c.cellRow;
            const col = c.cellCol;
            // cuatro direcciones: up/down/left/right por 2 celdas
            const candidates = [
                { r: r - 2, c: col },
                { r: r + 2, c: col },
                { r: r, c: col - 2 },
                { r: r, c: col + 2 }
            ];
            for (const cand of candidates) {
                if (this.isValidCell(cand.r, cand.c)) {
                    if (this.isValidMove(r, col, cand.r, cand.c)) return true;
                }
            }
        }
        return false;
    }

    //Dibuja el tablero
    draw() {
        this.cells = [];

        this.ctx.fillStyle = this.fill;

        const startX = this.x;
        const startY = this.y;

        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                // Condición para no dibujar las esquinas
                if ((row < 2 || row > 4) && (col < 2 || col > 4)) {
                    continue;
                }

                const cellX = startX + col * this.cellSize;
                const cellY = startY + row * this.cellSize;


                const cell = new Cell(cellX, cellY, this.cellSize, this.img, this.ctx);
                this.cells.push(cell);
                cell.draw();
            }
        }
    }
}