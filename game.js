// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const speedSelector = document.getElementById('gameSpeed');

// Make canvas responsive
function resizeCanvas() {
    const maxSize = Math.min(window.innerWidth * 0.95, window.innerHeight * 0.6);
    canvas.style.width = `${maxSize}px`;
    canvas.style.height = `${maxSize}px`;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Game constants
const gridSize = 20;
const tileCount = canvas.width / gridSize;

// Game variables
let snake = [
    { x: 10, y: 10 }
];
let food = {
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount)
};
let dx = 0;
let dy = 0;
let score = 0;
let gameOver = false;
let lastTouchTime = 0;

// Game speed
let gameSpeed = parseInt(speedSelector.value);
let gameLoop;

// Mobile controls
const upBtn = document.getElementById('upBtn');
const downBtn = document.getElementById('downBtn');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');

// Touch controls
function handleDirection(newDx, newDy) {
    // Non permettere il movimento nella direzione opposta
    if (snake.length > 1) {
        // Se sta andando a destra, non può andare a sinistra
        if (dx === 1 && newDx === -1) return;
        // Se sta andando a sinistra, non può andare a destra
        if (dx === -1 && newDx === 1) return;
        // Se sta andando giù, non può andare su
        if (dy === 1 && newDy === -1) return;
        // Se sta andando su, non può andare giù
        if (dy === -1 && newDy === 1) return;
    }

    // Aggiorna la direzione solo se c'è un cambio effettivo
    if (newDx !== 0) {
        dx = newDx;
        dy = 0;
    }
    if (newDy !== 0) {
        dx = 0;
        dy = newDy;
    }
}

// Improved mobile button controls with better touch response
function addTouchHandler(btn, dx, dy) {
    let touchTimeout;
    
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleDirection(dx, dy);
        
        // Clear any existing timeout
        if (touchTimeout) clearTimeout(touchTimeout);
        
        // Add active state
        btn.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
    }, { passive: false });

    btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        // Remove active state
        btn.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        
        // Clear timeout
        if (touchTimeout) clearTimeout(touchTimeout);
    }, { passive: false });
}

// Add touch handlers to buttons
addTouchHandler(upBtn, 0, -1);
addTouchHandler(downBtn, 0, 1);
addTouchHandler(leftBtn, -1, 0);
addTouchHandler(rightBtn, 1, 0);

// Swipe controls with improved sensitivity
let touchStartX = 0;
let touchStartY = 0;
const minSwipeDistance = 20; // Reduced minimum swipe distance
let lastDirection = { dx: 0, dy: 0 };

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    lastTouchTime = Date.now();
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    
    // Throttle touch move events
    const now = Date.now();
    if (now - lastTouchTime < 32) return; // About 30fps
    lastTouchTime = now;
    
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    
    const dx = touchX - touchStartX;
    const dy = touchY - touchStartY;
    
    if (Math.abs(dx) > minSwipeDistance || Math.abs(dy) > minSwipeDistance) {
        if (Math.abs(dx) > Math.abs(dy)) {
            const newDx = dx > 0 ? 1 : -1;
            if (lastDirection.dx !== newDx) {
                handleDirection(newDx, 0);
                lastDirection = { dx: newDx, dy: 0 };
            }
        } else {
            const newDy = dy > 0 ? 1 : -1;
            if (lastDirection.dy !== newDy) {
                handleDirection(0, newDy);
                lastDirection = { dx: 0, dy: newDy };
            }
        }
        // Update start position for next move
        touchStartX = touchX;
        touchStartY = touchY;
    }
}, { passive: false });

// Speed change handler
speedSelector.addEventListener('change', (e) => {
    if (!gameOver) {
        gameSpeed = parseInt(e.target.value);
        clearInterval(gameLoop);
        gameLoop = setInterval(drawGame, gameSpeed);
    }
});

// Event listener for keyboard controls
document.addEventListener('keydown', (e) => {
    if (gameOver && e.key === 'Enter') {
        resetGame();
        return;
    }

    switch(e.key) {
        case 'ArrowUp':
            handleDirection(0, -1);
            break;
        case 'ArrowDown':
            handleDirection(0, 1);
            break;
        case 'ArrowLeft':
            handleDirection(-1, 0);
            break;
        case 'ArrowRight':
            handleDirection(1, 0);
            break;
    }
});

function drawGame() {
    // Clear canvas
    ctx.fillStyle = '#34495e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameOver) {
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width/2, canvas.height/2);
        ctx.font = '20px Arial';
        ctx.fillText('Tocca per Ricominciare', canvas.width/2, canvas.height/2 + 40);
        return;
    }

    // Move snake
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);

    // Check if snake ate food
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        document.getElementById('score').textContent = `Score: ${score}`;
        generateFood();
        // Increase speed
        if (gameSpeed > 50) {
            gameSpeed = Math.max(50, gameSpeed - 2);
            clearInterval(gameLoop);
            gameLoop = setInterval(drawGame, gameSpeed);
        }
    } else {
        snake.pop();
    }

    // Check collision with walls or self
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver = true;
    }

    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver = true;
        }
    }

    // Draw snake
    snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? '#2ecc71' : '#27ae60';
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
    });

    // Draw food
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
}

function generateFood() {
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
    // Make sure food doesn't spawn on snake
    snake.forEach(segment => {
        if (segment.x === food.x && segment.y === food.y) {
            generateFood();
        }
    });
}

// Add touch restart
canvas.addEventListener('touchend', (e) => {
    if (gameOver) {
        e.preventDefault();
        resetGame();
    }
}, { passive: false });

function resetGame() {
    snake = [{ x: 10, y: 10 }];
    dx = 0;
    dy = 0;
    score = 0;
    lastDirection = { dx: 0, dy: 0 };
    gameSpeed = parseInt(speedSelector.value);
    gameOver = false;
    document.getElementById('score').textContent = 'Score: 0';
    generateFood();
    clearInterval(gameLoop);
    gameLoop = setInterval(drawGame, gameSpeed);
}

// Start game
gameLoop = setInterval(drawGame, gameSpeed); 