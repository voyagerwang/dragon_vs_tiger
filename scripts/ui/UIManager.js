/**
 * UIManager类 - 用户界面管理器
 * 负责管理所有的UI组件、事件处理和界面更新
 */

import { BoardRenderer } from './BoardRenderer.js';
import { AnimationController } from './AnimationController.js';

export class UIManager {
    constructor(gameEngine, document = window.document) {
        this.gameEngine = gameEngine;
        this.document = document;
        this.boardRenderer = new BoardRenderer(this);
        this.animationController = new AnimationController(this);
        
        this.elements = {};
        this.eventListeners = new Map();
        this.isInitialized = false;
        this.lastWindowWidth = 0;
        
        // UI状态
        this.selectedCell = null;
        this.validMoves = [];
        this.isAnimating = false;
    }

    /**
     * 初始化UI管理器
     */
    init() {
        try {
            // 获取DOM元素引用
            this.initElements();
            
            // 绑定事件监听器
            this.bindEvents();
            
            // 绑定游戏引擎事件
            this.bindGameEvents();
            
            // 初始化界面状态
            this.initializeUI();
            
            this.isInitialized = true;
            this.emit('uiInitialized');
            
            console.log('🎨 UI管理器初始化完成');
        } catch (error) {
            console.error('UI管理器初始化失败:', error);
            throw error;
        }
    }

    /**
     * 获取DOM元素引用
     */
    initElements() {
        const elementIds = [
            'game-container', 'loading-screen', 'game-board', 'move-hints',
            'game-status', 'game-phase', 'current-turn',
            'player-info', 'player-faction', 'ai-info', 'ai-faction',
            'rock-paper-scissors', 'rps-result', 'game-main',
            'game-log', 'log-toggle', 'game-end-modal', 'help-modal',
            'deselect-btn', 'hint-btn', 'restart-btn',
            'turn-count', 'remaining-cards'
        ];

        elementIds.forEach(id => {
            const element = this.document.getElementById(id);
            if (element) {
                this.elements[this.toCamelCase(id)] = element;
            } else {
                console.warn(`未找到元素: ${id}`);
            }
        });

        // 验证关键元素
        const requiredElements = ['gameContainer', 'gameBoard'];
        requiredElements.forEach(key => {
            if (!this.elements[key]) {
                throw new Error(`缺少必需的UI元素: ${key}`);
            }
        });
    }

    /**
     * 转换ID为驼峰命名
     * @param {string} id - 元素ID
     * @returns {string} 驼峰命名
     */
    toCamelCase(id) {
        return id.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
    }

    /**
     * 绑定UI事件监听器
     */
    bindEvents() {
        // 棋盘点击事件
        if (this.elements.gameBoard) {
            this.elements.gameBoard.addEventListener('click', this.handleBoardClick.bind(this));
        }

        // 控制按钮事件
        if (this.elements.deselectBtn) {
            this.elements.deselectBtn.addEventListener('click', this.handleDeselectClick.bind(this));
        }
        
        if (this.elements.hintBtn) {
            this.elements.hintBtn.addEventListener('click', this.handleHintClick.bind(this));
        }
        
        if (this.elements.restartBtn) {
            this.elements.restartBtn.addEventListener('click', this.handleRestartClick.bind(this));
        }

        // 猜拳按钮事件
        const rpsButtons = this.document.querySelectorAll('.rps-choice');
        rpsButtons.forEach(button => {
            button.addEventListener('click', this.handleRPSClick.bind(this));
        });

        // 模态框事件
        const modalButtons = this.document.querySelectorAll('[id$="-close-btn"], [id$="-modal-btn"]');
        modalButtons.forEach(button => {
            button.addEventListener('click', this.handleModalClick.bind(this));
        });

        // 窗口大小变化事件
        window.addEventListener('resize', this.handleResize.bind(this));

        // 键盘事件
        this.document.addEventListener('keydown', this.handleKeyDown.bind(this));

        // 日志折叠事件
        if (this.elements.logToggle) {
            this.elements.logToggle.addEventListener('click', this.toggleGameLog.bind(this));
        }
    }

    /**
     * 绑定游戏引擎事件
     */
    bindGameEvents() {
        this.gameEngine.on('gameStarted', this.onGameStarted.bind(this));
        this.gameEngine.on('rpsCompleted', this.onRPSCompleted.bind(this));
        this.gameEngine.on('boardInitialized', this.onBoardInitialized.bind(this));
        this.gameEngine.on('cardFlipped', this.onCardFlipped.bind(this));
        this.gameEngine.on('cardSelected', this.onCardSelected.bind(this));
        this.gameEngine.on('cardDeselected', this.onCardDeselected.bind(this));
        this.gameEngine.on('cardMoved', this.onCardMoved.bind(this));
        this.gameEngine.on('gameEnded', this.onGameEnded.bind(this));
    }

