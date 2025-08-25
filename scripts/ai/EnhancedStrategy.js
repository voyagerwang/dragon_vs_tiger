/**
 * EnhancedStrategy类 - 增强版AI策略引擎
 * 基于产品经理优化方案重构的智能策略系统
 */

export class EnhancedStrategy {
    constructor(difficulty = 'medium') {
        this.difficulty = difficulty;
        this.config = this.initializeConfig(difficulty);
        this.openingBook = this.initializeOpeningBook();
        this.tacticalLibrary = this.initializeTacticalLibrary();
        this.learningData = this.loadLearningData();
        
        // 性能统计
        this.stats = {
            totalGames: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            averageMoveTime: 0
        };
    }

    /**
     * 初始化策略配置 - 简化且可量化
     */
    initializeConfig(difficulty) {
        const configs = {
            easy: {
                searchDepth: 2,           // 搜索深度
                riskTolerance: 0.3,       // 风险容忍度
                aggressionLevel: 0.4,     // 攻击性水平
                patienceFactor: 0.6,      // 耐心因子
                adaptationSpeed: 0.8      // 适应速度
            },
            medium: {
                searchDepth: 3,
                riskTolerance: 0.5,
                aggressionLevel: 0.6,
                patienceFactor: 0.5,
                adaptationSpeed: 0.6
            },
            hard: {
                searchDepth: 4,
                riskTolerance: 0.7,
                aggressionLevel: 0.8,
                patienceFactor: 0.4,
                adaptationSpeed: 0.4
            }
        };

        return configs[difficulty] || configs.medium;
    }

    /**
     * 初始化开局库 - 经过验证的高胜率开局
     */
    initializeOpeningBook() {
        return {
            // 龙阵营开局策略
            dragon: {
                // 优先翻牌位置（按优先级排序）
                priorityPositions: [
                    { row: 2, col: 1, reason: '控制中心，威胁对手' },
                    { row: 1, col: 2, reason: '侧翼控制，形成包围' },
                    { row: 3, col: 2, reason: '后场支援，保持压力' },
                    { row: 0, col: 1, reason: '前场压制，限制对手' }
                ],
                // 避免的位置
                avoidPositions: [
                    { row: 0, col: 0, reason: '角落位置，容易被围攻' },
                    { row: 4, col: 3, reason: '边缘位置，缺乏支援' }
                ]
            },
            // 虎阵营开局策略
            tiger: {
                priorityPositions: [
                    { row: 2, col: 2, reason: '中心控制，灵活应对' },
                    { row: 1, col: 1, reason: '侧翼发展，建立优势' },
                    { row: 3, col: 1, reason: '后场布局，等待时机' },
                    { row: 0, col: 2, reason: '前场控制，限制对手' }
                ],
                avoidPositions: [
                    { row: 0, col: 3, reason: '角落位置，缺乏灵活性' },
                    { row: 4, col: 0, reason: '边缘位置，难以支援' }
                ]
            }
        };
    }

    /**
     * 初始化战术库 - 常见局面的标准战术
     */
    initializeTacticalLibrary() {
        return {
            // 优势局面的战术
            advantage: {
                name: '优势压制',
                moves: ['aggressive_attack', 'position_control', 'limit_escape'],
                description: '利用等级优势，主动攻击，控制关键位置'
            },
            // 劣势局面的战术
            disadvantage: {
                name: '劣势防守',
                moves: ['defensive_positioning', 'counter_opportunity', 'survival_first'],
                description: '优先生存，寻找反击机会，避免被围歼'
            },
            // 均势局面的战术
            equal: {
                name: '均势发展',
                moves: ['position_improvement', 'threat_creation', 'flexible_response'],
                description: '改善位置，创造威胁，保持灵活性'
            }
        };
    }

    /**
     * 加载学习数据
     */
    loadLearningData() {
        try {
            const saved = localStorage.getItem('ai_learning_data');
            return saved ? JSON.parse(saved) : {
                gameHistory: [],
                strategyPerformance: {},
                opponentPatterns: {},
                lastUpdate: Date.now()
            };
        } catch (error) {
            console.warn('加载学习数据失败，使用默认数据');
            return {
                gameHistory: [],
                strategyPerformance: {},
                opponentPatterns: {},
                lastUpdate: Date.now()
            };
        }
    }

    /**
     * 保存学习数据
     */
    saveLearningData() {
        try {
            localStorage.setItem('ai_learning_data', JSON.stringify(this.learningData));
        } catch (error) {
            console.warn('保存学习数据失败');
        }
    }

    /**
     * 核心决策函数 - 产品级智能决策系统
     */
    makeDecision(gameState, availableMoves) {
        const startTime = performance.now();
        
        try {
            // 1. 深度局面分析
            const evaluation = this.deepGameAnalysis(gameState);
            
            // 2. 【新增】三层决策框架
            const decision = this.intelligentDecisionFramework(gameState, availableMoves, evaluation);
            
            // 3. 记录决策数据
            this.recordDecision(decision, this.getCurrentStrategy(), evaluation);
            
            const endTime = performance.now();
            this.stats.averageMoveTime = (this.stats.averageMoveTime + (endTime - startTime)) / 2;
            
            return decision;
            
        } catch (error) {
            console.error('AI决策出错，使用降级策略:', error);
            return this.fallbackDecision(availableMoves);
        }
    }

    /**
     * 三层智能决策框架 - 产品经理设计
     * Layer 1: 紧急行动判断（必须立即行动的情况）
     * Layer 2: 战术优势评估（利用现有资源的最佳时机）
     * Layer 3: 战略发展选择（长期规划，包括翻牌）
     */
    intelligentDecisionFramework(gameState, availableMoves, evaluation) {
        // === Layer 1: 紧急行动层 ===
        const urgentAction = this.checkUrgentActions(gameState, availableMoves, evaluation);
        if (urgentAction) {
            console.log('🚨 AI选择紧急行动:', urgentAction.type);
            return urgentAction;
        }

        // === Layer 2: 战术优势层 ===
        const tacticalAction = this.checkTacticalOpportunities(gameState, availableMoves, evaluation);
        if (tacticalAction) {
            console.log('⚔️ AI选择战术行动:', tacticalAction.type);
            return tacticalAction;
        }

        // === Layer 3: 战略发展层 ===
        const strategicAction = this.checkStrategicDevelopment(gameState, availableMoves, evaluation);
        console.log('🧠 AI选择战略行动:', strategicAction.type);
        return strategicAction;
    }

