/**
 * EnhancedAIPlayer类 - 增强版AI对手
 * 基于产品经理优化方案重构的智能AI系统
 */

import { EnhancedStrategy } from './EnhancedStrategy.js';
import { ChessMasterStrategy } from './ChessMasterStrategy.js';

export class EnhancedAIPlayer {
    constructor(gameEngine, difficulty = 'medium') {
        this.gameEngine = gameEngine;
        this.difficulty = difficulty;
        this.strategy = new EnhancedStrategy(difficulty);
        this.chessMasterStrategy = new ChessMasterStrategy(difficulty);
        
        // AI配置
        this.config = {
            thinkingTime: this.getThinkingTime(difficulty),
            maxDepth: this.getMaxDepth(difficulty),
            enableLearning: true,
            enableAdaptation: true
        };
        
        // 思考日志
        this.thinkingLog = [];
        this.enableThinkingLog = true;
        
        // 决策历史
        this.decisionHistory = [];
        
        // 【新增】失败学习机制 - 类人类智能的关键特征
        this.failureMemory = new Map(); // 记录无效移动
        this.successMemory = new Map(); // 记录成功移动
        this.maxFailureMemorySize = 100; // 限制内存大小
        
        // 性能统计
        this.stats = {
            totalMoves: 0,
            wins: 0,
            losses: 0,
            battles: 0,
            flips: 0,
            averageDecisionTime: 0,
            invalidMovesAvoided: 0, // 避免的无效移动次数
            learningEfficiency: 0   // 学习效率
        };
        
        // 初始化
        this.initialize();
    }

    /**
     * 初始化
     */
    initialize() {
        this.logThinking('AI系统初始化完成', 'initialization', {
            difficulty: this.difficulty,
            config: this.config
        });
    }

    /**
     * 根据难度获取思考时间 - 大幅优化响应速度
     */
    getThinkingTime(difficulty) {
        const times = {
            easy: 400,      // 从600ms降低到400ms
            medium: 600,    // 从800ms降低到600ms
            hard: 800       // 从1200ms降低到800ms
        };
        return times[difficulty] || times.medium;
    }

