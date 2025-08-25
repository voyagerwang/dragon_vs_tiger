/**
 * GameEngine类 - 游戏引擎核心
 * 负责管理整个游戏的逻辑流程、状态转换和规则执行
 */

import { GameState } from './GameState.js';
import { BattleResolver } from './BattleResolver.js';
import { Card } from './Card.js';
import { EnhancedAIPlayer } from '../ai/EnhancedAIPlayer.js';

export class GameEngine {
    constructor() {
        this.gameState = new GameState();
        this.battleResolver = new BattleResolver();
        this.aiPlayer = new EnhancedAIPlayer(this);
        this.gameId = this.generateGameId();
        this.eventListeners = new Map();
        this.saveKey = 'dragon_tiger_save';
        
        // 错误码定义
        this.ERROR_CODES = {
            INVALID_GAME_PHASE: '当前游戏阶段不允许此操作',
            INVALID_POSITION: '位置坐标无效',
            NOT_YOUR_TURN: '不是你的回合',
            CARD_ALREADY_REVEALED: '卡牌已经翻开',
            INVALID_MOVE: '无效的移动',
            CARD_NOT_SELECTED: '未选择卡牌',
            GAME_NOT_STARTED: '游戏未开始',
            NO_CARD_AT_POSITION: '指定位置没有卡牌',
            CANNOT_MOVE_OPPONENT_CARD: '不能移动对方的卡牌',
            POSITION_OCCUPIED: '目标位置被占据',
            INVALID_RPS_CHOICE: '无效的猜拳选择',
            AI_TURN_FAILED: 'AI回合执行失败',
            GAME_START_FAILED: '游戏启动失败',
            FLIP_CARD_FAILED: '翻牌操作失败',
            SELECT_CARD_FAILED: '选择卡牌失败',
            DESELECT_FAILED: '取消选择失败',
            MOVE_CARD_FAILED: '移动卡牌失败',
            RPS_FAILED: '猜拳操作失败',
            RESTART_FAILED: '重启游戏失败'
        };
    }

    /**
     * 开始新游戏
     * @returns {Object} 操作结果
     */
    startNewGame() {
        try {
            this.gameState = new GameState();
            this.gameState.phase = 'rps';
            this.gameId = this.generateGameId();
            
            this.gameState.addLogEntry('game_start', 'system', '游戏开始', {
                gameId: this.gameId,
                timestamp: this.gameState.startTime
            });

            this.emit('gameStarted', { gameState: this.gameState.clone() });

            return {
                success: true,
                data: {
                    gameId: this.gameId,
                    gameState: this.gameState.clone()
                },
                message: '新游戏已开始'
            };
        } catch (error) {
            return this.createError('GAME_START_FAILED', { originalError: error.message });
        }
    }

    /**
     * 执行猜拳操作
     * @param {string} playerChoice - 玩家选择：rock, paper, scissors
     * @returns {Object} 猜拳结果
     */
    playRockPaperScissors(playerChoice) {
        if (this.gameState.phase !== 'rps') {
            return this.createError('INVALID_GAME_PHASE');
        }

        const validChoices = ['rock', 'paper', 'scissors'];
        if (!validChoices.includes(playerChoice)) {
            return this.createError('INVALID_RPS_CHOICE');
        }

        try {
            // AI随机选择
            const aiChoice = validChoices[Math.floor(Math.random() * validChoices.length)];
            
            // 判定胜负
            const winner = this.determineRPSWinner(playerChoice, aiChoice);
            
            // 设置先手
            this.gameState.currentPlayer = winner === 'draw' ? 
                (Math.random() < 0.5 ? 'player' : 'ai') : winner;
            
            // 进入游戏阶段
            this.gameState.phase = 'playing';
            
            this.gameState.addLogEntry('rps_completed', 'system', '猜拳决定先手', {
                playerChoice,
                aiChoice,
                winner,
                firstPlayer: this.gameState.currentPlayer
            });

            const result = {
                success: true,
                data: {
                    playerChoice,
                    aiChoice,
                    winner,
                    firstPlayer: this.gameState.currentPlayer,
                    gameState: this.gameState.clone()
                },
                message: `猜拳结果：${winner === 'draw' ? '平局，随机决定' : ''}${this.gameState.currentPlayer === 'player' ? '玩家' : 'AI'}先手`
            };

            this.emit('rpsCompleted', result.data);

            return result;
        } catch (error) {
            return this.createError('RPS_FAILED', { originalError: error.message });
        }
    }

