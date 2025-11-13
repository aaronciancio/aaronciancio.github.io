//Variables
//#region 
let canvas = document.getElementById("pegsolitaire");
let ctx = canvas.getContext("2d");
let canvasWidth = canvas.width;
let canvasHeight = canvas.height;

let chipsAmount;

let chips = [];
let lastClickedChip = null;
let isMouseDown = false;
let board = null;
let validPaths = [];

const BG_TABLE = "../images_cards/PegSolitaire/fondoMadera.png";
const BG_BOARD = "../images_cards/PegSolitaire/boardPegSolitaire.png";
const CELL_IMAGE = "../images_cards/PegSolitaire/CellImage.png";
const CHIPS_IMAGES = [
    "../images_cards/PegSolitaire/Chip1.png",
    "../images_cards/PegSolitaire/Chip2.png",
    "../images_cards/PegSolitaire/Chip3.png",
    "../images_cards/PegSolitaire/Chip4.png",
    "../images_cards/PegSolitaire/Chip5.png",
    "../images_cards/PegSolitaire/Chip6.png",
    "../images_cards/PegSolitaire/Chip7.png",
    "../images_cards/PegSolitaire/Chip8.png",
]

const CHIP_SIZE = 30;

let hints = null;

let chipsImgs = loadImagesAsync(CHIPS_IMAGES).then(result => {
    chipsImgs = result; // ahora sí tenemos las imágenes cargadas
});;

let bgTable;
let bgBoard;
let cellImg;

let chipImgIndex = 0;

// Timer / game state
const TIME_LIMIT = 300; // segundos (5 minutos) - ajustar según necesario
let timer = null;
let gameActive = false;
let allChipsDrawn = false;

//Instancias
let endGameScreen = new EndGameScreen(ctx, canvasWidth, canvasHeight);
const RETRY_BTN = new Button(ctx, 0, 0, 150, 44, 12);
RETRY_BTN.setLayout(canvasWidth - 150 - 16, 12);

let btnPlay = document.getElementById("play");
//#endregion

btnPlay.addEventListener("click", function() {
    resetGameState();
    DrawGame();
    btnPlay.classList.add("fade-out");
    let btnFriends = document.getElementById("friends-id");
    if (btnFriends) btnFriends.classList.add("move-right");
    setTimeout(() => {
        if (btnFriends) {
            btnFriends.classList.add("default-position");
            btnFriends.classList.remove("move-right");
        }
        btnPlay.classList.add("disabled");
    }, 300);
});

// Resetea el estado interno antes de empezar una partida:
// - Vacía el array de fichas (chips) para forzar su recreación.
// - Resetea el flag gameActive y el tiempo restante.
// - Detiene cualquier timer anterior.
// Esto prepara todo para llamar a DrawGame() y repoblar el tablero.
function resetGameState() {
    chips = [];
    lastClickedChip = null;
    isMouseDown = false;

    // Reiniciar timer a su valor inicial
    gameActive = true;

    if (timer) {
        timer.stopTimer();
        timer.setTimeLeft(TIME_LIMIT);
    }

    if (hints){
        hints.hide();
    } 
}


//Dibuja el fondo el tablero y las fichas
function DrawGame() {
    chipsAmount = board.getValidCellCenters().length - 1; // Excluir la casilla central

    if(chipImgIndex < chipsImgs.length){
        addChip(chipsImgs[chipImgIndex]);
        chipImgIndex++;
    }
    else{
        chipImgIndex = 0;
    }
    
    if (chips.length < chipsAmount) {
        setTimeout(DrawGame, 100);
    } else {
        // Una vez completado, asegurarnos de dibujar la escena final
        startTimer();
        drawAllChips();
    }
}

