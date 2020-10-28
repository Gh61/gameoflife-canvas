///<reference path="node_modules/knockout/build/types/knockout.d.ts"/>

class SettingsViewModel {
	cellSize = kox.intObservable(10);
	borderSize = kox.intObservable(1);
	completeSize = ko.computed(() => this.cellSize() + this.borderSize());
	borderColor = ko.observable("#111111");
	deadColor = ko.observable("#000000");
	liveColor = ko.observable("#ff0000");
	speed = ko.observable(10);
	pauseTime = ko.computed(() => this.speed() * 2); // 2s
}

class GameOfLife {
	// #### Settings
	readonly settings: SettingsViewModel;

	// #### Private
	private readonly canvas: HTMLCanvasElement;
	private lastState: CellOfLife[][];
	private currentState: CellOfLife[][];
	private maxX: number;
	private maxY: number;
	private isPaused: number = 0;
	private settingsHeight: number = 0;

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		this.settings = new SettingsViewModel();

		this.hookSettingsChanges(this.settings);
	}

	// #region Settings change

	private hookSettingsChanges(settings: SettingsViewModel) {
		// change of cellsize/bordersize means re-render whole grid with cells
		settings.completeSize.subscribe(() => {
			this.drawGrid();
			this.renderCurrentState(false);
		});

		settings.borderColor.subscribe(() => {
			this.drawGrid();
			this.renderCurrentState(false);
		});

		settings.deadColor.subscribe(() => {
			this.renderCurrentState(false);
		});

		settings.liveColor.subscribe(() => {
			this.renderCurrentState(false);
		});
	}

	// #endregion

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
		this.isPaused = this.settings.pauseTime();
		this.isLiveSetting = this.toggleCellLive(ev);
		this.renderCurrentState(false);
	}

	private mouseMove(ev: MouseEvent) {
		if (this.mouseIsClicking) {
			this.isPaused = this.settings.pauseTime();
			this.toggleCellLive(ev, this.isLiveSetting);
			this.renderCurrentState(false);
		}
	}

	private mouseUp(ev: MouseEvent) {
		this.isPaused = this.settings.pauseTime();
		this.mouseIsClicking = false;
	}

	/**
	 * Will toggle the state of the cell under the cursor.
	 * @param ev Mouse event after click, move
	 * @param setLive If the cell might be set Live/Dead or toggled(null)
	 * @returns The state wich was set to
	 */
	private toggleCellLive(ev: MouseEvent, setLive?: boolean): boolean {
		const x = Math.floor(ev.clientX / this.settings.completeSize());
		const y = Math.floor((ev.clientY - this.settingsHeight) / this.settings.completeSize());

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
		setInterval(() => this.game(), 1000 / this.settings.speed());
	}

	/**
	 * Resizes cavas to full size of window
	 */
	private setCanvasSize() {
		var settings = document.getElementById("settings");
		if (settings) {
			this.settingsHeight = settings.clientHeight;
		}

		this.canvas.width = document.body.clientWidth;
		this.canvas.height = document.body.clientHeight - this.settingsHeight;
	}

	/**
	 * Will draw basic grid
	 */
	private drawGrid() {
		const context = this.canvas.getContext("2d");
		context.imageSmoothingEnabled = false;

		// clearing the canvas
		context.clearRect(0, 0, this.canvas.width, this.canvas.height);

		// drawing grid only if needed - using rectangles (lines are not perfectly aligned)
		if (this.settings.borderSize() > 0) {
			context.fillStyle = this.settings.borderColor();

			// vertical lines
			for (let x = this.settings.cellSize(); x < this.canvas.width; x += this.settings.completeSize()) {
				context.fillRect(x, 0, this.settings.borderSize(), this.canvas.height);
			}

			// horizontal lines
			for (let y = this.settings.cellSize(); y < this.canvas.height; y += this.settings.completeSize()) {
				context.fillRect(0, y, this.canvas.width, this.settings.borderSize());
			}
		}
	}

	/**
	 * Initializes arrays of cells (lastState and currentState) depending on size of canvas.
	 */
	private initializeStates() {
		this.maxX = Math.ceil(this.canvas.width / this.settings.completeSize());
		this.maxY = Math.ceil(this.canvas.height / this.settings.completeSize());

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
				const posX = x * this.settings.completeSize();
				const posY = y * this.settings.completeSize();

				// render to the right context
				if (this.currentState[x][y].isLive) {
					ctx.fillStyle = this.settings.liveColor();
				} else {
					ctx.fillStyle = this.settings.deadColor();
				}

				ctx.fillRect(posX, posY, this.settings.cellSize(), this.settings.cellSize());
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

	ko.applyBindings(gol.settings, document.getElementById("settings"));
};