    /**
     * 判定猜拳胜负
     * @param {string} player - 玩家选择
     * @param {string} ai - AI选择
     * @returns {string} 胜者：player, ai, draw
     */
    determineRPSWinner(player, ai) {
        if (player === ai) return 'draw';
        
        const winConditions = {
            rock: 'scissors',
            paper: 'rock',
            scissors: 'paper'
        };
        
        return winConditions[player] === ai ? 'player' : 'ai';
    }

    /**
     * 初始化棋盘（洗牌并放置卡牌）
     */
    initializeBoard() {
        if (this.gameState.phase !== 'playing') {
            throw new Error('只能在游戏阶段初始化棋盘');
        }

        // 获取所有可放置的位置
        const availablePositions = [];
        for (let row = 0; row < 5; row++) {
            if (row === 2) continue; // 跳过空行
            for (let col = 0; col < 4; col++) {
                availablePositions.push({ row, col });
            }
        }

        // 洗牌已洗过的卡牌数组，随机分配位置
        const shuffledPositions = this.gameState.shuffleCards(availablePositions);
        
        // 将卡牌放置到棋盘上
        this.gameState.cardsData.forEach((card, index) => {
            const position = shuffledPositions[index];
            this.gameState.placeCard(card, position.row, position.col);
        });

        this.gameState.addLogEntry('board_initialized', 'system', '棋盘初始化完成', {
            totalCards: this.gameState.cardsData.length
        });

        this.emit('boardInitialized', { gameState: this.gameState.clone() });
        
        return {
            success: true,
            message: '棋盘初始化完成'
        };
    }

    /**
     * 翻开卡牌
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @param {string} player - 执行翻牌的玩家 ('player' 或 'ai')，可选，默认为当前玩家
     * @returns {Object} 翻牌结果
     */
    flipCard(row, col, player = null) {
        // 验证游戏状态
        if (this.gameState.phase !== 'playing') {
            return this.createError('INVALID_GAME_PHASE');
        }

        // 如果指定了player参数，使用指定的玩家；否则检查当前玩家
        const expectedPlayer = player || this.gameState.currentPlayer;
        if (this.gameState.currentPlayer !== expectedPlayer) {
            return this.createError('NOT_YOUR_TURN');
        }

        // 验证位置
        if (!this.gameState.isValidPosition(row, col)) {
            return this.createError('INVALID_POSITION');
        }

        const card = this.gameState.getCardAt(row, col);
        if (!card) {
            return this.createError('NO_CARD_AT_POSITION');
        }

        if (card.isRevealed) {
            return this.createError('CARD_ALREADY_REVEALED');
        }

        try {
            // 翻开卡牌
            card.reveal();
            
            // 如果是首次翻牌，根据先手玩家确定阵营
            let factionAssigned = false;
            if (!this.gameState.playerFaction) {
                // 根据先手玩家设置阵营
                if (this.gameState.currentPlayer === 'player') {
                    // 玩家先手，第一张卡牌是玩家阵营
                    this.gameState.setPlayerFaction(card.faction);
                    card.owner = 'player';
                } else {
                    // AI先手，第一张卡牌是AI阵营
                    this.gameState.setAIFaction(card.faction);
                    card.owner = 'ai';
                }
                factionAssigned = true;
            } else {
                // 阵营已确定，根据卡牌阵营设置归属
                if (card.faction === this.gameState.playerFaction) {
                    card.owner = 'player';
                } else {
                    card.owner = 'ai';
                }
            }

            this.gameState.addLogEntry('flip', expectedPlayer, '翻开卡牌', {
                cardId: card.id,
                cardName: card.name,
                position: { row, col },
                faction: card.faction,
                level: card.level,
                factionAssigned
            });

            // 切换回合
            this.gameState.switchPlayer();

            const result = {
                success: true,
                data: {
                    flippedCard: card.toJSON(),
                    factionAssigned,
                    gameState: this.gameState.clone()
                },
                message: `翻开了${card.name}${factionAssigned ? '，阵营确定为' + (card.faction === 'dragon' ? '龙' : '虎') : ''}`
            };

            this.emit('cardFlipped', result.data);

            return result;
        } catch (error) {
            return this.createError('FLIP_CARD_FAILED', { originalError: error.message });
        }
    }

