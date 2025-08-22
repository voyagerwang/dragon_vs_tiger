/**
 * AIPlayer类 - AI对手
 * 实现智能的游戏AI，能够分析局面、制定策略并执行合理的操作
 */

import { Strategy } from './Strategy.js';

export class AIPlayer {
    constructor(gameEngine, difficulty = 'medium') {
        this.gameEngine = gameEngine;
        this.difficulty = difficulty;
        this.strategy = new Strategy(difficulty);
        
        // AI配置
        this.config = {
            thinkingTime: this.getThinkingTime(difficulty),
            maxDepth: this.getMaxDepth(difficulty),
            randomness: this.getRandomness(difficulty)
        };
        
        // 思考日志
        this.thinkingLog = [];
        this.enableThinkingLog = false;
        
        // 决策历史
        this.decisionHistory = [];
        
        // 性能统计
        this.stats = {
            totalMoves: 0,
            wins: 0,
            losses: 0,
            battles: 0,
            flips: 0
        };
    }

    /**
     * 根据难度获取思考时间
     * @param {string} difficulty - 难度级别
     * @returns {number} 思考时间（毫秒）
     */
    getThinkingTime(difficulty) {
        const times = {
            easy: 800,
            medium: 1200,
            hard: 1800
        };
        return times[difficulty] || times.medium;
    }

    /**
     * 根据难度获取最大搜索深度
     * @param {string} difficulty - 难度级别
     * @returns {number} 最大深度
     */
    getMaxDepth(difficulty) {
        const depths = {
            easy: 2,
            medium: 3,
            hard: 4
        };
        return depths[difficulty] || depths.medium;
    }

    /**
     * 根据难度获取随机性系数
     * @param {string} difficulty - 难度级别
     * @returns {number} 随机性系数
     */
    getRandomness(difficulty) {
        const randomness = {
            easy: 0.3,
            medium: 0.15,
            hard: 0.05
        };
        return randomness[difficulty] || randomness.medium;
    }

    /**
     * 执行AI回合
     * @returns {Promise<Object>} 执行结果
     */
    async executeTurn() {
        this.logThinking('开始AI回合', 'turn_start');
        
        try {
            // 模拟思考时间
            await this.simulateThinking();
            
            // 分析当前局面
            const gameAnalysis = this.analyzeGameState();
            this.logThinking('局面分析完成', 'analysis', gameAnalysis);
            
            // 制定决策
            const decision = this.makeDecision();
            this.logThinking('决策制定完成', 'decision', decision);
            
            // 执行决策
            const result = await this.executeDecision(decision);
            
            // 更新统计信息
            this.updateStats(decision, result);
            
            // 记录决策历史
            this.decisionHistory.push({
                timestamp: new Date().toISOString(),
                gameState: this.gameEngine.gameState.clone(),
                decision,
                result
            });
            
            this.logThinking('AI回合完成', 'turn_end', result);
            
            return {
                success: true,
                action: decision.action,
                decision,
                result,
                thinkingTime: this.config.thinkingTime
            };
            
        } catch (error) {
            console.error('AI执行回合失败:', error);
            return {
                success: false,
                error: error.message,
                action: 'error'
            };
        }
    }

    /**
     * 模拟思考时间
     * @returns {Promise} 思考完成Promise
     */
    async simulateThinking() {
        const actualTime = this.config.thinkingTime + 
            (Math.random() - 0.5) * 400; // ±200ms随机变化
        
        return new Promise(resolve => {
            setTimeout(resolve, Math.max(500, actualTime));
        });
    }

    /**
     * 分析游戏状态
     * @returns {Object} 局面分析结果
     */
    analyzeGameState() {
        const gameState = this.gameEngine.gameState;
        
        // 基础信息
        const analysis = {
            phase: gameState.phase,
            currentPlayer: gameState.currentPlayer,
            playerFaction: gameState.playerFaction,
            aiFaction: gameState.aiFaction,
            unrevealedCards: this.countUnrevealedCards(),
            playerCards: this.countPlayerCards('player'),
            aiCards: this.countPlayerCards('ai'),
            canFlip: this.canFlipCards(),
            canMove: this.canMoveCards()
        };
        
        // 威胁分析
        analysis.threats = this.analyzeThreats();
        analysis.opportunities = this.analyzeOpportunities();
        
        // 位置评估
        analysis.positionAdvantage = this.evaluatePositionAdvantage();
        analysis.materialAdvantage = this.evaluateMaterialAdvantage();
        
        return analysis;
    }

