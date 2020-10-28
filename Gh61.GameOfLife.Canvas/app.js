class SettingsViewModel {
    constructor() {
        this.cellSize = kox.intObservable(10);
        this.borderSize = kox.intObservable(1);
        this.completeSize = ko.computed(() => this.cellSize() + this.borderSize());
        this.borderColor = ko.observable("#111");
        this.deadColor = ko.observable("black");
        this.liveColor = ko.observable("red");
        this.speed = ko.observable(10);
        this.pauseTime = ko.computed(() => this.speed() * 2);
    }
}
class GameOfLife {
    constructor(canvas) {
        this.isPaused = 0;
        this.settingsHeight = 0;
        this.mouseIsClicking = false;
        this.isLiveSetting = false;
        this.canvas = canvas;
        this.settings = new SettingsViewModel();
        this.hookSettingsChanges(this.settings);
    }
    hookSettingsChanges(settings) {
        settings.completeSize.subscribe(() => {
            this.drawGrid();
            this.renderCurrentState(false);
        });
    }
    registerClicks() {
        this.canvas.addEventListener("mousedown", ev => this.mouseDown(ev));
        this.canvas.addEventListener("mousemove", ev => this.mouseMove(ev));
        this.canvas.addEventListener("mouseup", ev => this.mouseUp(ev));
    }
    mouseDown(ev) {
        this.mouseIsClicking = true;
        this.isPaused = this.settings.pauseTime();
        this.isLiveSetting = this.toggleCellLive(ev);
        this.renderCurrentState(false);
    }
    mouseMove(ev) {
        if (this.mouseIsClicking) {
            this.isPaused = this.settings.pauseTime();
            this.toggleCellLive(ev, this.isLiveSetting);
            this.renderCurrentState(false);
        }
    }
    mouseUp(ev) {
        this.isPaused = this.settings.pauseTime();
        this.mouseIsClicking = false;
    }
    toggleCellLive(ev, setLive) {
        const x = Math.floor(ev.clientX / this.settings.completeSize());
        const y = Math.floor((ev.clientY - this.settingsHeight) / this.settings.completeSize());
        const cell = this.currentState[x][y];
        if (setLive == null) {
            cell.isLive = !cell.isLive;
        }
        else {
            cell.isLive = setLive;
        }
        return cell.isLive;
    }
    start() {
        this.registerClicks();
        this.setCanvasSize();
        this.initializeStates();
        this.currentState[2][1] = new CellOfLife(true);
        this.currentState[2][2] = new CellOfLife(true);
        this.currentState[2][3] = new CellOfLife(true);
        this.drawGrid();
        this.renderCurrentState(false);
        setInterval(() => this.game(), 1000 / this.settings.speed());
    }
    setCanvasSize() {
        var settings = document.getElementById("settings");
        if (settings) {
            this.settingsHeight = settings.clientHeight;
        }
        this.canvas.width = document.body.clientWidth;
        this.canvas.height = document.body.clientHeight - this.settingsHeight;
    }
    drawGrid() {
        const context = this.canvas.getContext("2d");
        context.imageSmoothingEnabled = false;
        context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.settings.borderSize() > 0) {
            context.fillStyle = this.settings.borderColor();
            for (let x = this.settings.cellSize(); x < this.canvas.width; x += this.settings.completeSize()) {
                context.fillRect(x, 0, this.settings.borderSize(), this.canvas.height);
            }
            for (let y = this.settings.cellSize(); y < this.canvas.height; y += this.settings.completeSize()) {
                context.fillRect(0, y, this.canvas.width, this.settings.borderSize());
            }
        }
    }
    initializeStates() {
        this.maxX = Math.ceil(this.canvas.width / this.settings.completeSize());
        this.maxY = Math.ceil(this.canvas.height / this.settings.completeSize());
        this.lastState = this.createNewState(true);
        this.currentState = this.createNewState(true);
    }
    game() {
        if (this.isPaused > 0) {
            this.isPaused--;
            return;
        }
        this.transformToNewState();
        this.renderCurrentState();
    }
    transformToNewState() {
        this.lastState = this.currentState;
        this.currentState = this.createNewState();
        const deadCell = new CellOfLife();
        for (let x = 0; x < this.maxX; x++) {
            for (let y = 0; y < this.maxY; y++) {
                const neighbours = new Array();
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
                neighbours.push(x > 0 ? this.lastState[x - 1][y] : deadCell);
                neighbours.push(x < this.maxX - 1 ? this.lastState[x + 1][y] : deadCell);
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
                this.currentState[x][y] = this.lastState[x][y].getNewState(neighbours);
            }
        }
    }
    renderCurrentState(onlyChanges = true) {
        const ctx = this.canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        for (let x = 0; x < this.maxX; x++) {
            for (let y = 0; y < this.maxY; y++) {
                if (onlyChanges && this.lastState[x][y].isLive === this.currentState[x][y].isLive) {
                    continue;
                }
                const posX = x * this.settings.completeSize();
                const posY = y * this.settings.completeSize();
                if (this.currentState[x][y].isLive) {
                    ctx.fillStyle = this.settings.liveColor();
                }
                else {
                    ctx.fillStyle = this.settings.deadColor();
                }
                ctx.fillRect(posX, posY, this.settings.cellSize(), this.settings.cellSize());
            }
        }
    }
    createNewState(init = false) {
        if (init) {
            return new Array(this.maxX).fill(null).map(() => new Array(this.maxY).fill(new CellOfLife()));
        }
        else {
            return new Array(this.maxX).fill(null).map(() => new Array(this.maxY));
        }
    }
}
class CellOfLife {
    constructor(isLive = false) {
        this.isLive = isLive;
    }
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
        return new CellOfLife(nextIsLive);
    }
}
window.onload = () => {
    var canvas = document.getElementById("gc");
    var gol = new GameOfLife(canvas);
    gol.start();
    ko.applyBindings(gol.settings, document.getElementById("settings"));
};
//# sourceMappingURL=app.js.map