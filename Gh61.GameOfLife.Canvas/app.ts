class GameOfLife {
	// Settings
	private static readonly size: number = 15;
	private static readonly borderSize: number = 1;
	private static readonly borderColor: string = "#BDC3C7";
	private static readonly deadColor: string = "#fff";
	private static readonly liveColor: string = "#000";

	// Private
	private readonly canvas: HTMLCanvasElement;

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
	}

	/**
	 * Will start the Game of life
	 */
	start() {
		// create grid
		this.drawGrid();

		// TODO: start game loop
	}

	/**
	 * Will draw basic grid
	 */
	private drawGrid() {
		// resize cavas to full size of window
		this.canvas.width = document.body.clientWidth;
		this.canvas.height = document.body.clientHeight;

		const context = this.canvas.getContext("2d");

		// clearing the canvas
		context.clearRect(0, 0, this.canvas.width, this.canvas.height);

		// drawing grid only if needed
		if (GameOfLife.borderSize > 0) {

			// vertical lines
			for (let x = GameOfLife.size; x < this.canvas.width; x += GameOfLife.size + GameOfLife.borderSize) {
				context.beginPath();
				context.moveTo(x, 0.5); // y needs .5 fix, for pixel perfect drawing
				context.lineTo(x, this.canvas.height + .5);
				context.lineWidth = GameOfLife.borderSize;
				context.strokeStyle = GameOfLife.borderColor;
				context.stroke();
			}

			// horizontal lines
			for (let y = GameOfLife.size; y < this.canvas.height; y += GameOfLife.size + GameOfLife.borderSize) {
				context.beginPath();
				context.moveTo(0, y + .5);
				context.lineTo(this.canvas.width, y + .5);
				context.lineWidth = GameOfLife.borderSize;
				context.strokeStyle = GameOfLife.borderColor;
				context.stroke();
			}
		}
	}
}


window.onload = () => {
	var canvas = document.getElementById("gc");
	var gol = new GameOfLife(canvas as HTMLCanvasElement);
	gol.start();
};