    /**
     * 选择卡牌
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @returns {Object} 选择结果
     */
    selectCard(row, col) {
        if (this.gameState.phase !== 'playing') {
            return this.createError('INVALID_GAME_PHASE');
        }

        if (this.gameState.currentPlayer !== 'player') {
            return this.createError('NOT_YOUR_TURN');
        }

        if (!this.gameState.isValidPosition(row, col)) {
            return this.createError('INVALID_POSITION');
        }

        const card = this.gameState.getCardAt(row, col);
        if (!card || !card.isRevealed) {
            return this.createError('NO_CARD_AT_POSITION');
        }

        if (card.faction !== this.gameState.playerFaction) {
            return this.createError('CANNOT_MOVE_OPPONENT_CARD');
        }

        try {
            this.gameState.selectedPosition = { row, col };
            const validMoves = this.getValidMoves(row, col);

            const result = {
                success: true,
                data: {
                    selectedCard: card.toJSON(),
                    validMoves,
                    gameState: this.gameState.clone()
                },
                message: `选择了${card.name}`
            };

            this.emit('cardSelected', result.data);

            return result;
        } catch (error) {
            return this.createError('SELECT_CARD_FAILED', { originalError: error.message });
        }
    }

    /**
     * 取消选择
     * @returns {Object} 取消结果
     */
    deselectCard() {
        if (!this.gameState.selectedPosition) {
            return this.createError('CARD_NOT_SELECTED');
        }

        try {
            this.gameState.selectedPosition = null;

            const result = {
                success: true,
                data: {
                    gameState: this.gameState.clone()
                },
                message: '已取消选择'
            };

            this.emit('cardDeselected', result.data);

            return result;
        } catch (error) {
            return this.createError('DESELECT_FAILED', { originalError: error.message });
        }
    }

