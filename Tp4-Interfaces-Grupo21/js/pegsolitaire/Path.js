class Path {
    // ACTUALIZACIÓN DEFENSA:
    // Nueva clase que guarda la posicion destino, las fichas que se pisarían y las celdas por las que pasaría
    constructor() {
        this.row = null;
        this.col = null;
        this.cells = [];
        this.chips = [];
    }

    setDestination(row, col) {
        this.row = row;
        this.col = col;
    }

    getDestination() {
        return this.destination();
    }

    setChips(chips) {
        this.chips = chips;
    }

    addChip(chip) {
        this.chips.push(chip);
    }

    addCell(cell) {
        this.cells.push(cell);
    }

    removeCell() {
        this.cells.pop();
    }

    contains(cell) {
        for (const c of this.cells) {
            if (c.cellRow === cell.r && c.cellCol === cell.c) return true;
        }
        return false;
    }

    removeChip() {
        this.chips.pop();
    }

    getCopy() {
        return this.chips.slice();
    }
}