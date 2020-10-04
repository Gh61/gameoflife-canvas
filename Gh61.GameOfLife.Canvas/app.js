class GameOfLife {
    constructor(canvas) {
        this.isPaused = false;
        this.canvas = canvas;
    }
    /**
     * Will start the Game of life
     */
    start() {
        this.setCanvasSize();
        // init states
        this.initializeStates();
        // TEST: basic oscilator:
        this.currentState[2][1] = new CellOfLife(true);
        this.currentState[2][2] = new CellOfLife(true);
        this.currentState[2][3] = new CellOfLife(true);
        // create grid
        this.drawGrid();
        // startup full render
        this.renderCurrentState(false);
        // start game loop
        setInterval(() => this.game(), 1000 / GameOfLife.fps);
    }
    /**
     * Resizes cavas to full size of window
     */
    setCanvasSize() {
        this.canvas.width = document.body.clientWidth;
        this.canvas.height = document.body.clientHeight;
    }
    /**
     * Will draw basic grid
     */
    drawGrid() {
        const context = this.canvas.getContext("2d");
        context.imageSmoothingEnabled = false;
        // clearing the canvas
        context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // drawing grid only if needed
        if (GameOfLife.borderSize > 0) {
            // vertical lines
            for (let x = GameOfLife.size; x < this.canvas.width; x += GameOfLife.completeSize) {
                context.beginPath();
                context.moveTo(x, 0.5); // y needs .5 fix, for pixel perfect drawing
                context.lineTo(x, this.canvas.height + .5);
                context.lineWidth = GameOfLife.borderSize;
                context.strokeStyle = GameOfLife.borderColor;
                context.stroke();
            }
            // horizontal lines
            for (let y = GameOfLife.size; y < this.canvas.height; y += GameOfLife.completeSize) {
                context.beginPath();
                context.moveTo(0, y + .5);
                context.lineTo(this.canvas.width, y + .5);
                context.lineWidth = GameOfLife.borderSize;
                context.strokeStyle = GameOfLife.borderColor;
                context.stroke();
            }
        }
    }
    /**
     * Initializes arrays of cells (lastState and currentState) depending on size of canvas.
     */
    initializeStates() {
        this.maxX = Math.ceil(this.canvas.width / GameOfLife.completeSize);
        this.maxY = Math.ceil(this.canvas.height / GameOfLife.completeSize);
        //TODO: preserve currentState
        this.lastState = this.createNewState(true);
        this.currentState = this.createNewState(true);
    }
    /**
     * One step of gameLoop
     */
    game() {
        // when paused
        if (this.isPaused)
            return;
        // transform
        this.transformToNewState();
        // render
        this.renderCurrentState();
    }
    /**
     * create new state depending on currentState and rules.
     */
    transformToNewState() {
        this.lastState = this.currentState;
        this.currentState = this.createNewState();
        // deadCell - helper
        const deadCell = new CellOfLife();
        for (let x = 0; x < this.maxX; x++) {
            for (let y = 0; y < this.maxY; y++) {
                // Getting neighbours
                const neighbours = new Array();
                // first row
                if (y > 0) {
                    neighbours.push(x > 0 ? this.lastState[x - 1][y - 1] : deadCell);
                    neighbours.push(this.lastState[x][y - 1]);
                    neighbours.push(x < this.maxX - 1 ? this.lastState[x + 1][y - 1] : deadCell);
                }
                else {
                    neighbours.push(deadCell);
                    neighbours.push(deadCell);
                    neighbours.push(deadCell);
                }
                // middle row
                neighbours.push(x > 0 ? this.lastState[x - 1][y] : deadCell);
                neighbours.push(x < this.maxX - 1 ? this.lastState[x + 1][y] : deadCell);
                // last row
                if (y < this.maxY - 1) {
                    neighbours.push(x > 0 ? this.lastState[x - 1][y + 1] : deadCell);
                    neighbours.push(this.lastState[x][y + 1]);
                    neighbours.push(x < this.maxX - 1 ? this.lastState[x + 1][y + 1] : deadCell);
                }
                else {
                    neighbours.push(deadCell);
                    neighbours.push(deadCell);
                    neighbours.push(deadCell);
                }
                // setting new cell
                this.currentState[x][y] = this.lastState[x][y].getNewState(neighbours);
            }
        }
    }
    /**
     * Renders currentState (only changes)
     */
    renderCurrentState(onlyChanges = true) {
        const ctx = this.canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        for (let x = 0; x < this.maxX; x++) {
            for (let y = 0; y < this.maxY; y++) {
                // if rendering only changes, then skip cells with same state
                if (onlyChanges && this.lastState[x][y].isLive === this.currentState[x][y].isLive) {
                    continue;
                }
                // compute position
                const posX = x * GameOfLife.completeSize;
                const posY = y * GameOfLife.completeSize;
                // render to the right context
                if (this.currentState[x][y].isLive) {
                    ctx.fillStyle = GameOfLife.liveColor;
                }
                else {
                    ctx.fillStyle = GameOfLife.deadColor;
                }
                ctx.fillRect(posX, posY, GameOfLife.size, GameOfLife.size);
            }
        }
    }
    // #### UTILS:
    createNewState(init = false) {
        if (init) {
            return new Array(this.maxX).fill(null).map(() => new Array(this.maxY).fill(new CellOfLife()));
        }
        else {
            return new Array(this.maxX).fill(null).map(() => new Array(this.maxY));
        }
    }
}
// #### Settings
GameOfLife.size = 5;
GameOfLife.borderSize = 1;
GameOfLife.completeSize = GameOfLife.size + GameOfLife.borderSize;
GameOfLife.borderColor = "#049372";
GameOfLife.deadColor = "#fff";
GameOfLife.liveColor = "#5B8930";
GameOfLife.fps = 4;
class CellOfLife {
    constructor(isLive = false) {
        this.isLive = isLive;
    }
    /**
     * Creates new state of this cell.
     */
    getNewState(surroundingCells) {
        const liveNeighbours = surroundingCells.filter(c => c.isLive).length;
        let nextIsLive = this.isLive;
        if (this.isLive) {
            if (liveNeighbours < 2 || liveNeighbours > 3) {
                nextIsLive = false;
            }
        }
        else {
            if (liveNeighbours === 3) {
                nextIsLive = true;
            }
        }
        // if is state same is this, returning this
        if (nextIsLive === this.isLive) {
            return this;
        }
        return new CellOfLife(nextIsLive);
    }
}
window.onload = () => {
    var canvas = document.getElementById("gc");
    var gol = new GameOfLife(canvas);
    gol.start();
};
//# sourceMappingURL=app.js.map