    /**
     * 制定AI决策
     * @returns {Object} 决策结果
     */
    makeDecision() {
        const gameState = this.gameEngine.gameState;
        
        // 检查游戏状态
        if (gameState.phase !== 'playing' || gameState.currentPlayer !== 'ai') {
            return {
                action: 'wait',
                reason: '无可用操作',
                confidence: 1.0
            };
        }
        
        // 检查是否有AI的已翻开卡牌可以移动
        const aiCards = this.getAIRevealedCards();
        
        if (aiCards.length > 0) {
            // 评估移动选项
            const moveOptions = this.evaluateMoveOptions();
            
            if (moveOptions.length > 0) {
                // 选择最佳移动
                const bestMove = this.selectBestMove(moveOptions);
                return {
                    action: 'move',
                    from: bestMove.from,
                    to: bestMove.to,
                    confidence: bestMove.confidence,
                    reasoning: bestMove.reasoning
                };
            }
        }
        
        // 没有可移动的卡牌，选择翻牌
        const flipPosition = this.chooseFlipPosition();
        return {
            action: 'flip',
            position: flipPosition,
            confidence: this.calculateFlipConfidence(flipPosition),
            reasoning: this.getFlipReasoning(flipPosition)
        };
    }

    /**
     * 选择翻牌位置
     * @returns {Object} 翻牌位置
     */
    chooseFlipPosition() {
        const gameState = this.gameEngine.gameState;
        const availablePositions = [];
        
        // 收集所有可翻牌的位置
        for (let row = 0; row < 5; row++) {
            if (row === 2) continue; // 跳过空行
            
            for (let col = 0; col < 4; col++) {
                const card = gameState.getCardAt(row, col);
                if (card && !card.isRevealed) {
                    availablePositions.push({
                        row,
                        col,
                        value: this.calculatePositionValue(row, col)
                    });
                }
            }
        }
        
        if (availablePositions.length === 0) {
            throw new Error('没有可翻牌的位置');
        }
        
        // 根据策略选择位置
        return this.strategy.selectFlipPosition(availablePositions);
    }

    /**
     * 计算位置价值
     * @param {number} row - 行
     * @param {number} col - 列
     * @returns {number} 位置价值
     */
    calculatePositionValue(row, col) {
        let value = 0;
        
        // 基础位置价值（中心位置更有价值）
        const centerRow = 2;
        const centerCol = 1.5;
        const distanceFromCenter = Math.sqrt(
            Math.pow(row - centerRow, 2) + Math.pow(col - centerCol, 2)
        );
        value += Math.max(0, 3 - distanceFromCenter);
        
        // 边缘位置稍有优势（便于逃跑）
        if (row === 0 || row === 4 || col === 0 || col === 3) {
            value += 0.5;
        }
        
        // 角落位置略有不利
        if ((row === 0 || row === 4) && (col === 0 || col === 3)) {
            value -= 0.3;
        }
        
        // 考虑周围已翻开的卡牌
        const surroundingCards = this.getAdjacentCards(row, col);
        const revealedAdjacent = surroundingCards.filter(card => card && card.isRevealed);
        
        // 已翻开卡牌越多，信息价值越高
        value += revealedAdjacent.length * 0.2;
        
        // 考虑安全性
        const enemyThreats = this.countEnemyThreatsAt(row, col);
        value -= enemyThreats * 0.3;
        
        return value;
    }