    /**
     * Layer 1: 检查紧急行动
     * 必须立即执行的高优先级行动
     */
    checkUrgentActions(gameState, availableMoves, evaluation) {
        // 1. 立即致胜机会
        const winningMoves = availableMoves.filter(move => 
            move.type === 'attack' && move.canWin && this.isGameWinningMove(move, gameState)
        );
        if (winningMoves.length > 0) {
            return this.selectBestAttack(winningMoves);
        }

        // 2. 生存威胁 - 必须防御
        const survivalMoves = availableMoves.filter(move => 
            this.isSurvivalCritical(move, gameState, evaluation)
        );
        if (survivalMoves.length > 0) {
            return survivalMoves[0];
        }

        // 3. 高价值目标即将逃脱
        const criticalAttacks = availableMoves.filter(move => 
            move.type === 'attack' && move.canWin && 
            move.targetLevel <= 3 && this.targetMayEscape(move, gameState)
        );
        if (criticalAttacks.length > 0) {
            return this.selectBestAttack(criticalAttacks);
        }

        return null; // 无紧急行动
    }

    /**
     * Layer 2: 检查战术机会
     * 利用现有卡牌创造优势的机会
     */
    checkTacticalOpportunities(gameState, availableMoves, evaluation) {
        const aiCards = gameState.cardsData.filter(card => 
            card.isRevealed && card.owner === 'ai'
        );

        // 如果没有AI卡牌，必须翻牌
        if (aiCards.length === 0) {
            return this.getBestFlipMove(availableMoves, gameState);
        }

        // AI卡牌利用率检查
        const utilizationRate = this.calculateCardUtilization(aiCards, gameState);
        
        // 如果已有卡牌利用率低，优先行动
        if (utilizationRate < 0.6 && aiCards.length >= 2) {
            // 1. 优先攻击机会
            const goodAttacks = availableMoves.filter(move => 
                move.type === 'attack' && move.canWin && this.isWorthwhileAttack(move)
            );
            if (goodAttacks.length > 0) {
                return this.selectBestAttack(goodAttacks);
            }

            // 2. 位置改善机会
            const positionMoves = availableMoves.filter(move => 
                move.type === 'move' && this.significantPositionImprovement(move, gameState)
            );
            if (positionMoves.length > 0) {
                return this.selectBestMove(positionMoves, gameState);
            }
        }

        // 中局后优先行动而非翻牌
        if (evaluation.gamePhase === 'midgame' || evaluation.gamePhase === 'endgame') {
            const actionMoves = availableMoves.filter(move => move.type !== 'flip');
            if (actionMoves.length > 0) {
                const bestAction = this.calculateExpectedValue(actionMoves, gameState, evaluation);
                const bestFlip = this.getBestFlipMove(availableMoves, gameState);
                
                if (bestAction[0]?.totalScore > (bestFlip?.totalScore || 0) * 0.8) {
                    return bestAction[0];
                }
            }
        }

        return null; // 无明显战术机会
    }

    /**
     * Layer 3: 战略发展选择
     * 包括翻牌和长期规划
     */
    checkStrategicDevelopment(gameState, availableMoves, evaluation) {
        // 使用优化后的期望值计算，但加入战略权重
        const movesWithValue = this.calculateExpectedValue(availableMoves, gameState, evaluation);
        
        // 对翻牌进行战略性调整
        movesWithValue.forEach(move => {
            if (move.type === 'flip') {
                move.totalScore = this.adjustFlipValue(move, gameState, evaluation);
            }
        });

        return this.selectHighestExpectedValue(movesWithValue);
    }

    /**
     * 深度游戏分析 - 更全面的局面评估
     */
    deepGameAnalysis(gameState) {
        const aiCards = gameState.cardsData.filter(card => 
            card.isRevealed && card.owner === 'ai'
        );
        const playerCards = gameState.cardsData.filter(card => 
            card.isRevealed && card.owner === 'player'
        );
        const unflippedCards = gameState.cardsData.filter(card => !card.isRevealed);
        
        // 计算材料优势
        let aiValue = 0, playerValue = 0;
        aiCards.forEach(card => aiValue += (9 - card.level));
        playerCards.forEach(card => playerValue += (9 - card.level));
        
        const materialAdvantage = aiValue - playerValue;
        const totalValue = aiValue + playerValue;
        
        // 计算位置优势
        const positionAdvantage = this.calculatePositionAdvantage(aiCards, playerCards);
        
        // 计算威胁分析
        const threatAnalysis = this.analyzeThreats(gameState);
        
        // 计算翻牌潜力
        const flipPotential = this.analyzeFlipPotential(unflippedCards, gameState);
        
        // 计算移动机会
        const moveOpportunities = this.analyzeMoveOpportunities(aiCards, gameState);
        
        // 计算攻击机会
        const attackOpportunities = this.analyzeAttackOpportunities(aiCards, playerCards);
        
        return {
            materialAdvantage: totalValue > 0 ? materialAdvantage / totalValue : 0,
            positionAdvantage,
            threatLevel: threatAnalysis.level,
            gamePhase: this.determineGamePhase(gameState),
            aiCardCount: aiCards.length,
            playerCardCount: playerCards.length,
            flipPotential,
            moveOpportunities,
            attackOpportunities,
            overallScore: this.calculateOverallScore({
                materialAdvantage: totalValue > 0 ? materialAdvantage / totalValue : 0,
                positionAdvantage,
                threatLevel: threatAnalysis.level,
                flipPotential,
                moveOpportunities,
                attackOpportunities
            })
        };
    }

    /**
     * 分析翻牌潜力
     */
    analyzeFlipPotential(unflippedCards, gameState) {
        if (unflippedCards.length === 0) return 0;
        
        let potential = 0;
        const aiFaction = gameState.aiFaction;
        
        // 如果AI阵营未确定，翻牌潜力很高
        if (!aiFaction) {
            potential += 10;
        }
        
        // 分析未翻牌的位置价值
        unflippedCards.forEach(card => {
            const posValue = this.evaluatePositionValue(card.position);
            potential += posValue * 0.5;
            
            // 中心位置翻牌潜力更高
            if (this.isCenterArea(card.position)) {
                potential += 2;
            }
        });
        
        // 根据游戏阶段调整
        const phase = this.determineGamePhase(gameState);
        if (phase === 'opening') {
            potential *= 1.5; // 开局翻牌更重要
        } else if (phase === 'endgame') {
            potential *= 0.5; // 残局翻牌价值较低
        }
        
        return Math.min(10, Math.max(0, potential));
    }