    /**
     * 初始化界面状态
     */
    initializeUI() {
        // 隐藏加载屏幕
        this.hideElement('loadingScreen');
        
        // 显示游戏容器
        this.showElement('gameContainer');
        
        // 初始化棋盘
        this.boardRenderer.createBoard();
        
        // 更新初始状态
        this.updateGameStatus('点击开始游戏', 'setup');
        this.updatePlayerInfo(null, null);
        
        // 记录初始窗口宽度
        this.lastWindowWidth = window.innerWidth;
    }

    /**
     * 渲染游戏棋盘
     */
    renderBoard() {
        if (!this.isInitialized) {
            console.warn('UI未初始化，无法渲染棋盘');
            return;
        }
        
        this.boardRenderer.renderBoard(this.gameEngine.gameState);
    }

    /**
     * 处理棋盘点击事件
     * @param {Event} event - 点击事件
     */
    handleBoardClick(event) {
        if (this.isAnimating) return;
        
        const cell = event.target.closest('.board-cell');
        if (!cell) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        this.emit('cellClicked', { row, col, cell });
        
        // 处理不同的点击情况
        if (this.selectedCell) {
            // 有选中的卡牌，尝试移动
            this.handleMoveAttempt(row, col);
        } else {
            // 没有选中卡牌，尝试翻牌或选择
            this.handleCardAction(row, col);
        }
    }

    /**
     * 处理卡牌操作（翻牌或选择）
     * @param {number} row - 行坐标
     * @param {number} col - 列坐标
     */
    handleCardAction(row, col) {
        const card = this.gameEngine.gameState.getCardAt(row, col);
        
        if (!card) return;
        
        if (!card.isRevealed) {
            // 翻牌
            this.gameEngine.flipCard(row, col);
        } else if (card.faction === this.gameEngine.gameState.playerFaction) {
            // 选择己方卡牌
            this.gameEngine.selectCard(row, col);
        }
    }

    /**
     * 处理移动尝试
     * @param {number} row - 目标行
     * @param {number} col - 目标列
     */
    handleMoveAttempt(row, col) {
        const selectedPos = this.gameEngine.gameState.selectedPosition;
        if (!selectedPos) return;
        
        // 如果点击的是同一个位置，取消选择
        if (selectedPos.row === row && selectedPos.col === col) {
            this.gameEngine.deselectCard();
            return;
        }
        
        // 尝试移动
        this.gameEngine.moveCard(selectedPos.row, selectedPos.col, row, col);
    }

    /**
     * 处理取消选择按钮
     */
    handleDeselectClick() {
        this.gameEngine.deselectCard();
    }

    /**
     * 处理提示按钮
     */
    handleHintClick() {
        this.showHint();
    }

    /**
     * 处理重新开始按钮
     */
    handleRestartClick() {
        if (confirm('确定要重新开始游戏吗？')) {
            this.gameEngine.restartGame();
        }
    }

    /**
     * 处理猜拳按钮点击
     * @param {Event} event - 点击事件
     */
    handleRPSClick(event) {
        const choice = event.currentTarget.dataset.choice;
        if (choice) {
            this.gameEngine.playRockPaperScissors(choice);
        }
    }

    /**
     * 处理模态框按钮点击
     * @param {Event} event - 点击事件
     */
    handleModalClick(event) {
        const buttonId = event.target.id;
        
        if (buttonId.includes('close') || buttonId.includes('modal')) {
            this.hideModal();
        } else if (buttonId === 'play-again-btn') {
            this.hideModal();
            this.gameEngine.restartGame();
        }
    }

    /**
     * 处理窗口大小变化
     */
    handleResize() {
        const currentWidth = window.innerWidth;
        
        // 避免频繁触发
        if (Math.abs(currentWidth - this.lastWindowWidth) < 50) return;
        
        this.lastWindowWidth = currentWidth;
        
        // 重新计算棋盘尺寸
        this.boardRenderer.adjustBoardSize();
        
        // 重新定位元素
        this.adjustLayout();
        
        this.emit('windowResized', { width: currentWidth });
    }

