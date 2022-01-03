'use strict';

class Board {
  /**
   * @type {number | null}
   */
  interval;

  /**
   *
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.rows = Math.floor(this.canvas.height / Cell.SIZE);
    this.columns = Math.floor(this.canvas.width / Cell.SIZE);
    this.marginY = (canvas.height - this.rows * Cell.SIZE) / 2;
    this.marginX = (canvas.width - this.columns * Cell.SIZE) / 2;

    this.ctx = canvas.getContext('2d');
    this.ctx.strokeStyle = '#505050';
    this.ctx.lineWidth = 2;

    /**
     * @type {Cell[][]}
     */
    this.grid = [[]];
    this.interval = null;

    this.#generateCells();
    this.canvas.addEventListener('click', this.#handleClick.bind(this));
  }

  #generateCells() {
    for (let i = 0; i < this.rows; i++) {
      const row = [];

      for (let j = 0; j < this.columns; j++) {
        const cell = new Cell(this, i, j);
        row[j] = cell;
      }

      this.grid[i] = row;
    }
  }

  #loadNextState() {
    this.grid.forEach((row) => {
      row.forEach((cell) => cell.getNextState());
    });
  }

  #update() {
    this.grid.forEach((row) => {
      row.forEach((cell) => {
        cell.update();
      });
    });
  }

  /**
   *
   * @param {MouseEvent} event
   */
  #handleClick(event) {
    const { clientX, clientY } = event;
    const cell = this.#findCell(clientX, clientY);

    if (cell instanceof Cell) {
      cell.toggle();
    }
  }

  /**
   * Find the cell at the given coordinates
   * @param {Number} x
   * @param {Number} y
   * @returns {Cell | null} Cell in the grid
   */
  #findCell(x, y) {
    const { canvas, marginX, marginY } = this;
    const { offsetLeft: left, offsetTop: top } = canvas;

    if (x > canvas.width + left - marginX) {
      return null;
    }

    if (x < left + marginX) {
      return null;
    }

    if (y > canvas.height + top - marginY) {
      return null;
    }

    if (y < top + marginX) {
      return null;
    }

    const canvasX = x - left - marginX;
    const canvasY = y - top - marginY;

    const { SIZE } = Cell;
    const row = Math.floor(canvasY / SIZE);
    const column = Math.floor(canvasX / SIZE);

    const cell = this.grid[row][column];
    console.log(cell);
    return cell;
  }

  play() {
    if (this.interval === null) {
      this.interval = setInterval(() => {
        this.#loadNextState();
        this.#update();
      }, 1000);
    }
  }

  stop() {
    clearInterval(this.interval);
    this.interval = null;
  }
}

class Cell {
  static SIZE = 50;

  /**
   * @param {Board} board
   * @param {Number} row
   * @param {Number} column
   */
  constructor(board, row, column) {
    this.board = board;
    this.row = row;
    this.column = column;
    this.currentState = false;
    this.nextState = false;

    /**
     * @type {Array<{column: number, row: number}>}
     */
    this.neighbors = [];

    const { SIZE } = Cell;
    const { marginY, marginX } = board;

    this.y = row * SIZE + marginY;
    this.x = column * SIZE + marginX;
    this.setNeighbors();
    this.render();
  }

  toggle() {
    this.currentState = !this.currentState;
    this.render();
  }

  render() {
    const { ctx } = this.board;
    const { SIZE } = Cell;

    ctx.beginPath();
    ctx.fillStyle = this.currentState ? '#fff' : '#000';
    ctx.rect(this.x, this.y, SIZE, SIZE);
    ctx.fill();
    ctx.stroke();
  }

  setNeighbors() {
    const { row, column, board } = this;

    /**
     * @type {Array<{column: number, row: number}>}
     */
    const neighbors = [];

    for (let i = row - 1; i <= row + 1; i++) {
      if (i < 0 || i >= board.rows) {
        continue;
      }

      for (let j = column - 1; j <= column + 1; j++) {
        if (j < 0 || j >= board.columns) {
          continue;
        }

        if (i === row && j === column) {
          continue;
        }

        neighbors.push({ row: i, column: j });
      }
    }

    this.neighbors = neighbors;
  }

  getNextState() {
    const { neighbors, board, currentState } = this;
    let aliveNeighbors = 0;

    for (const iterator of neighbors) {
      const { row, column } = iterator;
      const neighbor = board.grid[row][column];

      if (neighbor.currentState) {
        aliveNeighbors++;
      }
    }

    const MAX_ALIVE_NEIGHBORS = 3;
    const MIN_ALIVE_NEIGHBORS = 2;

    if (!currentState && aliveNeighbors === MAX_ALIVE_NEIGHBORS) {
      this.nextState = true;
      return true;
    }

    if (
      currentState &&
      (aliveNeighbors === MIN_ALIVE_NEIGHBORS ||
        aliveNeighbors === MAX_ALIVE_NEIGHBORS)
    ) {
      this.nextState = true;
      return true;
    }

    this.nextState = false;
    return false;
  }

  update() {
    this.currentState = this.nextState;
    this.render();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('container');
  const canvas = document.getElementById('canvas');
  const play = document.getElementById('play');
  const stop = document.getElementById('stop');

  const { clientWidth, clientHeight } = container;

  canvas.width = clientWidth;
  canvas.height = clientHeight;

  const board = new Board(canvas);

  play.addEventListener('click', () => board.play());
  stop.addEventListener('click', () => board.stop());
});
