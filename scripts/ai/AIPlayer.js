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
        
        // 产品级AI配置 - 增强用户体验
        this.config = {
            thinkingTime: this.getThinkingTime(difficulty),
            maxDepth: this.getMaxDepth(difficulty),
            randomness: this.getRandomness(difficulty),
            personality: this.initializePersonality(difficulty),
            adaptiveDifficulty: true,
            showThinkingProcess: true
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

        // 产品级增强功能
        this.playerPerformance = {
            wins: 0,
            losses: 0,
            averageGameLength: 0,
            strugglingMoves: 0
        };

        // AI个性化状态
        this.emotionalState = 'confident'; // confident, cautious, aggressive, desperate
        this.adaptiveLevel = difficulty;
    }

    /**
     * 初始化AI个性化配置 - 产品级增强
     * @param {string} difficulty - 难度级别
     * @returns {Object} 个性化配置
     */
    initializePersonality(difficulty) {
        const personalities = {
            easy: {
                name: '新手导师',
                style: 'friendly',
                errorRate: 0.3,
                teachingMode: true,
                helpfulHints: true
            },
            medium: {
                name: '平衡对手',
                style: 'balanced',
                errorRate: 0.15,
                teachingMode: false,
                helpfulHints: false
            },
            hard: {
                name: '策略大师',
                style: 'aggressive',
                errorRate: 0.05,
                teachingMode: false,
                helpfulHints: false
            }
        };
        return personalities[difficulty] || personalities.medium;
    }

    /**
     * 根据难度获取思考时间 - 增加个性化调整
     * @param {string} difficulty - 难度级别
     * @returns {number} 思考时间（毫秒）
     */
    getThinkingTime(difficulty) {
        const baseTimes = {
            easy: 1000,     // 更长思考时间，给新手更好体验
            medium: 1200,
            hard: 1500      // 减少等待时间，提升高手体验
        };
        return baseTimes[difficulty] || baseTimes.medium;
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
     * 制定AI决策 - 临时简化版本
     * @returns {Object} 决策对象
     */
    makeDecision() {
        this.logThinking('🧠 启动决策引擎', 'decision_start');
        
        try {
            const gameState = this.gameEngine.gameState;
            const aiFaction = gameState.aiFaction;
            
            if (!aiFaction) {
                this.logThinking('🎯 阵营未确定，优先翻牌', 'faction_unknown');
                return this.makeSimpleFlipDecision();
            }
            
            // 智能决策：优先智能攻击，然后防御，最后翻牌
            const attackDecision = this.trySmartAttack();
            if (attackDecision) {
                // 最终安全检查：确保不会自杀
                if (this.finalSafetyCheck(attackDecision)) {
                    return attackDecision;
                } else {
                    console.log('🚫 AI最终安全检查失败，跳过攻击决策');
                }
            }
            
            // 尝试防御：移动被威胁的卡牌
            const defenseDecision = this.tryDefenseMove();
            if (defenseDecision) {
                return defenseDecision;
            }
            
            return this.makeSimpleFlipDecision();
            
        } catch (error) {
            this.logThinking('❌ 决策引擎异常', 'decision_error', error);
            console.error('AI决策制定错误:', error);
            return this.makeSimpleFlipDecision();
        }
    }

    /**
     * 深度战略分析 - 临时禁用
     * @returns {Object} 战略分析结果
     */
    performStrategicAnalysis() {
        // 临时禁用复杂分析，返回简单结果
        return {
            combatPower: { advantage: 0 },
            invincibleCards: { aiInvincibleCount: 0 },
            eliminationOpportunities: { opportunities: [] },
            threats: [],
            tacticalPositions: [],
            flipValue: { shouldFlip: true },
            strategicScore: 0
        };
    }

    /**
     * 有生力量分析 - 临时禁用
     * @returns {Object} 战斗力分析结果
     */
    analyzeCombatPower() {
        // 临时禁用，返回简单结果
        return {
            aiForces: 0,
            playerForces: 0,
            aiCombatPower: 0,
            playerCombatPower: 0,
            powerRatio: 1,
            eliminationPotential: 0,
            survivalPotential: 0,
            advantage: 0
        };
    }

    /**
     * 无敌牌分析 - 识别和保护关键优势牌
     * @returns {Object} 无敌牌分析结果
     */
    analyzeInvincibleCards() {
        const gameState = this.gameEngine.gameState;
        const aiCards = gameState.cardsData.filter(card => card.isRevealed && card.owner === 'ai');
        const playerCards = gameState.cardsData.filter(card => card.isRevealed && card.owner === 'player');
        
        // 识别无敌牌
        const aiInvincibleCards = this.identifyInvincibleCards(aiCards, playerCards);
        const playerInvincibleCards = this.identifyInvincibleCards(playerCards, aiCards);
        
        // 计算无敌牌价值
        const invincibleValue = this.calculateInvincibleValue(aiInvincibleCards, playerInvincibleCards);
        
        // 分析无敌牌创造机会
        const creationOpportunities = this.analyzeInvincibleCreationOpportunities();
        
        return {
            aiInvincibleCards,
            playerInvincibleCards,
            aiInvincibleCount: aiInvincibleCards.length,
            playerInvincibleCount: playerInvincibleCards.length,
            invincibleAdvantage: aiInvincibleCards.length - playerInvincibleCards.length,
            invincibleValue,
            creationOpportunities,
            shouldProtectInvincible: aiInvincibleCards.length > 0
        };
    }

    /**
     * 消灭机会分析 - 寻找最佳歼敌时机
     * @returns {Object} 消灭机会分析结果
     */
    analyzeEliminationOpportunities() {
        const gameState = this.gameEngine.gameState;
        const aiCards = gameState.cardsData.filter(card => card.isRevealed && card.owner === 'ai');
        const playerCards = gameState.cardsData.filter(card => card.isRevealed && card.owner === 'player');
        
        const opportunities = [];
        
        // 分析每张己方牌的消灭机会
        for (const aiCard of aiCards) {
            const targets = this.findEliminationTargets(aiCard, playerCards);
            if (targets.length > 0) {
                opportunities.push({
                    attacker: aiCard,
                    targets: targets,
                    maxValue: Math.max(...targets.map(t => t.value)),
                    totalValue: targets.reduce((sum, t) => sum + t.value, 0)
                });
            }
        }
        
        // 按消灭价值排序
        opportunities.sort((a, b) => b.maxValue - a.maxValue);
        
        return {
            opportunities,
            bestOpportunity: opportunities[0] || null,
            totalEliminationValue: opportunities.reduce((sum, op) => sum + op.maxValue, 0),
            hasHighValueTargets: opportunities.some(op => op.maxValue >= 3),
            shouldAttackNow: this.shouldExecuteElimination(opportunities)
        };
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
     * 智能卡牌价值评估系统
     */
    calculateSmartCardValue(card, gameContext) {
        if (!card) return 0;
        
        const baseValue = 9 - card.level; // 基础价值：1级=8分，8级=1分
        
        // 获取游戏上下文
        const gameState = this.gameEngine.gameState;
        const allCards = gameState.cardsData.filter(c => c.isRevealed);
        const enemyCards = allCards.filter(c => c.owner && c.owner !== card.owner);
        const allyCards = allCards.filter(c => c.owner === card.owner);
        
        // 计算动态价值修正
        let valueMultiplier = 1.0;
        
        // 1. 无敌牌检测：如果所有能克制它的牌都消失了，价值大幅提升
        if (this.isInvincibleCard(card, enemyCards)) {
            valueMultiplier *= 3.0; // 无敌牌价值翻3倍
            this.logThinking('发现无敌牌', 'invincible_card', {
                card: card.name,
                level: card.level,
                reason: '所有克制牌已消失'
            });
        }
        
        // 2. 威胁检测：如果敌方有能克制它的牌，价值降低
        const threats = this.getThreatsToCard(card, card.owner);
        const threatCount = threats.length;
        if (threatCount > 0) {
            valueMultiplier *= Math.max(0.3, 1.0 - threatCount * 0.2);
        }
        
        // 3. 消灭能力检测：能消灭多少敌方牌
        const canEliminate = this.getEliminatableEnemies(card, enemyCards);
        valueMultiplier += canEliminate.length * 0.3;
        
        // 4. 位置安全性评估
        const safetyBonus = this.assessCardSafety(card);
        valueMultiplier += safetyBonus;
        
        return baseValue * valueMultiplier;
    }

    /**
     * 检测是否为无敌牌
     */
    isInvincibleCard(card, enemyCards) {
        // 对于1级牌：检查敌方是否还有8级牌
        if (card.level === 1) {
            return !enemyCards.some(enemy => enemy.level === 8);
        }
        
        // 对于其他牌：检查是否有比它小的敌方牌
        const smallerEnemies = enemyCards.filter(enemy => enemy.level < card.level);
        if (smallerEnemies.length === 0) {
            // 没有更小的敌方牌，且自己不是8级
            return card.level !== 8;
        }
        
        return false;
    }

    /**
     * 获取能被此牌消灭的敌方牌
     */
    getEliminatableEnemies(card, enemyCards) {
        return enemyCards.filter(enemy => {
            const battleResult = this.gameEngine.battleResolver.resolveBattle(card, enemy);
            return battleResult === 'win';
        });
    }

    /**
     * 评估卡牌安全性
     */
    assessCardSafety(card) {
        const gameState = this.gameEngine.gameState;
        const threats = this.getThreatsToCard(card, card.owner);
        
        // 威胁距离评估
        let safetyScore = 0;
        threats.forEach(threat => {
            const distance = this.getDistance(card.position, threat.position);
            if (distance === 1) {
                safetyScore -= 0.3; // 相邻威胁
            } else if (distance === 2) {
                safetyScore -= 0.1; // 距离2的威胁
            }
        });
        
        // 位置防御性评估
        const { row, col } = card.position;
        const isEdge = row === 0 || row === 4 || col === 0 || col === 3;
        const isCorner = (row === 0 || row === 4) && (col === 0 || col === 3);
        
        if (isCorner) safetyScore += 0.2; // 角落相对安全
        else if (isEdge) safetyScore += 0.1; // 边缘相对安全
        
        return safetyScore;
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
     * 高级翻牌位置评估 - 基于智能消灭策略
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
        
        // 智能翻牌策略：基于消灭敌方牌的需求
        let strategicBonus = 0;
        
        // 1. 检测附近是否有高威胁敌方牌，优先翻牌围攻
        const enemyCards = this.getEnemyCards();
        const highThreatEnemies = enemyCards.filter(enemy => this.isHighThreatCard(enemy));
        
        highThreatEnemies.forEach(enemy => {
            const distance = this.getDistance({row, col}, enemy.position);
            if (distance <= 2) {
                strategicBonus += (3 - distance) * 10; // 距离越近奖励越高
                this.logThinking('翻牌围攻高威胁敌方牌', 'flip_to_surround_threat', {
                    targetCard: enemy.name,
                    targetLevel: enemy.level,
                    distance,
                    flipPosition: {row, col}
                });
            }
        });
        
        // 2. 如果有无敌牌，优先翻出更多己方牌来配合
        const allyCards = this.getAllyCards();
        const invincibleCards = allyCards.filter(ally => this.isInvincibleCard(ally, enemyCards));
        
        if (invincibleCards.length > 0) {
            invincibleCards.forEach(invincible => {
                const distance = this.getDistance({row, col}, invincible.position);
                if (distance <= 2) {
                    strategicBonus += (3 - distance) * 8; // 支援无敌牌
                    this.logThinking('翻牌支援无敌牌', 'flip_to_support_invincible', {
                        invincibleCard: invincible.name,
                        distance,
                        flipPosition: {row, col}
                    });
                }
            });
        }
        
        // 3. 检测是否可能翻出克制敌方威胁牌的己方牌
        const counterBonus = this.calculateCounterPotential({row, col}, highThreatEnemies);
        strategicBonus += counterBonus;
        
        // 计算未知牌中己方和敌方的比例
        const unknownCards = gameState.cardsData.filter(card => !card.isRevealed);
        const unknownAICards = unknownCards.filter(card => card.faction === aiFaction);
        const unknownPlayerCards = unknownCards.filter(card => card.faction === playerFaction);
        
        const aiCardRatio = unknownAICards.length / unknownCards.length;
        const playerCardRatio = unknownPlayerCards.length / unknownCards.length;
        
        // 计算期望价值
        const aiCardExpectedValue = this.calculateSmartExpectedValue(unknownAICards, positionValue);
        const playerCardExpectedValue = this.calculateSmartExpectedValue(unknownPlayerCards, positionValue);
        
        // 翻牌期望价值 = 己方牌期望收益 - 敌方牌期望损失 + 战略奖励
        const expectedValue = aiCardRatio * aiCardExpectedValue - 
                            playerCardRatio * playerCardExpectedValue * 0.8 + 
                            strategicBonus + 
                            this.calculateInformationValue() * 3;
        
        // 根据当前策略调整权重
        const strategy = this.getCurrentStrategy();
        const strategyMultiplier = this.getStrategyMultiplier(strategy);
        
        return expectedValue * strategyMultiplier;
    }

    /**
     * 计算克制潜力奖励
     */
    calculateCounterPotential(position, threatEnemies) {
        let counterBonus = 0;
        const gameState = this.gameEngine.gameState;
        const aiFaction = gameState.aiFaction;
        const unknownAICards = gameState.cardsData.filter(card => 
            !card.isRevealed && card.faction === aiFaction
        );
        
        // 计算翻出能克制威胁牌的己方牌的概率
        threatEnemies.forEach(threat => {
            const distance = this.getDistance(position, threat.position);
            if (distance <= 2) {
                // 计算有多少张未知己方牌能克制这个威胁
                const counters = unknownAICards.filter(card => {
                    const result = this.gameEngine.battleResolver.resolveBattle(card, threat);
                    return result === 'win';
                });
                
                if (counters.length > 0) {
                    const probability = counters.length / unknownAICards.length;
                    counterBonus += probability * (3 - distance) * 15; // 概率 × 距离奖励 × 系数
                }
            }
        });
        
        return counterBonus;
    }

    /**
     * 智能期望价值计算
     */
    calculateSmartExpectedValue(cards, positionValue) {
        if (cards.length === 0) return 0;
        
        const totalValue = cards.reduce((sum, card) => {
            const smartValue = this.calculateSmartCardValue(card);
            return sum + smartValue * positionValue;
        }, 0);
        
        return totalValue / cards.length;
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
     * 制定移动决策 - 基于智能消灭策略
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
        
        // 智能移动策略：优先发挥大牌和无敌牌的优势
        let bestMove = null;
        let bestScore = -Infinity;
        
        // 1. 优先移动无敌牌去消灭敌方
        const invincibleCards = aiCards.filter(card => this.isInvincibleCard(card, this.getEnemyCards()));
        if (invincibleCards.length > 0) {
            this.logThinking('发现无敌牌，优先发挥其优势', 'prioritize_invincible', {
                invincibleCards: invincibleCards.map(c => c.name)
            });
            
            for (const invincible of invincibleCards) {
                const moves = this.getValidMoves(invincible);
                for (const move of moves) {
                    const moveScore = this.evaluateInvincibleMove(invincible, move);
                    if (moveScore > bestScore) {
                        bestScore = moveScore;
                        bestMove = {
                            from: invincible.position,
                            to: move,
                            score: moveScore,
                            card: invincible,
                            type: 'invincible_move'
                        };
                    }
                }
            }
        }
        
        // 2. 如果没有无敌牌的好移动，考虑所有卡牌的移动
        if (!bestMove || bestScore < 20) {
            for (const aiCard of aiCards) {
                const moves = this.getValidMoves(aiCard);
                for (const move of moves) {
                    const moveScore = this.evaluateSmartMove(aiCard, move);
                    if (moveScore > bestScore) {
                        bestScore = moveScore;
                        bestMove = {
                            from: aiCard.position,
                            to: move,
                            score: moveScore,
                            card: aiCard,
                            type: 'smart_move'
                        };
                    }
                }
            }
        }
        
        if (bestMove && bestScore > 0) {
            this.logThinking('找到智能移动机会', 'smart_move_found', {
                ...bestMove,
                reasoning: bestMove.type === 'invincible_move' ? '发挥无敌牌优势' : '智能战术移动'
            });
            return {
                action: 'move',
                from: bestMove.from,
                to: bestMove.to,
                confidence: Math.min(0.9, 0.5 + bestScore * 0.1),
                reasoning: `${bestMove.reasoning || '移动'}${bestMove.card.name}，得分: ${bestScore.toFixed(2)}`
            };
        }
        
        this.logThinking('没有好的移动机会，尝试翻牌', 'move_no_opportunity');
        return this.makeFlipDecision();
    }

    /**
     * 评估无敌牌移动
     */
    evaluateInvincibleMove(card, targetPosition) {
        const gameState = this.gameEngine.gameState;
        const targetCard = gameState.getCardAt(targetPosition.row, targetPosition.col);
        
        let score = 0;
        
        if (targetCard && targetCard.owner === 'player') {
            // 无敌牌攻击敌方牌：超高奖励
            const enemyValue = this.calculateSmartCardValue(targetCard);
            score = enemyValue * 3.0 + 50; // 无敌牌消灭敌方的超高奖励
            
            this.logThinking('无敌牌攻击机会', 'invincible_attack', {
                invincibleCard: card.name,
                targetCard: targetCard.name,
                score
            });
        } else if (!targetCard) {
            // 无敌牌移动到战略位置
            const positionValue = this.getPositionValue(targetPosition);
            score = positionValue * 15; // 无敌牌占据战略位置的高价值
            
            // 移动到敌方附近准备下回合攻击
            const nearbyEnemies = this.getNearbyEnemies(targetPosition, 1);
            score += nearbyEnemies.length * 10;
            
            this.logThinking('无敌牌战略移动', 'invincible_positioning', {
                invincibleCard: card.name,
                targetPosition,
                nearbyEnemies: nearbyEnemies.length,
                score
            });
        }
        
        return score;
    }

    /**
     * 智能移动评估
     */
    evaluateSmartMove(card, targetPosition) {
        const gameState = this.gameEngine.gameState;
        const targetCard = gameState.getCardAt(targetPosition.row, targetPosition.col);
        
        let score = 0;
        
        if (targetCard && targetCard.owner === 'player') {
            // 使用智能攻击评估
            return this.evaluateAttackAdvanced(card, targetCard, targetPosition);
        } else if (!targetCard) {
            // 空位移动：基于战略价值
            const positionValue = this.getPositionValue(targetPosition);
            score = positionValue * 5;
            
            // 支援己方卡牌
            const nearbyAllies = this.getNearbyAllies(targetPosition, 1);
            score += nearbyAllies.length * 3;
            
            // 威胁敌方卡牌
            const nearbyEnemies = this.getNearbyEnemies(targetPosition, 1);
            const threatBonus = nearbyEnemies.reduce((sum, enemy) => {
                const battleResult = this.gameEngine.battleResolver.resolveBattle(card, enemy);
                return sum + (battleResult === 'win' ? 8 : 0);
            }, 0);
            score += threatBonus;
            
            // 避开风险
            const riskPenalty = this.calculateMoveRisk(card, targetPosition);
            score -= riskPenalty;
        }
        
        return score;
    }

    /**
     * 获取附近的敌方卡牌
     */
    getNearbyEnemies(position, maxDistance) {
        const enemyCards = this.getEnemyCards();
        return enemyCards.filter(enemy => {
            const distance = this.getDistance(position, enemy.position);
            return distance <= maxDistance;
        });
    }

    /**
     * 获取附近的己方卡牌
     */
    getNearbyAllies(position, maxDistance) {
        const allyCards = this.getAllyCards();
        return allyCards.filter(ally => {
            const distance = this.getDistance(position, ally.position);
            return distance <= maxDistance;
        });
    }

    /**
     * 计算移动风险
     */
    calculateMoveRisk(card, newPosition) {
        const nearbyEnemies = this.getNearbyEnemies(newPosition, 1);
        let risk = 0;
        
        nearbyEnemies.forEach(enemy => {
            const battleResult = this.gameEngine.battleResolver.resolveBattle(enemy, card);
            if (battleResult === 'win') {
                const cardValue = this.calculateSmartCardValue(card);
                risk += cardValue * 0.8; // 被消灭的风险
            }
        });
        
        return risk;
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
     * 高级攻击评估 - 考虑战略价值和智能消灭原则
     */
    evaluateAttackAdvanced(aiCard, playerCard, targetPosition) {
        // 智能价值评估
        const aiCardValue = this.calculateSmartCardValue(aiCard);
        const playerCardValue = this.calculateSmartCardValue(playerCard);
        
        // 战斗结果预测
        const battleResult = this.gameEngine.battleResolver.resolveBattle(aiCard, playerCard);
        
        // 基础评分：基于智能消灭原则
        let baseScore = 0;
        switch (battleResult) {
            case 'win':
                // 胜利：保留己方牌价值 + 消灭敌方牌价值
                baseScore = aiCardValue * 1.5 + playerCardValue * 2.0 + 30;
                
                // 特殊奖励：消灭敌方威胁牌
                if (this.isHighThreatCard(playerCard)) {
                    baseScore += 20;
                    this.logThinking('消灭高威胁敌方牌', 'eliminate_threat', {
                        targetCard: playerCard.name,
                        threatLevel: playerCard.level
                    });
                }
                break;
                
            case 'lose':
                // 失败：绝对禁止小牌攻击大牌
                const valueLoss = aiCardValue * -3.0 - 100;
                baseScore = valueLoss;
                
                // 严厉惩罚：小牌攻击大牌
                if (aiCard.level > playerCard.level) {
                    baseScore -= 200; // 严厉惩罚
                    this.logThinking('禁止小牌攻击大牌', 'prevent_suicide_attack', {
                        aiCard: aiCard.name,
                        playerCard: playerCard.name,
                        aiLevel: aiCard.level,
                        playerLevel: playerCard.level
                    });
                }
                break;
                
            case 'draw':
                // 平局：价值交换分析
                const exchangeValue = playerCardValue - aiCardValue;
                baseScore = exchangeValue * 1.5;
                
                // 如果能换掉敌方关键牌，可以接受
                if (this.isKeyEnemyCard(playerCard)) {
                    baseScore += 15;
                }
                break;
        }
        
        // 战略价值评估
        const strategicValue = this.evaluateStrategicValue(aiCard, playerCard, targetPosition);
        
        // 风险评估
        const riskAssessment = this.assessAttackRisk(aiCard, targetPosition);
        
        // 无敌牌保护：如果AI卡是无敌牌，避免不必要的风险
        if (this.isInvincibleCard(aiCard, this.getEnemyCards())) {
            riskAssessment *= 2.0; // 加倍风险惩罚
            this.logThinking('保护无敌牌', 'protect_invincible', {
                card: aiCard.name,
                level: aiCard.level
            });
        }
        
        // 综合评分
        const finalScore = baseScore + strategicValue - riskAssessment;
        
        this.logThinking('智能攻击评估', 'smart_attack_evaluation', {
            aiCard: aiCard.name,
            playerCard: playerCard.name,
            battleResult,
            aiCardValue: aiCardValue.toFixed(2),
            playerCardValue: playerCardValue.toFixed(2),
            baseScore: baseScore.toFixed(2),
            strategicValue: strategicValue.toFixed(2),
            riskAssessment: riskAssessment.toFixed(2),
            finalScore: finalScore.toFixed(2)
        });
        
        return finalScore;
    }

    /**
     * 检测高威胁敌方牌
     */
    isHighThreatCard(card) {
        // 8级牌（可以吃1级王牌）
        if (card.level === 8) return true;
        
        // 1级王牌
        if (card.level === 1) return true;
        
        // 能消灭多张己方牌的敌方牌
        const allyCards = this.getAllyCards();
        const canEliminate = allyCards.filter(ally => {
            const result = this.gameEngine.battleResolver.resolveBattle(card, ally);
            return result === 'win';
        });
        
        return canEliminate.length >= 2;
    }

    /**
     * 检测关键敌方牌
     */
    isKeyEnemyCard(card) {
        // 敌方最强的几张牌
        const enemyCards = this.getEnemyCards();
        const sortedEnemies = enemyCards.sort((a, b) => a.level - b.level);
        const topEnemies = sortedEnemies.slice(0, 3); // 前3强
        
        return topEnemies.includes(card);
    }

    /**
     * 获取己方所有卡牌
     */
    getAllyCards() {
        const gameState = this.gameEngine.gameState;
        return gameState.cardsData.filter(card => 
            card.isRevealed && card.owner === 'ai'
        );
    }

    /**
     * 获取敌方所有卡牌
     */
    getEnemyCards() {
        const gameState = this.gameEngine.gameState;
        return gameState.cardsData.filter(card => 
            card.isRevealed && card.owner === 'player'
        );
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

    // ==================== 战略级智能核心方法 ====================

    /**
     * 识别无敌牌 - 基于当前棋盘状态
     * @param {Array} ownCards - 己方卡牌
     * @param {Array} enemyCards - 敌方卡牌
     * @returns {Array} 无敌牌列表
     */
    identifyInvincibleCards(ownCards, enemyCards) {
        const invincibleCards = [];
        
        for (const card of ownCards) {
            let isInvincible = true;
            
            // 检查是否有敌方牌能够消灭这张牌
            for (const enemyCard of enemyCards) {
                if (this.canEliminate(enemyCard, card)) {
                    isInvincible = false;
                    break;
                }
            }
            
            if (isInvincible && ownCards.length > 1) {
                invincibleCards.push({
                    card: card,
                    value: this.calculateCardStrategicValue(card),
                    protectionPriority: this.calculateProtectionPriority(card)
                });
            }
        }
        
        return invincibleCards.sort((a, b) => b.protectionPriority - a.protectionPriority);
    }

    /**
     * 计算卡牌战斗力价值
     * @param {Array} cards - 卡牌列表
     * @param {Array} enemyCards - 敌方卡牌
     * @returns {number} 战斗力数值
     */
    calculateCombatPower(cards, enemyCards) {
        let totalPower = 0;
        
        for (const card of cards) {
            // 基础价值（等级越低价值越高）
            let cardValue = 9 - card.level;
            
            // 特殊规则加成
            if (this.isSpecialCard(card)) {
                cardValue += 2; // 特殊牌额外价值
            }
            
            // 消灭潜力加成
            const eliminationTargets = this.findEliminationTargets(card, enemyCards);
            cardValue += eliminationTargets.length * 0.5;
            
            // 无敌牌加成
            if (this.isCardInvincible(card, enemyCards)) {
                cardValue *= 1.5;
            }
            
            totalPower += cardValue;
        }
        
        return totalPower;
    }

    /**
     * 找到可消灭的目标
     * @param {Object} attacker - 攻击牌
     * @param {Array} targets - 目标卡牌列表
     * @returns {Array} 可消灭的目标列表
     */
    findEliminationTargets(attacker, targets) {
        const eliminationTargets = [];
        
        for (const target of targets) {
            if (this.canEliminate(attacker, target) && this.canReach(attacker, target)) {
                eliminationTargets.push({
                    card: target,
                    value: this.calculateEliminationValue(target),
                    distance: this.calculateDistance(attacker.position, target.position)
                });
            }
        }
        
        return eliminationTargets.sort((a, b) => b.value - a.value);
    }

    /**
     * 判断是否能消灭目标
     * @param {Object} attacker - 攻击者
     * @param {Object} target - 目标
     * @returns {boolean} 是否能消灭
     */
    canEliminate(attacker, target) {
        // 基本规则：等级低的吃等级高的
        if (attacker.level < target.level) return true;
        
        // 特殊规则：8级小王虎可吃1级龙王
        if (attacker.faction === 'tiger' && attacker.level === 8 && 
            target.faction === 'dragon' && target.level === 1) {
            return true;
        }
        
        // 特殊规则：8级变形龙可吃1级虎王
        if (attacker.faction === 'dragon' && attacker.level === 8 && 
            target.faction === 'tiger' && target.level === 1) {
            return true;
        }
        
        return false;
    }

    /**
     * 计算消灭价值 - 核心战略指标
     * @param {Object} target - 目标卡牌
     * @returns {number} 消灭价值
     */
    calculateEliminationValue(target) {
        // 基础价值：等级越低价值越高
        let value = 9 - target.level;
        
        // 特殊牌额外价值
        if (target.level === 1 || target.level === 8) {
            value += 3;
        }
        
        // 威胁性评估：能消灭我方多少牌
        const gameState = this.gameEngine.gameState;
        const myCards = gameState.cardsData.filter(card => 
            card.isRevealed && card.owner === 'ai'
        );
        const threatenedCards = myCards.filter(card => this.canEliminate(target, card));
        value += threatenedCards.length * 2;
        
        // 位置战略价值
        if (target.position.row >= 2) {
            value += 1; // 靠近我方区域的敌牌价值更高
        }
        
        return value;
    }

    /**
     * 计算卡牌战略价值
     * @param {Object} card - 卡牌
     * @returns {number} 战略价值
     */
    calculateCardStrategicValue(card) {
        let value = 9 - card.level; // 基础价值
        
        // 特殊牌加成
        if (card.level === 1) value += 4; // 王牌
        if (card.level === 8) value += 2; // 特殊8级牌
        
        // 位置价值
        if (card.position.row <= 1) value += 1; // 后排安全位置
        
        return value;
    }

    /**
     * 判断卡牌是否无敌
     * @param {Object} card - 卡牌
     * @param {Array} enemyCards - 敌方卡牌
     * @returns {boolean} 是否无敌
     */
    isCardInvincible(card, enemyCards) {
        for (const enemy of enemyCards) {
            if (this.canEliminate(enemy, card)) {
                        return false;
    }
    
    /**
     * 尝试防御移动 - 移动被威胁的卡牌到安全位置
     * @returns {Object|null} 防御移动决策或null
     */
    tryDefenseMove() {
        const gameState = this.gameEngine.gameState;
        const aiCards = gameState.cardsData.filter(card => 
            card.isRevealed && card.owner === 'ai'
        );
        const playerCards = gameState.cardsData.filter(card => 
            card.isRevealed && card.owner === 'player'
        );
        
        // 寻找被威胁的AI卡牌
        for (const aiCard of aiCards) {
            if (!aiCard.position) continue;
            
            // 检查是否被敌方威胁
            if (this.isCardThreatened(aiCard, playerCards)) {
                // 寻找安全的移动位置
                const safePosition = this.findSafePosition(aiCard, aiCards, playerCards);
                if (safePosition) {
                    return {
                        action: 'move',
                        fromRow: aiCard.position.row,
                        fromCol: aiCard.position.col,
                        toRow: safePosition.row,
                        toCol: safePosition.col,
                        reasoning: `防御移动 ${aiCard.name} 到安全位置`
                    };
                }
            }
        }
        
        return null;
    }
    
    /**
     * 检查卡牌是否被威胁
     * @param {Object} card - 卡牌
     * @param {Array} enemyCards - 敌方卡牌
     * @returns {boolean} 是否被威胁
     */
    isCardThreatened(card, enemyCards) {
        for (const enemy of enemyCards) {
            if (enemy.position && this.canEliminate(enemy, card)) {
                const distance = this.calculateDistance(enemy.position, card.position);
                if (distance === 1) {
                    return true; // 被威胁
                }
            }
        }
        return false;
    }
    
    /**
     * 寻找安全位置
     * @param {Object} card - 要移动的卡牌
     * @param {Array} allyCards - 友方卡牌
     * @param {Array} enemyCards - 敌方卡牌
     * @returns {Object|null} 安全位置或null
     */
    findSafePosition(card, allyCards, enemyCards) {
        const gameState = this.gameEngine.gameState;
        const directions = [
            { row: -1, col: 0 }, { row: 1, col: 0 },
            { row: 0, col: -1 }, { row: 0, col: 1 }
        ];
        
        let bestPosition = null;
        let bestSafety = -1;
        
        for (const dir of directions) {
            const newRow = card.position.row + dir.row;
            const newCol = card.position.col + dir.col;
            
            // 检查位置是否有效
            if (newRow < 0 || newRow >= 5 || newCol < 0 || newCol >= 4) continue;
            if (newRow === 2) continue; // 跳过中间行
            
            // 检查位置是否被占用
            const existingCard = gameState.getCardAt(newRow, newCol);
            if (existingCard) continue;
            
            // 计算位置安全性
            const safety = this.calculatePositionSafety(newRow, newCol, card, allyCards, enemyCards);
            
            if (safety > bestSafety) {
                bestSafety = safety;
                bestPosition = { row: newRow, col: newCol };
            }
        }
        
        return bestPosition;
    }
    
    /**
     * 计算位置安全性
     * @param {number} row - 行
     * @param {number} col - 列
     * @param {Object} card - 卡牌
     * @param {Array} allyCards - 友方卡牌
     * @param {Array} enemyCards - 敌方卡牌
     * @returns {number} 安全性评分
     */
    calculatePositionSafety(row, col, card, allyCards, enemyCards) {
        let safety = 0;
        
        // 基础位置安全：后排更安全
        if (row <= 1) safety += 2;
        if (row >= 3) safety += 1;
        
        // 检查是否有友方卡牌保护
        for (const ally of allyCards) {
            if (ally.id === card.id) continue;
            if (ally.position) {
                const distance = this.calculateDistance(ally.position, { row, col });
                if (distance === 1) {
                    safety += 1; // 友方卡牌保护
                }
            }
        }
        
        // 检查是否有敌方威胁
        for (const enemy of enemyCards) {
            if (enemy.position) {
                const distance = this.calculateDistance(enemy.position, { row, col });
                if (distance === 1 && this.canEliminate(enemy, card)) {
                    safety -= 3; // 严重威胁
                } else if (distance === 1) {
                    safety -= 1; // 轻微威胁
                }
            }
        }
        
        return safety;
    }
}
        return true;
    }

    /**
     * 计算保护优先级
     * @param {Object} card - 卡牌
     * @returns {number} 保护优先级
     */
    calculateProtectionPriority(card) {
        let priority = this.calculateCardStrategicValue(card);
        
        // 如果是唯一的无敌牌，优先级大幅提升
        if (card.level === 1) priority += 5;
        
        return priority;
    }

    /**
     * 计算行动价值 - 新的核心决策方法
     * @param {Object} strategicAnalysis - 战略分析结果
     * @returns {Object} 行动价值评估
     */
    calculateActionValues(strategicAnalysis) {
        const { eliminationOpportunities, invincibleCards, combatPower } = strategicAnalysis;
        
        return {
            attackValue: this.calculateAttackValue(eliminationOpportunities),
            flipValue: this.calculateFlipValue(),
            moveValue: this.calculateMoveValue(invincibleCards),
            defendValue: this.calculateDefendValue(combatPower.threats)
        };
    }

    /**
     * 选择最优行动
     * @param {Object} actionValues - 行动价值
     * @param {Object} strategicAnalysis - 战略分析
     * @returns {Object} 最优决策
     */
    selectOptimalAction(actionValues, strategicAnalysis) {
        const { attackValue, flipValue, moveValue, defendValue } = actionValues;
        
        // 找出价值最高的行动
        const actions = [
            { type: 'attack', value: attackValue },
            { type: 'flip', value: flipValue },
            { type: 'move', value: moveValue },
            { type: 'defend', value: defendValue }
        ];
        
        const bestAction = actions.reduce((best, current) => 
            current.value > best.value ? current : best
        );
        
        // 根据最优行动类型执行对应策略
        switch (bestAction.type) {
            case 'attack':
                return this.executeOptimalAttack(strategicAnalysis.eliminationOpportunities);
            case 'flip':
                return this.makeStrategicFlipDecision();
            case 'move':
                return this.executeOptimalMove(strategicAnalysis.invincibleCards);
            case 'defend':
                return this.executeOptimalDefense(strategicAnalysis.threats);
            default:
                return this.makeStrategicFlipDecision();
        }
    }

    /**
     * 执行最优攻击
     * @param {Object} eliminationOpportunities - 消灭机会
     * @returns {Object} 攻击决策
     */
    executeOptimalAttack(eliminationOpportunities) {
        if (!eliminationOpportunities.bestOpportunity) {
            return this.makeStrategicFlipDecision();
        }
        
        const { attacker, targets } = eliminationOpportunities.bestOpportunity;
        const bestTarget = targets[0];
        
        return {
            action: 'move',
            fromRow: attacker.position.row,
            fromCol: attacker.position.col,
            toRow: bestTarget.card.position.row,
            toCol: bestTarget.card.position.col,
            reasoning: `消灭高价值目标 ${bestTarget.card.name}(价值:${bestTarget.value})`
        };
    }

    /**
     * 战略翻牌决策
     * @returns {Object} 翻牌决策
     */
    makeStrategicFlipDecision() {
        const gameState = this.gameEngine.gameState;
        const hiddenCards = gameState.cardsData.filter(card => !card.isRevealed);
        
        if (hiddenCards.length === 0) {
            return null;
        }
        
        // 优先翻开最有战略价值的位置
        const bestFlip = this.findBestFlipPosition(hiddenCards);
        
        // 安全检查：确保找到了有效的翻牌位置
        if (!bestFlip || !bestFlip.position || 
            bestFlip.position.row === undefined || bestFlip.position.col === undefined) {
            
            // 降级策略：随机选择一张隐藏卡牌
            const randomCard = hiddenCards[Math.floor(Math.random() * hiddenCards.length)];
            if (randomCard && randomCard.position) {
                return {
                    action: 'flip',
                    row: randomCard.position.row,
                    col: randomCard.position.col,
                    reasoning: '降级策略：随机翻牌'
                };
            }
            
            return null; // 无法找到有效的翻牌位置
        }
        
        return {
            action: 'flip',
            row: bestFlip.position.row,
            col: bestFlip.position.col,
            reasoning: `战略翻牌，期望价值: ${bestFlip.expectedValue.toFixed(2)}`
        };
    }

    /**
     * 寻找最佳翻牌位置
     * @param {Array} hiddenCards - 隐藏卡牌
     * @returns {Object} 最佳翻牌位置
     */
    findBestFlipPosition(hiddenCards) {
        // 安全检查：确保有隐藏卡牌
        if (!hiddenCards || hiddenCards.length === 0) {
            return {
                card: null,
                position: { row: 0, col: 0 },
                expectedValue: 0
            };
        }
        
        let bestCard = hiddenCards[0];
        let bestValue = 0;
        
        for (const card of hiddenCards) {
            if (!card) continue; // 跳过空卡牌
            
            const expectedValue = this.calculateFlipExpectedValue(card);
            if (expectedValue > bestValue) {
                bestValue = expectedValue;
                bestCard = card;
            }
        }
        
        // 确保最佳卡牌存在且有位置
        if (!bestCard || !bestCard.position) {
            return {
                card: hiddenCards[0],
                position: hiddenCards[0]?.position || { row: 0, col: 0 },
                expectedValue: 0
            };
        }
        
        return {
            card: bestCard,
            position: bestCard.position,
            expectedValue: bestValue
        };
    }

    /**
     * 计算翻牌期望价值
     * @param {Object} card - 卡牌
     * @returns {number} 期望价值
     */
    calculateFlipExpectedValue(card) {
        let value = 0;
        
        // 安全检查：确保卡牌和位置存在
        if (!card || !card.position) {
            return 0;
        }
        
        // 位置价值：靠近中心和前线的位置更有价值
        if (card.position.row === 2) value += 2; // 战场中心
        if (card.position.row <= 1) value += 1; // 后排安全
        if (card.position.row >= 3) value += 1.5; // 前线压力
        
        // 信息价值：在关键位置获得信息的价值
        value += this.calculatePositionInfoValue(card.position);
        
        return value;
    }

    /**
     * 计算位置信息价值
     * @param {Object} position - 位置坐标
     * @returns {number} 信息价值
     */
    calculatePositionInfoValue(position) {
        let value = 0;
        
        // 安全检查：确保位置存在
        if (!position || position.row === undefined || position.col === undefined) {
            return 0;
        }
        
        // 中心位置信息价值更高
        const centerDistance = Math.abs(position.row - 2) + Math.abs(position.col - 1.5);
        value += Math.max(0, 3 - centerDistance);
        
        // 边缘位置有观察价值
        if (position.row === 0 || position.row === 4) value += 0.5;
        if (position.col === 0 || position.col === 3) value += 0.5;
        
        return value;
    }

    /**
     * 计算攻击价值
     * @param {Object} eliminationOpportunities - 消灭机会
     * @returns {number} 攻击价值
     */
    calculateAttackValue(eliminationOpportunities) {
        if (!eliminationOpportunities || !eliminationOpportunities.bestOpportunity) {
            return 0;
        }
        
        return eliminationOpportunities.totalEliminationValue * 2;
    }

    /**
     * 计算移动价值
     * @param {Object} invincibleCards - 无敌牌信息
     * @returns {number} 移动价值
     */
    calculateMoveValue(invincibleCards) {
        if (!invincibleCards || invincibleCards.aiInvincibleCount === 0) {
            return 1; // 基础移动价值
        }
        
        // 保护无敌牌的移动价值
        return invincibleCards.invincibleValue * 0.5;
    }

    /**
     * 计算防守价值
     * @param {Object} threats - 威胁信息
     * @returns {number} 防守价值
     */
    calculateDefendValue(threats) {
        if (!threats) return 0;
        
        // 基于威胁程度计算防守价值
        return threats.length * 1.5;
    }

    /**
     * 执行最优移动
     * @param {Object} invincibleCards - 无敌牌信息
     * @returns {Object} 移动决策
     */
    executeOptimalMove(invincibleCards) {
        // 如果有无敌牌需要保护，优先保护
        if (invincibleCards && invincibleCards.aiInvincibleCards.length > 0) {
            const cardToProtect = invincibleCards.aiInvincibleCards[0];
            return this.createProtectionMove(cardToProtect);
        }
        
        // 否则执行战略翻牌
        return this.makeStrategicFlipDecision();
    }

    /**
     * 执行最优防守
     * @param {Object} threats - 威胁信息
     * @returns {Object} 防守决策
     */
    executeOptimalDefense(threats) {
        // 简化防守策略：优先翻牌获取更多信息
        return this.makeStrategicFlipDecision();
    }

    /**
     * 创建保护移动
     * @param {Object} cardToProtect - 需要保护的卡牌
     * @returns {Object} 保护移动决策
     */
    createProtectionMove(cardToProtect) {
        const gameState = this.gameEngine.gameState;
        const availableMoves = this.getAvailableMovesForCard(cardToProtect.card);
        
        if (availableMoves.length === 0) {
            return this.makeStrategicFlipDecision();
        }
        
        // 选择最安全的移动位置
        const safestMove = availableMoves[0];
        
        return {
            action: 'move',
            fromRow: cardToProtect.card.position.row,
            fromCol: cardToProtect.card.position.col,
            toRow: safestMove.row,
            toCol: safestMove.col,
            reasoning: `保护无敌牌 ${cardToProtect.card.name}`
        };
    }

    /**
     * 获取卡牌的可用移动
     * @param {Object} card - 卡牌
     * @returns {Array} 可用移动列表
     */
    getAvailableMovesForCard(card) {
        const moves = [];
        const directions = [
            { row: -1, col: 0 }, { row: 1, col: 0 },
            { row: 0, col: -1 }, { row: 0, col: 1 }
        ];
        
        for (const dir of directions) {
            const newRow = card.position.row + dir.row;
            const newCol = card.position.col + dir.col;
            
            if (newRow >= 0 && newRow < 5 && newCol >= 0 && newCol < 4) {
                const gameState = this.gameEngine.gameState;
                const targetCard = gameState.getCardAt(newRow, newCol);
                
                // 可以移动到空位或攻击敌方
                if (!targetCard || targetCard.owner !== card.owner) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
        
        return moves;
    }

    /**
     * 评估对己方的威胁
     * @returns {Object} 威胁评估结果
     */
    assessThreatsToOwnForces() {
        const gameState = this.gameEngine.gameState;
        const aiCards = gameState.cardsData.filter(card => card.isRevealed && card.owner === 'ai');
        const playerCards = gameState.cardsData.filter(card => card.isRevealed && card.owner === 'player');
        
        const threats = [];
        
        for (const aiCard of aiCards) {
            for (const playerCard of playerCards) {
                if (this.canEliminate(playerCard, aiCard) && this.canReach(playerCard, aiCard)) {
                    threats.push({
                        threatCard: playerCard,
                        targetCard: aiCard,
                        danger: this.calculateThreatLevel(playerCard, aiCard)
                    });
                }
            }
        }
        
        return threats.sort((a, b) => b.danger - a.danger);
    }

    /**
     * 分析战术位置
     * @returns {Object} 战术位置分析
     */
    analyzeTacticalPositions() {
        const gameState = this.gameEngine.gameState;
        const positions = [];
        
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 4; col++) {
                const card = gameState.getCardAt(row, col);
                if (!card) {
                    positions.push({
                        row,
                        col,
                        value: this.calculatePositionTacticalValue(row, col)
                    });
                }
            }
        }
        
        return positions.sort((a, b) => b.value - a.value);
    }

    /**
     * 分析翻牌价值
     * @returns {Object} 翻牌价值分析
     */
    analyzeFlipValue() {
        const gameState = this.gameEngine.gameState;
        const hiddenCards = gameState.cardsData.filter(card => !card.isRevealed);
        
        let totalValue = 0;
        let bestFlip = null;
        let bestValue = 0;
        
        for (const card of hiddenCards) {
            const value = this.calculateFlipExpectedValue(card);
            totalValue += value;
            
            if (value > bestValue) {
                bestValue = value;
                bestFlip = card;
            }
        }
        
        return {
            totalValue,
            averageValue: hiddenCards.length > 0 ? totalValue / hiddenCards.length : 0,
            bestFlip,
            bestValue,
            shouldFlip: bestValue > 2
        };
    }

    /**
     * 计算战略分数
     * @param {Object} analysis - 分析结果
     * @returns {number} 战略分数
     */
    calculateStrategicScore(analysis) {
        const { combatPowerAnalysis, invincibleCardAnalysis, eliminationOpportunities, threatAssessment } = analysis;
        
        let score = 0;
        
        // 战斗力优势分数
        if (combatPowerAnalysis) {
            score += combatPowerAnalysis.advantage * 10;
        }
        
        // 无敌牌优势分数
        if (invincibleCardAnalysis) {
            score += invincibleCardAnalysis.invincibleAdvantage * 15;
        }
        
        // 消灭机会分数
        if (eliminationOpportunities) {
            score += eliminationOpportunities.totalEliminationValue * 5;
        }
        
        // 威胁惩罚分数
        if (threatAssessment) {
            score -= threatAssessment.length * 3;
        }
        
        return score;
    }

    /**
     * 计算威胁等级
     * @param {Object} threatCard - 威胁卡牌
     * @param {Object} targetCard - 目标卡牌
     * @returns {number} 威胁等级
     */
    calculateThreatLevel(threatCard, targetCard) {
        let danger = this.calculateCardStrategicValue(targetCard);
        
        // 威胁的紧迫性
        const distance = this.calculateDistance(threatCard.position, targetCard.position);
        danger += Math.max(0, 3 - distance);
        
        return danger;
    }

    /**
     * 计算位置战术价值
     * @param {number} row - 行
     * @param {number} col - 列
     * @returns {number} 战术价值
     */
    calculatePositionTacticalValue(row, col) {
        let value = 0;
        
        // 中心控制价值
        if (row === 2) value += 2;
        
        // 前线价值
        if (row >= 3) value += 1.5;
        
        // 后排安全价值
        if (row <= 1) value += 1;
        
        return value;
    }

    /**
     * 分析无敌牌创造机会
     * @returns {Array} 创造机会列表
     */
    analyzeInvincibleCreationOpportunities() {
        const gameState = this.gameEngine.gameState;
        const hiddenCards = gameState.cardsData.filter(card => !card.isRevealed);
        const opportunities = [];
        
        // 分析翻出1级王牌的机会
        for (const card of hiddenCards) {
            if (this.couldBeKingCard(card)) {
                opportunities.push({
                    position: card.position,
                    probability: 0.125, // 1/8的概率是王牌
                    value: 10 // 王牌的价值
                });
            }
        }
        
        return opportunities;
    }

    /**
     * 判断位置是否可能是王牌
     * @param {Object} card - 卡牌
     * @returns {boolean} 是否可能是王牌
     */
    couldBeKingCard(card) {
        // 后排位置更可能放置重要卡牌
        return card.position.row <= 1;
    }

    /**
     * 计算消灭潜力
     * @param {Array} ownCards - 己方卡牌
     * @param {Array} enemyCards - 敌方卡牌
     * @returns {number} 消灭潜力
     */
    calculateEliminationPotential(ownCards, enemyCards) {
        let potential = 0;
        
        for (const ownCard of ownCards) {
            const targets = this.findEliminationTargets(ownCard, enemyCards);
            potential += targets.reduce((sum, target) => sum + target.value, 0);
        }
        
        return potential;
    }

    /**
     * 计算生存潜力
     * @param {Array} ownCards - 己方卡牌
     * @param {Array} enemyCards - 敌方卡牌
     * @returns {number} 生存潜力
     */
    calculateSurvivalPotential(ownCards, enemyCards) {
        let potential = 0;
        
        for (const ownCard of ownCards) {
            if (this.isCardInvincible(ownCard, enemyCards)) {
                potential += this.calculateCardStrategicValue(ownCard);
            }
        }
        
        return potential;
    }

    /**
     * 计算无敌牌价值
     * @param {Array} aiInvincibleCards - AI无敌牌
     * @param {Array} playerInvincibleCards - 玩家无敌牌
     * @returns {number} 无敌牌价值
     */
    calculateInvincibleValue(aiInvincibleCards, playerInvincibleCards) {
        const aiValue = aiInvincibleCards.reduce((sum, card) => sum + card.value, 0);
        const playerValue = playerInvincibleCards.reduce((sum, card) => sum + card.value, 0);
        
        return aiValue - playerValue;
    }

    /**
     * 判断是否应该执行消灭
     * @param {Array} opportunities - 消灭机会
     * @returns {boolean} 是否应该攻击
     */
    shouldExecuteElimination(opportunities) {
        if (opportunities.length === 0) return false;
        
        const bestOpportunity = opportunities[0];
        return bestOpportunity.maxValue >= 3; // 只有高价值目标才值得攻击
    }

    /**
     * 判断是否能到达目标位置
     * @param {Object} attacker - 攻击者
     * @param {Object} target - 目标
     * @returns {boolean} 是否能到达
     */
    canReach(attacker, target) {
        // 安全检查：确保攻击者和目标都存在且有位置
        if (!attacker || !target || !attacker.position || !target.position) {
            return false;
        }
        
        const distance = this.calculateDistance(attacker.position, target.position);
        return distance === 1; // 只能攻击相邻的目标
    }

    /**
     * 计算两点间的曼哈顿距离
     * @param {Object} pos1 - 位置1
     * @param {Object} pos2 - 位置2
     * @returns {number} 距离
     */
    calculateDistance(pos1, pos2) {
        // 安全检查：确保两个位置都存在
        if (!pos1 || !pos2 || 
            pos1.row === undefined || pos1.col === undefined ||
            pos2.row === undefined || pos2.col === undefined) {
            return 999; // 返回一个很大的距离表示无法到达
        }
        
        return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
    }

    /**
     * 判断是否是特殊卡牌
     * @param {Object} card - 卡牌
     * @returns {boolean} 是否是特殊卡牌
     */
    isSpecialCard(card) {
        return card.level === 1 || card.level === 8;
    }

    /**
     * 简单翻牌决策 - 安全版本
     * @returns {Object} 翻牌决策
     */
    makeSimpleFlipDecision() {
        const gameState = this.gameEngine.gameState;
        const hiddenCards = gameState.cardsData.filter(card => !card.isRevealed);
        
        if (hiddenCards.length === 0) {
            return null;
        }
        
        // 随机选择一张隐藏卡牌
        const randomCard = hiddenCards[Math.floor(Math.random() * hiddenCards.length)];
        
        if (!randomCard || !randomCard.position) {
            return null;
        }
        
        return {
            action: 'flip',
            row: randomCard.position.row,
            col: randomCard.position.col,
            reasoning: '简单翻牌策略'
        };
    }

    /**
     * 尝试智能攻击 - 禁止自杀，避免无意义走棋
     * @returns {Object|null} 攻击决策或null
     */
    trySmartAttack() {
        console.log('🔍 AI开始智能攻击决策...');
        const gameState = this.gameEngine.gameState;
        const aiCards = gameState.cardsData.filter(card => 
            card.isRevealed && card.owner === 'ai'
        );
        const playerCards = gameState.cardsData.filter(card => 
            card.isRevealed && card.owner === 'player'
        );
        
        // 寻找最佳攻击目标
        let bestAttack = null;
        let bestValue = -1;
        
        for (const aiCard of aiCards) {
            if (!aiCard.position) continue;
            
            for (const playerCard of playerCards) {
                if (!playerCard.position) continue;
                
                // 检查是否相邻且可以消灭
                const distance = Math.abs(aiCard.position.row - playerCard.position.row) + 
                               Math.abs(aiCard.position.col - playerCard.position.col);
                
                if (distance === 1) {
                    console.log(`🔍 AI检查攻击: ${aiCard.name}(${aiCard.level}级) vs ${playerCard.name}(${playerCard.level}级)`);
                    
                    // 首先检查攻击是否有意义（避免自杀和无意义走棋）
                    if (!this.isAttackMeaningful(aiCard, playerCard)) {
                        console.log(`🚫 AI阻止攻击: ${aiCard.name} 攻击 ${playerCard.name} 无意义`);
                        continue; // 跳过无意义的攻击
                    }
                    
                    // 然后检查攻击后是否会被敌方消灭（额外安全保护）
                    if (this.wouldBeEliminatedAfterAttack(aiCard, playerCard, playerCards)) {
                        console.log(`🚫 AI阻止攻击: ${aiCard.name} 攻击后会被消灭`);
                        continue; // 跳过会导致自杀的攻击
                    }
                    
                    // 最后计算攻击价值
                    const attackValue = this.calculateAttackValue(aiCard, playerCard);
                    console.log(`✅ AI允许攻击: ${aiCard.name} 攻击 ${playerCard.name}, 价值: ${attackValue}`);
                    
                    if (attackValue > 0 && attackValue > bestValue) {
                        bestValue = attackValue;
                        bestAttack = {
                            action: 'move',
                            fromRow: aiCard.position.row,
                            fromCol: aiCard.position.col,
                            toRow: playerCard.position.row,
                            toCol: playerCard.position.col,
                            reasoning: `智能攻击 ${playerCard.name} (价值: ${attackValue})`
                        };
                    }
                }
            }
        }
        
        return bestAttack;
    }
    
    /**
     * 检查攻击后是否会被敌方消灭
     * @param {Object} attacker - 攻击者
     * @param {Object} target - 攻击目标
     * @param {Array} enemyCards - 敌方卡牌
     * @returns {boolean} 是否会被消灭
     */
    wouldBeEliminatedAfterAttack(attacker, target, enemyCards) {
        // 模拟攻击后的位置
        const newPosition = { row: target.position.row, col: target.position.col };
        
        // 检查是否有敌方卡牌能消灭移动到新位置的攻击者
        for (const enemy of enemyCards) {
            if (enemy.id === target.id) continue; // 跳过被消灭的目标
            
            if (enemy.position && this.canEliminate(enemy, attacker)) {
                const distance = this.calculateDistance(enemy.position, newPosition);
                if (distance === 1) {
                    return true; // 会被消灭
                }
            }
        }
        
        return false;
    }
    
    /**
     * 计算攻击价值
     * @param {Object} attacker - 攻击者
     * @param {Object} target - 攻击目标
     * @returns {number} 攻击价值
     */
    calculateAttackValue(attacker, target) {
        let value = 0;
        
        // 基础消灭价值
        value += this.calculateEliminationValue(target);
        
        // 攻击者安全评估
        if (this.isCardInvincible(attacker, [])) {
            value += 2; // 无敌牌攻击更安全
        }
        
        // 位置战略价值
        if (target.position.row >= 2) {
            value += 1; // 攻击靠近我方区域的敌牌
        }
        
        // 避免暴露重要卡牌
        if (attacker.level === 1) {
            value -= 1; // 王牌攻击要谨慎
        }
        
        return value;
    }
    
    /**
     * 检查攻击是否有意义 - 强化版自杀检查
     * @param {Object} attacker - 攻击者
     * @param {Object} target - 攻击目标
     * @returns {boolean} 是否有意义
     */
    isAttackMeaningful(attacker, target) {
        // 基础规则：等级低的吃等级高的
        if (attacker.level < target.level) {
            return true; // 有意义的攻击
        }
        
        // 特殊规则：8级小王虎可吃1级龙王
        if (attacker.faction === 'tiger' && attacker.level === 8 && 
            target.faction === 'dragon' && target.level === 1) {
            return true;
        }
        
        // 特殊规则：8级变形龙可吃1级虎王
        if (attacker.faction === 'dragon' && attacker.level === 8 && 
            target.faction === 'tiger' && target.level === 1) {
            return true;
        }
        
        // 严格禁止自杀行为：
        
        // 1. 等级高的攻击等级低的 = 自杀
        if (attacker.level > target.level) {
            console.log(`🚫 AI阻止自杀攻击: ${attacker.name}(等级${attacker.level}) 攻击 ${target.name}(等级${target.level})`);
            return false;
        }
        
        // 2. 相同等级攻击 = 同归于尽
        if (attacker.level === target.level) {
            console.log(`🚫 AI阻止同归于尽: ${attacker.name}(等级${attacker.level}) 攻击 ${target.name}(等级${target.level})`);
            return false;
        }
        
        // 3. 等级低的攻击等级高的 = 无意义（除非特殊规则）
        console.log(`🚫 AI阻止无意义攻击: ${attacker.name}(等级${attacker.level}) 攻击 ${target.name}(等级${target.level})`);
        return false;
    }
    
    /**
     * 最终安全检查 - 在决策执行前的最后一道防线
     * @param {Object} decision - 攻击决策
     * @returns {boolean} 是否安全
     */
    finalSafetyCheck(decision) {
        if (decision.action !== 'move') return true;
        
        const gameState = this.gameEngine.gameState;
        const attacker = gameState.getCardAt(decision.fromRow, decision.fromCol);
        const target = gameState.getCardAt(decision.toRow, decision.toCol);
        
        if (!attacker || !target) {
            console.log('🚫 最终安全检查：攻击者或目标不存在');
            return false;
        }
        
        // 再次验证攻击是否有意义
        if (!this.isAttackMeaningful(attacker, target)) {
            console.log('🚫 最终安全检查：攻击无意义');
            return false;
        }
        
        // 检查攻击后是否会被敌方消灭
        const playerCards = gameState.cardsData.filter(card => 
            card.isRevealed && card.owner === 'player'
        );
        
        if (this.wouldBeEliminatedAfterAttack(attacker, target, playerCards)) {
            console.log('🚫 最终安全检查：攻击后会被消灭');
            return false;
        }
        
        console.log(`✅ 最终安全检查通过：${attacker.name} 攻击 ${target.name}`);
        return true;
    }
}
