/**
 * Strategy类 - AI策略引擎
 * 定义不同难度级别的AI策略和决策逻辑
 */

export class Strategy {
    constructor(difficulty = 'medium') {
        this.difficulty = difficulty;
        this.config = this.initializeConfig(difficulty);
        this.patterns = this.initializePatterns();
    }

    /**
     * 初始化策略配置
     * @param {string} difficulty - 难度级别
     * @returns {Object} 策略配置
     */
    initializeConfig(difficulty) {
        const configs = {
            easy: {
                exploration: 0.4,        // 探索性
                aggression: 0.3,         // 攻击性
                safety: 0.5,             // 安全性
                calculation_depth: 1,    // 计算深度
                risk_assessment: 0.3,    // 风险评估
                randomness: 0.3,         // 随机性
                patience: 0.2,           // 耐心度
                tactical_awareness: 0.4   // 战术意识
            },
            medium: {
                exploration: 0.3,
                aggression: 0.6,
                safety: 0.7,
                calculation_depth: 2,
                risk_assessment: 0.6,
                randomness: 0.15,
                patience: 0.5,
                tactical_awareness: 0.7
            },
            hard: {
                exploration: 0.2,
                aggression: 0.8,
                safety: 0.9,
                calculation_depth: 3,
                risk_assessment: 0.9,
                randomness: 0.05,
                patience: 0.8,
                tactical_awareness: 0.9
            }
        };

        return configs[difficulty] || configs.medium;
    }

    /**
     * 初始化决策模式
     * @returns {Object} 决策模式
     */
    initializePatterns() {
        return {
            // 开局策略
            opening: {
                preferredPositions: [
                    { row: 1, col: 1 }, // 中心偏上
                    { row: 3, col: 2 }, // 中心偏下
                    { row: 0, col: 1 }, // 上中
                    { row: 4, col: 2 }  // 下中
                ],
                avoidPositions: [
                    { row: 0, col: 0 }, // 角落
                    { row: 0, col: 3 },
                    { row: 4, col: 0 },
                    { row: 4, col: 3 }
                ]
            },
            
            // 中局策略
            midgame: {
                prioritizeAttacks: true,
                defendKey: true,
                expandTerritory: true
            },
            
            // 残局策略
            endgame: {
                calculatePrecisely: true,
                minimizeRisk: true,
                forceDecision: true
            }
        };
    }

    /**
     * 选择翻牌位置
     * @param {Array} availablePositions - 可用位置列表
     * @returns {Object} 选择的位置
     */
    selectFlipPosition(availablePositions) {
        if (availablePositions.length === 0) {
            throw new Error('没有可用的翻牌位置');
        }

        // 根据游戏阶段调整策略
        const gamePhase = this.determineGamePhase(availablePositions);
        
        switch (gamePhase) {
            case 'opening':
                return this.selectOpeningPosition(availablePositions);
            case 'midgame':
                return this.selectMidgamePosition(availablePositions);
            case 'endgame':
                return this.selectEndgamePosition(availablePositions);
            default:
                return this.selectDefaultPosition(availablePositions);
        }
    }

    /**
     * 确定游戏阶段
     * @param {Array} availablePositions - 可用位置
     * @returns {string} 游戏阶段
     */
    determineGamePhase(availablePositions) {
        const totalCards = 16;
        const revealedCards = totalCards - availablePositions.length;
        
        if (revealedCards <= 4) {
            return 'opening';
        } else if (revealedCards <= 12) {
            return 'midgame';
        } else {
            return 'endgame';
        }
    }

    /**
     * 选择开局位置
     * @param {Array} availablePositions - 可用位置
     * @returns {Object} 选择的位置
     */
    selectOpeningPosition(availablePositions) {
        // 优先选择中心附近的位置
        const preferredPositions = this.patterns.opening.preferredPositions;
        
        for (const preferred of preferredPositions) {
            const found = availablePositions.find(pos => 
                pos.row === preferred.row && pos.col === preferred.col
            );
            if (found) {
                return { row: found.row, col: found.col };
            }
        }

        // 如果没有首选位置，选择价值最高的
        const sortedByValue = availablePositions.sort((a, b) => b.value - a.value);
        
        // 根据探索性调整选择
        const topCount = Math.max(1, Math.floor(sortedByValue.length * this.config.exploration));
        const topPositions = sortedByValue.slice(0, topCount);
        
        return this.randomSelect(topPositions);
    }