// Explicación:
// Calcula la posición (x,y) y la celda (row,col) donde debe crearse la siguiente ficha.
// - Usa board.getValidCellCenters() para obtener las celdas jugables.
// - Excluye la celda central.
// - Crea la instancia Chip con sus coordenadas y con los campos cellRow/cellCol asignados.
function addChip(chipImg) {
    let x, y, row, col;

    if (board !== null) {
        const centers = board.getValidCellCenters();
        const centerIndex = Math.floor(board.size / 2);
        const validCenters = centers.filter(c => !(c.row === centerIndex && c.col === centerIndex));

        if (chips.length < validCenters.length) {
            const pos = validCenters[chips.length];
            const offset = (board.cellSize - CHIP_SIZE) / 2;
            x = pos.x + offset;
            y = pos.y + offset;
            row = pos.row;
            col = pos.col;
        }
    }

    const CHIP = new Chip(x, y, CHIP_SIZE, chipImg, ctx);
    CHIP.cellRow = row;
    CHIP.cellCol = col;
    CHIP.originalRow = row;
    CHIP.originalCol = col;
    CHIP.originalX = x;
    CHIP.originalY = y;
    chips.push(CHIP);
    drawAllChips();
}

//Dibuja todas las fichas
function drawAllChips() {
    clearCanvas();
    ctx.drawImage(bgTable, 0, 0, canvasWidth, canvasHeight);

    if (board != null) {
        if (bgBoard.complete && bgBoard.naturalHeight !== 0) {
            const boardWidth = board.size * board.cellSize * 1.50;
            const boardHeight = board.size * board.cellSize * 1.50;
            const imgX = Math.round((canvasWidth - boardWidth) / 2);
            const imgY = Math.round(((canvasHeight - boardHeight) / 2));
            ctx.drawImage(bgBoard, imgX, imgY, boardWidth, boardHeight);
        }
        board.draw();
    }

    for (let i = 0; i < chips.length; i++) {
        chips[i].draw();
    }

    if (timer){
        timer.draw();
    } 

    if (hints){
        hints.render(ctx);
    }
    RETRY_BTN.draw();

    endGameScreen.draw();
}

//Redibuja el canvas
function clearCanvas() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
}

//Cuando la pagina carga, settea todo lo necesario antes de empezar el juego
window.addEventListener('load', async() => {
    await waitForImages();

    // Crear el tablero recién ahora que cellImg ya está cargada
    const cellSize = 70;
    const boardCells = 7;
    const boardWidth = boardCells * cellSize;
    const boardHeight = boardCells * cellSize;
    const x = Math.round(canvasWidth - boardWidth) / 2; 
    const y = Math.round(((canvasHeight - boardHeight) / 2) + 35);
    board = new Board(x, y, boardCells, cellSize, "#333", cellImg, ctx);

    // Dibujar fondo + tablero inicial
    ctx.drawImage(bgTable, 0, 0, canvasWidth, canvasHeight);

    const boardW = board.size * board.cellSize * 1.5;
    const boardH = board.size * board.cellSize * 1.5;
    const imgX = Math.round((canvasWidth - boardW) / 2);
    const imgY = Math.round((canvasHeight - boardH) / 2);
    ctx.drawImage(bgBoard, imgX, imgY, boardW, boardH);

    board.draw();

    // Crear HintAnimator una vez que ya existe board y ctx
    hints = new HintAnimator({ board, ctx });

    // Loop liviano para animar SOLAMENTE cuando hints estén activos
    let lastHintNow = performance.now();
    function hintLoop(now) {
        const dt = (now - lastHintNow) / 1000;
        lastHintNow = now;
        if (hints && hints.active) {
            hints.update(dt);
            drawAllChips(); // necesitamos repintar para ver el pulso/bounce
        }
        requestAnimationFrame(hintLoop);
    }
    
    requestAnimationFrame(hintLoop);

    // Crear el timer ahora que tenemos ctx y tablero
    const timerX = 20;
    const timerY = 10;
    timer = new Timer(ctx, TIME_LIMIT, timerX, timerY, 380, 'rgba(0,0,0,0.6)', '18px monospace', '#FFD54F', '#FFD54F');
    timer.setOnEnd(() => {
        gameActive = false;
        endGame('Se acabó el tiempo. Fin del juego.', false);
    });
    // Cada segundo redibujar la escena para refrescar el contador incluso si el jugador no se mueve
    timer.setOnTick(() => {
        // redibujar canvas para que timer.draw() muestre el tiempo actualizado
        drawAllChips();
    });
});