    /**
     * 评估移动选项
     * @returns {Array} 移动选项数组
     */
    evaluateMoveOptions() {
        const aiCards = this.getAIRevealedCards();
        const allMoves = [];
        
        aiCards.forEach(card => {
            const validMoves = this.gameEngine.getValidMoves(
                card.position.row, 
                card.position.col
            );
            
            validMoves.forEach(move => {
                const evaluation = this.evaluateMove(card, move);
                allMoves.push({
                    from: card.position,
                    to: { row: move.row, col: move.col },
                    card: card,
                    type: move.type,
                    score: evaluation.score,
                    confidence: evaluation.confidence,
                    reasoning: evaluation.reasoning,
                    canWin: evaluation.canWin,
                    isSpecialRule: evaluation.isSpecialRule
                });
            });
        });
        
        // 按评分排序
        return allMoves.sort((a, b) => b.score - a.score);
    }

    /**
     * 评估单个移动
     * @param {Card} card - 移动的卡牌
     * @param {Object} move - 移动信息
     * @returns {Object} 评估结果
     */
    evaluateMove(card, move) {
        const simulation = this.simulateMove(
            card.position, 
            { row: move.row, col: move.col }
        );
        
        let score = 0;
        let confidence = 0.5;
        let reasoning = [];
        let canWin = false;
        let isSpecialRule = false;
        
        if (move.type === 'battle') {
            const targetCard = this.gameEngine.gameState.getCardAt(move.row, move.col);
            
            if (targetCard && targetCard.isRevealed) {
                // 计算战斗结果
                const battleResult = card.battleWith(targetCard);
                
                if (battleResult === 'win') {
                    score += 10 + targetCard.level; // 基础分 + 目标等级
                    confidence = 0.9;
                    reasoning.push(`击败${targetCard.name}(${targetCard.level}级)`);
                    canWin = true;
                    
                    // 检查特殊规则
                    if ((card.id === 'tiger_8' && targetCard.id === 'dragon_1') ||
                        (card.id === 'dragon_8' && targetCard.id === 'tiger_1')) {
                        score += 15; // 特殊规则额外奖励
                        reasoning.push('触发特殊规则');
                        isSpecialRule = true;
                    }
                    
                } else if (battleResult === 'lose') {
                    score -= 15 + card.level; // 重大损失
                    confidence = 0.1;
                    reasoning.push(`会被${targetCard.name}击败`);
                    
                } else { // draw
                    score += targetCard.level - card.level; // 相对价值
                    confidence = 0.6;
                    reasoning.push('同归于尽');
                }
            }
        } else {
            // 普通移动
            score += this.calculatePositionValue(move.row, move.col);
            score += this.calculateSafetyValue(move.row, move.col);
            confidence = 0.7;
            reasoning.push('安全移动');
        }
        
        // 加入随机性
        if (Math.random() < this.config.randomness) {
            score += (Math.random() - 0.5) * 2;
            reasoning.push('随机调整');
        }
        
        return {
            score,
            confidence,
            reasoning: reasoning.join(', '),
            canWin,
            isSpecialRule
        };
    }

    /**
     * 选择最佳移动
     * @param {Array} moveOptions - 移动选项
     * @returns {Object} 最佳移动
     */
    selectBestMove(moveOptions) {
        if (moveOptions.length === 0) {
            throw new Error('没有可用的移动选项');
        }
        
        // 优先选择能获胜的攻击
        const winningAttacks = moveOptions.filter(move => move.canWin);
        if (winningAttacks.length > 0) {
            return this.strategy.selectFromWinningMoves(winningAttacks);
        }
        
        // 其次选择高分移动
        const topMoves = moveOptions.slice(0, 3); // 前3个最高分
        return this.strategy.selectFromTopMoves(topMoves);
    }

    /**
     * 查找必胜攻击
     * @returns {Array} 必胜攻击列表
     */
    findWinningAttacks() {
        const moveOptions = this.evaluateMoveOptions();
        return moveOptions.filter(move => 
            move.type === 'battle' && move.canWin
        );
    }

    /**
     * 查找安全移动
     * @returns {Array} 安全移动列表
     */
    findSafeMoves() {
        const moveOptions = this.evaluateMoveOptions();
        return moveOptions.filter(move => 
            move.type === 'move' || (move.type === 'battle' && move.canWin)
        );
    }

    /**
     * 查找特殊规则机会
     * @returns {Array} 特殊规则机会列表
     */
    findSpecialRuleOpportunities() {
        const moveOptions = this.evaluateMoveOptions();
        return moveOptions.filter(move => move.isSpecialRule);
    }