    /**
     * 处理键盘事件
     * @param {Event} event - 键盘事件
     */
    handleKeyDown(event) {
        if (event.key === 'Escape') {
            this.handleEscape();
        } else if (event.key === ' ') {
            event.preventDefault();
            this.showHint();
        }
    }

    /**
     * 处理ESC键
     */
    handleEscape() {
        if (this.isModalVisible()) {
            this.hideModal();
        } else if (this.selectedCell) {
            this.gameEngine.deselectCard();
        }
    }

    /**
     * 游戏开始事件处理
     * @param {Object} data - 事件数据
     */
    onGameStarted(data) {
        this.showElement('rockPaperScissors');
        this.hideElement('gameMain');
        this.updateGameStatus('请选择猜拳', 'rps');
    }

    /**
     * 猜拳完成事件处理
     * @param {Object} data - 事件数据
     */
    onRPSCompleted(data) {
        this.hideElement('rockPaperScissors');
        this.showRPSResult(data);
        
        // 延迟显示游戏主界面
        setTimeout(() => {
            this.hideElement('rpsResult');
            this.showElement('gameMain');
            this.gameEngine.initializeBoard();
        }, 2000);
    }

    /**
     * 棋盘初始化事件处理
     * @param {Object} data - 事件数据
     */
    onBoardInitialized(data) {
        this.renderBoard();
        this.updateGameStatus(`${data.gameState.currentPlayer === 'player' ? '你的' : 'AI的'}回合`, 'playing');
        
        // 如果是AI回合，触发AI执行
        if (data.gameState.currentPlayer === 'ai') {
            setTimeout(async () => {
                await this.gameEngine.executeAITurn();
            }, 1000);
        }
    }

