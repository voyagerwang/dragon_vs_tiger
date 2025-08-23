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
     * @returns {Object} 分析结果
     */
    analyzeGameState() {
        const gameState = this.gameEngine.gameState;
        const revealedCards = gameState.cardsData.filter(card => card.isRevealed);
        const aiCards = revealedCards.filter(card => card.owner === 'ai');
        const playerCards = revealedCards.filter(card => card.owner === 'player');
        const neutralCards = revealedCards.filter(card => !card.owner);
        
        // 计算材料优势
        const materialAdvantage = this.evaluateMaterialAdvantage();
        
        // 计算位置优势
        const positionAdvantage = this.evaluatePositionAdvantage();
        
        // 计算控制区域
        const controlAnalysis = this.analyzeControl();
        
        return {
            revealedCards,
            aiCards,
            playerCards,
            neutralCards,
            materialAdvantage,
            positionAdvantage,
            controlAnalysis,
            totalCards: gameState.cardsData.length,
            revealedCount: revealedCards.length,
            aiCount: aiCards.length,
            playerCount: playerCards.length
        };
    }
    
    /**
     * 评估材料优势
     * @returns {number} 材料优势值 (-1 到 1)
     */
    evaluateMaterialAdvantage() {
        const gameState = this.gameEngine.gameState;
        const aiCards = gameState.cardsData.filter(card => card.isRevealed && card.owner === 'ai');
        const playerCards = gameState.cardsData.filter(card => card.isRevealed && card.owner === 'player');
        
        if (aiCards.length === 0 && playerCards.length === 0) {
            return 0;
        }
        
        let aiValue = 0;
        let playerValue = 0;
        
        // 计算AI卡牌总价值（等级越低越强）
        for (const card of aiCards) {
            aiValue += (9 - card.level);
        }
        
        // 计算玩家卡牌总价值
        for (const card of playerCards) {
            playerValue += (9 - card.level);
        }
        
        const totalValue = aiValue + playerValue;
        if (totalValue === 0) return 0;
        
        return (aiValue - playerValue) / totalValue;
    }
    
    /**
     * 评估位置优势
     * @returns {number} 位置优势值 (-1 到 1)
     */
    evaluatePositionAdvantage() {
        const gameState = this.gameEngine.gameState;
        const aiCards = gameState.cardsData.filter(card => card.isRevealed && card.owner === 'ai');
        const playerCards = gameState.cardsData.filter(card => card.isRevealed && card.owner === 'player');
        
        if (aiCards.length === 0 && playerCards.length === 0) {
            return 0;
        }
        
        let aiPositionValue = 0;
        let playerPositionValue = 0;
        
        // 计算AI卡牌位置价值
        for (const card of aiCards) {
            aiPositionValue += this.evaluatePositionValue(card.position);
        }
        
        // 计算玩家卡牌位置价值
        for (const card of playerCards) {
            playerPositionValue += this.evaluatePositionValue(card.position);
        }
        
        const totalPositionValue = aiPositionValue + playerPositionValue;
        if (totalPositionValue === 0) return 0;
        
        return (aiPositionValue - playerPositionValue) / totalPositionValue;
    }
    
    /**
     * 分析控制区域
     * @returns {Object} 控制分析结果
     */
    analyzeControl() {
        const gameState = this.gameEngine.gameState;
        const aiCards = gameState.cardsData.filter(card => card.isRevealed && card.owner === 'ai');
        const playerCards = gameState.cardsData.filter(card => card.isRevealed && card.owner === 'player');
        
        // 分析第三行控制
        const row2Cards = gameState.cardsData.filter(card => 
            card.isRevealed && card.position.row === 2
        );
        
        const aiRow2Count = row2Cards.filter(card => card.owner === 'ai').length;
        const playerRow2Count = row2Cards.filter(card => card.owner === 'player').length;
        
        return {
            row2Control: {
                ai: aiRow2Count,
                player: playerRow2Count,
                advantage: aiRow2Count - playerRow2Count
            },
            totalControl: {
                ai: aiCards.length,
                player: playerCards.length,
                advantage: aiCards.length - playerCards.length
            }
        };
    }

    /**
     * 制定AI决策
     * @returns {Object} 决策对象
     */
    makeDecision() {
        this.logThinking('开始制定决策', 'decision_start');
        
        try {
            const gameState = this.gameEngine.gameState;
            const aiFaction = gameState.aiFaction;
            
            if (!aiFaction) {
                this.logThinking('AI阵营未确定，优先翻牌', 'faction_unknown');
                return this.makeFlipDecision();
            }
            
            // 分析当前局面
            const analysis = this.analyzeGameState();
            this.logThinking('局面分析结果', 'analysis_result', analysis);
            
            // 智能策略选择
            const strategy = this.selectStrategy(analysis);
            this.logThinking('选择策略', 'strategy_selection', strategy);
            
            // 根据策略制定决策
            let decision;
            switch (strategy) {
                case 'flip':
                case 'info':
                case 'gamble':
                    decision = this.makeFlipDecision();
                    break;
                case 'attack':
                case 'expand':
                case 'desperate':
                    decision = this.makeAttackDecision();
                    break;
                case 'move':
                case 'control':
                    decision = this.makeMoveDecision();
                    break;
                case 'defend':
                case 'counter':
                    decision = this.makeDefendDecision();
                    break;
                default:
                    decision = this.makeFlipDecision();
            }
            
            this.logThinking('决策制定完成', 'decision_complete', decision);
            return decision;
            
        } catch (error) {
            this.logThinking('决策制定出错', 'decision_error', error);
            console.error('AI决策制定错误:', error);
            // 降级到基础翻牌策略
            return this.makeFlipDecision();
        }
    }
    
    /**
     * 智能选择策略 - 基于动态力量博弈
     * @param {Object} analysis - 局面分析结果
     * @returns {string} 策略类型
     */
    selectStrategy(analysis) {
        const { revealedCards, aiCards, playerCards, materialAdvantage, positionAdvantage, controlAnalysis } = analysis;
        
        // 如果AI阵营未确定，优先翻牌
        if (!this.gameEngine.gameState.aiFaction) {
            return 'flip';
        }
        
        // 动态策略选择 - 基于力量博弈
        const strategy = this.selectStrategyByPowerMatrix(analysis);
        
        this.logThinking('动态策略选择', 'strategy_selection', {
            strategy,
            analysis: {
                materialAdvantage,
                positionAdvantage,
                aiCardsCount: aiCards.length,
                playerCardsCount: playerCards.length
            }
        });
        
        return strategy;
    }

    /**
     * 基于力量矩阵选择策略
     */
    selectStrategyByPowerMatrix(analysis) {
        const { aiCards, playerCards, materialAdvantage, positionAdvantage } = analysis;
        
        // 计算综合力量对比
        const powerAnalysis = this.analyzePowerBalance(aiCards, playerCards);
        const positionAnalysis = this.analyzePositionControl();
        const informationValue = this.calculateInformationValue();
        
        // 动态策略选择矩阵
        const strategy = this.selectStrategyByMatrix(powerAnalysis, positionAnalysis, informationValue);
        
        this.logThinking('策略矩阵选择', 'strategy_matrix', {
            strategy,
            powerAnalysis,
            positionAnalysis,
            informationValue
        });
        
        return strategy;
    }

    /**
     * 分析力量平衡
     */
    analyzePowerBalance(aiCards, playerCards) {
        const aiPower = this.calculateComprehensivePower(aiCards, 'ai');
        const playerPower = this.calculateComprehensivePower(playerCards, 'player');
        const powerDiff = aiPower.total - playerPower.total;
        
        return {
            aiPower: aiPower.total,
            playerPower: playerPower.total,
            powerDiff,
            aiAdvantage: powerDiff > 0,
            advantageLevel: this.getAdvantageLevel(powerDiff),
            aiHighValueCards: aiCards.filter(card => card.level <= 3).length,
            playerHighValueCards: playerCards.filter(card => card.level <= 3).length,
            aiCardCount: aiCards.length,
            playerCardCount: playerCards.length
        };
    }

    /**
     * 计算综合力量值
     */
    calculateComprehensivePower(cards, owner) {
        let totalPower = 0;
        let positionBonus = 0;
        let survivalBonus = 0;
        
        cards.forEach(card => {
            const baseValue = 9 - card.level; // 1级最强，8级最弱
            const positionValue = this.getPositionValue(card.position);
            const survivalValue = this.getSurvivalValue(card, owner);
            
            totalPower += baseValue * positionValue * survivalValue;
            positionBonus += positionValue;
            survivalBonus += survivalValue;
        });
        
        return {
            total: totalPower,
            base: cards.reduce((sum, card) => sum + (9 - card.level), 0),
            positionBonus,
            survivalBonus,
            count: cards.length
        };
    }

    /**
     * 获取位置价值
     */
    getPositionValue(position) {
        const { row, col } = position;
        
        // 中心4格价值最高
        if (row >= 1 && row <= 3 && col >= 1 && col <= 2) {
            return 1.2;
        }
        // 第3行通道位置
        else if (row === 2) {
            return 1.0;
        }
        // 次要通道
        else if ((row === 1 || row === 3) && (col === 1 || col === 2)) {
            return 0.9;
        }
        // 边缘位置
        else {
            return 0.8;
        }
    }

    /**
     * 获取生存价值
     */
    getSurvivalValue(card, owner) {
        const threats = this.getThreatsToCard(card, owner);
        const threatLevel = threats.reduce((sum, threat) => sum + threat.level, 0);
        return Math.max(0.3, 1 - (threatLevel * 0.1));
    }

    /**
     * 获取威胁到指定卡牌的敌方卡牌
     */
    getThreatsToCard(targetCard, owner) {
        const gameState = this.gameEngine.gameState;
        const enemyCards = gameState.cardsData.filter(card => 
            card.owner && card.owner !== owner && card.isRevealed
        );
        
        return enemyCards.filter(enemyCard => {
            const distance = this.getDistance(targetCard.position, enemyCard.position);
            return distance === 1; // 相邻位置
        });
    }

    /**
     * 计算位置控制优势
     */
    analyzePositionControl() {
        const gameState = this.gameEngine.gameState;
        const centerPositions = [
            {row: 1, col: 1}, {row: 1, col: 2},
            {row: 2, col: 1}, {row: 2, col: 2}
        ];
        
        let aiControl = 0;
        let playerControl = 0;
        
        centerPositions.forEach(pos => {
            const card = gameState.getCardAt(pos.row, pos.col);
            if (card) {
                if (card.owner === 'ai') aiControl++;
                else if (card.owner === 'player') playerControl++;
            }
        });
        
        const totalControl = aiControl + playerControl;
        if (totalControl === 0) return 0;
        
        return (aiControl - playerControl) / totalControl;
    }

    /**
     * 计算信息价值
     */
    calculateInformationValue() {
        const gameState = this.gameEngine.gameState;
        const revealedCount = gameState.cardsData.filter(card => card.isRevealed).length;
        const totalCards = gameState.cardsData.length;
        const revealedRatio = revealedCount / totalCards;
        
        // 游戏早期信息价值高，后期信息价值低
        if (revealedRatio < 0.3) return 0.8;      // 开局阶段
        else if (revealedRatio < 0.6) return 0.6; // 中局阶段
        else if (revealedRatio < 0.8) return 0.4; // 残局阶段
        else return 0.2;                           // 终局阶段
    }

    /**
     * 根据矩阵选择策略
     */
    selectStrategyByMatrix(powerAnalysis, positionAnalysis, informationValue) {
        const { advantageLevel, powerDiff } = powerAnalysis;
        const positionAdvantage = positionAnalysis;
        
        // 策略选择矩阵
        if (advantageLevel === 'significant') {
            if (positionAdvantage > 0.3) return 'control';    // 稳健控场
            else return 'expand';                              // 积极扩张
        }
        else if (advantageLevel === 'slight') {
            if (positionAdvantage > 0.2) return 'defend';     // 保守防守
            else return 'flip';                               // 谨慎翻牌
        }
        else if (advantageLevel === 'even') {
            if (positionAdvantage > 0.1) return 'control';    // 位置控制
            else return 'info';                               // 信息战
        }
        else if (advantageLevel === 'behind') {
            if (positionAdvantage > 0.2) return 'counter';    // 防守反击
            else return 'gamble';                             // 冒险翻牌
        }
        else { // significantly_behind
            return 'desperate';                               // 孤注一掷
        }
    }

    /**
     * 获取优势等级
     */
    getAdvantageLevel(powerDiff) {
        if (powerDiff > 8) return 'significant';
        else if (powerDiff > 3) return 'slight';
        else if (powerDiff > -3) return 'even';
        else if (powerDiff > -8) return 'behind';
        else return 'significantly_behind';
    }

    /**
     * 计算两点间距离
     */
    getDistance(pos1, pos2) {
        return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
    }
    
    /**
     * 检查是否有必胜攻击机会
     * @returns {boolean} 是否有必胜攻击
     */
    hasWinningAttack() {
        const gameState = this.gameEngine.gameState;
        const aiCards = gameState.cardsData.filter(card => 
            card.isRevealed && card.owner === 'ai'
        );
        const playerCards = gameState.cardsData.filter(card => 
            card.isRevealed && card.owner === 'player'
        );
        
        for (const aiCard of aiCards) {
            for (const playerCard of playerCards) {
                if (this.isAdjacent(aiCard.position, playerCard.position)) {
                    const battleResult = this.gameEngine.battleResolver.resolveBattle(aiCard, playerCard);
                    if (battleResult === 'win') {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    /**
     * 制定翻牌决策 - 基于期望价值计算
     * @returns {Object} 翻牌决策
     */
    makeFlipDecision() {
        this.logThinking('制定翻牌决策', 'flip_decision_start');
        
        try {
            const gameState = this.gameEngine.gameState;
            const unrevealedCards = gameState.cardsData.filter(card => !card.isRevealed);
            
            if (unrevealedCards.length === 0) {
                this.logThinking('没有未翻开的卡牌', 'flip_no_cards');
                return this.makeMoveDecision();
            }
            
            // 计算每个位置的翻牌期望价值
            const flipPositions = [];
            
            for (const card of unrevealedCards) {
                const expectedValue = this.evaluateFlipPositionAdvanced(card);
                flipPositions.push({
                    card,
                    expectedValue
                });
            }
            
            // 按期望价值排序
            flipPositions.sort((a, b) => b.expectedValue - a.expectedValue);
            
            // 选择最佳翻牌位置
            const bestFlip = flipPositions[0];
            
            this.logThinking('选择翻牌位置', 'flip_position_selected', {
                position: bestFlip.card.position,
                expectedValue: bestFlip.expectedValue,
                cardName: bestFlip.card.name
            });
            
            return {
                action: 'flip',
                position: bestFlip.card.position,
                confidence: Math.min(0.9, bestFlip.expectedValue / 10),
                reasoning: `期望价值: ${bestFlip.expectedValue.toFixed(2)}`
            };
            
        } catch (error) {
            this.logThinking('翻牌决策出错', 'flip_decision_error', error);
            console.error('AI翻牌决策错误:', error);
            // 降级到基础翻牌
            return this.makeBasicFlipDecision();
        }
    }

    /**
     * 基础翻牌决策（降级使用）
     */
    makeBasicFlipDecision() {
        const gameState = this.gameEngine.gameState;
        const unrevealedCards = gameState.cardsData.filter(card => !card.isRevealed);
        
        if (unrevealedCards.length === 0) {
            return this.makeMoveDecision();
        }
        
        // 随机选择一个未翻开的卡牌
        const randomCard = unrevealedCards[Math.floor(Math.random() * unrevealedCards.length)];
        
        return {
            action: 'flip',
            position: randomCard.position,
            confidence: 0.5,
            reasoning: '随机选择翻牌位置'
        };
    }
    
    /**
     * 评估翻牌位置的价值（基础版本）
     * @param {Object} card - 未翻开的卡牌
     * @returns {number} 位置价值
     */
    evaluateFlipPosition(card) {
        let score = 0;
        const { row, col } = card.position;
        
        // 边缘位置优先（便于防守和逃跑）
        if (row === 0 || row === 4 || col === 0 || col === 3) {
            score += 3;
        }
        
        // 第三行附近优先（便于快速进入战场）
        if (row === 1 || row === 3) {
            score += 2;
        }
        
        // 角落位置略有优势
        if ((row === 0 || row === 4) && (col === 0 || col === 3)) {
            score += 1;
        }
        
        // 考虑周围已翻开卡牌的信息价值
        const adjacentCards = this.getAdjacentCards(row, col);
        const revealedAdjacent = adjacentCards.filter(card => card && card.isRevealed);
        score += revealedAdjacent.length * 0.5;
        
        // 考虑安全性（避免被包围）
        const enemyThreats = this.countEnemyThreatsAt(row, col);
        score -= enemyThreats * 0.8;
        
        return score;
    }

    /**
     * 高级翻牌位置评估 - 基于期望价值算法
     */
    evaluateFlipPositionAdvanced(card) {
        const gameState = this.gameEngine.gameState;
        const { row, col } = card.position;
        
        // 基础位置价值
        const positionValue = this.getPositionValue({row, col});
        
        // 计算翻到己方牌的概率和收益
        const aiFaction = gameState.aiFaction;
        const playerFaction = gameState.playerFaction;
        
        if (!aiFaction || !playerFaction) {
            // 阵营未确定时，所有位置价值相等
            return positionValue * 5;
        }
        
        // 计算未知牌中己方和敌方的比例
        const unknownCards = gameState.cardsData.filter(card => !card.isRevealed);
        const unknownAICards = unknownCards.filter(card => card.faction === aiFaction);
        const unknownPlayerCards = unknownCards.filter(card => card.faction === playerFaction);
        
        const aiCardRatio = unknownAICards.length / unknownCards.length;
        const playerCardRatio = unknownPlayerCards.length / unknownCards.length;
        
        // 计算期望价值
        const aiCardExpectedValue = this.calculateExpectedCardValue(unknownAICards, positionValue);
        const playerCardExpectedValue = this.calculateExpectedCardValue(unknownPlayerCards, positionValue);
        
        // 翻牌期望价值 = 己方牌期望收益 - 敌方牌期望损失 + 信息价值
        const expectedValue = aiCardRatio * aiCardExpectedValue - 
                            playerCardRatio * playerCardExpectedValue * 0.8 + 
                            this.calculateInformationValue() * 3;
        
        // 根据当前策略调整权重
        const strategy = this.getCurrentStrategy();
        const strategyMultiplier = this.getStrategyMultiplier(strategy);
        
        return expectedValue * strategyMultiplier;
    }

    /**
     * 计算期望卡牌价值
     */
    calculateExpectedCardValue(cards, positionValue) {
        if (cards.length === 0) return 0;
        
        const totalValue = cards.reduce((sum, card) => {
            const baseValue = 9 - card.level;
            return sum + baseValue * positionValue;
        }, 0);
        
        return totalValue / cards.length;
    }

    /**
     * 获取当前策略
     */
    getCurrentStrategy() {
        // 这里可以根据最近的决策历史推断当前策略
        const recentDecisions = this.decisionHistory.slice(-3);
        const flipCount = recentDecisions.filter(d => d.action === 'flip').length;
        
        if (flipCount >= 2) return 'flip';
        else if (flipCount === 1) return 'mixed';
        else return 'aggressive';
    }

    /**
     * 获取策略乘数
     */
    getStrategyMultiplier(strategy) {
        const multipliers = {
            'flip': 1.2,      // 翻牌策略时提高翻牌价值
            'mixed': 1.0,     // 混合策略时保持原值
            'aggressive': 0.8  // 攻击策略时降低翻牌价值
        };
        return multipliers[strategy] || 1.0;
    }

    /**
     * 获取攻击阈值
     */
    getAttackThreshold(strategy) {
        const thresholds = {
            'flip': 15,        // 翻牌策略时提高攻击门槛
            'mixed': 10,       // 混合策略时保持标准门槛
            'aggressive': 5,   // 攻击策略时降低攻击门槛
            'desperate': 0,    // 孤注一掷时接受任何攻击
            'control': 12,     // 控场策略时适度提高门槛
            'expand': 8,       // 扩张策略时降低门槛
            'defend': 15,      // 防守策略时提高门槛
            'counter': 8,      // 反击策略时降低门槛
            'info': 18,        // 信息战策略时大幅提高门槛
            'gamble': 3        // 冒险策略时大幅降低门槛
        };
        return thresholds[strategy] || 10;
    }
    
    /**
     * 制定攻击决策
     * @returns {Object} 攻击决策
     */
    makeAttackDecision() {
        const gameState = this.gameEngine.gameState;
        const aiCards = gameState.cardsData.filter(card => 
            card.isRevealed && card.owner === 'ai'
        );
        
        if (aiCards.length === 0) {
            this.logThinking('AI没有已翻开的卡牌，无法攻击', 'attack_no_cards');
            return this.makeFlipDecision();
        }
        
        const playerCards = gameState.cardsData.filter(card => 
            card.isRevealed && card.owner === 'player'
        );
        
        if (playerCards.length === 0) {
            this.logThinking('玩家没有已翻开的卡牌，无法攻击', 'attack_no_targets');
            return this.makeMoveDecision();
        }
        
        // 寻找最佳攻击机会
        let bestAttack = null;
        let bestScore = -Infinity;
        
        for (const aiCard of aiCards) {
            for (const playerCard of playerCards) {
                // 检查是否可以攻击（相邻位置）
                if (this.isAdjacent(aiCard.position, playerCard.position)) {
                    const attackScore = this.evaluateAttackAdvanced(aiCard, playerCard, playerCard.position);
                    if (attackScore > bestScore) {
                        bestScore = attackScore;
                        bestAttack = {
                            from: aiCard.position,
                            to: playerCard.position,
                            score: attackScore,
                            aiCard: aiCard,
                            playerCard: playerCard
                        };
                    }
                }
            }
        }
        
        // 根据当前策略调整攻击阈值
        const strategy = this.getCurrentStrategy();
        const attackThreshold = this.getAttackThreshold(strategy);
        
        if (bestAttack && bestAttack.score > attackThreshold) {
            this.logThinking('找到攻击机会', 'attack_found', {
                ...bestAttack,
                strategy,
                threshold: attackThreshold
            });
            return {
                action: 'move',
                from: bestAttack.from,
                to: bestAttack.to,
                confidence: Math.min(0.9, 0.5 + bestAttack.score * 0.1),
                reasoning: `攻击${bestAttack.playerCard.name}，预期得分: ${bestAttack.score.toFixed(2)}，策略: ${strategy}`
            };
        }
        
        this.logThinking('没有好的攻击机会，尝试移动', 'attack_no_good_opportunity', {
            bestScore,
            threshold: attackThreshold,
            strategy
        });
        return this.makeMoveDecision();
    }
    
    /**
     * 制定移动决策
     * @returns {Object} 移动决策
     */
    makeMoveDecision() {
        const gameState = this.gameEngine.gameState;
        const aiCards = gameState.cardsData.filter(card => 
            card.isRevealed && card.owner === 'ai'
        );
        
        if (aiCards.length === 0) {
            this.logThinking('AI没有已翻开的卡牌，无法移动', 'move_no_cards');
            return this.makeFlipDecision();
        }
        
        // 寻找最佳移动机会
        let bestMove = null;
        let bestScore = -Infinity;
        
        for (const aiCard of aiCards) {
            const moves = this.getValidMoves(aiCard);
            for (const move of moves) {
                const moveScore = this.evaluateMove(aiCard, move);
                if (moveScore > bestScore) {
                    bestScore = moveScore;
                    bestMove = {
                        from: aiCard.position,
                        to: move,
                        score: moveScore,
                        card: aiCard
                    };
                }
            }
        }
        
        if (bestMove && bestMove.score > -1) { // 降低移动门槛，允许一些风险移动
            this.logThinking('找到移动机会', 'move_found', bestMove);
            return {
                action: 'move',
                from: bestMove.from,
                to: bestMove.to,
                confidence: Math.min(0.8, 0.4 + bestMove.score * 0.1),
                reasoning: `移动${bestMove.card.name}到(${bestMove.to.row}, ${bestMove.to.col})，预期得分: ${bestMove.score.toFixed(2)}`
            };
        }
        
        this.logThinking('没有好的移动机会，尝试翻牌', 'move_no_good_opportunity');
        return this.makeFlipDecision();
    }
    
    /**
     * 制定防守决策
     * @returns {Object} 防守决策
     */
    makeDefendDecision() {
        const gameState = this.gameEngine.gameState;
        const aiCards = gameState.cardsData.filter(card => 
            card.isRevealed && card.owner === 'ai'
        );
        
        if (aiCards.length === 0) {
            return this.makeFlipDecision();
        }
        
        // 寻找最安全的移动位置
        let bestDefenseMove = null;
        let bestSafetyScore = -Infinity;
        
        for (const aiCard of aiCards) {
            const safeMoves = this.getSafeMoves(aiCard);
            for (const move of safeMoves) {
                const safetyScore = this.evaluateDefenseMove(aiCard, move);
                if (safetyScore > bestSafetyScore) {
                    bestSafetyScore = safetyScore;
                    bestDefenseMove = {
                        from: aiCard.position,
                        to: move,
                        score: safetyScore,
                        card: aiCard
                    };
                }
            }
        }
        
        if (bestDefenseMove) {
            this.logThinking('找到防守移动', 'defense_found', bestDefenseMove);
            return {
                action: 'move',
                from: bestDefenseMove.from,
                to: bestDefenseMove.to,
                confidence: 0.7,
                reasoning: `移动到安全位置进行防守，安全评分: ${bestDefenseMove.score.toFixed(2)}`
            };
        }
        
        return this.makeFlipDecision();
    }
    
    /**
     * 检查两个位置是否相邻
     * @param {Object} pos1 - 位置1
     * @param {Object} pos2 - 位置2
     * @returns {boolean} 是否相邻
     */
    isAdjacent(pos1, pos2) {
        const rowDiff = Math.abs(pos1.row - pos2.row);
        const colDiff = Math.abs(pos1.col - pos2.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }
    
    /**
     * 获取卡牌的有效移动位置
     * @param {Object} card - 卡牌对象
     * @returns {Array} 有效移动位置数组
     */
    getValidMoves(card) {
        const moves = [];
        const { row, col } = card.position;
        
        // 检查四个方向的移动
        const directions = [
            { row: row - 1, col: col },
            { row: row + 1, col: col },
            { row: row, col: col - 1 },
            { row: row, col: col + 1 }
        ];
        
        for (const dir of directions) {
            if (this.isValidPosition(dir.row, dir.col) && this.isValidMoveTarget(dir.row, dir.col)) {
                moves.push(dir);
            }
        }
        
        return moves;
    }
    
    /**
     * 检查位置是否有效
     * @param {number} row - 行
     * @param {number} col - 列
     * @returns {boolean} 是否有效
     */
    isValidPosition(row, col) {
        return row >= 0 && row < 5 && col >= 0 && col < 4;
    }
    
    /**
     * 检查移动目标是否有效
     * @param {number} row - 行
     * @param {number} col - 列
     * @returns {boolean} 是否有效
     */
    isValidMoveTarget(row, col) {
        const gameState = this.gameEngine.gameState;
        const targetCard = gameState.getCardAt(row, col);
        
        // 空位置或敌方卡牌都可以作为移动目标
        return !targetCard || targetCard.owner !== 'ai';
    }
    
    /**
     * 获取安全的移动位置
     * @param {Object} card - 卡牌对象
     * @returns {Array} 安全移动位置数组
     */
    getSafeMoves(card) {
        const moves = this.getValidMoves(card);
        const safeMoves = [];
        
        for (const move of moves) {
            const targetCard = this.gameEngine.gameState.getCardAt(move.row, move.col);
            if (!targetCard) {
                // 空位置是安全的
                safeMoves.push(move);
            } else if (targetCard.owner !== 'ai' && this.canWinBattle(card, targetCard)) {
                // 可以战胜的敌方卡牌也是安全的
                safeMoves.push(move);
            }
        }
        
        return safeMoves;
    }
    
    /**
     * 检查AI卡牌是否能战胜目标卡牌
     * @param {Object} aiCard - AI卡牌
     * @param {Object} targetCard - 目标卡牌
     * @returns {boolean} 是否能战胜
     */
    canWinBattle(aiCard, targetCard) {
        // 使用游戏引擎的战斗规则
        const battleResult = this.gameEngine.battleResolver.resolveBattle(aiCard, targetCard);
        return battleResult === 'win';
    }
    
    /**
     * 评估攻击的价值
     * @param {Object} aiCard - AI卡牌
     * @param {Object} playerCard - 玩家卡牌
     * @returns {number} 攻击得分
     */
    evaluateAttack(aiCard, playerCard) {
        const battleResult = this.gameEngine.battleResolver.resolveBattle(aiCard, playerCard);
        
        // 基于战斗结果的基础评分
        let baseScore = 0;
        switch (battleResult) {
            case 'win':
                // 胜利：己方保留 + 敌方损失
                const aiCardValue = (9 - aiCard.level) * 2; // AI卡牌保留价值
                const playerCardValue = (9 - playerCard.level) * 3; // 敌方卡牌损失价值
                baseScore = aiCardValue + playerCardValue + 20; // 胜利基础奖励
                break;
            case 'lose':
                // 失败：己方损失巨大，绝对不能接受
                const aiLossValue = (9 - aiCard.level) * -5; // AI卡牌损失惩罚
                baseScore = aiLossValue - 50; // 失败基础惩罚
                break;
            case 'draw':
                // 平局：双方都损失，需要考虑价值交换
                const aiValue = (9 - aiCard.level) * -2;
                const playerValue = (9 - playerCard.level) * 2;
                baseScore = playerValue + aiValue; // 如果敌方卡牌更有价值则有利
                break;
        }
        
        // 只有在胜利时才考虑额外奖励
        if (battleResult === 'win') {
            // 位置价值奖励
            const positionValue = this.evaluatePositionValue(playerCard.position);
            
            // 特殊规则奖励（8级击败1级）
            let specialRuleBonus = 0;
            if (aiCard.level === 8 && playerCard.level === 1) {
                specialRuleBonus = 10;
            }
            
            baseScore += positionValue + specialRuleBonus;
        }
        
        return baseScore;
    }

    /**
     * 高级攻击评估 - 考虑战略价值
     */
    evaluateAttackAdvanced(aiCard, playerCard, targetPosition) {
        // 基础攻击评分
        const baseScore = this.evaluateAttack(aiCard, playerCard);
        
        // 战略价值评估
        const strategicValue = this.evaluateStrategicValue(aiCard, playerCard, targetPosition);
        
        // 风险评估
        const riskAssessment = this.assessAttackRisk(aiCard, targetPosition);
        
        // 综合评分
        const finalScore = baseScore + strategicValue - riskAssessment;
        
        this.logThinking('高级攻击评估', 'attack_evaluation_advanced', {
            aiCard: aiCard.name,
            playerCard: playerCard.name,
            baseScore,
            strategicValue,
            riskAssessment,
            finalScore
        });
        
        return finalScore;
    }

    /**
     * 评估攻击的战略价值
     */
    evaluateStrategicValue(aiCard, playerCard, targetPosition) {
        let strategicValue = 0;
        
        // 控制关键位置的价值
        const positionValue = this.getPositionValue(targetPosition);
        if (positionValue > 1.0) {
            strategicValue += (positionValue - 1.0) * 15;
        }
        
        // 消除威胁的价值
        const threatLevel = this.assessThreatLevel(playerCard);
        strategicValue += threatLevel * 8;
        
        // 保护己方卡牌的价值
        const protectionValue = this.calculateProtectionValue(aiCard, targetPosition);
        strategicValue += protectionValue;
        
        // 限制敌方发展的价值
        const restrictionValue = this.calculateRestrictionValue(targetPosition);
        strategicValue += restrictionValue;
        
        return strategicValue;
    }

    /**
     * 评估攻击风险
     */
    assessAttackRisk(aiCard, targetPosition) {
        let risk = 0;
        
        // 移动后的位置风险
        const newPositionRisk = this.assessPositionRisk(targetPosition);
        risk += newPositionRisk;
        
        // 暴露风险（移动后可能被敌方攻击）
        const exposureRisk = this.assessExposureRisk(aiCard, targetPosition);
        risk += exposureRisk;
        
        // 失去控制权的风险
        const controlLossRisk = this.assessControlLossRisk(aiCard.position);
        risk += controlLossRisk;
        
        return risk;
    }

    /**
     * 评估威胁等级
     */
    assessThreatLevel(card) {
        // 高等级卡牌威胁更大
        const levelThreat = (9 - card.level) * 0.5;
        
        // 特殊卡牌（1级、8级）威胁更大
        let specialThreat = 0;
        if (card.level === 1) specialThreat = 3; // 王牌威胁最大
        else if (card.level === 8) specialThreat = 2; // 8级卡牌威胁较大
        
        return levelThreat + specialThreat;
    }

    /**
     * 计算保护价值
     */
    calculateProtectionValue(aiCard, newPosition) {
        // 计算新位置能保护多少己方卡牌
        const gameState = this.gameEngine.gameState;
        const aiCards = gameState.cardsData.filter(card => 
            card.owner === 'ai' && card.isRevealed
        );
        
        let protectionValue = 0;
        aiCards.forEach(card => {
            if (card.id !== aiCard.id) {
                const distance = this.getDistance(newPosition, card.position);
                if (distance === 1) {
                    // 相邻位置，提供保护
                    protectionValue += (9 - card.level) * 0.5;
                }
            }
        });
        
        return protectionValue;
    }

    /**
     * 计算限制价值
     */
    calculateRestrictionValue(position) {
        // 计算占据该位置能限制多少敌方移动
        const gameState = this.gameEngine.gameState;
        const playerCards = gameState.cardsData.filter(card => 
            card.owner === 'player' && card.isRevealed
        );
        
        let restrictionValue = 0;
        playerCards.forEach(card => {
            const distance = this.getDistance(position, card.position);
            if (distance === 1) {
                // 相邻位置，限制敌方移动
                restrictionValue += (9 - card.level) * 0.3;
            }
        });
        
        return restrictionValue;
    }

    /**
     * 评估位置风险
     */
    assessPositionRisk(position) {
        const gameState = this.gameEngine.gameState;
        const enemyCards = gameState.cardsData.filter(card => 
            card.owner === 'player' && card.isRevealed
        );
        
        let risk = 0;
        enemyCards.forEach(card => {
            const distance = this.getDistance(position, card.position);
            if (distance === 1) {
                // 相邻敌方卡牌构成威胁
                risk += (9 - card.level) * 0.8;
            }
        });
        
        return risk;
    }

    /**
     * 评估暴露风险
     */
    assessExposureRisk(aiCard, newPosition) {
        // 计算移动后可能被多少敌方卡牌攻击
        const gameState = this.gameEngine.gameState;
        const enemyCards = gameState.cardsData.filter(card => 
            card.owner === 'player' && card.isRevealed
        );
        
        let exposureRisk = 0;
        enemyCards.forEach(card => {
            const distance = this.getDistance(newPosition, card.position);
            if (distance === 1) {
                // 相邻敌方卡牌可以攻击
                const canWin = this.gameEngine.battleResolver.resolveBattle(card, aiCard) === 'win';
                if (canWin) {
                    exposureRisk += (9 - card.level) * 1.2;
                }
            }
        });
        
        return exposureRisk;
    }

    /**
     * 评估控制权损失风险
     */
    assessControlLossRisk(originalPosition) {
        // 计算离开原位置会失去多少控制价值
        const positionValue = this.getPositionValue(originalPosition);
        const controlLoss = positionValue * 5;
        
        return controlLoss;
    }
    
    /**
     * 评估位置价值
     * @param {Object} position - 位置
     * @returns {number} 位置价值
     */
    evaluatePositionValue(position) {
        // 边缘位置更有价值
        if (position.row === 0 || position.row === 4 || position.col === 0 || position.col === 3) {
            return 1;
        }
        // 中心位置价值较低
        if (position.row === 2) {
            return 0.5;
        }
        return 0.8;
    }

    /**
     * 评估移动的价值
     * @param {Object} card - 要移动的卡牌
     * @param {Object} move - 移动目标位置
     * @returns {number} 移动得分
     */
    evaluateMove(card, move) {
        let score = 0;
        
        // 基础移动分数
        score += 1;
        
        // 移动到第三行（战场）的奖励
        if (move.row === 2) {
            score += 2;
        }
        
        // 移动到边缘位置的奖励
        if (move.row === 0 || move.row === 4 || move.col === 0 || move.col === 3) {
            score += 1;
        }
        
        // 移动到中心位置的奖励
        if (move.row === 1 || move.row === 3) {
            score += 0.5;
        }
        
        // 如果目标位置有敌方卡牌，评估战斗结果
        const targetCard = this.gameEngine.gameState.getCardAt(move.row, move.col);
        if (targetCard && targetCard.owner !== 'ai') {
            const battleResult = this.gameEngine.battleResolver.resolveBattle(card, targetCard);
            switch (battleResult) {
                case 'win':
                    score += 8;
                    break;
                case 'lose':
                    score -= 3;
                    break;
                case 'draw':
                    score += 1;
                    break;
            }
        }
        
        // 考虑移动后的战略位置
        score += this.evaluateStrategicPosition(move);
        
        return score;
    }
    
    /**
     * 评估战略位置价值
     * @param {Object} position - 位置
     * @returns {number} 战略价值
     */
    evaluateStrategicPosition(position) {
        let value = 0;
        
        // 第三行是战场，价值最高
        if (position.row === 2) {
            value += 3;
        }
        
        // 边缘位置便于防守
        if (position.row === 0 || position.row === 4 || position.col === 0 || position.col === 3) {
            value += 1;
        }
        
        // 避免被包围的位置
        const adjacentPositions = this.getAdjacentPositions(position);
        let openSides = 0;
        for (const adjPos of adjacentPositions) {
            if (this.isValidPosition(adjPos.row, adjPos.col)) {
                const adjCard = this.gameEngine.gameState.getCardAt(adjPos.row, adjPos.col);
                if (!adjCard || adjCard.owner === 'ai') {
                    openSides++;
                }
            }
        }
        value += openSides * 0.5;
        
        return value;
    }
    
    /**
     * 获取相邻位置
     * @param {Object} position - 位置
     * @returns {Array} 相邻位置数组
     */
    getAdjacentPositions(position) {
        const { row, col } = position;
        return [
            { row: row - 1, col: col },
            { row: row + 1, col: col },
            { row: row, col: col - 1 },
            { row: row, col: col + 1 }
        ];
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
            // 修复：在获胜攻击中，优先选择击败高等级卡牌（低数字）的攻击
            const bestAttack = winningAttacks.reduce((best, current) => {
                const targetCard = this.gameEngine.gameState.getCardAt(current.to.row, current.to.col);
                if (targetCard && targetCard.level < best.targetLevel) { // 等级越低越强
                    return { ...current, targetLevel: targetCard.level };
                }
                return best;
            }, { targetLevel: 9 }); // 初始化为最高等级
            
            return bestAttack;
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
            score = this.evaluatePositionValue(to);
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
                    decision.position.col,
                    'ai'  // 明确指定是AI在翻牌
                );
                
            case 'move':
                return this.gameEngine.moveCard(
                    decision.from.row, 
                    decision.from.col,
                    decision.to.row, 
                    decision.to.col,
                    'ai'  // 明确指定是AI在移动卡牌
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
            // 修复：在获胜攻击中，优先选择击败高等级卡牌（低数字）的攻击
            const bestAttack = winningAttacks.reduce((best, current) => {
                const targetCard = this.gameEngine.gameState.getCardAt(current.to.row, current.to.col);
                if (targetCard && targetCard.level < best.targetLevel) { // 等级越低越强
                    return { ...current, targetLevel: targetCard.level };
                }
                return best;
            }, { targetLevel: 9 }); // 初始化为最高等级
            
            return bestAttack;
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
            score = this.evaluatePositionValue(to);
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
                    decision.position.col,
                    'ai'  // 明确指定是AI在翻牌
                );
                
            case 'move':
                return this.gameEngine.moveCard(
                    decision.from.row, 
                    decision.from.col,
                    decision.to.row, 
                    decision.to.col,
                    'ai'  // 明确指定是AI在移动卡牌
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
            // 修复：在获胜攻击中，优先选择击败高等级卡牌（低数字）的攻击
            const bestAttack = winningAttacks.reduce((best, current) => {
                const targetCard = this.gameEngine.gameState.getCardAt(current.to.row, current.to.col);
                if (targetCard && targetCard.level < best.targetLevel) { // 等级越低越强
                    return { ...current, targetLevel: targetCard.level };
                }
                return best;
            }, { targetLevel: 9 }); // 初始化为最高等级
            
            return bestAttack;
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
            score = this.evaluatePositionValue(to);
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
                    decision.position.col,
                    'ai'  // 明确指定是AI在翻牌
                );
                
            case 'move':
                return this.gameEngine.moveCard(
                    decision.from.row, 
                    decision.from.col,
                    decision.to.row, 
                    decision.to.col,
                    'ai'  // 明确指定是AI在移动卡牌
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
            aiPositionValue += this.evaluatePositionValue(
                card.position.row, 
                card.position.col
            );
        });
        
        playerCards.forEach(card => {
            playerPositionValue += this.evaluatePositionValue(
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
        
        // 修复：等级越低越强，所以用(9-等级)计算价值
        const aiValue = aiCards.reduce((sum, card) => sum + (9 - card.level), 0);
        const playerValue = playerCards.reduce((sum, card) => sum + (9 - card.level), 0);
        
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