    /**
     * 模拟移动结果
     * @param {Object} from - 起始位置
     * @param {Object} to - 目标位置
     * @returns {Object} 模拟结果
     */
    simulateMove(from, to) {
        const gameState = this.gameEngine.gameState;
        const movingCard = gameState.getCardAt(from.row, from.col);
        const targetCard = gameState.getCardAt(to.row, to.col);
        
        if (!movingCard) {
            return {
                isValid: false,
                reason: '起始位置没有卡牌'
            };
        }
        
        // 检查移动有效性
        const isValid = this.gameEngine.isValidMove(
            from.row, from.col, to.row, to.col
        );
        
        if (!isValid) {
            return {
                isValid: false,
                reason: '无效移动'
            };
        }
        
        let outcome = 'move';
        let score = 0;
        
        if (targetCard && targetCard.isRevealed) {
            // 战斗模拟
            const battleResult = movingCard.battleWith(targetCard);
            
            if (battleResult === 'win') {
                outcome = 'win';
                score = 10 + targetCard.level;
            } else if (battleResult === 'lose') {
                outcome = 'lose';
                score = -(10 + movingCard.level);
            } else {
                outcome = 'draw';
                score = targetCard.level - movingCard.level;
            }
        } else {
            // 普通移动
            score = this.calculatePositionValue(to.row, to.col);
        }
        
        return {
            isValid: true,
            moveType: targetCard ? 'battle' : 'move',
            outcome,
            score,
            battleResult: targetCard ? {
                attacker: movingCard.toJSON(),
                defender: targetCard.toJSON(),
                winner: outcome
            } : null
        };
    }

    /**
     * 执行决策
     * @param {Object} decision - 决策对象
     * @returns {Promise<Object>} 执行结果
     */
    async executeDecision(decision) {
        switch (decision.action) {
            case 'flip':
                return this.gameEngine.flipCard(
                    decision.position.row, 
                    decision.position.col
                );
                
            case 'move':
                return this.gameEngine.moveCard(
                    decision.from.row, 
                    decision.from.col,
                    decision.to.row, 
                    decision.to.col
                );
                
            case 'wait':
                return {
                    success: true,
                    message: 'AI选择等待',
                    action: 'wait'
                };
                
            default:
                throw new Error(`未知的AI动作: ${decision.action}`);
        }
    }

    /**
     * 获取AI的已翻开卡牌
     * @returns {Array} AI卡牌数组
     */
    getAIRevealedCards() {
        const gameState = this.gameEngine.gameState;
        const aiFaction = gameState.aiFaction;
        
        if (!aiFaction) return [];
        
        return gameState.cardsData.filter(card => 
            card.isRevealed && 
            card.faction === aiFaction &&
            card.position.row >= 0 && 
            card.position.col >= 0
        );
    }

    /**
     * 计算未翻开卡牌数量
     * @returns {number} 未翻开卡牌数量
     */
    countUnrevealedCards() {
        return this.gameEngine.gameState.cardsData.filter(card => !card.isRevealed).length;
    }

    /**
     * 计算指定玩家的卡牌数量
     * @param {string} player - 玩家类型
     * @returns {number} 卡牌数量
     */
    countPlayerCards(player) {
        const gameState = this.gameEngine.gameState;
        const faction = player === 'player' ? gameState.playerFaction : gameState.aiFaction;
        
        if (!faction) return 0;
        
        return gameState.cardsData.filter(card => 
            card.isRevealed && card.faction === faction
        ).length;
    }