    /**
     * 移动卡牌
     * @param {number} fromRow - 起始行
     * @param {number} fromCol - 起始列
     * @param {number} toRow - 目标行
     * @param {number} toCol - 目标列
     * @param {string} player - 执行移动的玩家 ('player' 或 'ai')，可选，默认为当前玩家
     * @returns {Object} 移动结果
     */
    moveCard(fromRow, fromCol, toRow, toCol, player = null) {
        if (this.gameState.phase !== 'playing') {
            return this.createError('INVALID_GAME_PHASE');
        }

        // 如果指定了player参数，使用指定的玩家；否则检查当前玩家
        const expectedPlayer = player || this.gameState.currentPlayer;
        if (this.gameState.currentPlayer !== expectedPlayer) {
            return this.createError('NOT_YOUR_TURN');
        }

        // 验证移动有效性
        if (!this.isValidMove(fromRow, fromCol, toRow, toCol)) {
            return this.createError('INVALID_MOVE');
        }

        try {
            const movingCard = this.gameState.getCardAt(fromRow, fromCol);
            
            // 验证卡牌归属 - 只能移动自己的卡牌
            if (expectedPlayer === 'player') {
                if (movingCard.faction !== this.gameState.playerFaction) {
                    return this.createError('CANNOT_MOVE_OPPONENT_CARD');
                }
            } else if (expectedPlayer === 'ai') {
                if (movingCard.faction !== this.gameState.aiFaction) {
                    return this.createError('CANNOT_MOVE_OPPONENT_CARD');
                }
            }
            const targetCard = this.gameState.getCardAt(toRow, toCol);
            
            let moveResult = {
                type: 'move',
                battleResult: null,
                eliminatedCards: []
            };

            // 如果目标位置有敌方卡牌，触发战斗
            if (targetCard && targetCard.isRevealed && targetCard.faction !== movingCard.faction) {
                const battleResult = this.battleResolver.resolveBattle(movingCard, targetCard);
                moveResult.type = 'battle';
                moveResult.battleResult = battleResult;
                
                // 处理战斗结果
                this.processBattleResult(battleResult, fromRow, fromCol, toRow, toCol);
                moveResult.eliminatedCards = battleResult.eliminatedCards.map(card => card.id);
            } else {
                // 普通移动
                this.gameState.removeCardAt(fromRow, fromCol);
                this.gameState.placeCard(movingCard, toRow, toCol);
            }

            // 记录移动日志
            this.gameState.addLogEntry('move', expectedPlayer, '移动卡牌', {
                from: { row: fromRow, col: fromCol },
                to: { row: toRow, col: toCol },
                cardId: movingCard.id,
                moveType: moveResult.type,
                battleResult: moveResult.battleResult
            });

            // 清除选择
            this.gameState.selectedPosition = null;

            // 检查胜负
            const winCheck = this.checkWinCondition();
            if (winCheck.isGameOver) {
                this.endGame(winCheck.winner, winCheck.reason);
            } else {
                // 切换回合
                this.gameState.switchPlayer();
            }

            const result = {
                success: true,
                data: {
                    moveType: moveResult.type,
                    battleResult: moveResult.battleResult,
                    eliminatedCards: moveResult.eliminatedCards,
                    gameState: this.gameState.clone(),
                    isGameOver: winCheck.isGameOver,
                    winner: winCheck.winner
                },
                message: moveResult.type === 'battle' ? 
                    `${movingCard.name} 攻击 ${targetCard.name}` : 
                    `${movingCard.name} 移动到新位置`
            };

            this.emit('cardMoved', result.data);

            return result;
        } catch (error) {
            return this.createError('MOVE_CARD_FAILED', { originalError: error.message });
        }
    }

    /**
     * 处理战斗结果
     * @param {Object} battleResult - 战斗结果
     * @param {number} fromRow - 起始行
     * @param {number} fromCol - 起始列
     * @param {number} toRow - 目标行
     * @param {number} toCol - 目标列
     */
    processBattleResult(battleResult, fromRow, fromCol, toRow, toCol) {
        const { winner, eliminatedCards } = battleResult;

        // 先获取攻击方卡牌，避免被提前移除
        const attackerCard = this.gameState.getCardAt(fromRow, fromCol);

        // 移除被消灭的卡牌
        eliminatedCards.forEach(card => {
            const pos = card.position;
            this.gameState.removeCardAt(pos.row, pos.col);
        });

        // 根据战斗结果处理存活的卡牌
        if (winner === 'attacker') {
            // 攻击方获胜，移动到目标位置
            if (attackerCard && !eliminatedCards.includes(attackerCard)) {
                this.gameState.removeCardAt(fromRow, fromCol);
                this.gameState.placeCard(attackerCard, toRow, toCol);
            }
        } else if (winner === 'defender') {
            // 防守方获胜，攻击方被移除（如果还没被移除）
            if (attackerCard && !eliminatedCards.includes(attackerCard)) {
                this.gameState.removeCardAt(fromRow, fromCol);
            }
        }
        // 如果是平局(draw)，双方都已在eliminatedCards中处理
    }