//Agrega events listeners
canvas.addEventListener("mousedown", onMouseDown, false);
canvas.addEventListener("mouseup", onMouseUp, false);
canvas.addEventListener("mousemove", onMouseMove, false);


// - Ignora input si el juego no está activo (gameActive).
// - Detecta la ficha clicada (findClickedFicha) y la marca como seleccionada.
// - Guarda la posición original para poder revertir si el movimiento resulta inválido.
// - Reordena el array 'chips' para dibujar la ficha seleccionada encima.

// ACTUALIZACIÓN DEFENSA:
// Si clickea una ficha, calcula los caminos válidos para esa ficha y los guarda enn la variable global validPaths
function onMouseDown(e) {
    
    if (RETRY_BTN.isInButton(e.offsetX, e.offsetY)) {
        resetGame();
        timer.stopTimer();
        drawAllChips();
        return;
    }

    if (endGameScreen.isActive() && endGameScreen.isRetryClicked(e.offsetX, e.offsetY)) {
        resetGame();
        endGameScreen.hide();
        timer.stopTimer();
        drawAllChips();
        return;
    }

    if (!gameActive) return;
    
    isMouseDown = true;

    if (hints){
        hints.hide();
    } 

    if (lastClickedChip != null) {
        lastClickedChip.setClicked(false);
        lastClickedChip = null;
    }

    let clickedChip = findClickedFicha(e.offsetX, e.offsetY);
    if (clickedChip != null) {
        clickedChip.setClicked(true);
        lastClickedChip = clickedChip;
        validPaths = board.computeValidDestinationsForChip(clickedChip);

        lastClickedChip.originalX = lastClickedChip.x;
        lastClickedChip.originalY = lastClickedChip.y;
        lastClickedChip.originalRow = lastClickedChip.cellRow;
        lastClickedChip.originalCol = lastClickedChip.cellCol;

        setLast();
        updateHintsForChip(lastClickedChip);
    }
    else{
        updateHintsForChip(null);
        lastClickedChip = null;
    }

    drawAllChips();
}

//Encuentra la ficha clickeada
function findClickedFicha(mouseX, mouseY) {
    for (let i = chips.length - 1; i >= 0; i--) {
        if (chips[i].isMouseInside(mouseX, mouseY)) {
            return chips[i];
        }
    }
    return null;
}

//Posiciona la ficha en el ultimo lugar del arreglo para que se dibuje sobre las demas fichas
function setLast() {
    let index = chips.indexOf(lastClickedChip);
    if (index > -1) {
        chips.splice(index, 1);
        chips.push(lastClickedChip);
    }
}

// - Al soltar, buscamos la celda válida más cercana al centro de la ficha.
// - Validamos el movimiento con isValidMove():
// - Debe ser un salto ortogonal de 2 celdas con una ficha en la intermedia.
// - El destino debe estar vacío.
// - Si es válido: eliminamos la ficha intermedia, actualizamos cellRow/cellCol y snappeamos
// - la ficha a la celda (posición top-left + offset).
// - Si no es válido: revertimos a la posición original guardada en originalX/originalY.
// - Tras un movimiento válido comprobamos si hay movimientos posibles (checkAnyMoves).