    /**
     * 根据难度获取最大搜索深度
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
     * 执行AI回合 - 【重要修复】添加预演验证机制
     */
    async executeTurn() {
        const startTime = performance.now();
        this.logThinking('开始AI回合', 'turn_start');
        
        try {
            // 获取可用移动
            const availableMoves = this.getAvailableMoves();
            
            // 【新增】预演验证所有移动
            const validatedMoves = this.validateMovesWithGameEngine(availableMoves);
            
            this.logThinking('可用移动分析', 'moves_analysis', {
                totalMoves: availableMoves.length,
                validatedMoves: validatedMoves.length,
                moveTypes: this.categorizeMoves(validatedMoves),
                filteredOut: availableMoves.length - validatedMoves.length
            });
            
            if (validatedMoves.length === 0) {
                this.logThinking('没有可用移动', 'no_moves');
                return { success: false, message: '没有可用移动' };
            }
            
            let decision;
            
            try {
                // 【修复】使用经过验证的移动进行决策
                const chessMasterDecision = this.chessMasterStrategy.makeStrategicDecision(
                    this.gameEngine.gameState, 
                    validatedMoves
                );
                
                // 如果象棋策略有高分决策，优先使用
                if (chessMasterDecision && chessMasterDecision.score > 100) {
                    decision = chessMasterDecision;
                    this.logThinking(`🏛️ 象棋大师策略: ${chessMasterDecision.reason}`, 'chess_strategy');
                } else {
                    // 否则使用增强策略
                    decision = this.strategy.makeDecision(this.gameEngine.gameState, validatedMoves);
                    this.logThinking('🧠 增强策略决策', 'enhanced_strategy');
                }
            } catch (error) {
                this.logThinking(`❌ 策略决策出错: ${error.message}`, 'strategy_error');
                
                // 降级到最简单的决策：优先攻击 > 移动 > 翻牌
                const attackMoves = validatedMoves.filter(move => move.type === 'attack');
                const moveMoves = validatedMoves.filter(move => move.type === 'move');
                const flipMoves = validatedMoves.filter(move => move.type === 'flip');
                
                if (attackMoves.length > 0) {
                    decision = attackMoves[0];
                    this.logThinking('🛡️ 降级策略：选择攻击', 'fallback_attack');
                } else if (moveMoves.length > 0) {
                    decision = moveMoves[0];
                    this.logThinking('🛡️ 降级策略：选择移动', 'fallback_move');
                } else if (flipMoves.length > 0) {
                    decision = flipMoves[0];
                    this.logThinking('🛡️ 降级策略：选择翻牌', 'fallback_flip');
                } else {
                    decision = availableMoves[0];
                    this.logThinking('🛡️ 降级策略：选择第一个可用选项', 'fallback_first');
                }
            }
            
            if (!decision) {
                this.logThinking('策略决策失败，使用降级策略', 'strategy_fallback');
                // 使用最简单的降级决策
                decision = validatedMoves.find(move => move.type === 'flip') || 
                          validatedMoves.find(move => move.type === 'move') || 
                          validatedMoves.find(move => move.type === 'attack') ||
                          validatedMoves[0];
                this.logThinking('降级决策选择', 'fallback_decision', { decision });
                
                if (!decision) {
                    return {
                        success: false,
                        action: 'error',
                        decision: null,
                        result: null,
                        thinkingTime: performance.now() - startTime,
                        message: 'AI无法找到有效决策',
                        error: '没有可执行的移动'
                    };
                }
            }
            
            this.logThinking('策略决策完成', 'decision_complete', {
                decision,
                strategy: this.getCurrentStrategy()
            });
            
            // 执行决策
            const executionResult = await this.executeDecision(decision);
            
            // 记录统计
            this.recordMove(decision, executionResult);
            
            const endTime = performance.now();
            const executionTime = endTime - startTime;
            this.stats.averageDecisionTime = (this.stats.averageDecisionTime + executionTime) / 2;
            
            this.logThinking('AI回合执行完成', 'turn_complete', {
                decision,
                result: executionResult,
                executionTime
            });
            
            // 返回GameEngine期望的结构
            return {
                success: true,
                action: decision.type,
                decision: decision,
                result: executionResult,
                thinkingTime: executionTime,
                message: `AI执行了${decision.description}`
            };
            
        } catch (error) {
            this.logThinking('AI回合执行出错', 'turn_error', error);
            console.error('AI回合执行错误:', error);
            
            // 返回错误结构
            return {
                success: false,
                action: 'error',
                decision: null,
                result: null,
                thinkingTime: performance.now() - startTime,
                message: `AI执行出错: ${error.message}`,
                error: error.message
            };
        }
    }

    /**
     * 获取可用移动
     */
    getAvailableMoves() {
        const gameState = this.gameEngine.gameState;
        const moves = [];
        
        // 获取AI的卡牌
        const aiCards = gameState.cardsData.filter(card => 
            card.isRevealed && card.owner === 'ai'
        );
        
        // 获取可翻牌的位置
        const unflippedPositions = this.getUnflippedPositions();
        unflippedPositions.forEach(pos => {
            moves.push({
                type: 'flip',
                position: pos,
                description: '翻牌'
            });
        });
        
        // 获取AI卡牌的移动和攻击选项
        aiCards.forEach(card => {
            // 移动选项
            const movePositions = this.getValidMovePositions(card);
            movePositions.forEach(pos => {
                moves.push({
                    type: 'move',
                    from: card.position,
                    to: pos,
                    card: card,
                    description: `移动${card.name}到(${pos.row},${pos.col})`
                });
            });
            
            // 攻击选项
            const attackTargets = this.getValidAttackTargets(card);
            attackTargets.forEach(target => {
                moves.push({
                    type: 'attack',
                    from: card.position,
                    to: target.position,
                    card: card,
                    target: target,
                    canWin: this.canWinBattle(card, target),
                    targetLevel: target.level,
                    description: `${card.name}攻击${target.name}`,
                    isSpecialRule: this.isSpecialRuleAttack(card, target)
                });
            });
        });
        
        return moves;
    }

