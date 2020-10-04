var GameOfLife = /** @class */ (function () {
    function GameOfLife(canvas) {
        this.canvas = canvas;
    }
    /**
     * Will start the Game of life
     */
    GameOfLife.prototype.start = function () {
        // create grid
        this.drawGrid();
        // TODO: start game loop
    };
    /**
     * Will draw basic grid
     */
    GameOfLife.prototype.drawGrid = function () {
        // resize cavas to full size
        this.canvas.width = document.body.clientWidth;
        this.canvas.height = document.body.clientHeight;
        var context = this.canvas.getContext("2d");
        console.log("Size: " + this.canvas.width + "x" + this.canvas.height);
        // clearing the canvas
        context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // drawing grid only if needed
        if (GameOfLife.borderSize > 0) {
            // vertical lines
            for (var x = GameOfLife.size; x < this.canvas.width; x += GameOfLife.size + GameOfLife.borderSize) {
                context.beginPath();
                context.moveTo(x, 0.5);
                context.lineTo(x, this.canvas.height + .5);
                context.lineWidth = GameOfLife.borderSize;
                context.strokeStyle = GameOfLife.borderColor;
                context.stroke();
            }
            // horizontal lines
            for (var y = GameOfLife.size; y < this.canvas.height; y += GameOfLife.size + GameOfLife.borderSize) {
                context.beginPath();
                context.moveTo(0, y + .5);
                context.lineTo(this.canvas.width, y + .5);
                context.lineWidth = GameOfLife.borderSize;
                context.strokeStyle = GameOfLife.borderColor;
                context.stroke();
            }
        }
    };
    // Settings
    GameOfLife.size = 15;
    GameOfLife.borderSize = 1;
    GameOfLife.borderColor = "#BDC3C7";
    GameOfLife.deadColor = "#fff";
    GameOfLife.liveColor = "#000";
    return GameOfLife;
}());
window.onload = function () {
    var canvas = document.getElementById("gc");
    var gol = new GameOfLife(canvas);
    gol.start();
};
//# sourceMappingURL=app.js.map