// ACTUALIZACIÓN DEFENSA:
// Si la posición en la que se suelta la ficha es válida (está dentro de alguna celda)
// chequea si esa celda es la celda destino de alguno de los caminos almacenados en validPaths
// Si coincide con alguno, elimina todas las fichas almacenadas de ese camino y mueve la ficha
// Después, vacía validPaths para futuros movimientos
function onMouseUp(e) {
    if (!gameActive) return;
    isMouseDown = false;

    if (!lastClickedChip) return;

    const dropX = lastClickedChip.x + lastClickedChip.size / 2;
    const dropY = lastClickedChip.y + lastClickedChip.size / 2;

    const dest = board.findClosestCell(dropX, dropY);

    if (dest && board.isInPath(dest.row, dest.col)) {
        for (const p of validPaths) {
            let validRow = p.row;
            let validCol = p.col;
            if (validRow === dest.row && validCol === dest.col) {
                let chipsToDelete = p.getCopy();
                for (const c of chipsToDelete) {
                    const idx = chips.indexOf(c);
                    if (idx > -1) chips.splice(idx, 1);
                }
            }
        }
        const tl = board.getCellTopLeft(dest.row, dest.col);
        const offset = (board.cellSize - CHIP_SIZE) / 2;
        lastClickedChip.x = tl.x + offset;
        lastClickedChip.y = tl.y + offset;
        lastClickedChip.cellRow = dest.row;
        lastClickedChip.cellCol = dest.col;
        lastClickedChip.setClicked(false);

        lastClickedChip = null;
        validPaths = [];

        if (hints){
            hints.hide();
        } 

        drawAllChips();

        // ===== Condición de victoria "clásica": 1 ficha y debe quedar en el CENTRO =====
        if (chips.length === 1) {
        const center = Math.floor(board.size / 2);  
        const only = chips[0];
        const isCenter = only.cellRow === center && only.cellCol === center;

        if (isCenter) {
            endGame("¡Victoria perfecta! La ficha quedó en el centro.", true);
        } else {
            endGame("Quedó 1 ficha, pero NO en el centro. Fin del juego", false);
        }
        } else if (!board.checkAnyMoves() && chips.length > 1) {
            endGame("No hay más movimientos. Fin del juego.", false);
        }
        return;
    } else {
        lastClickedChip.x = lastClickedChip.originalX;
        lastClickedChip.y = lastClickedChip.originalY;
        lastClickedChip.cellRow = lastClickedChip.originalRow;
        lastClickedChip.cellCol = lastClickedChip.originalCol;
        lastClickedChip.setClicked(false);
    
        lastClickedChip = null;
        if (hints){
            hints.hide();
        } 

        drawAllChips();
    }

    lastClickedChip = null;
}

// - Si hay una ficha seleccionada y el botón está presionado, moveremos la ficha
// - Centrando su imagen bajo el cursor para dar la sensación de arrastrar.
// - No aplicamos snapping hasta onMouseUp donde validamos la celda destino.
function onMouseMove(e) {
    if (!gameActive) return;

    if (isMouseDown && lastClickedChip != null) {
        // mover la ficha con el puntero (centrada bajo el cursor)
        lastClickedChip.setPosition(e.offsetX - lastClickedChip.size / 2, e.offsetY - lastClickedChip.size / 2);
        drawAllChips();
    }
}

function endGame(message, won) {
    gameActive = false;
    if (timer) timer.stopTimer();

    if (hints){
        hints.hide();
    }

    endGameScreen.show(message, won);
    drawAllChips(); // Se dibuja el overlay dentro
}

// Reinicia el juego, limpia las fichas y vuelve a crear la configuración inicial
function resetGame() {
    chips = [];
    lastClickedChip = null;
    isMouseDown = false;

    DrawGame();

    gameActive = true;
    if (timer) {
        timer.stopTimer();
        timer.setTimeLeft(TIME_LIMIT);
        timer.startTimer();
    }

    if (hints){
        hints.hide();
    }
}

// Timer helpers
function startTimer() {
    timer.setOnEnd(() => {
        gameActive = false;
        endGame("Se acabó el tiempo. Fin del juego.", false);
    });

    timer.setTimeLeft(TIME_LIMIT);
    timer.startTimer();
    
}

//Carga de Varias Imagenes
function loadImagesAsync(srcs) {
    return Promise.all(
      srcs.map(src => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = src;
      }))
    );
}

//Carga de una sola imagen
function loadImageAsync(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });
}

//Espera a que esten todas cargadas
async function waitForImages(){
    bgTable = await loadImageAsync(BG_TABLE);
    bgBoard = await loadImageAsync(BG_BOARD);
    cellImg = await loadImageAsync(CELL_IMAGE);
}

//Actualiza las animaciones por cada ficha
function updateHintsForChip(chip) {
  if (!chip || !hints) { if (hints) hints.hide(); return; }
  const targets = board.computeValidDestinationsForChip(chip);
  if (targets.length) {
    hints.show({ row: chip.cellRow, col: chip.cellCol }, targets.map(t => ({ row: t.row, col: t.col })));
  } else {
    hints.hide();
  }

}



