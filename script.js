const gameCanvas = document.getElementById('tetris');
const gameCanvasContext = gameCanvas.getContext('2d');
const nextTetrominoCanvas = document.getElementById('next-tetromino');
const nextTetrominoCanvasContext = nextTetrominoCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const bestScoreElement = document.getElementById('bestScore');
const secondBestScoreElement = document.getElementById('secondBestScore');
const thirdBestScoreElement = document.getElementById('thirdBestScore');
const cyanElement = document.getElementById('cyan');
const cyanMinusButton = document.getElementById('cyanMinusButton');
const cyanPlusButton = document.getElementById('cyanPlusButton');
const redElement = document.getElementById('red');
const redMinusButton = document.getElementById('redMinusButton');
const redPlusButton = document.getElementById('redPlusButton');

const arena = createMatrix(10, 22);
const colorChangeInterval = 30000;
const grid = gameCanvas.width / 10;
const keysPressed = {};

const scoreData = {
    1: 40,
    2: 100,
    3: 300,
    4: 1200
}

const wallKickData = {
    'JLSTZ': {
        '0->1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
        '1->0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
        '1->2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
        '2->1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
        '2->3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
        '3->2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
        '3->0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
        '0->3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]]
    },
    'I': {
        '0->1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
        '1->0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
        '1->2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
        '2->1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
        '2->3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
        '3->2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
        '3->0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
        '0->3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]]
    }
};

let redValue = localStorage.getItem('redValue') || '154';
let cyanValue = localStorage.getItem('cyanValue') || '140';
let bestScore = localStorage.getItem('bestScore') || 0;
let secondBestScore = localStorage.getItem('secondBestScore') || 0;
let thirdBestScore = localStorage.getItem('thirdBestScore') || 0;

let lastUpdateTime = 0;
let moveDirection = 0;
let bagOfTetrominos = [];
let score = 0;
let tetromino = null;
let terminoDropInterval = 1000;
let terminoIdleTime = 0;

redElement.value = redValue;
cyanElement.value = cyanValue;
bestScoreElement.textContent = bestScore;

gameCanvasContext.scale(1, 1);
nextTetrominoCanvasContext.scale(1, 1);

newTetromino();
update();

/*
 * Functions
 */

function calculateScore(linesCleared) {
    score += scoreData[linesCleared] || 0;
    scoreElement.textContent = score;
    updateGameSpeed();
}

function clearLines() {
    let rowCount = 0;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
        ++rowCount;
    }
    calculateScore(rowCount);
}

function gameOver() {
    arena.forEach(row => row.fill(0));

    updateScores();
    score = 0;
    scoreElement.textContent = score;

    updateGameSpeed();
    newTetromino();
}

function updateGameSpeed() {
    terminoDropInterval = Math.max(200, 1000 - Math.floor(score / 1000) * 100);
}

function updateScores() {
    if (score > bestScore) {
        thirdBestScore = secondBestScore;
        secondBestScore = bestScore;
        bestScore = score;
    } else if (score > secondBestScore) {
        thirdBestScore = secondBestScore;
        secondBestScore = score;
    } else if (score > thirdBestScore) {
        thirdBestScore = score;
    }

    localStorage.setItem('tetrisBestScore', bestScore);
    localStorage.setItem('tetrisSecondBestScore', secondBestScore);
    localStorage.setItem('tetrisThirdBestScore', thirdBestScore);

    bestScoreElement.textContent = bestScore;
    secondBestScoreElement.textContent = secondBestScore;
    thirdBestScoreElement.textContent = thirdBestScore;
}

function createTetrominoMatrix(type) {
    if (type === 'T') {
        return [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0],
        ];
    } else if (type === 'O') {
        return [
            [1, 1],
            [1, 1],
        ];
    } else if (type === 'L') {
        return [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0],
        ];
    } else if (type === 'J') {
        return [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0],
        ];
    } else if (type === 'I') {
        return [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ];
    } else if (type === 'S') {
        return [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0],
        ];
    } else if (type === 'Z') {
        return [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0],
        ];
    }
}

function dropTetromino() {
    tetromino.position.y++;
    if (hasTetrominoCollided()) {
        tetromino.position.y--;
        if (moveDirection == 0 || tetromino.hasCollidedHorizontally) {
            lockTetromino();
            const firstInvisibleRowContainsTetromino = arena[1].includes(2);
            if (firstInvisibleRowContainsTetromino) {
                gameOver()
            } else {
                clearLines();
                newTetromino();
            }
        } else {
            tetromino.hasCollidedVertically = true;
        }
    }
}

function getTetrominoColors() {
    const alternateColorIndex = Math.trunc(Date.now() / colorChangeInterval) % 2 + 1;
    return {
        [alternateColorIndex]: `rgb(${redValue}, 0, 0)`,
        [alternateColorIndex % 2 + 1]: `rgb(0, ${cyanValue}, ${cyanValue})`
    };
}

function hasTetrominoCollided() {
    const [m, o] = [tetromino.matrix, tetromino.position];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function lockTetromino() {
    tetromino.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + tetromino.position.y][x + tetromino.position.x] = 2;
            }
        });
    });
}

function moveTetromino(direction) {
    moveDirection = direction;
    tetromino.position.x += direction;
    if (hasTetrominoCollided()) {
        tetromino.position.x -= direction;
        tetromino.hasCollidedHorizontally = true;
    } else {
        tetromino.hasCollidedHorizontally = false;
    }
}

