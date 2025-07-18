document.addEventListener('DOMContentLoaded', function() {
    // Game state
    let score = 0;
    let isAnimating = false;
    let gameActive = true;
    let comboCount = 0;
    let comboTimeout;
    
    // DOM elements
    const scoreDisplay = document.getElementById('score-display');
    const comboDisplay = document.getElementById('combo-display');
    const comboCountDisplay = document.getElementById('combo-count');

    let inactivityTimeout;

    function resetInactivityTimer() {
        clearTimeout(inactivityTimeout);
        inactivityTimeout = setTimeout(() => {
            hintNextMove();
        }, 30000);
    }
    
    // Helper functions
    function randInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    function createElement(tag, className) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        return el;
    }

    function addClass(el, className) {
        if (el.classList) {
            el.classList.add(className);
        } else {
            el.className += ' ' + className;
        }
    }

    function removeClass(el, className) {
        if (el.classList) {
            el.classList.remove(className);
        } else {
            el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
        }
    }

    function hasClass(el, className) {
        if (el.classList) {
            return el.classList.contains(className);
        } else {
            return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
        }
    }

    // Game settings
    const boardSizeX = 7;
    const boardSizeY = 7;
    let board = [];

    // Available colors
    const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'white'];
    const rareColors = ['rainbow'];

    // Game elements
    const box = document.querySelector('.box');
    let cellDragSelectedX, cellDragSelectedY;

    // Initialize board with no immediate matches
    function initializeBoard() {
        board = [];
        for (let y = 0; y < boardSizeY; y++) {
            board[y] = new Array(boardSizeX).fill(undefined);
        }

        for (let y = 0; y < boardSizeY; y++) {
            for (let x = 0; x < boardSizeX; x++) {
                let newColor;
                do {
                    newColor = colors[randInt(0, colors.length)];
                } while (
                    (x >= 2 && board[y][x - 1] === newColor && board[y][x - 2] === newColor) ||
                    (y >= 2 && board[y - 1] && board[y - 1][x] === newColor && board[y - 2] && board[y - 2][x] === newColor)
                );
                board[y][x] = newColor;
            }
        }
    }

    // Create the game board
    function buildBoard() {
        box.innerHTML = '';
        
        for (let y = 0; y < boardSizeY; y++) {
            const row = createElement('div', 'box-row');
            for (let x = 0; x < boardSizeX; x++) {
                const cellY = boardSizeY - y - 1;
                const cell = createElement('div', `box-cell box-cell-${x}-${cellY}`);
                cell.dataset.cellX = x;
                cell.dataset.cellY = cellY;

                // Mouse events for dragging
                cell.addEventListener('mousedown', function(e) {
                    if (!gameActive || isAnimating) return;
                    e.preventDefault();
                    e.stopPropagation();
                    cellDragSelectedX = x;
                    cellDragSelectedY = cellY;
                    addClass(cell, 'box-cell-selected');
                });

                cell.addEventListener('mouseup', function(e) {
                    if (!gameActive || isAnimating) return;
                    e.preventDefault();
                    e.stopPropagation();
                    if (cellDragSelectedX !== undefined && cellDragSelectedY !== undefined) {
                        onCellDragged(cellDragSelectedX, cellDragSelectedY, x, cellY);
                        cellDragSelectedX = undefined;
                        cellDragSelectedY = undefined;
                    }
                    document.querySelectorAll('.box-cell-selected').forEach(el => {
                        removeClass(el, 'box-cell-selected');
                    });
                });

                cell.addEventListener('mouseleave', function() {
                    removeClass(cell, 'box-cell-selected');
                });

                row.appendChild(cell);
            }
            box.appendChild(row);
        }
    }

    // Check if coordinates are within bounds
    function isInBounds(x, y) {
        return x >= 0 && y >= 0 && x < boardSizeX && y < boardSizeY;
    }

    // Check if a move creates a valid match
    function isValidMatch(x, y) {
        if (!isInBounds(x, y) || !board[y] || !board[y][x] || !board[y][x].dataset) return false;

        const color = board[y][x].dataset.boxColor;
        
        // Check horizontal matches
        let left = x - 1, right = x + 1;
        while (left >= 0 && board[y][left] && board[y][left].dataset.boxColor === color) left--;
        while (right < boardSizeX && board[y][right] && board[y][right].dataset.boxColor === color) right++;
        const horizontalMatch = (right - left - 1) >= 3;

        // Check vertical matches
        let up = y - 1, down = y + 1;
        while (up >= 0 && board[up][x] && board[up][x].dataset.boxColor === color) up--;
        while (down < boardSizeY && board[down][x] && board[down][x].dataset.boxColor === color) down++;
        const verticalMatch = (down - up - 1) >= 3;

        return horizontalMatch || verticalMatch;
    }

    // Check if there are possible moves left
    function hasPossibleMoves() {
        // Check all possible swaps
        for (let y = 0; y < boardSizeY; y++) {
            for (let x = 0; x < boardSizeX; x++) {
                // Check swap to the right
                if (x < boardSizeX - 1) {
                    // Temporary swap
                    [board[y][x], board[y][x + 1]] = [board[y][x + 1], board[y][x]];
                    
                    // Check if creates a match
                    const createsMatch = isValidMatch(x, y) || isValidMatch(x + 1, y);
                    
                    // Swap back
                    [board[y][x], board[y][x + 1]] = [board[y][x + 1], board[y][x]];
                    
                    if (createsMatch) return true;
                }
                
                // Check swap downwards
                if (y < boardSizeY - 1) {
                    // Temporary swap
                    [board[y][x], board[y + 1][x]] = [board[y + 1][x], board[y][x]];
                    
                    // Check if creates a match
                    const createsMatch = isValidMatch(x, y) || isValidMatch(x, y + 1);
                    
                    // Swap back
                    [board[y][x], board[y + 1][x]] = [board[y + 1][x], board[y][x]];
                    
                    if (createsMatch) return true;
                }
            }
        }
        return false;
    }

    // Swap adjacent tiles
    function swapAdjacentTiles(x1, y1, x2, y2) {
        if (!isInBounds(x1, y1) || !isInBounds(x2, y2)) return false;
        if (!board[y1] || !board[y1][x1] || !board[y2] || !board[y2][x2]) return false;

        isAnimating = true;
        
        // Remove elements from DOM temporarily
        if (board[y2][x2] && board[y2][x2].remove) board[y2][x2].remove();
        if (board[y1][x1] && board[y1][x1].remove) board[y1][x1].remove();

        // Add swap animations
        if (x1 !== x2) {
            if (x1 < x2) {
                addAnimation(board[y2][x2], 'box-shift-left');
                addAnimation(board[y1][x1], 'box-shift-right');
            } else {
                addAnimation(board[y2][x2], 'box-shift-right');
                addAnimation(board[y1][x1], 'box-shift-left');
            }
        } else {
            if (y1 < y2) {
                addAnimation(board[y2][x2], 'box-shift-up');
                addAnimation(board[y1][x1], 'box-shift-down');
            } else {
                addAnimation(board[y2][x2], 'box-shift-down');
                addAnimation(board[y1][x1], 'box-shift-up');
            }
        }

        // Swap tiles in the board array
        const temp = board[y2][x2];
        board[y2][x2] = board[y1][x1];
        board[y1][x1] = temp;

        // Append to cells
        appendToCell(x2, y2, board[y2][x2]);
        appendToCell(x1, y1, board[y1][x1]);
        
        return true;
    }

    // Handle cell dragging
    function onCellDragged(fromX, fromY, toX, toY) {
        const dist = Math.abs(fromX - toX) + Math.abs(fromY - toY);
        if (dist === 1) {
            const validSwap = swapAdjacentTiles(fromX, fromY, toX, toY);
            if (validSwap) {
                setTimeout(() => {
                    // Check if the swap created any valid matches
                    const createdMatch = isValidMatch(fromX, fromY) || isValidMatch(toX, toY);
                    
                    if (!createdMatch) {
                        // No valid matches, swap back
                        swapAdjacentTiles(toX, toY, fromX, fromY);
                        isAnimating = false;
                    } else {
                        // Valid matches found, process them
                        checkMatches();
                    }
                }, 300);
            }
        }
    }

    // Create a new box item
    function createBoxItem(color) {
        const container = createElement('div', 'box-item-container');
        const boxItem = createElement('div', 'box-item');
        container.appendChild(boxItem);

        let boxColor = color;
        if (!boxColor) {
            if (randInt(0, 50) === 0) {
                boxColor = rareColors[randInt(0, rareColors.length)];
            } else {
                boxColor = colors[randInt(0, colors.length)];
            }
        }
        
        addClass(boxItem, `box-item-${boxColor}`);
        container.dataset.boxColor = boxColor;

        return container;
    }

    // Add animation to an item
    function addAnimation(item, animation) {
        if (!item) return;
        
        removeClass(item, 'box-item-container');
        removeClass(item, animation);
        addClass(item, 'box-item-container');
        addClass(item, animation);
        
        item.dataset.isAnimating = 'true';
        item.addEventListener('animationend', function(e) {
            item.dataset.isAnimating = 'false';
        }, { once: true });
    }

    // Append item to cell
    function appendToCell(x, y, item) {
        if (!isInBounds(x, y) || !item) return;
    
        const cell = document.querySelector(`.box-cell-${x}-${y}`);
        if (cell) {
            // Elimina cualquier gema existente
            if (cell.firstChild) cell.removeChild(cell.firstChild);
            cell.appendChild(item);
        }
    }
    

    // Delete cell content
    function deleteCell(x, y) {
        if (!isInBounds(x, y) || !board[y]) return;
    
        const cell = document.querySelector(`.box-cell-${x}-${y}`);
        if (cell && cell.firstChild) {
            cell.removeChild(cell.firstChild);
        }
    
        board[y][x] = undefined;
    }
    
    // Mark gems for removal and find matches
    function markGemsForRemoval() {
        const gemsToRemove = new Set();
        const matchedGroups = [];

        // Check horizontal matches
        for (let y = 0; y < boardSizeY; y++) {
            let currentColor = null;
            let currentGroup = [];
            
            for (let x = 0; x < boardSizeX; x++) {
                if (board[y][x] && board[y][x].dataset && board[y][x].dataset.boxColor) {
                    const color = board[y][x].dataset.boxColor;
                    
                    if (color === currentColor || currentColor === null) {
                        currentGroup.push({x, y});
                        currentColor = color;
                    } else {
                        if (currentGroup.length >= 3) {
                            currentGroup.forEach(pos => gemsToRemove.add(`${pos.x},${pos.y}`));
                            matchedGroups.push([...currentGroup]);
                        }
                        currentGroup = [{x, y}];
                        currentColor = color;
                    }
                } else {
                    if (currentGroup.length >= 3) {
                        currentGroup.forEach(pos => gemsToRemove.add(`${pos.x},${pos.y}`));
                        matchedGroups.push([...currentGroup]);
                    }
                    currentGroup = [];
                    currentColor = null;
                }
            }
            
            // Check last group in the row
            if (currentGroup.length >= 3) {
                currentGroup.forEach(pos => gemsToRemove.add(`${pos.x},${pos.y}`));
                matchedGroups.push([...currentGroup]);
            }
        }

        // Check vertical matches
        for (let x = 0; x < boardSizeX; x++) {
            let currentColor = null;
            let currentGroup = [];
            
            for (let y = 0; y < boardSizeY; y++) {
                if (board[y][x] && board[y][x].dataset && board[y][x].dataset.boxColor) {
                    const color = board[y][x].dataset.boxColor;
                    
                    if (color === currentColor || currentColor === null) {
                        currentGroup.push({x, y});
                        currentColor = color;
                    } else {
                        if (currentGroup.length >= 3) {
                            currentGroup.forEach(pos => gemsToRemove.add(`${pos.x},${pos.y}`));
                            matchedGroups.push([...currentGroup]);
                        }
                        currentGroup = [{x, y}];
                        currentColor = color;
                    }
                } else {
                    if (currentGroup.length >= 3) {
                        currentGroup.forEach(pos => gemsToRemove.add(`${pos.x},${pos.y}`));
                        matchedGroups.push([...currentGroup]);
                    }
                    currentGroup = [];
                    currentColor = null;
                }
            }
            
            // Check last group in the column
            if (currentGroup.length >= 3) {
                currentGroup.forEach(pos => gemsToRemove.add(`${pos.x},${pos.y}`));
                matchedGroups.push([...currentGroup]);
            }
        }

        return {
            gemsToRemove: Array.from(gemsToRemove).map(pos => {
                const [x, y] = pos.split(',').map(Number);
                return {x, y};
            }),
            matchedGroups
        };
    }

    // Apply gravity to make existing gems fall
    function applyGravityAfterMatch() {
        return new Promise((resolve) => {
            const movements = [];
    
            for (let x = 0; x < boardSizeX; x++) {
                let targetY = 0;
                for (let y = 0; y < boardSizeY; y++) {
                    if (board[y][x]) {
                        if (y !== targetY) {
                            movements.push({
                                fromX: x,
                                fromY: y,
                                toX: x,
                                toY: targetY,
                                gem: board[y][x],
                                distance: y - targetY
                            });
                            board[targetY][x] = board[y][x];
                            board[y][x] = undefined;
                        }
                        targetY++;
                    }
                }
            }
    
            executeMovements(movements, 0, resolve);
        });
    }    

    // Ejecutar movimientos con animación en secuencia
    function executeMovements(movements, index, callback) {
        if (index >= movements.length) {
            callback();
            return;
        }
    
        const { fromX, fromY, toX, toY, gem, distance } = movements[index];
    
        const fromCell = document.querySelector(`.box-cell-${fromX}-${fromY}`);
        const toCell = document.querySelector(`.box-cell-${toX}-${toY}`);
    
        if (fromCell && gem) {
            fromCell.removeChild(gem);
        }
    
        if (toCell) {
            if (toCell.firstChild) toCell.removeChild(toCell.firstChild);
            toCell.appendChild(gem);
            addAnimation(gem, `box-drop-${distance * 70}`);
        }
    
        setTimeout(() => {
            executeMovements(movements, index + 1, callback);
        }, 100);
    }

    // Spawn new gems in empty spaces at the top
    function spawnNewGems() {
        return new Promise((resolve) => {
            const promises = [];
    
            for (let x = 0; x < boardSizeX; x++) {
                for (let y = boardSizeY - 1; y >= 0; y--) {
                    if (!board[y][x]) {
                        const newGem = createBoxItem();
                        board[y][x] = newGem;
    
                        const cell = document.querySelector(`.box-cell-${x}-${y}`);
                        if (cell) {
                            if (cell.firstChild) cell.removeChild(cell.firstChild);
                            cell.appendChild(newGem);
                            addAnimation(newGem, `box-drop-${(boardSizeY - y) * 70}`);
                        }
                    }
                }
            }
    
            setTimeout(resolve, 400);
        });
    }

    // Reshuffle the board when no moves are possible
    function reshuffleBoard() {
        if (!gameActive || isAnimating) return;
    
        isAnimating = true;
    
        // Mostrar mensaje
        const shuffleMsg = document.createElement('div');
        shuffleMsg.className = 'shuffle-message';
        shuffleMsg.textContent = '¡Mezclando tablero!';
        document.body.appendChild(shuffleMsg);
    
        setTimeout(() => {
            shuffleMsg.remove();
        }, 2000);
    
        // Obtener todas las gemas actuales
        const flatGems = [];
        for (let y = 0; y < boardSizeY; y++) {
            for (let x = 0; x < boardSizeX; x++) {
                if (board[y][x]) {
                    flatGems.push(board[y][x]);
                }
            }
        }
    
        // Intentar hasta encontrar una disposición con al menos un movimiento
        let maxAttempts = 100;
        let foundValidShuffle = false;
    
        while (maxAttempts-- > 0) {
            // Mezclar las gemas
            for (let i = flatGems.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [flatGems[i], flatGems[j]] = [flatGems[j], flatGems[i]];
            }
    
            // Insertar la mezcla al tablero
            let idx = 0;
            for (let y = 0; y < boardSizeY; y++) {
                for (let x = 0; x < boardSizeX; x++) {
                    board[y][x] = flatGems[idx++];
                }
            }
    
            if (hasPossibleMoves()) {
                foundValidShuffle = true;
                break;
            }
        }
    
        // Si no se encontró una disposición válida, volver a mezclar con nuevas gemas (fallback)
        if (!foundValidShuffle) {
            initializeBoard();
            for (let y = 0; y < boardSizeY; y++) {
                for (let x = 0; x < boardSizeX; x++) {
                    board[y][x] = createBoxItem(board[y][x]);
                }
            }
        }
    
        // Renderizar el tablero actualizado
        for (let y = 0; y < boardSizeY; y++) {
            for (let x = 0; x < boardSizeX; x++) {
                appendToCell(x, y, board[y][x]);
            }
        }
    
        isAnimating = false;
    }    

    function hintNextMove() {
        if (!gameActive || isAnimating) return;
    
        for (let y = 0; y < boardSizeY; y++) {
            for (let x = 0; x < boardSizeX; x++) {
                // Check swap to the right
                if (x < boardSizeX - 1) {
                    [board[y][x], board[y][x + 1]] = [board[y][x + 1], board[y][x]];
                    if (isValidMatch(x, y) || isValidMatch(x + 1, y)) {
                        [board[y][x], board[y][x + 1]] = [board[y][x + 1], board[y][x]];
                        highlightHint(x, y, x + 1, y);
                        return;
                    }
                    [board[y][x], board[y][x + 1]] = [board[y][x + 1], board[y][x]];
                }
    
                // Check swap downwards
                if (y < boardSizeY - 1) {
                    [board[y][x], board[y + 1][x]] = [board[y + 1][x], board[y][x]];
                    if (isValidMatch(x, y) || isValidMatch(x, y + 1)) {
                        [board[y][x], board[y + 1][x]] = [board[y + 1][x], board[y][x]];
                        highlightHint(x, y, x, y + 1);
                        return;
                    }
                    [board[y][x], board[y + 1][x]] = [board[y + 1][x], board[y][x]];
                }
            }
        }
    }
    
    function highlightHint(x1, y1, x2, y2) {
        const gem1 = board[y1][x1];
        const gem2 = board[y2][x2];
        
        if (gem1) addClass(gem1, 'hint-pulse');
        if (gem2) addClass(gem2, 'hint-pulse');
    
        setTimeout(() => {
            if (gem1) removeClass(gem1, 'hint-pulse');
            if (gem2) removeClass(gem2, 'hint-pulse');
        }, 2000);
    }    

    // Calculate score based on matched groups
    function calculateScore(matchedGroups) {
        let totalScore = 0;
        matchedGroups.forEach(group => {
            totalScore += 100 * group.length; // Base points
            
            // Bonus for crosses (tiles in multiple groups)
            const crossBonus = group.filter(({x, y}) => {
                return matchedGroups.some(otherGroup => {
                    return otherGroup !== group && otherGroup.some(pos => pos.x === x && pos.y === y);
                });
            }).length * 50;
            
            totalScore += crossBonus;
        });
        
        // Apply combo multiplier
        totalScore *= Math.max(1, comboCount);
        updateScore(totalScore);
    }

    // Update the board state
    async function updateBoard() {
        isAnimating = true;
        const { gemsToRemove, matchedGroups } = markGemsForRemoval();
    
        if (gemsToRemove.length > 0) {
            gemsToRemove.forEach(({ x, y }) => {
                const cell = document.querySelector(`.box-cell-${x}-${y}`);
                if (cell && cell.firstChild) {
                    addAnimation(cell.firstChild, 'box-item-match');
                    setTimeout(() => {
                        deleteCell(x, y);
                    }, 300);
                }
            });
    
            calculateScore(matchedGroups);
            await new Promise((res) => setTimeout(res, 400));
            await applyGravityAfterMatch();
            await spawnNewGems();
    
            setTimeout(() => {
                checkMatches();
            }, 200);
        } else {
            if (!hasPossibleMoves()) {
                reshuffleBoard();
            } else {
                isAnimating = false;
            }
        }
    }

    // Check for matches
    function checkMatches() {
        const {gemsToRemove} = markGemsForRemoval();
        
        if (gemsToRemove.length > 0) {
            // Aumentar combo
            comboCount++;
            showCombo();
            
            // Procesar coincidencias
            updateBoard();
        } else {
            // Reiniciar combo si no hay coincidencias
            resetCombo();
            isAnimating = false;
        }
    }

    // Show combo display
    function showCombo() {
        if (comboCount > 1 && comboDisplay && comboCountDisplay) {
            comboCountDisplay.textContent = comboCount;
            comboDisplay.style.display = 'block';
            
            clearTimeout(comboTimeout);
            comboTimeout = setTimeout(() => {
                if (comboDisplay) comboDisplay.style.display = 'none';
            }, 1000);
        }
    }

    // Reset combo counter
    function resetCombo() {
        comboCount = 0;
        if (comboDisplay) comboDisplay.style.display = 'none';
    }

    // Update the score display
    function updateScore(points) {
        score += points;
        if (scoreDisplay) {
            scoreDisplay.textContent = `Score: ${score}`;
            
            addClass(scoreDisplay, 'score-pop');
            setTimeout(() => {
                if (scoreDisplay) removeClass(scoreDisplay, 'score-pop');
            }, 300);
        }
    }

    // Initialize the game
    function initGame() {
        initializeBoard();
        buildBoard();
        
        // Poblar el tablero
        for (let y = 0; y < boardSizeY; y++) {
            for (let x = 0; x < boardSizeX; x++) {
                const color = board[y][x];
                board[y][x] = createBoxItem(color);
                appendToCell(x, y, board[y][x]);
            }
        }
        
        // Verificar movimientos posibles
        if (!hasPossibleMoves()) {
            reshuffleBoard();
        }
        
        // Bucle principal del juego
        setInterval(() => {
            if (!isAnimating && gameActive) {
                updateBoard();
            }
        }, 100);
    }
    // Escuchar actividad para reiniciar el temporizador
    ['mousedown', 'keydown', 'touchstart'].forEach(evt => {
        document.addEventListener(evt, resetInactivityTimer);
    });

    // Iniciar el temporizador al cargar
    resetInactivityTimer();
    // Start the game
    initGame();
});