    /**
     * 获取有效移动位置
     * @param {number} row - 当前行
     * @param {number} col - 当前列
     * @returns {Array} 有效移动位置数组
     */
    getValidMoves(row, col) {
        const validMoves = [];
        const directions = [
            { row: -1, col: 0 }, // 上
            { row: 1, col: 0 },  // 下
            { row: 0, col: -1 }, // 左
            { row: 0, col: 1 }   // 右
        ];

        const movingCard = this.gameState.getCardAt(row, col);
        if (!movingCard || !movingCard.isRevealed) {
            return validMoves;
        }

        directions.forEach(dir => {
            const newRow = row + dir.row;
            const newCol = col + dir.col;

            if (this.isValidMove(row, col, newRow, newCol)) {
                const targetCard = this.gameState.getCardAt(newRow, newCol);
                validMoves.push({
                    row: newRow,
                    col: newCol,
                    type: targetCard ? 
                        (targetCard.isRevealed ? 'battle' : 'blocked') : 'move'
                });
            }
        });

        return validMoves;
    }

    /**
     * 验证移动是否有效
     * @param {number} fromRow - 起始行
     * @param {number} fromCol - 起始列
     * @param {number} toRow - 目标行
     * @param {number} toCol - 目标列
     * @returns {boolean} 是否有效
     */
    isValidMove(fromRow, fromCol, toRow, toCol) {
        // 检查位置有效性
        if (!this.gameState.isValidPosition(fromRow, fromCol) || 
            !this.gameState.isValidPosition(toRow, toCol)) {
            return false;
        }

        // 检查是否为相邻位置（只能移动一格）
        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);
        if ((rowDiff + colDiff) !== 1) {
            return false;
        }

        const movingCard = this.gameState.getCardAt(fromRow, fromCol);
        if (!movingCard || !movingCard.isRevealed) {
            return false;
        }

        const targetCard = this.gameState.getCardAt(toRow, toCol);
        
        // 如果目标位置为空，可以移动
        if (!targetCard) {
            return true;
        }

        // 如果目标位置有未翻开的卡牌，不能移动
        if (!targetCard.isRevealed) {
            return false;
        }

        // 如果目标位置有己方卡牌，不能移动
        if (targetCard.faction === movingCard.faction) {
            return false;
        }