    /**
     * 选择中局位置
     * @param {Array} availablePositions - 可用位置
     * @returns {Object} 选择的位置
     */
    selectMidgamePosition(availablePositions) {
        // 中局更注重战术价值
        const evaluatedPositions = availablePositions.map(pos => ({
            ...pos,
            tacticalValue: this.calculateTacticalValue(pos)
        }));

        // 按战术价值排序
        evaluatedPositions.sort((a, b) => b.tacticalValue - a.tacticalValue);

        // 根据战术意识选择
        const selectCount = Math.max(1, 
            Math.floor(evaluatedPositions.length * this.config.tactical_awareness)
        );
        
        const candidates = evaluatedPositions.slice(0, selectCount);
        return this.weightedSelect(candidates, 'tacticalValue');
    }

    /**
     * 选择残局位置
     * @param {Array} availablePositions - 可用位置
     * @returns {Object} 选择的位置
     */
    selectEndgamePosition(availablePositions) {
        // 残局需要精确计算
        if (this.config.calculation_depth >= 3) {
            return this.selectPrecisePosition(availablePositions);
        } else {
            // 低难度时选择相对安全的位置
            const safestPositions = availablePositions.filter(pos => 
                this.calculateSafetyScore(pos) > 0.5
            );
            
            if (safestPositions.length > 0) {
                return this.randomSelect(safestPositions);
            } else {
                return this.randomSelect(availablePositions);
            }
        }
    }

    /**
     * 选择默认位置
     * @param {Array} availablePositions - 可用位置
     * @returns {Object} 选择的位置
     */
    selectDefaultPosition(availablePositions) {
        // 综合考虑价值和安全性
        const scoredPositions = availablePositions.map(pos => ({
            ...pos,
            compositeScore: pos.value * 0.6 + this.calculateSafetyScore(pos) * 0.4
        }));

        scoredPositions.sort((a, b) => b.compositeScore - a.compositeScore);
        
        // 加入随机性
        const selectRange = Math.max(1, 
            Math.floor(scoredPositions.length * (1 - this.config.randomness))
        );
        
        const topPositions = scoredPositions.slice(0, selectRange);
        return this.randomSelect(topPositions);
    }

    /**
     * 从获胜移动中选择
     * @param {Array} winningMoves - 获胜移动列表
     * @returns {Object} 选择的移动
     */
    selectFromWinningMoves(winningMoves) {
        // 优先选择特殊规则攻击
        const specialRuleMoves = winningMoves.filter(move => move.isSpecialRule);
        if (specialRuleMoves.length > 0) {
            return this.selectHighestValue(specialRuleMoves);
        }

        // 其次选择高价值目标
        const highValueMoves = winningMoves.filter(move => 
            this.getTargetValue(move) >= 5
        );
        if (highValueMoves.length > 0) {
            return this.selectHighestValue(highValueMoves);
        }

        // 最后选择任意获胜移动
        return this.selectHighestValue(winningMoves);
    }

    /**
     * 从顶级移动中选择
     * @param {Array} topMoves - 顶级移动列表
     * @returns {Object} 选择的移动
     */
    selectFromTopMoves(topMoves) {
        // 根据攻击性调整选择偏好
        if (this.config.aggression > 0.7) {
            // 高攻击性：优先选择攻击移动
            const attackMoves = topMoves.filter(move => move.type === 'battle');
            if (attackMoves.length > 0) {
                return this.weightedSelect(attackMoves, 'score');
            }
        }

        // 根据安全性调整选择
        if (this.config.safety > 0.7) {
            // 高安全性：优先选择安全移动
            const safeMoves = topMoves.filter(move => 
                this.calculateMoveSafety(move) > 0.6
            );
            if (safeMoves.length > 0) {
                return this.weightedSelect(safeMoves, 'score');
            }
        }

        // 默认选择最高分移动
        return this.selectHighestValue(topMoves);
    }

    /**
     * 计算战术价值
     * @param {Object} position - 位置
     * @returns {number} 战术价值
     */
    calculateTacticalValue(position) {
        let value = position.value || 0;

        // 控制关键位置
        if (this.isKeyPosition(position)) {
            value += 2;
        }

        // 威胁分析
        const threats = this.analyzeThreatAt(position);
        value -= threats * 0.5;

        // 支援价值
        const support = this.analyzeSupportAt(position);
        value += support * 0.3;

        return value;
    }