    /**
     * 获取未翻牌的位置
     */
    getUnflippedPositions() {
        const gameState = this.gameEngine.gameState;
        const positions = [];
        
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 4; col++) {
                const card = gameState.cardsData.find(c => 
                    c.position.row === row && c.position.col === col
                );
                
                if (card && !card.isRevealed) {
                    positions.push({ row, col });
                }
            }
        }
        
        return positions;
    }

    /**
     * 获取有效移动位置 - 【重要修复】添加游戏引擎验证
     */
    getValidMovePositions(card) {
        const gameState = this.gameEngine.gameState;
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
            
            // 【关键修复】使用游戏引擎的验证逻辑
            if (this.gameEngine.isValidMove(row, col, newRow, newCol)) {
                positions.push({ row: newRow, col: newCol });
                this.logThinking(`✅ 有效移动: (${row},${col}) → (${newRow},${newCol})`, 'move_validation');
            } else {
                this.logThinking(`❌ 无效移动: (${row},${col}) → (${newRow},${newCol})`, 'move_validation');
            }
        });
        
        return positions;
    }

    /**
     * 获取有效攻击目标 - 【重要修复】添加自杀防护
     */
    getValidAttackTargets(card) {
        const gameState = this.gameEngine.gameState;
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
            
            // 【关键修复】先验证移动有效性，再检查攻击目标
            if (this.gameEngine.isValidMove(row, col, targetRow, targetCol)) {
                const targetCard = gameState.cardsData.find(c => 
                    c.position.row === targetRow && c.position.col === targetCol
                );
                
                if (targetCard && targetCard.isRevealed && targetCard.owner !== card.owner) {
                    // 【重要修复】添加自杀防护：只允许有意义的攻击
                    if (this.isAttackMeaningful(card, targetCard)) {
                        targets.push(targetCard);
                        this.logThinking(`⚔️ 有效攻击目标: ${card.name}(${card.level}级) → ${targetCard.name}(${targetCard.level}级)`, 'attack_validation');
                    } else {
                        this.logThinking(`🚫 阻止自杀攻击: ${card.name}(${card.level}级) 攻击 ${targetCard.name}(${targetCard.level}级)`, 'suicide_prevention');
                    }
                }
            }
        });
        
        return targets;
    }

    /**
     * 【优化】检查是否可以获胜 - 完整战斗规则理解
     */
    canWinBattle(attacker, target) {
        this.logThinking(`🎯 战斗分析: ${attacker.name}(${attacker.level}) vs ${target.name}(${target.level})`, 'battle_analysis');
        
        // 正常规则：等级低的吃等级高的（数字越小等级越高）
        if (attacker.level < target.level) {
            this.logThinking(`✅ 正常规则胜利: ${attacker.level} < ${target.level}`, 'battle_normal_win');
            return true;
        }
        
        // 特殊规则：8级小王虎可吃1级龙王，8级变形龙可吃1级虎王
        if (attacker.level === 8 && target.level === 1) {
            if ((attacker.faction === 'tiger' && target.faction === 'dragon') ||
                (attacker.faction === 'dragon' && target.faction === 'tiger')) {
                this.logThinking(`🔥 特殊规则胜利: 8级${attacker.faction}吃1级${target.faction}`, 'battle_special_win');
                return true;
            }
        }
        
        // 同等级对战：平局，双方都被消灭
        if (attacker.level === target.level) {
            this.logThinking(`⚡ 同等级对战: 双方都被消灭`, 'battle_draw');
            return false; // 技术上不算"获胜"，但是战斗可以进行
        }
        
        this.logThinking(`❌ 战斗失败: ${attacker.level} > ${target.level}且无特殊规则`, 'battle_lose');
        return false;
    }

    /**
     * 检查是否为特殊规则攻击
     */
    isSpecialRuleAttack(attacker, target) {
        return attacker.level === 8 && target.level === 1 &&
               ((attacker.faction === 'tiger' && target.faction === 'dragon') ||
                (attacker.faction === 'dragon' && target.faction === 'tiger'));
    }
    
    /**
     * 【新增】检查攻击是否有意义 - 全局防止小牌攻击大牌
     * @param {Object} attacker - 攻击者
     * @param {Object} target - 攻击目标
     * @returns {boolean} 是否有意义
     */
    isAttackMeaningful(attacker, target) {
        // 【核心防护】严格禁止小牌攻击大牌（除了特殊规则）
        
        // 1. 等级高的攻击等级低的 = 绝对禁止（小牌攻击大牌）
        if (attacker.level > target.level) {
            console.log(`🚫 AI全局防护：禁止小牌攻击大牌 - ${attacker.name}(等级${attacker.level}) 攻击 ${target.name}(等级${target.level})`);
            return false;
        }
        
        // 2. 相同等级攻击 = 禁止（同归于尽）
        if (attacker.level === target.level) {
            console.log(`🚫 AI全局防护：禁止同归于尽 - ${attacker.name}(等级${attacker.level}) 攻击 ${target.name}(等级${target.level})`);
            return false;
        }
        
        // 3. 等级低的攻击等级高的 = 允许（大牌吃小牌）
        if (attacker.level < target.level) {
            console.log(`✅ AI允许攻击：大牌吃小牌 - ${attacker.name}(等级${attacker.level}) 攻击 ${target.name}(等级${target.level})`);
            return true;
        }
        
        // 4. 特殊规则：8级小王虎可吃1级龙王，8级变形龙可吃1级虎王
        if (this.isSpecialRuleAttack(attacker, target)) {
            console.log(`🔥 AI特殊规则：${attacker.name}(等级${attacker.level}) 攻击 ${target.name}(等级${target.level})`);
            return true;
        }
        
        // 5. 其他情况 = 禁止
        console.log(`🚫 AI全局防护：未知情况禁止攻击 - ${attacker.name}(等级${attacker.level}) 攻击 ${target.name}(等级${target.level})`);
        return false;
    }

    /**
     * 【新增核心方法】预演验证所有移动 - 类人类智能的关键
     */
    validateMovesWithGameEngine(moves) {
        const validMoves = [];
        
        moves.forEach(move => {
            const moveKey = this.generateMoveKey(move);
            
            // 【学习机制1】检查是否是已知的无效移动
            if (this.failureMemory.has(moveKey)) {
                this.stats.invalidMovesAvoided++;
                this.logThinking(`🧠 学习避免: ${move.description} (之前失败过)`, 'learning_avoidance');
                return; // 跳过这个移动
            }
            
            let isValid = false;
            
            try {
                if (move.type === 'flip') {
                    // 翻牌验证：检查位置是否有未翻开的牌
                    const card = this.gameEngine.gameState.getCardAt(move.position.row, move.position.col);
                    isValid = card && !card.isRevealed;
                    
                } else if (move.type === 'move' || move.type === 'attack') {
                    // 移动/攻击验证：使用游戏引擎的验证逻辑
                    isValid = this.gameEngine.isValidMove(
                        move.from.row, move.from.col, 
                        move.to.row, move.to.col
                    );
                }
                
                if (isValid) {
                    validMoves.push(move);
                    // 【学习机制2】记录成功的移动
                    this.recordSuccessfulMove(moveKey, move);
                    this.logThinking(`✅ 验证通过: ${move.description}`, 'move_validation_success');
                } else {
                    // 【学习机制3】记录失败的移动
                    this.recordFailedMove(moveKey, move, '验证失败');
                    this.logThinking(`❌ 验证失败: ${move.description}`, 'move_validation_failed');
                }
                
            } catch (error) {
                // 【学习机制4】记录异常的移动
                this.recordFailedMove(moveKey, move, error.message);
                this.logThinking(`⚠️ 验证异常: ${move.description} - ${error.message}`, 'move_validation_error');
            }
        });
        
        // 更新学习效率统计
        this.updateLearningEfficiency();
        
        return validMoves;
    }

    /**
     * 【新增】生成移动的唯一标识符
     */
    generateMoveKey(move) {
        if (move.type === 'flip') {
            return `flip_${move.position.row}_${move.position.col}`;
        } else {
            return `${move.type}_${move.from.row}_${move.from.col}_${move.to.row}_${move.to.col}`;
        }
    }

    /**
     * 【新增】记录失败的移动
     */
    recordFailedMove(moveKey, move, reason) {
        const failureData = {
            move,
            reason,
            timestamp: Date.now(),
            attempts: (this.failureMemory.get(moveKey)?.attempts || 0) + 1
        };
        
        this.failureMemory.set(moveKey, failureData);
        
        // 限制内存大小
        if (this.failureMemory.size > this.maxFailureMemorySize) {
            const oldestKey = this.failureMemory.keys().next().value;
            this.failureMemory.delete(oldestKey);
        }
        
        this.logThinking(`🧠 学习记录失败: ${moveKey} - ${reason}`, 'learning_record_failure');
    }

    /**
     * 【新增】记录成功的移动
     */
    recordSuccessfulMove(moveKey, move) {
        const successData = {
            move,
            timestamp: Date.now(),
            uses: (this.successMemory.get(moveKey)?.uses || 0) + 1
        };
        
        this.successMemory.set(moveKey, successData);
        
        // 如果之前记录为失败，现在成功了，删除失败记录
        if (this.failureMemory.has(moveKey)) {
            this.failureMemory.delete(moveKey);
            this.logThinking(`🎯 纠正学习: ${moveKey} 从失败转为成功`, 'learning_correction');
        }
    }

    /**
     * 【新增】更新学习效率统计
     */
    updateLearningEfficiency() {
        const totalMemories = this.failureMemory.size + this.successMemory.size;
        if (totalMemories > 0) {
            this.stats.learningEfficiency = this.stats.invalidMovesAvoided / totalMemories;
        }
    }

    /**
     * 分类移动
     */
    categorizeMoves(moves) {
        const categories = {
            flip: 0,
            move: 0,
            attack: 0
        };
        
        moves.forEach(move => {
            categories[move.type]++;
        });
        
        return categories;
    }

    /**
     * 获取当前策略
     */
    getCurrentStrategy() {
        const evaluation = this.strategy.quickEvaluation(this.gameEngine.gameState);
        return this.strategy.selectStrategyBySituation(evaluation);
    }

    /**
     * 执行决策
     */
    async executeDecision(decision) {
        this.logThinking('开始执行决策', 'execution_start', decision);
        
        try {
            switch (decision.type) {
                case 'flip':
                    return await this.executeFlipMove(decision);
                case 'move':
                    return await this.executeMoveAction(decision);
                case 'attack':
                    return await this.executeAttackAction(decision);
                default:
                    throw new Error(`未知的移动类型: ${decision.type}`);
            }
        } catch (error) {
            this.logThinking('决策执行失败', 'execution_error', error);
            throw error;
        }
    }

    /**
     * 执行翻牌移动
     */
    async executeFlipMove(decision) {
        this.logThinking('执行翻牌移动', 'flip_execution', decision);
        
        try {
            const result = await this.gameEngine.flipCard(decision.position.row, decision.position.col);
            
            if (result.success) {
                this.stats.flips++;
                this.logThinking('翻牌成功', 'flip_success', result);
            } else {
                this.logThinking('翻牌失败', 'flip_failure', result);
            }
            
            return result;
        } catch (error) {
            this.logThinking('翻牌执行出错', 'flip_error', error);
            throw error;
        }
    }

    /**
     * 执行移动动作
     */
    async executeMoveAction(decision) {
        this.logThinking('执行移动动作', 'move_execution', decision);
        
        try {
            const result = await this.gameEngine.moveCard(
                decision.from.row, 
                decision.from.col,
                decision.to.row, 
                decision.to.col
            );
            
            if (result.success) {
                this.logThinking('移动成功', 'move_success', result);
            } else {
                this.logThinking('移动失败', 'move_failure', result);
            }
            
            return result;
        } catch (error) {
            this.logThinking('移动执行出错', 'move_error', error);
            throw error;
        }
    }

    /**
     * 执行攻击动作
     */
    async executeAttackAction(decision) {
        this.logThinking('执行攻击动作', 'attack_execution', decision);
        
        try {
            const result = await this.gameEngine.moveCard(
                decision.from.row, 
                decision.from.col,
                decision.to.row, 
                decision.to.col
            );
            
            if (result.success) {
                this.stats.battles++;
                this.logThinking('攻击成功', 'attack_success', result);
            } else {
                this.logThinking('攻击失败', 'attack_failure', result);
            }
            
            return result;
        } catch (error) {
            this.logThinking('攻击执行出错', 'attack_error', error);
            throw error;
        }
    }

    /**
     * 执行降级移动
     */
    executeFallbackMove(availableMoves) {
        this.logThinking('执行降级移动', 'fallback_execution');
        
        if (availableMoves.length === 0) {
            return { success: false, message: '没有可用移动' };
        }
        
        // 优先选择翻牌
        const flipMoves = availableMoves.filter(move => move.type === 'flip');
        if (flipMoves.length > 0) {
            return this.executeFlipMove(flipMoves[0]);
        }
        
        // 其次选择移动
        const moveMoves = availableMoves.filter(move => move.type === 'move');
        if (moveMoves.length > 0) {
            return this.executeMoveAction(moveMoves[0]);
        }
        
        // 最后选择攻击
        return this.executeAttackAction(availableMoves[0]);
    }

    /**
     * 记录移动
     */
    recordMove(decision, result) {
        this.stats.totalMoves++;
        
        this.decisionHistory.push({
            timestamp: Date.now(),
            decision,
            result,
            gameState: this.gameEngine.gameState.clone()
        });
        
        // 限制历史记录数量
        if (this.decisionHistory.length > 100) {
            this.decisionHistory = this.decisionHistory.slice(-50);
        }
    }

    /**
     * 更新游戏结果
     */
    updateGameResult(result) {
        if (result === 'win') {
            this.stats.wins++;
        } else if (result === 'loss') {
            this.stats.losses++;
        }
        
        // 更新策略统计
        this.strategy.updateGameResult(result);
        
        this.logThinking('游戏结果更新', 'game_result', {
            result,
            stats: this.stats
        });
    }

    /**
     * 思考日志记录
     */
    logThinking(message, step, data = {}) {
        if (!this.enableThinkingLog) return;

        const logEntry = {
            timestamp: new Date().toISOString(),
            step,
            message,
            data,
            difficulty: this.difficulty
        };

        this.thinkingLog.push(logEntry);

        // 实时广播到调试界面
        if (window.aiDebugger && typeof window.aiDebugger.onAIThinking === 'function') {
            window.aiDebugger.onAIThinking(logEntry);
        }

        // 控制台输出
        if (window.DRAGON_TIGER_CONFIG?.debug) {
            console.log(`[AI思考] ${step}: ${message}`, data);
        }
    }

    /**
     * 获取思考日志
     */
    getThinkingLog() {
        return [...this.thinkingLog];
    }

    /**
     * 获取统计信息
     */
    getStats() {
        return {
            ...this.stats,
            strategyStats: this.strategy.getStats()
        };
    }

    /**
     * 获取策略描述
     */
    getStrategyDescription() {
        return this.strategy.getStrategyDescription();
    }

    /**
     * 调整难度
     */
    adjustDifficulty(newDifficulty) {
        this.difficulty = newDifficulty;
        this.strategy = new EnhancedStrategy(newDifficulty);
        this.config.thinkingTime = this.getThinkingTime(newDifficulty);
        this.config.maxDepth = this.getMaxDepth(newDifficulty);
        
        this.logThinking('难度调整完成', 'difficulty_adjustment', {
            newDifficulty,
            newConfig: this.config
        });
    }

    /**
     * 重置统计
     */
    resetStats() {
        this.stats = {
            totalMoves: 0,
            wins: 0,
            losses: 0,
            battles: 0,
            flips: 0,
            averageDecisionTime: 0
        };
        
        this.thinkingLog = [];
        this.decisionHistory = [];
        
        this.logThinking('统计重置完成', 'stats_reset');
    }
}