    /**
     * 分析移动机会
     */
    analyzeMoveOpportunities(aiCards, gameState) {
        if (aiCards.length === 0) return 0;
        
        let opportunities = 0;
        
        aiCards.forEach(card => {
            // 检查是否有好的移动目标
            const validMoves = this.getValidMovePositions(card);
            const bestMoveScore = Math.max(...validMoves.map(pos => 
                this.evaluatePositionValue(pos)
            ));
            
            opportunities += bestMoveScore;
            
            // 如果当前位置不好，移动机会更高
            const currentPosValue = this.evaluatePositionValue(card.position);
            if (currentPosValue < 1) {
                opportunities += 2; // 鼓励从差位置移动
            }
        });
        
        return Math.min(10, Math.max(0, opportunities));
    }

    /**
     * 分析攻击机会 - 重新设计，更智能
     */
    analyzeAttackOpportunities(aiCards, playerCards) {
        if (aiCards.length === 0 || playerCards.length === 0) return 0;
        
        let opportunities = 0;
        
        aiCards.forEach(aiCard => {
            const attackTargets = this.getValidAttackTargets(aiCard);
            attackTargets.forEach(target => {
                if (this.canWinBattle(aiCard, target)) {
                    // 计算攻击价值
                    const targetValue = 9 - target.level;
                    opportunities += targetValue * 3; // 提升权重
                    
                    // 特殊规则攻击加分
                    if (this.isSpecialRuleAttack(aiCard, target)) {
                        opportunities += 5;
                    }
                    
                    // 距离奖励（近距离攻击更好）
                    const distance = Math.abs(aiCard.position.row - target.position.row) + 
                                   Math.abs(aiCard.position.col - target.position.col);
                    if (distance === 1) {
                        opportunities += 8; // 相邻攻击奖励
                    }
                    
                    // 目标威胁等级
                    if (target.level <= 3) {
                        opportunities += 10; // 高价值目标
                    } else if (target.level <= 5) {
                        opportunities += 6; // 中等价值目标
                    }
                }
            });
        });
        
        return Math.min(20, Math.max(0, opportunities)); // 提升上限到20
    }

    /**
     * 计算整体评分
     */
    calculateOverallScore(evaluation) {
        const { materialAdvantage, positionAdvantage, threatLevel, flipPotential, moveOpportunities, attackOpportunities } = evaluation;
        
        // 权重分配
        const weights = {
            material: 0.25,      // 材料优势
            position: 0.20,      // 位置优势
            threat: 0.15,        // 威胁程度
            flip: 0.15,          // 翻牌潜力
            move: 0.15,          // 移动机会
            attack: 0.10         // 攻击机会
        };
        
        return materialAdvantage * weights.material +
               positionAdvantage * weights.position +
               (-threatLevel) * weights.threat +
               (flipPotential / 10) * weights.flip +
               (moveOpportunities / 10) * weights.move +
               (attackOpportunities / 10) * weights.attack;
    }

    /**
     * 计算每种移动的预期收益
     */
    calculateExpectedValue(availableMoves, gameState, evaluation) {
        return availableMoves.map(move => {
            const baseScore = this.scoreMove(move, gameState);
            const expectedValue = this.calculateMoveExpectedValue(move, gameState, evaluation);
            
            return {
                ...move,
                baseScore,
                expectedValue,
                totalScore: baseScore + expectedValue
            };
        });
    }

    /**
     * 计算移动的预期收益
     */
    calculateMoveExpectedValue(move, gameState, evaluation) {
        let expectedValue = 0;
        
        switch (move.type) {
            case 'flip':
                expectedValue = this.calculateFlipExpectedValue(move, gameState, evaluation);
                break;
            case 'move':
                expectedValue = this.calculateMoveActionExpectedValue(move, gameState, evaluation);
                break;
            case 'attack':
                expectedValue = this.calculateAttackExpectedValue(move, gameState, evaluation);
                break;
        }
        
        return expectedValue;
    }

    /**
     * 计算翻牌的预期收益 - 产品级优化
     */
    calculateFlipExpectedValue(move, gameState, evaluation) {
        let expectedValue = 0;
        
        // 基础翻牌价值（保持不变）
        expectedValue += this.evaluatePositionValue(move.position) * 2;
        
        // 【关键优化】根据已有AI卡牌数量动态调整翻牌价值
        const aiCards = gameState.cardsData.filter(card => 
            card.isRevealed && card.owner === 'ai'
        );
        
        // 游戏阶段价值 - 大幅重新设计
        const phase = this.determineGamePhase(gameState);
        if (phase === 'opening') {
            // 开局：根据已有卡牌数量调整
            if (aiCards.length === 0) {
                expectedValue += 12; // 必须翻牌确定阵营
            } else if (aiCards.length <= 2) {
                expectedValue += 6; // 适度翻牌
            } else {
                expectedValue += 3; // 减少翻牌倾向
            }
        } else if (phase === 'midgame') {
            // 中局：严格限制翻牌
            if (aiCards.length <= 1) {
                expectedValue += 4; // 卡牌太少才翻牌
            } else {
                expectedValue += 1; // 大幅降低
            }
        } else {
            // 残局：几乎不翻牌
            expectedValue += 0.5;
        }
        
        // 如果AI阵营未确定，翻牌价值极高（保持）
        if (!gameState.aiFaction) {
            expectedValue += 15;
        }
        
        // 【新增】卡牌利用率惩罚
        if (aiCards.length >= 2) {
            const utilization = this.calculateCardUtilization(aiCards, gameState);
            if (utilization < 0.6) {
                expectedValue *= 0.5; // 利用率低时大幅降低翻牌价值
            }
        }
        
        // 【新增】攻击机会存在时的翻牌惩罚
        if (evaluation.attackOpportunities > 5) {
            expectedValue *= 0.6; // 有攻击机会时降低翻牌倾向
        }
        
        // 位置战略价值（轻微调整）
        if (this.isCenterArea(move.position)) {
            expectedValue += 3; // 从5降低到3
        } else if (this.isEdgePosition(move.position)) {
            expectedValue += 2; // 从3降低到2
        }
        
        // 威胁环境考虑（保持）
        if (evaluation.threatLevel > 0.3) {
            expectedValue += 2; // 从3降低到2
        }
        
        return expectedValue;
    }

    /**
     * 计算移动动作的预期收益
     */
    calculateMoveActionExpectedValue(move, gameState, evaluation) {
        let expectedValue = 0;
        
        // 目标位置价值
        expectedValue += this.evaluatePositionValue(move.to) * 3;
        
        // 当前位置价值（如果当前位置不好，移动收益更高）
        const currentPosValue = this.evaluatePositionValue(move.from);
        const targetPosValue = this.evaluatePositionValue(move.to);
        
        if (targetPosValue > currentPosValue) {
            expectedValue += (targetPosValue - currentPosValue) * 4; // 位置改善的收益
        }
        
        // 移动距离（短距离移动更好）
        const distance = Math.abs(move.from.row - move.to.row) + Math.abs(move.from.col - move.to.col);
        if (distance === 1) {
            expectedValue += 2;
        } else if (distance === 2) {
            expectedValue += 1;
        }
        
        // 安全性考虑
        if (this.isSafePosition(move.to, gameState)) {
            expectedValue += 3;
        }
        
        // 战术价值（是否能形成更好的阵型）
        if (this.canFormBetterFormation(move, gameState)) {
            expectedValue += 4;
        }
        
        return expectedValue;
    }