    /**
     * 检查是否可以翻牌
     * @returns {boolean} 是否可以翻牌
     */
    canFlipCards() {
        const gameState = this.gameEngine.gameState;
        
        for (let row = 0; row < 5; row++) {
            if (row === 2) continue;
            
            for (let col = 0; col < 4; col++) {
                const card = gameState.getCardAt(row, col);
                if (card && !card.isRevealed) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * 检查是否可以移动卡牌
     * @returns {boolean} 是否可以移动
     */
    canMoveCards() {
        const aiCards = this.getAIRevealedCards();
        
        return aiCards.some(card => {
            const validMoves = this.gameEngine.getValidMoves(
                card.position.row, 
                card.position.col
            );
            return validMoves.length > 0;
        });
    }

    /**
     * 分析威胁
     * @returns {Array} 威胁列表
     */
    analyzeThreats() {
        const threats = [];
        const gameState = this.gameEngine.gameState;
        const playerFaction = gameState.playerFaction;
        
        if (!playerFaction) return threats;
        
        // 查找玩家可以攻击的AI卡牌
        gameState.cardsData.forEach(playerCard => {
            if (playerCard.isRevealed && playerCard.faction === playerFaction) {
                const validMoves = this.gameEngine.getValidMoves(
                    playerCard.position.row,
                    playerCard.position.col
                );
                
                validMoves.forEach(move => {
                    if (move.type === 'battle') {
                        const targetCard = gameState.getCardAt(move.row, move.col);
                        if (targetCard && targetCard.faction === gameState.aiFaction) {
                            const battleResult = playerCard.battleWith(targetCard);
                            if (battleResult === 'win') {
                                threats.push({
                                    type: 'attack_threat',
                                    attacker: playerCard,
                                    target: targetCard,
                                    severity: targetCard.level
                                });
                            }
                        }
                    }
                });
            }
        });
        
        return threats;
    }

    /**
     * 分析机会
     * @returns {Array} 机会列表
     */
    analyzeOpportunities() {
        const opportunities = [];
        const aiCards = this.getAIRevealedCards();
        
        aiCards.forEach(aiCard => {
            const validMoves = this.gameEngine.getValidMoves(
                aiCard.position.row,
                aiCard.position.col
            );
            
            validMoves.forEach(move => {
                if (move.type === 'battle') {
                    const targetCard = this.gameEngine.gameState.getCardAt(move.row, move.col);
                    if (targetCard && targetCard.isRevealed) {
                        const battleResult = aiCard.battleWith(targetCard);
                        if (battleResult === 'win') {
                            opportunities.push({
                                type: 'attack_opportunity',
                                attacker: aiCard,
                                target: targetCard,
                                value: targetCard.level,
                                isSpecialRule: this.isSpecialRule(aiCard, targetCard)
                            });
                        }
                    }
                }
            });
        });
        
        return opportunities;
    }

    /**
     * 检查是否为特殊规则
     * @param {Card} attacker - 攻击方
     * @param {Card} defender - 防守方
     * @returns {boolean} 是否为特殊规则
     */
    isSpecialRule(attacker, defender) {
        return (attacker.id === 'tiger_8' && defender.id === 'dragon_1') ||
               (attacker.id === 'dragon_8' && defender.id === 'tiger_1');
    }

    /**
     * 评估位置优势
     * @returns {number} 位置优势值
     */
    evaluatePositionAdvantage() {
        const gameState = this.gameEngine.gameState;
        const aiCards = this.getAIRevealedCards();
        const playerCards = gameState.getRevealedCards('player');
        
        let aiPositionValue = 0;
        let playerPositionValue = 0;
        
        aiCards.forEach(card => {
            aiPositionValue += this.calculatePositionValue(
                card.position.row, 
                card.position.col
            );
        });
        
        playerCards.forEach(card => {
            playerPositionValue += this.calculatePositionValue(
                card.position.row, 
                card.position.col
            );
        });
        
        return aiPositionValue - playerPositionValue;
    }

    /**
     * 评估物质优势
     * @returns {number} 物质优势值
     */
    evaluateMaterialAdvantage() {
        const gameState = this.gameEngine.gameState;
        const aiCards = this.getAIRevealedCards();
        const playerCards = gameState.getRevealedCards('player');
        
        const aiValue = aiCards.reduce((sum, card) => sum + card.level, 0);
        const playerValue = playerCards.reduce((sum, card) => sum + card.level, 0);
        
        return aiValue - playerValue;
    }

    /**
     * 获取相邻卡牌
     * @param {number} row - 行
     * @param {number} col - 列
     * @returns {Array} 相邻卡牌数组
     */
    getAdjacentCards(row, col) {
        const gameState = this.gameEngine.gameState;
        const adjacent = [];
        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1]
        ];
        
        directions.forEach(([dr, dc]) => {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (gameState.isValidPosition(newRow, newCol)) {
                adjacent.push(gameState.getCardAt(newRow, newCol));
            }
        });
        
        return adjacent;
    }

    /**
     * 计算位置的敌方威胁数量
     * @param {number} row - 行
     * @param {number} col - 列
     * @returns {number} 威胁数量
     */
    countEnemyThreatsAt(row, col) {
        const gameState = this.gameEngine.gameState;
        const playerFaction = gameState.playerFaction;
        let threats = 0;
        
        if (!playerFaction) return threats;
        
        const adjacent = this.getAdjacentCards(row, col);
        adjacent.forEach(card => {
            if (card && card.isRevealed && card.faction === playerFaction) {
                threats++;
            }
        });
        
        return threats;
    }

    /**
     * 计算安全价值
     * @param {number} row - 行
     * @param {number} col - 列
     * @returns {number} 安全价值
     */
    calculateSafetyValue(row, col) {
        const threats = this.countEnemyThreatsAt(row, col);
        const escapeRoutes = this.countEscapeRoutes(row, col);
        
        return escapeRoutes - threats * 2;
    }

    /**
     * 计算逃跑路线数量
     * @param {number} row - 行
     * @param {number} col - 列
     * @returns {number} 逃跑路线数量
     */
    countEscapeRoutes(row, col) {
        const gameState = this.gameEngine.gameState;
        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1]
        ];
        let routes = 0;
        
