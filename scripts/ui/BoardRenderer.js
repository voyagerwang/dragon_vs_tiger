/**
 * BoardRenderer类 - 棋盘渲染器
 * 负责渲染游戏棋盘和卡牌的视觉显示
 */

export class BoardRenderer {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.boardElement = null;
        this.cellSize = { width: 80, height: 112 }; // 默认卡牌尺寸
        this.boardPadding = 10;
        this.cells = [];
    }

    /**
     * 创建棋盘DOM结构
     */
    createBoard() {
        this.boardElement = this.uiManager.elements.gameBoard;
        if (!this.boardElement) {
            throw new Error('游戏棋盘元素未找到');
        }

        // 清空现有内容
        this.boardElement.innerHTML = '';
        this.cells = [];

        // 创建4x5网格的格子
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 4; col++) {
                const cell = this.createCell(row, col);
                this.boardElement.appendChild(cell);
                this.cells.push(cell);
            }
        }

        // 设置棋盘样式
        this.setupBoardLayout();
        
        // 调整棋盘尺寸
        this.adjustBoardSize();
    }

    /**
     * 创建单个格子
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @returns {Element} 格子元素
     */
    createCell(row, col) {
        const cell = this.uiManager.document.createElement('div');
        cell.className = 'board-cell';
        cell.dataset.row = row.toString();
        cell.dataset.col = col.toString();

        // 第3行为空行
        if (row === 2) {
            cell.classList.add('empty-row');
        }

        // 设置格子的CSS Grid位置
        cell.style.gridRow = (row + 1).toString();
        cell.style.gridColumn = (col + 1).toString();

        // 创建卡牌容器
        const cardContainer = this.uiManager.document.createElement('div');
        cardContainer.className = 'card-container';
        cell.appendChild(cardContainer);

        return cell;
    }

    /**
     * 设置棋盘布局
     */
    setupBoardLayout() {
        if (!this.boardElement) return;

        this.boardElement.style.display = 'grid';
        this.boardElement.style.gridTemplateRows = 'repeat(5, 1fr)';
        this.boardElement.style.gridTemplateColumns = 'repeat(4, 1fr)';
        this.boardElement.style.gap = '8px';
        this.boardElement.style.padding = `${this.boardPadding}px`;
        this.boardElement.style.background = 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)';
        this.boardElement.style.borderRadius = '12px';
        this.boardElement.style.border = '2px solid #34495e';
        this.boardElement.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
    }

    /**
     * 渲染游戏状态到棋盘
     * @param {GameState} gameState - 游戏状态
     */
    renderBoard(gameState) {
        if (!this.boardElement || !gameState) return;

        // 清空所有格子的内容
        this.cells.forEach(cell => {
            const cardContainer = cell.querySelector('.card-container');
            if (cardContainer) {
                cardContainer.innerHTML = '';
                cell.className = `board-cell ${cell.dataset.row === '2' ? 'empty-row' : ''}`;
            }
        });

        // 渲染卡牌
        gameState.cardsData.forEach(card => {
            if (card.position.row >= 0 && card.position.col >= 0) {
                this.renderCard(card);
            }
        });

        // 更新统计信息
        this.updateStats(gameState);
    }

    /**
     * 渲染单张卡牌
     * @param {Card} card - 卡牌对象
     */
    renderCard(card) {
        const cell = this.getCellByPosition(card.position.row, card.position.col);
        if (!cell) return;

        const cardContainer = cell.querySelector('.card-container');
        if (!cardContainer) return;

        // 创建卡牌元素
        const cardElement = this.createCardElement(card);
        cardContainer.appendChild(cardElement);

        // 添加卡牌状态样式
        this.updateCardAppearance(cell, card);
    }

    /**
     * 创建卡牌DOM元素
     * @param {Card} card - 卡牌对象
     * @returns {Element} 卡牌元素
     */
    createCardElement(card) {
        const cardElement = this.uiManager.document.createElement('div');
        cardElement.className = 'game-card';
        cardElement.dataset.cardId = card.id;

        if (card.isRevealed) {
            // 已翻开的卡牌
            cardElement.classList.add('revealed', card.faction);
            
            // 卡牌图片
            const cardImage = this.uiManager.document.createElement('img');
            cardImage.src = card.getImagePath();
            cardImage.alt = card.name;
            cardImage.className = 'card-image';
            cardImage.loading = 'lazy';
            
            // 图片加载失败时显示文字
            cardImage.onerror = () => {
                cardImage.style.display = 'none';
                const textFallback = this.uiManager.document.createElement('div');
                textFallback.className = 'card-text-fallback';
                textFallback.innerHTML = `
                    <div class="card-name">${card.name}</div>
                    <div class="card-level">Lv.${card.level}</div>
                `;
                cardElement.appendChild(textFallback);
            };
            
            cardElement.appendChild(cardImage);

            // 卡牌信息覆盖层
            const infoOverlay = this.uiManager.document.createElement('div');
            infoOverlay.className = 'card-info-overlay';
            infoOverlay.innerHTML = `
                <div class="card-name">${card.name}</div>
                <div class="card-level">Lv.${card.level}</div>
            `;
            cardElement.appendChild(infoOverlay);

        } else {
            // 未翻开的卡牌（背面）
            cardElement.classList.add('hidden');
            
            const cardBack = this.uiManager.document.createElement('div');
            cardBack.className = 'card-back';
            cardBack.innerHTML = `
                <div class="card-back-pattern"></div>
                <div class="card-back-logo">🎴</div>
            `;
            cardElement.appendChild(cardBack);
        }

        return cardElement;
    }

    /**
     * 更新卡牌外观
     * @param {Element} cell - 格子元素
     * @param {Card} card - 卡牌对象
     */
    updateCardAppearance(cell, card) {
        // 添加阵营样式
        if (card.isRevealed) {
            cell.classList.add('has-card', card.faction);
            
            // 添加归属样式
            if (card.owner) {
                cell.classList.add(`owner-${card.owner}`);
            }
        } else {
            cell.classList.add('has-card', 'face-down');
        }

        // 添加特殊卡牌标记
        if (card.level === 1 || card.level === 8) {
            cell.classList.add('special-card');
        }
    }

    /**
     * 根据位置获取格子
     * @param {number} row - 行
     * @param {number} col - 列
     * @returns {Element} 格子元素
     */
    getCellByPosition(row, col) {
        const index = row * 4 + col;
        return this.cells[index] || null;
    }

    /**
     * 高亮格子
     * @param {number} row - 行
     * @param {number} col - 列
     * @param {string} type - 高亮类型
     */
    highlightCell(row, col, type = 'highlight') {
        const cell = this.getCellByPosition(row, col);
        if (cell) {
            cell.classList.add(type);
        }
    }

    /**
     * 移除格子高亮
     * @param {number} row - 行
     * @param {number} col - 列
     * @param {string} type - 高亮类型
     */
    unhighlightCell(row, col, type = 'highlight') {
        const cell = this.getCellByPosition(row, col);
        if (cell) {
            cell.classList.remove(type);
        }
    }

    /**
     * 清除所有高亮
     */
    clearAllHighlights() {
        this.cells.forEach(cell => {
            cell.classList.remove('highlight', 'selected', 'valid-move', 'valid-attack');
        });
    }

    /**
     * 调整棋盘尺寸
     */
    adjustBoardSize() {
        if (!this.boardElement) return;

        const container = this.boardElement.parentElement;
        const containerRect = container.getBoundingClientRect();
        
        // 计算可用空间
        const availableWidth = containerRect.width - 40; // 减去边距
        const availableHeight = window.innerHeight * 0.6; // 最大高度为屏幕60%
        
        // 计算最优的格子尺寸
        const cellWidth = Math.floor((availableWidth - this.boardPadding * 2 - 8 * 3) / 4); // 4列，3个间隙
        const cellHeight = Math.floor(cellWidth * 1.4); // 卡牌比例约为1:1.4
        
        // 限制最小和最大尺寸
        this.cellSize.width = Math.max(60, Math.min(120, cellWidth));
        this.cellSize.height = Math.max(84, Math.min(168, cellHeight));
        
        // 计算棋盘总尺寸
        const boardWidth = this.cellSize.width * 4 + 8 * 3 + this.boardPadding * 2;
        const boardHeight = this.cellSize.height * 5 + 8 * 4 + this.boardPadding * 2;
        
        // 应用尺寸
        this.boardElement.style.width = `${boardWidth}px`;
        this.boardElement.style.height = `${boardHeight}px`;
        
        // 更新CSS变量（如果使用）
        this.boardElement.style.setProperty('--cell-width', `${this.cellSize.width}px`);
        this.boardElement.style.setProperty('--cell-height', `${this.cellSize.height}px`);
        
        // 调整卡牌尺寸
        this.updateCardSizes();
    }

    /**
     * 更新卡牌尺寸
     */
    updateCardSizes() {
        const cards = this.boardElement.querySelectorAll('.game-card');
        cards.forEach(card => {
            card.style.width = `${this.cellSize.width}px`;
            card.style.height = `${this.cellSize.height}px`;
        });
    }

    /**
     * 获取格子尺寸
     * @returns {Object} 格子尺寸
     */
    getCellSize() {
        return { ...this.cellSize };
    }

    /**
     * 更新统计信息显示
     * @param {GameState} gameState - 游戏状态
     */
    updateStats(gameState) {
        // 更新剩余牌数
        const revealedCount = gameState.cardsData.filter(card => card.isRevealed).length;
        const remainingCount = 16 - revealedCount;
        
        const remainingCardsEl = this.uiManager.elements.remainingCards;
        if (remainingCardsEl) {
            remainingCardsEl.textContent = remainingCount.toString();
        }

        // 更新回合数
        const turnCount = gameState.gameLog.filter(log => log.type === 'turn_change').length;
        const turnCountEl = this.uiManager.elements.turnCount;
        if (turnCountEl) {
            turnCountEl.textContent = turnCount.toString();
        }
    }

    /**
     * 播放卡牌翻转效果
     * @param {Element} cell - 格子元素
     * @param {Card} card - 卡牌对象
     * @returns {Promise} 动画完成Promise
     */
    async playCardFlip(cell, card) {
        return new Promise(resolve => {
            const cardElement = cell.querySelector('.game-card');
            if (!cardElement) {
                resolve();
                return;
            }

            // 添加翻转动画类
            cardElement.classList.add('flipping');
            
            // 中途更换卡牌内容
            setTimeout(() => {
                cardElement.innerHTML = '';
                const newCardElement = this.createCardElement(card);
                cardElement.appendChild(newCardElement.firstChild);
                this.updateCardAppearance(cell, card);
            }, 150); // 动画中点

            // 动画结束后清理
            setTimeout(() => {
                cardElement.classList.remove('flipping');
                cardElement.classList.add('flip-complete');
                resolve();
            }, 300);
        });
    }

    /**
     * 播放卡牌移动效果
     * @param {Element} fromCell - 起始格子
     * @param {Element} toCell - 目标格子
     * @returns {Promise} 动画完成Promise
     */
    async playCardMove(fromCell, toCell) {
        return new Promise(resolve => {
            const cardElement = fromCell.querySelector('.game-card');
            if (!cardElement) {
                resolve();
                return;
            }

            // 计算移动距离
            const fromRect = fromCell.getBoundingClientRect();
            const toRect = toCell.getBoundingClientRect();
            const deltaX = toRect.left - fromRect.left;
            const deltaY = toRect.top - fromRect.top;

            // 应用移动动画
            cardElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
            cardElement.style.transition = 'transform 0.3s ease-in-out';
            cardElement.style.zIndex = '100';

            setTimeout(() => {
                // 重置样式
                cardElement.style.transform = '';
                cardElement.style.transition = '';
                cardElement.style.zIndex = '';
                
                // 移动卡牌到目标位置
                const cardContainer = toCell.querySelector('.card-container');
                if (cardContainer) {
                    cardContainer.appendChild(cardElement);
                }
                
                resolve();
            }, 300);
        });
    }

    /**
     * 添加视觉效果
     * @param {Element} cell - 格子元素
     * @param {string} effect - 效果类型
     * @param {number} duration - 持续时间
     */
    addVisualEffect(cell, effect, duration = 1000) {
        if (!cell) return;

        cell.classList.add(effect);
        
        setTimeout(() => {
            cell.classList.remove(effect);
        }, duration);
    }

    /**
     * 重置棋盘显示
     */
    reset() {
        this.cells.forEach(cell => {
            const cardContainer = cell.querySelector('.card-container');
            if (cardContainer) {
                cardContainer.innerHTML = '';
            }
            cell.className = `board-cell ${cell.dataset.row === '2' ? 'empty-row' : ''}`;
        });
    }

    /**
     * 获取棋盘截图数据
     * @returns {string} Base64图片数据
     */
    getBoardScreenshot() {
        if (!this.boardElement) return null;

        try {
            // 使用html2canvas或类似库来截图
            // 这里提供一个简化的实现概念
            const canvas = this.uiManager.document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 设置画布尺寸
            canvas.width = this.boardElement.offsetWidth;
            canvas.height = this.boardElement.offsetHeight;
            
            // 这里需要实际的截图逻辑
            // 暂时返回空数据
            return canvas.toDataURL();
        } catch (error) {
            console.warn('获取棋盘截图失败:', error);
            return null;
        }
    }
}