    /**
     * 计算攻击的预期收益 - 大幅提升攻击价值并优化决策速度
     */
    calculateAttackExpectedValue(move, gameState, evaluation) {
        let expectedValue = 0;
        
        if (move.canWin) {
            // 攻击成功的基础收益 - 进一步提升
            expectedValue += 80; // 从50提升到80，增强攻击积极性
            
            // 目标价值 - 高等级目标更有价值（优化计算）
            const targetValue = 9 - move.targetLevel;
            expectedValue += targetValue * 8; // 从5提升到8
            
            // 特殊规则攻击大幅加分
            if (move.isSpecialRule) {
                expectedValue += 25; // 从10提升到25，鼓励特殊规则攻击
            }
            
            // 目标位置价值（快速计算）
            expectedValue += this.evaluatePositionValue(move.to) * 4; // 从3提升到4
            
            // 安全性考虑（简化计算）
            if (this.isSafePosition(move.to, gameState)) {
                expectedValue += 8; // 从5提升到8
            }
            
            // 战术价值 - 关键位置控制
            if (this.isKeyPosition(move.to)) {
                expectedValue += 15; // 从8提升到15
            }
            
            // 攻击距离奖励（相邻攻击最优）
            const attackDistance = Math.abs(move.from.row - move.to.row) + 
                                 Math.abs(move.from.col - move.to.col);
            if (attackDistance === 1) {
                expectedValue += 20; // 从10提升到20，强化近距离攻击
            }
            
            // 目标威胁等级 - 优先消灭威胁大的目标
            if (move.targetLevel <= 2) {
                expectedValue += 30; // 王级目标最高优先级
            } else if (move.targetLevel <= 4) {
                expectedValue += 20; // 高价值目标
            } else if (move.targetLevel <= 6) {
                expectedValue += 12; // 中等价值目标
            }
            
            // 位置控制价值 - 中心区域控制
            if (this.isCenterArea(move.to)) {
                expectedValue += 18; // 从12提升到18
            }
            
            // 新增：连续攻击机会（攻击后能否继续攻击）
            if (this.canContinueAttack(move, gameState)) {
                expectedValue += 15; // 连击机会奖励
            }
            
            // 新增：阻断对手策略（攻击是否能阻断对手重要计划）
            if (this.canDisruptOpponent(move, gameState)) {
                expectedValue += 10; // 干扰对手奖励
            }
            
        } else {
            // 攻击失败严重扣分 - 但不要过度保守
            expectedValue -= 60; // 从50提升到60
            
            // 失败后位置损失
            expectedValue -= this.evaluatePositionValue(move.to) * 4; // 从3提升到4
            
            // 新增：即使失败也要考虑战术价值
            if (move.targetLevel <= 3 && this.isDesperateAttack(evaluation)) {
                expectedValue += 20; // 绝境反击，即使风险高也要尝试
            }
        }
        
        return expectedValue;
    }

    /**
     * 检查是否能继续攻击
     */
    canContinueAttack(move, gameState) {
        // 攻击后的位置是否临近其他敌方目标
        const adjacentEnemies = this.getAdjacentEnemies(move.to, gameState);
        return adjacentEnemies.length > 0;
    }

    /**
     * 检查是否能干扰对手
     */
    canDisruptOpponent(move, gameState) {
        // 攻击目标是否是对手的关键棋子
        return move.targetLevel <= 3 || this.isKeyPosition(move.target?.position);
    }

    /**
     * 检查是否为绝境攻击
     */
    isDesperateAttack(evaluation) {
        // 当AI明显劣势时，需要冒险攻击
        return evaluation.overallScore < -0.4;
    }

    /**
     * 获取相邻敌方单位
     */
    getAdjacentEnemies(position, gameState) {
        const enemies = [];
        const directions = [
            { dr: -1, dc: 0 }, { dr: 1, dc: 0 },
            { dr: 0, dc: -1 }, { dr: 0, dc: 1 }
        ];
        
        directions.forEach(({ dr, dc }) => {
            const newRow = position.row + dr;
            const newCol = position.col + dc;
            
            if (newRow >= 0 && newRow < 5 && newCol >= 0 && newCol < 4) {
                const card = gameState.getCardAt(newRow, newCol);
                if (card && card.isRevealed && card.owner === 'player') {
                    enemies.push(card);
                }
            }
        });
        
        return enemies;
    }

    /**
     * 选择预期收益最高的移动
     */
    selectHighestExpectedValue(movesWithExpectedValue) {
        if (movesWithExpectedValue.length === 0) return null;
        
        // 按总评分排序
        movesWithExpectedValue.sort((a, b) => b.totalScore - a.totalScore);
        
        // 选择最高分的移动
        return movesWithExpectedValue[0];
    }

    /**
     * 检查是否能形成更好的阵型
     */
    canFormBetterFormation(move, gameState) {
        // 简化实现：检查移动后是否能与其他AI卡牌形成连线或包围
        const aiCards = gameState.cardsData.filter(card => 
            card.isRevealed && card.owner === 'ai'
        );
        
        // 检查移动后是否能与相邻AI卡牌形成更好的配合
        const adjacentAICards = aiCards.filter(card => {
            const distance = Math.abs(card.position.row - move.to.row) + 
                           Math.abs(card.position.col - move.to.col);
            return distance === 1;
        });
        
        return adjacentAICards.length > 0;
    }

    /**
     * 获取有效移动位置（从策略类中移过来）
     */
    getValidMovePositions(card) {
        const positions = [];
        const { row, col } = card.position;
        
        // 检查四个方向的移动
        const directions = [
            { dr: -1, dc: 0 }, // 上
            { dr: 1, dc: 0 },  // 下
            { dr: 0, dc: -1 }, // 左
            { dr: 0, dc: 1 }   // 右
        ];
        
        directions.forEach(({ dr, dc }) => {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (newRow >= 0 && newRow < 5 && newCol >= 0 && newCol < 4) {
                positions.push({ row: newRow, col: newCol });
            }
        });
        
        return positions;
    }

