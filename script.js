const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

const redElement = document.getElementById('red');
const cyanElement = document.getElementById('cyan');
const bestScoreElement = document.getElementById('bestScore');
const scoreElement = document.getElementById('score');

const colorChangeInterval = 30000;
const grid = canvas.width / 10;
const keysPressed = {};

const wallKickValues = {
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
let score = 0;

redElement.value = redValue;
cyanElement.value = cyanValue;
bestScoreElement.textContent = bestScore;

context.scale(1, 1);

function calculateScore(linesCleared) {
    switch (linesCleared) {
        case 1:
            score += 40;
            break;
        case 2:
            score += 100;
            break;
        case 3:
            score += 300;
            break;
        case 4:
            score += 1200;
            break;
        default:
            break;
    }
    scoreElement.textContent = score;
    updateSpeed();
}

function createTetromino(type) {
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

function drawMatrix(matrix, offset) {
    const colors = getTetrominoColors();
    const numberOfInvisibleRows = 2;
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            const ajustedY = y + offset.y - numberOfInvisibleRows;
            if (value !== 0 && ajustedY >= 0) {
                context.fillStyle = colors[value];
                context.fillRect((x + offset.x) * grid, ajustedY * grid, grid - 1, grid - 1);
            }
        });
    });
}

function getTetrominoColors() {
    const alternateColorIndex = Math.trunc(Date.now() / colorChangeInterval) % 2 + 1;
    return {
        [alternateColorIndex]: `rgb(${redValue}, 0, 0)`,
        [alternateColorIndex % 2 + 1]: `rgb(0, ${cyanValue}, ${cyanValue})`
    };
}

function merge(arena, tetromino) {
    tetromino.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + tetromino.pos.y][x + tetromino.pos.x] = 2;
            }
        });
    });
}

function collide(arena, tetromino) {
    const [m, o] = [tetromino.matrix, tetromino.pos];
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

function rotate(matrix, dir) {
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
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawMatrix(arena, {x: 0, y: 0});
    drawMatrix(tetromino.matrix, tetromino.pos);
}

function drop() {
    tetromino.pos.y++;
    if (collide(arena, tetromino)) {
        tetromino.pos.y--;
        if (tetromino.moveDirection == 0 || tetromino.hasCollidedHorizontally) {
            merge(arena, tetromino);
            if (arena[1].includes(2)) {
                arena.forEach(row => row.fill(0));
                if (score > bestScore) {
                    bestScore = score;
                    localStorage.setItem('bestScore', bestScore);
                    bestScoreElement.textContent = bestScore;
                }
                score = 0;
                scoreElement.textContent = score;
                updateSpeed();
            } else {
                arenaSweep();
            }
            tetrominoReset();
        } else {
            tetromino.hasCollidedVertically = true;
        }
    }
    dropCounter = 0;
}

function updateSpeed() {
    dropInterval = Math.max(100, 1000 - Math.floor(score / 1000) * 100);
}

function arenaSweep() {
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

function tetrominoReset() {
    const tetrominoTypes = 'IOJLSTZ';
    tetromino.hasCollidedHorizontally = false;
    tetromino.hasCollidedVertically = false;
    tetromino.type = tetrominoTypes[tetrominoTypes.length * Math.random() | 0];
    tetromino.rotationState = 0;
    tetromino.matrix = createTetromino(tetromino.type);
    tetromino.pos.y = 0;
    tetromino.pos.x = (arena[0].length / 2 | 0) - Math.ceil(tetromino.matrix[0].length / 2);
}

function tetrominoMove(dir) {
    tetromino.moveDirection = dir;
    tetromino.pos.x += dir;
    if (collide(arena, tetromino)) {
        tetromino.pos.x -= dir;
        tetromino.hasCollidedHorizontally = true;
    } else {
        tetromino.hasCollidedHorizontally = false;
    }
}

function tetrominoStop() {
    tetromino.moveDirection = 0;
}

function tetrominoRotate(dir) {
    if (tetromino.type == 'O') {
        return;
    }

    const [x, y] = [tetromino.pos.x, tetromino.pos.y];
    const wallKickSet = tetromino.type == 'I' ? 'I' : 'JLSTZ';

    rotate(tetromino.matrix, dir);

    const desiredRotationState = (tetromino.rotationState + dir) % 4;
    const desiredRotationId = `${tetromino.rotationState}->${desiredRotationState}`;
    const kicks = wallKickValues[wallKickSet][desiredRotationId];

    for (const [dx, dy] of kicks) {
        tetromino.pos.x = x + dx;
        tetromino.pos.y = y + dy;
        if (!collide(arena, tetromino)) {
            tetromino.rotationState = desiredRotationState;
            return;
        }
    }

    rotate(tetromino.matrix, -dir);
    tetromino.pos.x = x;
    tetromino.pos.y = y;
}

let dropCounter = 0;
let dropInterval = 1000;

let lastTime = 0;

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        drop();
    }

    draw();
    requestAnimationFrame(update);
}

document.addEventListener('keydown', event => {
    if (!event.repeat) {
        keysPressed[event.key] = true;
    }
    if (keysPressed['ArrowLeft'] && tetromino.moveDirection != 1) {
        tetrominoMove(-1);
    } else if (keysPressed['ArrowRight'] && tetromino.moveDirection != -1) {
        tetrominoMove(1);
    } else if (keysPressed['ArrowDown'] && tetromino.moveDirection == 0) {
        drop();
    }
    if (!event.repeat) {
        if (keysPressed['a']) {
            tetrominoRotate(-1);
        } else if (keysPressed['z'] || keysPressed[' '] || keysPressed['ArrowUp']) {
            tetrominoRotate(1);
        }
    }
});

document.addEventListener('keyup', event => {
    if (!event.repeat) {
        delete keysPressed[event.key];
    }
    if (event.key == 'ArrowLeft' && tetromino.moveDirection == -1) {
        tetrominoStop();
    } else if (event.key == 'ArrowRight' && tetromino.moveDirection == 1) {
        tetrominoStop();
    }
});

redElement.addEventListener('input', (event) => {
    redValue = event.target.value;
    localStorage.setItem('redValue', redValue);
    event.target.blur();
});

cyanElement.addEventListener('input', (event) => {
    cyanValue = event.target.value;
    localStorage.setItem('cyanValue', cyanValue)
    event.target.blur();
});

const arena = createMatrix(10, 22);

const tetromino = {
    hasCollidedHorizontally: false,
    hasCollidedVertically: false,
    matrix: null,
    moveDirection: 0,
    pos: {x: 0, y: 0},
    rotationState: 0,
    type: ""
};

tetrominoReset();
update();
