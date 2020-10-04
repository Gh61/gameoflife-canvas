class GameOfLife {
	// #### Settings
	private static readonly size: number = 10;
	private static readonly borderSize: number = 1;
	private static readonly completeSize = GameOfLife.size + GameOfLife.borderSize;
	private static readonly borderColor: string = "#111";
	private static readonly deadColor: string = "black";
	private static readonly liveColor: string = "red";
	private static readonly fps: number = 10;
	private static readonly pauseTime = GameOfLife.fps * 2; // 3s

	// #### Private
	private readonly canvas: HTMLCanvasElement;
	private lastState: CellOfLife[][];
	private currentState: CellOfLife[][];
	private maxX: number;
	private maxY: number;
	private isPaused: number = 0;

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
	}

	// #region Clicks

	private mouseIsClicking: boolean = false;
	private isLiveSetting: boolean = false;

	private registerClicks() {
		this.canvas.addEventListener("mousedown", ev => this.mouseDown(ev));
		this.canvas.addEventListener("mousemove", ev => this.mouseMove(ev));
		this.canvas.addEventListener("mouseup", ev => this.mouseUp(ev));
	}

	private mouseDown(ev: MouseEvent) {
		this.mouseIsClicking = true;
		this.isPaused = GameOfLife.pauseTime;
		this.isLiveSetting = this.toggleCellLive(ev);
		this.renderCurrentState(false);
	}

	private mouseMove(ev: MouseEvent) {
		if (this.mouseIsClicking) {
			this.isPaused = GameOfLife.pauseTime;
			this.toggleCellLive(ev, this.isLiveSetting);
			this.renderCurrentState(false);
		}
	}

	private mouseUp(ev: MouseEvent) {
		this.isPaused = GameOfLife.pauseTime;
		this.mouseIsClicking = false;
	}

	/**
	 * Will toggle the state of the cell under the cursor.
	 * @param ev Mouse event after click, move
	 * @param setLive If the cell might be set Live/Dead or toggled(null)
	 * @returns The state wich was set to
	 */
	private toggleCellLive(ev: MouseEvent, setLive?: boolean): boolean {
		const x = Math.floor(ev.clientX / GameOfLife.completeSize);
		const y = Math.floor(ev.clientY / GameOfLife.completeSize);

		const cell = this.currentState[x][y];

		if (setLive == null) {
			cell.isLive = !cell.isLive;
		} else {
			cell.isLive = setLive;
		}

		return cell.isLive; // returning if cell was set to live
	}

	// #endregion

	// #region Game engine

	/**
	 * Will start the Game of life
	 */
	start() {
		// clicks support
		this.registerClicks();

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
	private setCanvasSize() {
		this.canvas.width = document.body.clientWidth;
		this.canvas.height = document.body.clientHeight;
	}

	/**
	 * Will draw basic grid
	 */
	private drawGrid() {
		const context = this.canvas.getContext("2d");
		context.imageSmoothingEnabled = false;

		// clearing the canvas
		context.clearRect(0, 0, this.canvas.width, this.canvas.height);

		// drawing grid only if needed
		if (GameOfLife.borderSize > 0) {

			// vertical lines
			for (let x = GameOfLife.size; x < this.canvas.width; x += GameOfLife.completeSize) {
				context.beginPath();
				context.moveTo(x + .5, 0.5); // y needs .5 fix, for pixel perfect drawing
				context.lineTo(x + .5, this.canvas.height + .5);
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
	private initializeStates() {
		this.maxX = Math.ceil(this.canvas.width / GameOfLife.completeSize);
		this.maxY = Math.ceil(this.canvas.height / GameOfLife.completeSize);

		//TODO: preserve currentState (when resizin - resize event)

		this.lastState = this.createNewState(true);
		this.currentState = this.createNewState(true);
	}

	/**
	 * One step of gameLoop
	 */
	private game() {
		// when paused
		if (this.isPaused > 0) {
			// waiting to unpause
			this.isPaused--;
			return;
		}

		// transform
		this.transformToNewState();

		// render
		this.renderCurrentState();
	}

	/**
	 * create new state depending on currentState and rules.
	 */
	private transformToNewState() {
		this.lastState = this.currentState;
		this.currentState = this.createNewState();

		// deadCell - helper
		const deadCell = new CellOfLife();

		for (let x = 0; x < this.maxX; x++) {
			for (let y = 0; y < this.maxY; y++) {
				// Getting neighbours
				const neighbours = new Array<CellOfLife>();
				// first row
				if (y > 0) {
					neighbours.push(x > 0 ? this.lastState[x - 1][y - 1] : deadCell);
					neighbours.push(this.lastState[x][y - 1]);
					neighbours.push(x < this.maxX - 1 ? this.lastState[x + 1][y - 1] : deadCell);
				} else {
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
				} else {
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
	private renderCurrentState(onlyChanges: boolean = true) {
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
				} else {
					ctx.fillStyle = GameOfLife.deadColor;
				}

				ctx.fillRect(posX, posY, GameOfLife.size, GameOfLife.size);
			}
		}
	}

	// #### UTILS:

	private createNewState(init: boolean = false): CellOfLife[][] {
		if (init) {
			return new Array<CellOfLife[]>(this.maxX).fill(null).map(() =>
				new Array<CellOfLife>(this.maxY).fill(new CellOfLife())
			);
		} else {
			return new Array<CellOfLife[]>(this.maxX).fill(null).map(() =>
				new Array<CellOfLife>(this.maxY)
			);
		}
	}

	// #endregion
}

class CellOfLife {
	isLive: boolean;

	constructor(isLive: boolean = false) {
		this.isLive = isLive;
	}

	/**
	 * Creates new state of this cell.
	 */
	getNewState(surroundingCells: CellOfLife[]): CellOfLife {
		const liveNeighbours = surroundingCells.filter(c => c.isLive).length;
		let nextIsLive = this.isLive;
		if (this.isLive) {
			if (liveNeighbours < 2 || liveNeighbours > 3) {
				nextIsLive = false;
			}
		} else {
			if (liveNeighbours === 3) {
				nextIsLive = true;
			}
		}

		return new CellOfLife(nextIsLive);
	}
}


window.onload = () => {
	var canvas = document.getElementById("gc");
	var gol = new GameOfLife(canvas as HTMLCanvasElement);
	gol.start();
};