    /**
     * 获取有效攻击目标 - 修复实现
     */
    getValidAttackTargets(card) {
        const targets = [];
        const { row, col } = card.position;
        
        // 检查四个方向的攻击
        const directions = [
            { dr: -1, dc: 0 }, // 上
            { dr: 1, dc: 0 },  // 下
            { dr: 0, dc: -1 }, // 左
            { dr: 0, dc: 1 }   // 右
        ];
        
        directions.forEach(({ dr, dc }) => {
            const targetRow = row + dr;
            const targetCol = col + dc;
            
            if (targetRow >= 0 && targetRow < 5 && targetCol >= 0 && targetCol < 4) {
                // 这里需要从gameState中获取目标卡牌信息
                // 简化实现，返回位置信息
                targets.push({ 
                    position: { row: targetRow, col: targetCol },
                    row: targetRow,
                    col: targetCol
                });
            }
        });
        
        return targets;
    }

    /**
     * 快速局面评估 - 核心算法
     */
    quickEvaluation(gameState) {
        const aiCards = gameState.cardsData.filter(card => 
            card.isRevealed && card.owner === 'ai'
        );
        const playerCards = gameState.cardsData.filter(card => 
            card.isRevealed && card.owner === 'player'
        );
        
        // 计算材料优势（等级越低越强）
        let aiValue = 0, playerValue = 0;
        aiCards.forEach(card => aiValue += (9 - card.level));
        playerCards.forEach(card => playerValue += (9 - card.level));
        
        const materialAdvantage = aiValue - playerValue;
        const totalValue = aiValue + playerValue;
        
        // 计算位置优势
        const positionAdvantage = this.calculatePositionAdvantage(aiCards, playerCards);
        
        // 计算威胁分析
        const threatAnalysis = this.analyzeThreats(gameState);
        
        return {
            materialAdvantage: totalValue > 0 ? materialAdvantage / totalValue : 0,
            positionAdvantage,
            threatLevel: threatAnalysis.level,
            gamePhase: this.determineGamePhase(gameState),
            aiCardCount: aiCards.length,
            playerCardCount: playerCards.length,
            overallScore: (materialAdvantage / Math.max(totalValue, 1)) * 0.6 + positionAdvantage * 0.4
        };
    }

    /**
     * 计算位置优势
     */
    calculatePositionAdvantage(aiCards, playerCards) {
        let aiScore = 0, playerScore = 0;
        
        // 中心位置价值更高
        const centerPositions = [{row: 1, col: 1}, {row: 1, col: 2}, {row: 2, col: 1}, {row: 2, col: 2}, {row: 3, col: 1}, {row: 3, col: 2}];
        
        aiCards.forEach(card => {
            const pos = card.position;
            if (centerPositions.some(center => center.row === pos.row && center.col === pos.col)) {
                aiScore += 2; // 中心位置加分
            } else if (pos.row === 0 || pos.row === 4 || pos.col === 0 || pos.col === 3) {
                aiScore += 0.5; // 边缘位置
            } else {
                aiScore += 1; // 普通位置
            }
        });
        
        playerCards.forEach(card => {
            const pos = card.position;
            if (centerPositions.some(center => center.row === pos.row && center.col === pos.col)) {
                playerScore += 2;
            } else if (pos.row === 0 || pos.row === 4 || pos.col === 0 || pos.col === 3) {
                playerScore += 0.5;
            } else {
                playerScore += 1;
            }
        });
        
        const totalScore = aiScore + playerScore;
        return totalScore > 0 ? (aiScore - playerScore) / totalScore : 0;
    }

    /**
     * 分析威胁
     */
    analyzeThreats(gameState) {
        const aiCards = gameState.cardsData.filter(card => 
            card.isRevealed && card.owner === 'ai'
        );
        const playerCards = gameState.cardsData.filter(card => 
            card.isRevealed && card.owner === 'player'
        );
        
        let threatLevel = 0;
        
        // 检查AI卡牌是否面临威胁
        aiCards.forEach(aiCard => {
            const threats = this.countThreats(aiCard, playerCards);
            if (threats > 0) {
                threatLevel += threats * (9 - aiCard.level); // 高等级卡牌被威胁更严重
            }
        });
        
        // 检查玩家卡牌是否面临威胁
        playerCards.forEach(playerCard => {
            const threats = this.countThreats(playerCard, aiCards);
            if (threats > 0) {
                threatLevel -= threats * (9 - playerCard.level);
            }
        });
        
        return {
            level: Math.max(-1, Math.min(1, threatLevel / 10)), // 标准化到-1到1
            aiThreats: aiCards.filter(aiCard => this.countThreats(aiCard, playerCards) > 0).length,
            playerThreats: playerCards.filter(playerCard => this.countThreats(playerCard, aiCards) > 0).length
        };
    }

    /**
     * 计算卡牌面临的威胁数量
     */
    countThreats(card, opponentCards) {
        return opponentCards.filter(opponent => {
            // 检查是否可以攻击（包括特殊规则）
            return this.canAttack(opponent, card);
        }).length;
    }