function newTetromino() {
    if (bagOfTetrominos.length <= 1) {
        const tetrominos = [...'IOJLSTZ'].map(type => ({
            hasCollidedHorizontally: false,
            hasCollidedVertically: false,
            type,
            rotationState: 0,
            matrix: createTetrominoMatrix(type),
            position: {x: 0, y: 0}
        }));
        shuffleArray(tetrominos);
        bagOfTetrominos = [...bagOfTetrominos, ...tetrominos];
    }
    tetromino = bagOfTetrominos.shift();
    tetromino.position = {x: 5 - Math.ceil(tetromino.matrix[0].length / 2), y: 0};
}

function rotateTetromino(direction) {
    if (tetromino.type == 'O') {
        return;
    }

    const [x, y] = [tetromino.position.x, tetromino.position.y];
    const wallKickSet = tetromino.type == 'I' ? 'I' : 'JLSTZ';

    rotateMatrix(tetromino.matrix, direction);

    const desiredRotationState = (tetromino.rotationState + direction) % 4;
    const desiredRotationId = `${tetromino.rotationState}->${desiredRotationState}`;
    const kicks = wallKickData[wallKickSet][desiredRotationId];

    for (const [dx, dy] of kicks) {
        tetromino.position.x = x + dx;
        tetromino.position.y = y + dy;
        if (!hasTetrominoCollided()) {
            tetromino.rotationState = desiredRotationState;
            return;
        }
    }

    rotateMatrix(tetromino.matrix, -direction);
    tetromino.position.x = x;
    tetromino.position.y = y;
}

function createMatrix(width, height) {
    const matrix = [];
    while (height--) {
        matrix.push(new Array(width).fill(0));
    }
    return matrix;
}

function rotateMatrix(matrix, direction) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }
    if (direction > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

function draw() {
    gameCanvasContext.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    nextTetrominoCanvasContext.clearRect(0, 0, nextTetrominoCanvas.width, nextTetrominoCanvas.height);

    const originWithInvisibleRows = {x: 0, y: -2 * grid};
    drawElement(gameCanvasContext, arena, {x: 0, y: 0}, originWithInvisibleRows);
    drawElement(gameCanvasContext, tetromino.matrix, tetromino.position, originWithInvisibleRows);

    const nextTetromino = bagOfTetrominos[0];
    const nextTetrominoWidth = nextTetromino.type == 'I' ? 4 : nextTetromino.type == 'O' ? 2 : 3;
    const nextTetrominoHeight = nextTetromino.type == 'I' ? 3 : 2;

    drawElement(
        nextTetrominoCanvasContext,
        nextTetromino.matrix,
        {x: 0, y: 0},
        {x: (5 - nextTetrominoWidth) * grid / 2, y: (3 - nextTetrominoHeight) * grid / 2}
    );
}

function drawElement(canvasContext, matrix, offset, origin) {
    const colors = getTetrominoColors();
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            const ajustedX = (x + offset.x) * grid + origin.x;
            const ajustedY = (y + offset.y) * grid + origin.y;
            if (value !== 0 && ajustedY >= 0) {
                canvasContext.fillStyle = colors[value];
                canvasContext.fillRect(ajustedX, ajustedY, grid - 1, grid - 1);
            }
        });
    });
}

function update(time = 0) {
    terminoIdleTime += time - lastUpdateTime;
    lastUpdateTime = time;

    if (terminoIdleTime > terminoDropInterval) {
        dropTetromino();
        terminoIdleTime = terminoIdleTime % terminoDropInterval;
    }

    draw();
    requestAnimationFrame(update);
}

/*
 * Event Listeners
 */

document.addEventListener('keydown', event => {
    if (!event.repeat) {
        keysPressed[event.key] = true;
    }
    if (keysPressed['ArrowLeft'] && moveDirection != 1) {
        moveTetromino(-1);
    } else if (keysPressed['ArrowRight'] && moveDirection != -1) {
        moveTetromino(1);
    } else if (keysPressed['ArrowDown'] && moveDirection == 0) {
        dropTetromino();
        terminoIdleTime = 0;
    }
    if (!event.repeat) {
        if (keysPressed['a']) {
            rotateTetromino(-1);
        } else if (keysPressed['z'] || keysPressed[' '] || keysPressed['ArrowUp']) {
            rotateTetromino(1);
        }
    }
});

document.addEventListener('keyup', event => {
    if (!event.repeat) {
        delete keysPressed[event.key];
    }
    if ((event.key == 'ArrowLeft' && moveDirection == -1) || (event.key == 'ArrowRight' && moveDirection == 1)) {
        moveDirection = 0;
    }
});

redElement.addEventListener('input', (event) => {
    redValue = event.target.value;
    localStorage.setItem('redValue', redValue);
    event.target.blur();
});

redMinusButton.addEventListener('click', () => {
    redElement.value = Math.max(0, Number(redElement.value) - 1);
    redElement.dispatchEvent(new Event('input'));
    event.target.blur();
});

redPlusButton.addEventListener('click', () => {
    redElement.value = Math.min(255, Number(redElement.value) + 1);
    redElement.dispatchEvent(new Event('input'));
    event.target.blur();
});

cyanElement.addEventListener('input', (event) => {
    cyanValue = event.target.value;
    localStorage.setItem('cyanValue', cyanValue);
    event.target.blur();
});

cyanMinusButton.addEventListener('click', () => {
    cyanElement.value = Math.max(0, Number(cyanElement.value) - 1);
    cyanElement.dispatchEvent(new Event('input'));
    event.target.blur();
});

cyanPlusButton.addEventListener('click', () => {
    cyanElement.value = Math.min(255, Number(cyanElement.value) + 1);
    cyanElement.dispatchEvent(new Event('input'));
    event.target.blur();
});