        directions.forEach(([dr, dc]) => {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (gameState.isValidPosition(newRow, newCol)) {
                const card = gameState.getCardAt(newRow, newCol);
                if (!card || !card.isRevealed) {
                    routes++;
                }
            }
        });
        
        return routes;
    }

    /**
     * 计算翻牌信心度
     * @param {Object} position - 翻牌位置
     * @returns {number} 信心度
     */
    calculateFlipConfidence(position) {
        const value = this.calculatePositionValue(position.row, position.col);
        return Math.min(0.9, 0.5 + value * 0.1);
    }

    /**
     * 获取翻牌推理
     * @param {Object} position - 翻牌位置
     * @returns {string} 推理说明
     */
    getFlipReasoning(position) {
        const value = this.calculatePositionValue(position.row, position.col);
        
        if (value > 2.5) {
            return '选择高价值位置';
        } else if (value > 1.5) {
            return '选择较好位置';
        } else {
            return '随机探索';
        }
    }

    /**
     * 记录思考日志
     * @param {string} message - 日志消息
     * @param {string} step - 思考步骤
     * @param {Object} data - 额外数据
     */
    logThinking(message, step, data = {}) {
        if (!this.enableThinkingLog) return;
        
        this.thinkingLog.push({
            timestamp: new Date().toISOString(),
            step,
            message,
            analysis: data
        });
    }

    /**
     * 获取思考日志
     * @returns {Array} 思考日志
     */
    getThinkingLog() {
        return [...this.thinkingLog];
    }

    /**
     * 清空思考日志
     */
    clearThinkingLog() {
        this.thinkingLog = [];
    }

    /**
     * 更新统计信息
     * @param {Object} decision - 决策
     * @param {Object} result - 结果
     */
    updateStats(decision, result) {
        this.stats.totalMoves++;
        
        if (decision.action === 'flip') {
            this.stats.flips++;
        } else if (decision.action === 'move' && result.data?.moveType === 'battle') {
            this.stats.battles++;
        }
    }

    /**
     * 获取AI统计信息
     * @returns {Object} 统计信息
     */
    getStats() {
        return {
            ...this.stats,
            winRate: this.stats.totalMoves > 0 ? 
                this.stats.wins / this.stats.totalMoves : 0,
            difficulty: this.difficulty,
            totalDecisions: this.decisionHistory.length
        };
    }

    /**
     * 重置AI状态
     */
    reset() {
        this.thinkingLog = [];
        this.decisionHistory = [];
        this.stats = {
            totalMoves: 0,
            wins: 0,
            losses: 0,
            battles: 0,
            flips: 0
        };
    }
}