    /**
     * 检查是否可以攻击
     */
    canAttack(attacker, target) {
        // 正常规则：等级低的吃等级高的
        if (attacker.level < target.level) {
            return true;
        }
        
        // 特殊规则：8级小王虎可吃1级龙王，8级变形龙可吃1级虎王
        if (attacker.level === 8 && target.level === 1) {
            if ((attacker.faction === 'tiger' && target.faction === 'dragon') ||
                (attacker.faction === 'dragon' && target.faction === 'tiger')) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * 确定游戏阶段
     */
    determineGamePhase(gameState) {
        const totalCards = 16;
        const revealedCards = gameState.cardsData.filter(card => card.isRevealed).length;
        
        if (revealedCards <= 4) return 'opening';
        if (revealedCards <= 12) return 'midgame';
        return 'endgame';
    }

    /**
     * 重新设计策略选择 - 更激进的攻击导向
     */
    selectStrategyBySituation(evaluation) {
        const { overallScore, threatLevel, gamePhase, attackOpportunities } = evaluation;
        
        // 大幅降低攻击阈值，更积极主动
        if (attackOpportunities > 5) { // 从8降低到5
            return 'aggressive_attack';
        }
        
        // 即使是小优势也要积极攻击
        if (overallScore > 0.1) { // 从0.3降低到0.1
            return 'aggressive_attack'; // 改为更积极的策略
        } 
        
        // 均势时也要寻找攻击机会
        if (overallScore > -0.2) { // 从-0.3到0.3的范围缩小
            return 'balanced_aggressive'; // 新增：平衡攻击策略
        } 
        
        // 只有明显劣势时才防守
        if (overallScore < -0.4) { // 从-0.3降低到-0.4
            return 'disadvantage';
        }
        
        // 默认使用平衡攻击策略
        return 'balanced_aggressive';
    }

    /**
     * 执行策略决策 - 更新策略选择
     */
    executeStrategy(strategy, availableMoves, gameState) {
        switch (strategy) {
            case 'aggressive_attack':
                return this.executeAggressiveAttackStrategy(availableMoves, gameState);
            case 'balanced_aggressive':
                return this.executeBalancedAggressiveStrategy(availableMoves, gameState);
            case 'advantage':
                return this.executeAdvantageStrategy(availableMoves, gameState);
            case 'disadvantage':
                return this.executeDisadvantageStrategy(availableMoves, gameState);
            case 'equal':
                return this.executeEqualStrategy(availableMoves, gameState);
            default:
                return this.executeBalancedAggressiveStrategy(availableMoves, gameState);
        }
    }

    /**
     * 执行优势策略
     */
    executeAdvantageStrategy(availableMoves, gameState) {
        // 优先选择攻击性移动
        const attackMoves = availableMoves.filter(move => move.type === 'attack');
        if (attackMoves.length > 0) {
            // 选择最有价值的攻击
            return this.selectBestAttack(attackMoves);
        }
        
        // 其次选择位置改善
        const moveMoves = availableMoves.filter(move => move.type === 'move');
        if (moveMoves.length > 0) {
            return this.selectBestMove(moveMoves, gameState);
        }
        
        // 最后选择翻牌
        const flipMoves = availableMoves.filter(move => move.type === 'flip');
        if (flipMoves.length > 0) {
            return this.selectBestFlip(flipMoves, gameState);
        }
        
        return availableMoves[0]; // 降级选择
    }

    /**
     * 执行劣势策略
     */
    executeDisadvantageStrategy(availableMoves, gameState) {
        // 优先选择防守性移动
        const defensiveMoves = availableMoves.filter(move => 
            this.isDefensiveMove(move, gameState)
        );
        
        if (defensiveMoves.length > 0) {
            return this.selectBestDefensiveMove(defensiveMoves, gameState);
        }
        
        // 其次选择翻牌寻找机会
        const flipMoves = availableMoves.filter(move => move.type === 'flip');
        if (flipMoves.length > 0) {
            return this.selectBestFlip(flipMoves, gameState);
        }
        
        // 最后选择相对安全的移动
        return this.selectSafestMove(availableMoves, gameState);
    }

    /**
     * 执行均势策略
     */
    executeEqualStrategy(availableMoves, gameState) {
        // 平衡发展，根据具体局面选择
        const evaluation = this.quickEvaluation(gameState);
        
        if (evaluation.threatLevel > 0.5) {
            // 威胁较高，优先防守
            return this.executeDisadvantageStrategy(availableMoves, gameState);
        } else if (evaluation.threatLevel < -0.3) {
            // 威胁较低，可以进攻
            return this.executeAdvantageStrategy(availableMoves, gameState);
        } else {
            // 平衡发展
            return this.executeBalancedStrategy(availableMoves, gameState);
        }
    }

    /**
     * 执行积极攻击策略
     */
    executeAggressiveAttackStrategy(availableMoves, gameState) {
        // 优先选择攻击移动
        const attackMoves = availableMoves.filter(move => move.type === 'attack');
        if (attackMoves.length > 0) {
            // 选择最有价值的攻击
            return this.selectBestAttack(attackMoves);
        }
        
        // 没有攻击机会时，寻找能创造攻击机会的移动
        const tacticalMoves = availableMoves.filter(move => 
            this.canCreateAttackOpportunity(move, gameState)
        );
        if (tacticalMoves.length > 0) {
            return this.selectBestMove(tacticalMoves, gameState);
        }
        
        // 最后选择翻牌寻找强力卡牌
        const flipMoves = availableMoves.filter(move => move.type === 'flip');
        if (flipMoves.length > 0) {
            return this.selectBestFlip(flipMoves, gameState);
        }
        
        // 降级到平衡策略
        return this.executeBalancedStrategy(availableMoves, gameState);
    }

    /**
     * 执行平衡攻击策略 - 新增策略
     */
    executeBalancedAggressiveStrategy(availableMoves, gameState) {
        // 首先寻找安全的攻击机会
        const safeAttacks = availableMoves.filter(move => 
            move.type === 'attack' && move.canWin && this.isSafeAttack(move, gameState)
        );
        if (safeAttacks.length > 0) {
            return this.selectBestAttack(safeAttacks);
        }
        
        // 其次寻找高价值的冒险攻击
        const riskAttacks = availableMoves.filter(move => 
            move.type === 'attack' && move.canWin && move.targetLevel <= 4
        );
        if (riskAttacks.length > 0) {
            return this.selectBestAttack(riskAttacks);
        }
        
        // 再考虑位置改善
        const improveMoves = availableMoves.filter(move => 
            move.type === 'move' && this.canImprovePosition(move, gameState)
        );
        if (improveMoves.length > 0) {
            return this.selectBestMove(improveMoves, gameState);
        }
        
        // 最后选择翻牌
        const flipMoves = availableMoves.filter(move => move.type === 'flip');
        if (flipMoves.length > 0) {
            return this.selectBestFlip(flipMoves, gameState);
        }
        
        return availableMoves[0]; // 降级选择
    }

    /**
     * 检查是否为安全攻击
     */
    isSafeAttack(move, gameState) {
        return this.isSafePosition(move.to, gameState) || move.targetLevel >= 6;
    }

    /**
     * 检查是否能创造攻击机会
     */
    canCreateAttackOpportunity(move, gameState) {
        if (move.type !== 'move') return false;
        
        // 移动后是否能接近敌方单位
        const nearbyEnemies = this.getAdjacentEnemies(move.to, gameState);
        return nearbyEnemies.length > 0;
    }

    /**
     * 检查是否能改善位置
     */
    canImprovePosition(move, gameState) {
        const currentValue = this.evaluatePositionValue(move.from);
        const targetValue = this.evaluatePositionValue(move.to);
        return targetValue > currentValue;
    }

    /**
     * 执行平衡策略
     */
    executeBalancedStrategy(availableMoves, gameState) {
        // 综合考虑各种因素
        const scoredMoves = availableMoves.map(move => ({
            ...move,
            score: this.scoreMove(move, gameState)
        }));
        
        scoredMoves.sort((a, b) => b.score - a.score);
        
        // 加入随机性，避免过于机械化
        const topMoves = scoredMoves.slice(0, Math.min(3, scoredMoves.length));
        return this.randomSelect(topMoves);
    }

    /**
     * 评分移动
     */
    scoreMove(move, gameState) {
        let score = 0;
        
        switch (move.type) {
            case 'attack':
                score += this.scoreAttackMove(move, gameState);
                break;
            case 'move':
                score += this.scoreMoveAction(move, gameState);
                break;
            case 'flip':
                score += this.scoreFlipMove(move, gameState);
                break;
        }
        
        return score;
    }

    /**
     * 评分攻击移动
     */
    scoreAttackMove(move, gameState) {
        let score = 0;
        
        // 基础攻击价值
        if (move.canWin) {
            score += 10;
            // 高价值目标加分
            if (move.targetLevel <= 3) score += 5;
        } else {
            score -= 15; // 失败攻击严重扣分
        }
        
        // 位置价值
        score += this.evaluatePositionValue(move.to);
        
        // 安全性考虑
        if (this.isSafePosition(move.to, gameState)) {
            score += 3;
        }
        
        return score;
    }

    /**
     * 评分移动动作
     */
    scoreMoveAction(move, gameState) {
        let score = 0;
        
        // 目标位置价值
        score += this.evaluatePositionValue(move.to);
        
        // 移动距离（短距离移动更好）
        const distance = Math.abs(move.from.row - move.to.row) + Math.abs(move.from.col - move.to.col);
        if (distance === 1) score += 2;
        else if (distance === 2) score += 1;
        
        // 安全性
        if (this.isSafePosition(move.to, gameState)) {
            score += 2;
        }
        
        return score;
    }

    /**
     * 评分翻牌移动
     */
    scoreFlipMove(move, gameState) {
        let score = 0;
        
        // 位置价值
        score += this.evaluatePositionValue(move.position);
        
        // 游戏阶段考虑
        const phase = this.determineGamePhase(gameState);
        if (phase === 'opening') {
            score += 5; // 开局翻牌很重要
        } else if (phase === 'midgame') {
            score += 3;
        } else {
            score += 1; // 残局翻牌价值较低
        }
        
        return score;
    }

    /**
     * 评估位置价值
     */
    evaluatePositionValue(position) {
        let value = 0;
        
        // 中心位置价值最高
        if (position.row >= 1 && position.row <= 3 && position.col >= 1 && position.col <= 2) {
            value += 3;
        }
        // 边缘位置
        else if (position.row === 0 || position.row === 4 || position.col === 0 || position.col === 3) {
            value += 1;
        }
        // 角落位置
        else {
            value += 0;
        }
        
        return value;
    }

    /**
     * 检查位置是否安全
     */
    isSafePosition(position, gameState) {
        // 简化实现：检查是否在边缘或角落
        return position.row === 0 || position.row === 4 || 
               position.col === 0 || position.col === 3;
    }

    /**
     * 选择最佳攻击
     */
    selectBestAttack(attackMoves) {
        // 按目标价值排序
        const sortedMoves = attackMoves.sort((a, b) => {
            const aValue = a.targetLevel || 0;
            const bValue = b.targetLevel || 0;
            return aValue - bValue; // 等级越低越有价值
        });
        
        return sortedMoves[0];
    }

    /**
     * 选择最佳移动
     */
    selectBestMove(moveMoves, gameState) {
        const scoredMoves = moveMoves.map(move => ({
            ...move,
            score: this.scoreMoveAction(move, gameState)
        }));
        
        scoredMoves.sort((a, b) => b.score - a.score);
        return scoredMoves[0];
    }

    /**
     * 选择最佳翻牌
     */
    selectBestFlip(flipMoves, gameState) {
        const scoredMoves = flipMoves.map(move => ({
            ...move,
            score: this.scoreFlipMove(move, gameState)
        }));
        
        scoredMoves.sort((a, b) => b.score - a.score);
        return scoredMoves[0];
    }

    /**
     * 选择最佳防守移动
     */
    selectBestDefensiveMove(defensiveMoves, gameState) {
        const scoredMoves = defensiveMoves.map(move => ({
            ...move,
            score: this.scoreMove(move, gameState)
        }));
        
        scoredMoves.sort((a, b) => b.score - a.score);
        return scoredMoves[0];
    }

    /**
     * 选择最安全的移动
     */
    selectSafestMove(availableMoves, gameState) {
        const safeMoves = availableMoves.filter(move => 
            this.isSafeMove(move, gameState)
        );
        
        if (safeMoves.length > 0) {
            return this.randomSelect(safeMoves);
        }
        
        // 如果没有安全移动，选择风险最低的
        return availableMoves[0];
    }

    /**
     * 检查移动是否安全
     */
    isSafeMove(move, gameState) {
        // 简化实现
        return true;
    }

    /**
     * 检查是否为防守移动
     */
    isDefensiveMove(move, gameState) {
        if (move.type !== 'move') return false;
        
        // 移动到更安全的位置
        const currentSafety = this.evaluatePositionSafety(move.from, gameState);
        const targetSafety = this.evaluatePositionSafety(move.to, gameState);
        
        return targetSafety > currentSafety;
    }

    /**
     * 评估位置安全性
     */
    evaluatePositionSafety(position, gameState) {
        if (!position) return 0;
        
        let safety = 1.0;
        
        // 边缘位置相对安全
        if (this.isEdgePosition(position)) {
            safety += 0.3;
        }
        
        // 中心位置可能面临更多威胁
        if (this.isCenterArea(position)) {
            safety -= 0.2;
        }
        
        return safety;
    }

    /**
     * 随机选择
     */
    randomSelect(items) {
        if (items.length === 0) return null;
        const index = Math.floor(Math.random() * items.length);
        return items[index];
    }

    /**
     * 降级决策
     */
    fallbackDecision(availableMoves) {
        if (availableMoves.length === 0) return null;
        
        // 优先选择翻牌
        const flipMoves = availableMoves.filter(move => move.type === 'flip');
        if (flipMoves.length > 0) {
            return flipMoves[0];
        }
        
        // 其次选择移动
        const moveMoves = availableMoves.filter(move => move.type === 'move');
        if (moveMoves.length > 0) {
            return moveMoves[0];
        }
        
        // 最后选择攻击
        return availableMoves[0];
    }

    /**
     * 记录决策数据
     */
    recordDecision(decision, strategy, evaluation) {
        // 记录决策历史用于学习
        this.learningData.gameHistory.push({
            timestamp: Date.now(),
            decision,
            strategy,
            evaluation,
            difficulty: this.difficulty
        });
        
        // 限制历史记录数量
        if (this.learningData.gameHistory.length > 1000) {
            this.learningData.gameHistory = this.learningData.gameHistory.slice(-500);
        }
        
        // 定期保存
        if (this.learningData.gameHistory.length % 10 === 0) {
            this.saveLearningData();
        }
    }

    /**
     * 更新游戏结果
     */
    updateGameResult(result) {
        this.stats.totalGames++;
        
        if (result === 'win') {
            this.stats.wins++;
        } else if (result === 'loss') {
            this.stats.losses++;
        }
        
        this.stats.winRate = this.stats.wins / this.stats.totalGames;
        
        // 保存统计数据
        this.saveLearningData();
    }

    /**
     * 获取策略统计
     */
    getStats() {
        return { ...this.stats };
    }

    /**
     * 获取策略描述
     */
    getStrategyDescription() {
        const descriptions = {
            easy: {
                name: '智能新手',
                description: '基础策略，适合初学者，会学习改进',
                strengths: ['学习能力强', '策略简单有效', '适应性强'],
                weaknesses: ['计算深度有限', '复杂局面处理能力一般']
            },
            medium: {
                name: '进阶专家',
                description: '平衡策略，攻守兼备，提供适度挑战',
                strengths: ['策略平衡', '计算准确', '战术意识强'],
                weaknesses: ['可能过于保守', '创新性有限']
            },
            hard: {
                name: '大师级AI',
                description: '高级策略，深度计算，极具挑战性',
                strengths: ['计算深度高', '战术精确', '适应性强'],
                weaknesses: ['决策时间较长', '可能过于复杂']
            }
        };

        return descriptions[this.difficulty] || descriptions.medium;
    }

    // ========== 位置判断和辅助方法 ==========

    /**
     * 检查是否为中心区域
     */
    isCenterArea(position) {
        if (!position) return false;
        return position.row >= 1 && position.row <= 3 && 
               position.col >= 1 && position.col <= 2;
    }

    /**
     * 检查是否为关键位置
     */
    isKeyPosition(position) {
        if (!position) return false;
        // 中心区域被认为是关键位置
        return this.isCenterArea(position);
    }

    /**
     * 检查是否为边缘位置
     */
    isEdgePosition(position) {
        if (!position) return false;
        return position.row === 0 || position.row === 4 || 
               position.col === 0 || position.col === 3;
    }

    /**
     * 检查能否获胜战斗
     */
    canWinBattle(attacker, target) {
        if (!attacker || !target) return false;
        
        // 正常规则：等级低的吃等级高的
        if (attacker.level < target.level) {
            return true;
        }
        
        // 特殊规则：8级小王虎可吃1级龙王，8级变形龙可吃1级虎王
        if (attacker.level === 8 && target.level === 1) {
            if ((attacker.faction === 'tiger' && target.faction === 'dragon') ||
                (attacker.faction === 'dragon' && target.faction === 'tiger')) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * 检查是否为特殊规则攻击
     */
    isSpecialRuleAttack(attacker, target) {
        if (!attacker || !target) return false;
        
        return attacker.level === 8 && target.level === 1 &&
               ((attacker.faction === 'tiger' && target.faction === 'dragon') ||
                (attacker.faction === 'dragon' && target.faction === 'tiger'));
    }

    // ========== 智能决策支撑方法 ==========

    /**
     * 检查是否为制胜移动
     */
    isGameWinningMove(move, gameState) {
        // 简化判断：消灭对手最后/仅剩的高价值卡牌
        const playerCards = gameState.cardsData.filter(card => 
            card.isRevealed && card.owner === 'player'
        );
        
        // 如果对手只剩1-2张牌，且目标是高价值牌
        return playerCards.length <= 2 && move.targetLevel <= 4;
    }

    /**
     * 检查是否为生存关键移动
     */
    isSurvivalCritical(move, gameState, evaluation) {
        // 简化判断：AI严重劣势且有防御机会
        return evaluation.overallScore < -0.6 && 
               (move.type === 'move' && this.isDefensiveMove(move, gameState));
    }

    /**
     * 检查目标是否可能逃脱
     */
    targetMayEscape(move, gameState) {
        // 简化判断：目标在边缘位置更可能逃脱
        return this.isEdgePosition(move.to);
    }

    /**
     * 获取最佳翻牌移动
     */
    getBestFlipMove(availableMoves, gameState) {
        const flipMoves = availableMoves.filter(move => move.type === 'flip');
        if (flipMoves.length === 0) return null;
        
        return this.selectBestFlip(flipMoves, gameState);
    }

    /**
     * 计算卡牌利用率
     */
    calculateCardUtilization(aiCards, gameState) {
        if (aiCards.length === 0) return 0;
        
        let utilizedCards = 0;
        
        aiCards.forEach(card => {
            // 检查卡牌是否在有效位置，能够发挥作用
            const hasAttackOpportunity = this.getValidAttackTargets(card).length > 0;
            const isInGoodPosition = this.evaluatePositionValue(card.position) >= 2;
            
            if (hasAttackOpportunity || isInGoodPosition) {
                utilizedCards++;
            }
        });
        
        return utilizedCards / aiCards.length;
    }

    /**
     * 检查是否为值得的攻击
     */
    isWorthwhileAttack(move) {
        // 值得攻击的条件：目标等级4以下，或特殊规则攻击
        return move.targetLevel <= 4 || move.isSpecialRule;
    }

    /**
     * 检查是否为显著位置改善
     */
    significantPositionImprovement(move, gameState) {
        const currentValue = this.evaluatePositionValue(move.from);
        const targetValue = this.evaluatePositionValue(move.to);
        
        // 位置价值提升超过1才算显著
        return (targetValue - currentValue) >= 1;
    }

    /**
     * 调整翻牌价值 - 基于战略考虑
     */
    adjustFlipValue(move, gameState, evaluation) {
        let adjustedValue = move.totalScore;
        
        const aiCards = gameState.cardsData.filter(card => 
            card.isRevealed && card.owner === 'ai'
        );
        
        // 如果已有足够卡牌但利用率不高，降低翻牌价值
        if (aiCards.length >= 3) {
            const utilization = this.calculateCardUtilization(aiCards, gameState);
            if (utilization < 0.7) {
                adjustedValue *= 0.6; // 大幅降低翻牌倾向
            }
        }
        
        // 中后期进一步降低翻牌价值
        if (evaluation.gamePhase === 'midgame') {
            adjustedValue *= 0.8;
        } else if (evaluation.gamePhase === 'endgame') {
            adjustedValue *= 0.5; // 残局几乎不翻牌
        }
        
        // 如果有明显攻击机会存在，降低翻牌价值
        if (evaluation.attackOpportunities > 6) {
            adjustedValue *= 0.7;
        }
        
        return adjustedValue;
    }
}