    /**
     * 卡牌翻开事件处理
     * @param {Object} data - 事件数据
     */
    async onCardFlipped(data) {
        const { flippedCard, factionAssigned } = data;
        const cell = this.getCellByPosition(flippedCard.position.row, flippedCard.position.col);
        
        if (cell) {
            await this.animationController.playFlipAnimation(cell, flippedCard);
        }
        
        if (factionAssigned) {
            this.updatePlayerInfo(data.gameState.playerFaction, data.gameState.aiFaction);
        }
        
        this.updateGameStatus(`翻开了${flippedCard.name}`, 'playing');
        this.addLogEntry({
            type: 'flip',
            player: 'player',
            action: `翻开了${flippedCard.name}`,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * 卡牌选择事件处理
     * @param {Object} data - 事件数据
     */
    onCardSelected(data) {
        const { selectedCard, validMoves } = data;
        const cell = this.getCellByPosition(selectedCard.position.row, selectedCard.position.col);
        
        if (cell) {
            this.selectedCell = cell;
            cell.classList.add('selected');
        }
        
        this.showValidMoves(validMoves);
        this.updateDeselectButton(true);
    }

    /**
     * 卡牌取消选择事件处理
     * @param {Object} data - 事件数据
     */
    onCardDeselected(data) {
        if (this.selectedCell) {
            this.selectedCell.classList.remove('selected');
            this.selectedCell = null;
        }
        
        this.hideValidMoves();
        this.updateDeselectButton(false);
    }

    /**
     * 卡牌移动事件处理
     * @param {Object} data - 事件数据
     */
    async onCardMoved(data) {
        const { moveType, battleResult } = data;
        
        if (moveType === 'battle' && battleResult) {
            await this.animationController.playBattleAnimation(battleResult);
        }
        
        this.renderBoard();
        this.clearSelection();
        
        this.addLogEntry({
            type: 'move',
            player: 'player',
            action: moveType === 'battle' ? '发起攻击' : '移动卡牌',
            timestamp: new Date().toISOString()
        });
    }

    /**
     * 游戏结束事件处理
     * @param {Object} data - 事件数据
     */
    onGameEnded(data) {
        const { winner, reason } = data;
        
        this.updateGameStatus('游戏结束', 'ended');
        this.showGameEndModal(winner, reason);
    }

    /**
     * 显示猜拳结果
     * @param {Object} data - 猜拳数据
     */
    showRPSResult(data) {
        const { playerChoice, aiChoice, winner } = data;
        
        // 更新选择显示
        const playerChoiceEl = this.document.getElementById('player-choice');
        const aiChoiceEl = this.document.getElementById('ai-choice');
        const outcomeEl = this.document.getElementById('rps-outcome');
        
        const choiceIcons = {
            rock: '✊',
            paper: '✋',
            scissors: '✌️'
        };
        
        if (playerChoiceEl) playerChoiceEl.textContent = choiceIcons[playerChoice];
        if (aiChoiceEl) aiChoiceEl.textContent = choiceIcons[aiChoice];
        
        const outcomeText = winner === 'draw' ? '平局！' : 
                          winner === 'player' ? '你赢了！' : 'AI赢了！';
        if (outcomeEl) outcomeEl.textContent = outcomeText;
        
        this.showElement('rpsResult');
    }

    /**
     * 显示有效移动位置
     * @param {Array} validMoves - 有效移动数组
     */
    showValidMoves(validMoves) {
        this.hideValidMoves();
        this.validMoves = validMoves;
        
        const hintsContainer = this.elements.moveHints;
        if (!hintsContainer) return;
        
        validMoves.forEach(move => {
            const hint = this.document.createElement('div');
            hint.className = `move-hint ${move.type}`;
            hint.style.position = 'absolute';
            
            // 计算位置
            const cellSize = this.boardRenderer.getCellSize();
            hint.style.left = `${move.col * cellSize.width}px`;
            hint.style.top = `${move.row * cellSize.height}px`;
            hint.style.width = `${cellSize.width}px`;
            hint.style.height = `${cellSize.height}px`;
            
            hintsContainer.appendChild(hint);
        });
    }

    /**
     * 隐藏有效移动位置
     */
    hideValidMoves() {
        if (this.elements.moveHints) {
            this.elements.moveHints.innerHTML = '';
        }
        this.validMoves = [];
    }

    /**
     * 显示提示
     */
    showHint() {
        // 简单的提示实现
        const gameState = this.gameEngine.gameState;
        
        if (gameState.phase !== 'playing' || gameState.currentPlayer !== 'player') {
            return;
        }
        
        let hint = '';
        
        if (!gameState.playerFaction) {
            hint = '点击任意背面朝上的卡牌翻开，确定你的阵营';
        } else if (gameState.selectedPosition) {
            hint = '点击绿色高亮区域移动卡牌，或点击其他己方卡牌改变选择';
        } else {
            const playerCards = gameState.getRevealedCards('player');
            if (playerCards.length > 0) {
                hint = '点击己方卡牌选择后移动，或翻开更多卡牌';
            } else {
                hint = '继续翻开卡牌寻找己方阵营';
            }
        }
        
        this.showToast(hint, 3000);
    }

    /**
     * 显示吐司提示
     * @param {string} message - 提示信息
     * @param {number} duration - 显示时长
     */
    showToast(message, duration = 2000) {
        const toast = this.document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            z-index: 9999;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        this.document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, duration);
    }

    /**
     * 更新游戏状态显示
     * @param {string} status - 状态文本
     * @param {string} phase - 游戏阶段
     */
    updateGameStatus(status, phase) {
        if (this.elements.currentTurn) {
            this.elements.currentTurn.textContent = status;
        }
        if (this.elements.gamePhase) {
            this.elements.gamePhase.textContent = phase;
        }
    }

    /**
     * 更新玩家信息显示
     * @param {string} playerFaction - 玩家阵营
     * @param {string} aiFaction - AI阵营
     */
    updatePlayerInfo(playerFaction, aiFaction) {
        const factionNames = {
            dragon: '龙阵营',
            tiger: '虎阵营'
        };
        
        if (this.elements.playerFaction) {
            this.elements.playerFaction.textContent = playerFaction ? 
                factionNames[playerFaction] : '未确定';
        }
        
        if (this.elements.aiFaction) {
            this.elements.aiFaction.textContent = aiFaction ? 
                factionNames[aiFaction] : '未确定';
        }
    }

    /**
     * 添加游戏日志条目
     * @param {Object} logEntry - 日志条目
     */
    addLogEntry(logEntry) {
        if (!this.elements.gameLog) return;
        
        const logElement = this.document.createElement('div');
        logElement.className = 'log-entry';
        
        const time = new Date().toLocaleTimeString();
        logElement.innerHTML = `
            <span class="log-time">${time}</span>
            <span class="log-action">${logEntry.action}</span>
        `;
        
        this.elements.gameLog.appendChild(logElement);
        
        // 自动滚动到底部
        this.elements.gameLog.scrollTop = this.elements.gameLog.scrollHeight;
        
        // 限制日志条目数量
        const maxEntries = 50;
        while (this.elements.gameLog.children.length > maxEntries) {
            this.elements.gameLog.removeChild(this.elements.gameLog.firstChild);
        }
    }

    /**
     * 切换游戏日志显示
     */
    toggleGameLog() {
        if (!this.elements.gameLog || !this.elements.logToggle) return;
        
        const isHidden = this.elements.gameLog.style.display === 'none';
        this.elements.gameLog.style.display = isHidden ? 'block' : 'none';
        this.elements.logToggle.textContent = isHidden ? '▲' : '▼';
    }

    /**
     * 显示游戏结束模态框
     * @param {string} winner - 胜者
     * @param {string} reason - 结束原因
     */
    showGameEndModal(winner, reason) {
        const modal = this.elements.gameEndModal;
        if (!modal) return;
        
        const titleEl = this.document.getElementById('game-result-title');
        const iconEl = this.document.getElementById('result-icon');
        const messageEl = this.document.getElementById('result-message');
        
        let title, icon, message;
        
        if (winner === 'player') {
            title = '恭喜获胜！';
            icon = '🎉';
            message = '你战胜了AI对手！';
        } else if (winner === 'ai') {
            title = '失败了';
            icon = '😔';
            message = 'AI获得了胜利，再试一次吧！';
        } else {
            title = '平局';
            icon = '🤝';
            message = '势均力敌的对决！';
        }
        
        if (titleEl) titleEl.textContent = title;
        if (iconEl) iconEl.textContent = icon;
        if (messageEl) messageEl.textContent = message;
        
        this.showModal(modal);
    }

    /**
     * 根据位置获取棋盘格子
     * @param {number} row - 行
     * @param {number} col - 列
     * @returns {Element} 格子元素
     */
    getCellByPosition(row, col) {
        const index = row * 4 + col;
        return this.elements.gameBoard?.children[index] || null;
    }

    /**
     * 清除选择状态
     */
    clearSelection() {
        if (this.selectedCell) {
            this.selectedCell.classList.remove('selected');
            this.selectedCell = null;
        }
        this.hideValidMoves();
        this.updateDeselectButton(false);
    }

    /**
     * 更新取消选择按钮状态
     * @param {boolean} enabled - 是否启用
     */
    updateDeselectButton(enabled) {
        if (this.elements.deselectBtn) {
            this.elements.deselectBtn.disabled = !enabled;
        }
    }

    /**
     * 调整布局
     */
    adjustLayout() {
        // 根据屏幕尺寸调整元素布局
        const isMobile = window.innerWidth < 768;
        
        if (isMobile) {
            this.document.body.classList.add('mobile-layout');
        } else {
            this.document.body.classList.remove('mobile-layout');
        }
    }

    /**
     * 显示元素
     * @param {string} elementKey - 元素键名
     */
    showElement(elementKey) {
        const element = this.elements[elementKey];
        if (element) {
            element.classList.remove('hidden');
        }
    }

    /**
     * 隐藏元素
     * @param {string} elementKey - 元素键名
     */
    hideElement(elementKey) {
        const element = this.elements[elementKey];
        if (element) {
            element.classList.add('hidden');
        }
    }

    /**
     * 显示模态框
     * @param {Element} modal - 模态框元素
     */
    showModal(modal) {
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    /**
     * 隐藏模态框
     */
    hideModal() {
        const modals = this.document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.add('hidden');
        });
    }

    /**
     * 检查是否有模态框显示
     * @returns {boolean} 是否有模态框显示
     */
    isModalVisible() {
        const modals = this.document.querySelectorAll('.modal');
        return Array.from(modals).some(modal => !modal.classList.contains('hidden'));
    }

    /**
     * 设置动画状态
     * @param {boolean} isAnimating - 是否正在动画
     */
    setAnimating(isAnimating) {
        this.isAnimating = isAnimating;
        
        // 禁用/启用交互
        if (this.elements.gameBoard) {
            this.elements.gameBoard.style.pointerEvents = isAnimating ? 'none' : 'auto';
        }
    }

    /**
     * 事件监听器
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    /**
     * 移除事件监听器
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * 触发事件
     * @param {string} event - 事件名称
     * @param {Object} data - 事件数据
     */
    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`UI事件处理器错误 [${event}]:`, error);
                }
            });
        }
    }

    /**
     * 销毁UI管理器
     */
    destroy() {
        // 移除所有事件监听器
        this.eventListeners.clear();
        
        // 重置状态
        this.selectedCell = null;
        this.validMoves = [];
        this.isAnimating = false;
        this.isInitialized = false;
        
        console.log('🎨 UI管理器已销毁');
    }
}