    /**
     * 计算安全分数
     * @param {Object} position - 位置
     * @returns {number} 安全分数
     */
    calculateSafetyScore(position) {
        let safety = 0.5; // 基础安全性

        // 边缘位置稍微安全一些
        if (this.isEdgePosition(position)) {
            safety += 0.2;
        }

        // 角落位置可能被围攻
        if (this.isCornerPosition(position)) {
            safety -= 0.2;
        }

        // 考虑周围威胁
        const nearbyThreats = this.countNearbyThreats(position);
        safety -= nearbyThreats * 0.15;

        return Math.max(0, Math.min(1, safety));
    }

    /**
     * 精确选择位置
     * @param {Array} availablePositions - 可用位置
     * @returns {Object} 选择的位置
     */
    selectPrecisePosition(availablePositions) {
        // 使用更复杂的评估算法
        const evaluatedPositions = availablePositions.map(pos => ({
            ...pos,
            preciseValue: this.calculatePreciseValue(pos)
        }));

        evaluatedPositions.sort((a, b) => b.preciseValue - a.preciseValue);
        
        // 高难度下选择最优位置
        return { 
            row: evaluatedPositions[0].row, 
            col: evaluatedPositions[0].col 
        };
    }

    /**
     * 计算精确价值
     * @param {Object} position - 位置
     * @returns {number} 精确价值
     */
    calculatePreciseValue(position) {
        const baseValue = position.value || 0;
        const tacticalValue = this.calculateTacticalValue(position);
        const safetyValue = this.calculateSafetyScore(position);
        const strategicValue = this.calculateStrategicValue(position);

        return baseValue * 0.3 + 
               tacticalValue * 0.3 + 
               safetyValue * 0.2 + 
               strategicValue * 0.2;
    }

    /**
     * 计算战略价值
     * @param {Object} position - 位置
     * @returns {number} 战略价值
     */
    calculateStrategicValue(position) {
        let value = 0;

        // 控制中心区域
        if (this.isCenterArea(position)) {
            value += 1;
        }

        // 形成连线
        if (this.canFormLine(position)) {
            value += 0.5;
        }

        // 阻止对手连线
        if (this.canBlockOpponent(position)) {
            value += 0.8;
        }

        return value;
    }

    /**
     * 计算移动安全性
     * @param {Object} move - 移动
     * @returns {number} 安全性分数
     */
    calculateMoveSafety(move) {
        let safety = 0.5;

        // 攻击移动的风险评估
        if (move.type === 'battle') {
            if (move.canWin) {
                safety += 0.4;
            } else {
                safety -= 0.6;
            }
        }

        // 目标位置的安全性
        const positionSafety = this.calculateSafetyScore(move.to);
        safety = (safety + positionSafety) / 2;

        return Math.max(0, Math.min(1, safety));
    }

    /**
     * 获取目标价值
     * @param {Object} move - 移动
     * @returns {number} 目标价值
     */
    getTargetValue(move) {
        // 根据移动类型返回不同的价值
        if (move.type === 'battle' && move.canWin) {
            // 假设从move的reasoning或其他属性中提取目标等级
            return move.score || 5; // 默认中等价值
        }
        return 0;
    }

    /**
     * 选择最高价值项
     * @param {Array} items - 项目列表
     * @returns {Object} 最高价值项
     */
    selectHighestValue(items) {
        if (items.length === 0) {
            throw new Error('没有可选择的项目');
        }

        return items.reduce((best, current) => 
            (current.score || 0) > (best.score || 0) ? current : best
        );
    }

    /**
     * 加权选择
     * @param {Array} items - 项目列表
     * @param {string} weightProperty - 权重属性
     * @returns {Object} 选择的项目
     */
    weightedSelect(items, weightProperty) {
        if (items.length === 0) {
            throw new Error('没有可选择的项目');
        }

        if (items.length === 1) {
            return items[0];
        }

        // 计算权重总和
        const totalWeight = items.reduce((sum, item) => 
            sum + (item[weightProperty] || 0), 0
        );

        if (totalWeight <= 0) {
            return this.randomSelect(items);
        }

        // 加权随机选择
        let random = Math.random() * totalWeight;
        
        for (const item of items) {
            random -= (item[weightProperty] || 0);
            if (random <= 0) {
                return item;
            }
        }

        // 备选方案
        return items[items.length - 1];
    }