        // 如果目标位置有敌方卡牌，可以攻击
        return true;
    }

    /**
     * 检查胜负条件
     * @returns {Object} 胜负检查结果
     */
    checkWinCondition() {
        return this.gameState.checkWinCondition();
    }

    /**
     * 执行AI回合
     * @returns {Promise<Object>} AI操作结果
     */
    async executeAITurn() {
        if (this.gameState.phase !== 'playing') {
            return this.createError('INVALID_GAME_PHASE');
        }

        if (this.gameState.currentPlayer !== 'ai') {
            return this.createError('NOT_YOUR_TURN');
        }

        try {
            // 执行AI回合
            const aiResult = await this.aiPlayer.executeTurn();
            
            if (!aiResult.success) {
                throw new Error(aiResult.error || 'AI执行失败');
            }

            // 检查胜负
            const winCheck = this.checkWinCondition();
            if (winCheck.isGameOver) {
                this.endGame(winCheck.winner, winCheck.reason);
            }
            // 注意：不需要在这里切换回合，因为具体的操作（如flipCard）已经处理了回合切换

            const result = {
                success: true,
                data: {
                    action: aiResult.action,
                    decision: aiResult.decision,
                    result: aiResult.result,
                    thinkingTime: aiResult.thinkingTime,
                    gameState: this.gameState.clone(),
                    isGameOver: winCheck.isGameOver,
                    winner: winCheck.winner
                },
                message: `AI执行了${aiResult.action === 'flip' ? '翻牌' : '移动'}操作`
            };

            this.emit('aiTurnCompleted', result.data);

            return result;
        } catch (error) {
            return this.createError('AI_TURN_FAILED', { originalError: error.message });
        }
    }

    /**
     * 结束游戏
     * @param {string} winner - 胜者
     * @param {string} reason - 结束原因
     */
    endGame(winner, reason) {
        this.gameState.phase = 'ended';
        this.gameState.winner = winner;
        this.gameState.endTime = new Date().toISOString();

        this.gameState.addLogEntry('game_end', 'system', '游戏结束', {
            winner,
            reason,
            duration: Date.parse(this.gameState.endTime) - Date.parse(this.gameState.startTime)
        });

        this.emit('gameEnded', {
            winner,
            reason,
            gameState: this.gameState.clone()
        });
    }

    /**
     * 重新开始游戏
     * @returns {Object} 重启结果
     */
    restartGame() {
        try {
            const oldGameId = this.gameId;
            const newGameResult = this.startNewGame();
            
            this.emit('gameRestarted', {
                oldGameId,
                newGameId: this.gameId
            });

            return newGameResult;
        } catch (error) {
            return this.createError('RESTART_FAILED', { originalError: error.message });
        }
    }

    /**
     * 保存游戏状态
     * @returns {boolean} 保存是否成功
     */
    saveGameState() {
        try {
            if (typeof localStorage === 'undefined') {
                return false;
            }

            const saveData = {
                gameId: this.gameId,
                gameState: this.gameState.toJSON(),
                battleHistory: this.battleResolver.getBattleHistory(),
                timestamp: new Date().toISOString()
            };

            localStorage.setItem(this.saveKey, JSON.stringify(saveData));
            return true;
        } catch (error) {
            console.warn('保存游戏状态失败:', error);
            return false;
        }
    }

    /**
     * 加载游戏状态
     * @returns {boolean} 加载是否成功
     */
    loadGameState() {
        try {
            if (typeof localStorage === 'undefined') {
                return false;
            }

            const saveData = localStorage.getItem(this.saveKey);
            if (!saveData) {
                return false;
            }

            const parsed = JSON.parse(saveData);
            this.gameId = parsed.gameId;
            this.gameState = GameState.fromJSON(parsed.gameState);
            
            // 恢复战斗历史
            if (parsed.battleHistory) {
                this.battleResolver.battleHistory = parsed.battleHistory;
            }

            this.emit('gameLoaded', {
                gameId: this.gameId,
                gameState: this.gameState.clone()
            });

            return true;
        } catch (error) {
            console.warn('加载游戏状态失败:', error);
            return false;
        }
    }

    /**
     * 生成游戏ID
     * @returns {string} 唯一游戏ID
     */
    generateGameId() {
        return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 创建错误响应
     * @param {string} code - 错误码
     * @param {Object} details - 错误详情
     * @returns {Object} 错误响应
     */
    createError(code, details = {}) {
        return {
            success: false,
            error: {
                code,
                message: this.ERROR_CODES[code] || '未知错误',
                details
            }
        };
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
                    console.error(`事件处理器错误 [${event}]:`, error);
                }
            });
        }
    }

    /**
     * 获取游戏统计信息
     * @returns {Object} 统计信息
     */
    getGameStats() {
        const battleStats = this.battleResolver.getBattleStats();
        const gameTime = this.gameState.endTime ? 
            Date.parse(this.gameState.endTime) - Date.parse(this.gameState.startTime) :
            Date.now() - Date.parse(this.gameState.startTime);

        return {
            gameId: this.gameId,
            phase: this.gameState.phase,
            duration: gameTime,
            turns: this.gameState.gameLog.filter(log => log.type === 'turn_change').length,
            battles: battleStats,
            revealedCards: this.gameState.cardsData.filter(card => card.isRevealed).length,
            totalCards: this.gameState.cardsData.length
        };
    }
}
