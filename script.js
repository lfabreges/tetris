const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

const redElement = document.getElementById('red');
const blueElement = document.getElementById('blue');
const bestScoreElement = document.getElementById('bestScore');
const scoreElement = document.getElementById('score');

const grid = canvas.width / 10;

let redValue = localStorage.getItem('redValue') || '154';
let blueValue = localStorage.getItem('blueValue') || '140';
let bestScore = localStorage.getItem('bestScore') || 0;
let score = 0;

redElement.value = redValue;
blueElement.value = blueValue;
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

function createPiece(type) {
    if (type === 'T') {
        return [
            [1, 1, 1],
            [0, 1, 0],
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
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
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
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect((x + offset.x) * grid, (y + offset.y) * grid, grid - 1, grid - 1);
            }
        });
    });
}

function getTetrominoColors() {
    return {
        1: `rgb(${redValue}, 0, 0)`,
        2: `rgb(0, ${blueValue}, ${blueValue})`
    };
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = 2;
            }
        });
    });
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
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
    drawMatrix(player.matrix, player.pos);
}

function drop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
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

function playerReset() {
    const pieces = 'ILJOTSZ';
    player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
                   (player.matrix[0].length / 2 | 0);
    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem('bestScore', bestScore);
            bestScoreElement.textContent = bestScore;
        }
        score = 0;
        scoreElement.textContent = score;
        updateSpeed();
    }
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
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
    switch (event.key) {
        case 'ArrowLeft':
            playerMove(-1);
            break;
        case 'ArrowRight':
            playerMove(1);
            break;
        case 'ArrowDown':
            drop();
            break;
        case 'a':
            playerRotate(-1);
            break;
        case 'z':
        case ' ':
        case 'ArrowUp':
            playerRotate(1);
            break;
        case 'p':
            alert("Rouge : " + redValue + " - Bleu : " + blueValue);
            break;
    }
});

redElement.addEventListener('input', (event) => {
    redValue = event.target.value;
    localStorage.setItem('redValue', redValue);
    event.target.blur();
});

blueElement.addEventListener('input', (event) => {
    blueValue = event.target.value;
    localStorage.setItem('blueValue', blueValue)
    event.target.blur();
});

const arena = createMatrix(10, 20);

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
};

playerReset();
update();