    /**
     * 随机选择
     * @param {Array} items - 项目列表
     * @returns {Object} 随机选择的项目
     */
    randomSelect(items) {
        if (items.length === 0) {
            throw new Error('没有可选择的项目');
        }

        const index = Math.floor(Math.random() * items.length);
        return items[index]; // 返回完整的项目对象，而不是只返回 row 和 col
    }

    /**
     * 检查是否为关键位置
     * @param {Object} position - 位置
     * @returns {boolean} 是否为关键位置
     */
    isKeyPosition(position) {
        // 中心区域被认为是关键位置
        return this.isCenterArea(position);
    }

    /**
     * 检查是否为中心区域
     * @param {Object} position - 位置
     * @returns {boolean} 是否为中心区域
     */
    isCenterArea(position) {
        return position.row >= 1 && position.row <= 3 && 
               position.col >= 1 && position.col <= 2;
    }

    /**
     * 检查是否为边缘位置
     * @param {Object} position - 位置
     * @returns {boolean} 是否为边缘位置
     */
    isEdgePosition(position) {
        return position.row === 0 || position.row === 4 || 
               position.col === 0 || position.col === 3;
    }

    /**
     * 检查是否为角落位置
     * @param {Object} position - 位置
     * @returns {boolean} 是否为角落位置
     */
    isCornerPosition(position) {
        return (position.row === 0 || position.row === 4) && 
               (position.col === 0 || position.col === 3);
    }

    /**
     * 分析位置威胁
     * @param {Object} position - 位置
     * @returns {number} 威胁程度
     */
    analyzeThreatAt(position) {
        // 简化实现：基于位置计算威胁
        let threats = 0;

        if (this.isCornerPosition(position)) {
            threats += 1; // 角落容易被围攻
        }

        return threats;
    }

    /**
     * 分析位置支援
     * @param {Object} position - 位置
     * @returns {number} 支援程度
     */
    analyzeSupportAt(position) {
        // 简化实现：中心位置有更多支援可能
        return this.isCenterArea(position) ? 1 : 0.5;
    }

    /**
     * 计算附近威胁
     * @param {Object} position - 位置
     * @returns {number} 附近威胁数量
     */
    countNearbyThreats(position) {
        // 简化实现：边缘位置威胁较少
        return this.isEdgePosition(position) ? 0.5 : 1;
    }

    /**
     * 检查是否能形成连线
     * @param {Object} position - 位置
     * @returns {boolean} 是否能形成连线
     */
    canFormLine(position) {
        // 简化实现：中心位置更容易形成连线
        return this.isCenterArea(position);
    }

    /**
     * 检查是否能阻止对手
     * @param {Object} position - 位置
     * @returns {boolean} 是否能阻止对手
     */
    canBlockOpponent(position) {
        // 简化实现：关键位置能阻止对手
        return this.isKeyPosition(position);
    }

    /**
     * 获取策略描述
     * @returns {Object} 策略描述
     */
    getStrategyDescription() {
        const descriptions = {
            easy: {
                name: '初学者',
                traits: ['随机性较高', '计算深度浅', '偏好安全移动'],
                playstyle: '谨慎保守，适合新手练习'
            },
            medium: {
                name: '进阶者',
                traits: ['平衡攻守', '适度计算', '战术意识中等'],
                playstyle: '攻守兼备，提供适度挑战'
            },
            hard: {
                name: '专家级',
                traits: ['计算精确', '攻击性强', '战术意识高'],
                playstyle: '攻击积极，深度计算，极具挑战性'
            }
        };

        return descriptions[this.difficulty] || descriptions.medium;
    }

    /**
     * 调整策略参数
     * @param {Object} adjustments - 调整参数
     */
    adjustStrategy(adjustments) {
        Object.keys(adjustments).forEach(key => {
            if (this.config.hasOwnProperty(key)) {
                this.config[key] = Math.max(0, Math.min(1, adjustments[key]));
            }
        });
    }

    /**
     * 获取当前策略配置
     * @returns {Object} 策略配置副本
     */
    getConfig() {
        return { ...this.config };
    }
}
