/**
 * BattleResolver类 - 战斗解析器
 * 负责处理卡牌之间的战斗逻辑，包括特殊规则
 */

export class BattleResolver {
    constructor() {
        this.battleHistory = [];
    }

    /**
     * 解析战斗结果
     * @param {Card} attackerCard - 攻击方卡牌
     * @param {Card} defenderCard - 防守方卡牌
     * @returns {Object} 战斗结果
     */
    resolveBattle(attackerCard, defenderCard) {
        // 参数验证
        this.validateBattleParams(attackerCard, defenderCard);

        const battleId = this.generateBattleId();
        const timestamp = new Date().toISOString();

        // 检查特殊规则
        const specialResult = this.checkSpecialRules(attackerCard, defenderCard);
        if (specialResult) {
            return this.createBattleResult({
                battleId,
                timestamp,
                attackerCard,
                defenderCard,
                winner: specialResult.winner,
                reason: specialResult.reason,
                eliminatedCards: specialResult.eliminatedCards,
                battleType: 'special',
                isSpecialRule: true,
                specialRuleType: specialResult.ruleType
            });
        }

        // 基础等级比较
        const baseResult = this.resolveBasicBattle(attackerCard, defenderCard);
        return this.createBattleResult({
            battleId,
            timestamp,
            attackerCard,
            defenderCard,
            winner: baseResult.winner,
            reason: baseResult.reason,
            eliminatedCards: baseResult.eliminatedCards,
            battleType: 'normal',
            isSpecialRule: false
        });
    }

    /**
     * 验证战斗参数
     * @param {Card} attackerCard - 攻击方
     * @param {Card} defenderCard - 防守方
     */
    validateBattleParams(attackerCard, defenderCard) {
        if (!attackerCard || !defenderCard) {
            throw new Error('战斗参数无效：卡牌不能为空');
        }

        if (attackerCard.faction === defenderCard.faction) {
            throw new Error('同阵营卡牌不能战斗');
        }

        if (!attackerCard.isRevealed || !defenderCard.isRevealed) {
            throw new Error('未翻开的卡牌不能参与战斗');
        }
    }

    /**
     * 检查特殊规则
     * @param {Card} attackerCard - 攻击方
     * @param {Card} defenderCard - 防守方
     * @returns {Object|null} 特殊规则结果或null
     */
    checkSpecialRules(attackerCard, defenderCard) {
        // 特殊规则1：小王虎（8级）可击败龙王（1级）
        if (attackerCard.id === 'tiger_8' && defenderCard.id === 'dragon_1') {
            return {
                winner: 'attacker',
                reason: '特殊规则：小王虎击败龙王',
                eliminatedCards: [defenderCard],
                ruleType: 'king_tiger_vs_dragon_king'
            };
        }

        // 特殊规则2：变形龙（8级）可击败虎王（1级）
        if (attackerCard.id === 'dragon_8' && defenderCard.id === 'tiger_1') {
            return {
                winner: 'attacker',
                reason: '特殊规则：变形龙击败虎王',
                eliminatedCards: [defenderCard],
                ruleType: 'transform_dragon_vs_tiger_king'
            };
        }

        return null;
    }

    /**
     * 解析基础战斗（等级比较）
     * @param {Card} attackerCard - 攻击方
     * @param {Card} defenderCard - 防守方
     * @returns {Object} 基础战斗结果
     */
    resolveBasicBattle(attackerCard, defenderCard) {
        const attackerLevel = attackerCard.level;
        const defenderLevel = defenderCard.level;

        // 基础规则：1>2>3>4>5>6>7>8，但1不能吃8（8可以吃1在特殊规则中处理）
        if (attackerLevel === 1 && defenderLevel === 8) {
            // 1级不能吃8级，防守方获胜
            return {
                winner: 'defender',
                reason: `基础规则：${attackerCard.name}(${attackerLevel}级) 无法击败 ${defenderCard.name}(${defenderLevel}级)`,
                eliminatedCards: [attackerCard]
            };
        } else if (attackerLevel === 8 && defenderLevel === 1) {
            // 8级不能通过基础规则吃1级，防守方获胜（特殊规则另外处理）
            return {
                winner: 'defender',
                reason: `基础规则：${attackerCard.name}(${attackerLevel}级) 无法击败 ${defenderCard.name}(${defenderLevel}级)`,
                eliminatedCards: [attackerCard]
            };
        } else if (attackerLevel < defenderLevel) {
            // 等级越低越强
            return {
                winner: 'attacker',
                reason: `等级优势：${attackerCard.name}(${attackerLevel}级) 击败 ${defenderCard.name}(${defenderLevel}级)`,
                eliminatedCards: [defenderCard]
            };
        } else if (attackerLevel > defenderLevel) {
            return {
                winner: 'defender',
                reason: `等级优势：${defenderCard.name}(${defenderLevel}级) 击败 ${attackerCard.name}(${attackerLevel}级)`,
                eliminatedCards: [attackerCard]
            };
        } else {
            return {
                winner: 'draw',
                reason: `同归于尽：${attackerCard.name} 与 ${defenderCard.name} 等级相同(${attackerLevel}级)`,
                eliminatedCards: [attackerCard, defenderCard]
            };
        }
    }

    /**
     * 创建完整的战斗结果对象
     * @param {Object} params - 战斗结果参数
     * @returns {Object} 完整的战斗结果
     */
    createBattleResult(params) {
        const {
            battleId,
            timestamp,
            attackerCard,
            defenderCard,
            winner,
            reason,
            eliminatedCards,
            battleType,
            isSpecialRule,
            specialRuleType = null
        } = params;

        const result = {
            battleId,
            timestamp,
            attackerCard,
            defenderCard,
            winner,
            reason,
            eliminatedCards: [...eliminatedCards],
            battleLog: this.generateBattleLog(params),
            stats: this.calculateBattleStats(params),
            duration: 0 // 战斗动画持续时间（毫秒）
        };

        // 添加到历史记录
        this.battleHistory.push(result);

        return result;
    }

    /**
     * 生成战斗日志
     * @param {Object} params - 战斗参数
     * @returns {Array} 战斗日志数组
     */
    generateBattleLog(params) {
        const { attackerCard, defenderCard, winner, reason, timestamp } = params;
        
        const log = [];

        // 战斗开始
        log.push({
            timestamp,
            action: 'battle_start',
            details: {
                attacker: {
                    id: attackerCard.id,
                    name: attackerCard.name,
                    level: attackerCard.level,
                    faction: attackerCard.faction
                },
                defender: {
                    id: defenderCard.id,
                    name: defenderCard.name,
                    level: defenderCard.level,
                    faction: defenderCard.faction
                }
            }
        });

        // 战斗过程
        log.push({
            timestamp,
            action: 'battle_resolve',
            details: {
                winner,
                reason,
                method: params.isSpecialRule ? 'special_rule' : 'level_comparison'
            }
        });

        // 战斗结果
        log.push({
            timestamp,
            action: 'battle_end',
            details: {
                eliminatedCards: params.eliminatedCards.map(card => ({
                    id: card.id,
                    name: card.name
                })),
                survivor: winner === 'draw' ? null : 
                         winner === 'attacker' ? attackerCard.id : defenderCard.id
            }
        });

        return log;
    }

    /**
     * 计算战斗统计
     * @param {Object} params - 战斗参数
     * @returns {Object} 统计信息
     */
    calculateBattleStats(params) {
        const { attackerCard, defenderCard, winner, isSpecialRule, specialRuleType } = params;
        
        return {
            levelDifference: Math.abs(attackerCard.level - defenderCard.level),
            battleType: isSpecialRule ? 'special' : 'normal',
            isSpecialRule,
            specialRuleType,
            factionMatchup: `${attackerCard.faction}_vs_${defenderCard.faction}`,
            powerBalance: this.calculatePowerBalance(attackerCard, defenderCard),
            outcome: winner,
            eliminatedCount: params.eliminatedCards.length
        };
    }

    /**
     * 计算力量平衡
     * @param {Card} card1 - 卡牌1
     * @param {Card} card2 - 卡牌2
     * @returns {string} 力量平衡描述
     */
    calculatePowerBalance(card1, card2) {
        const diff = card1.level - card2.level;
        
        if (diff > 3) return 'overwhelming';
        if (diff > 1) return 'advantage';
        if (diff === 0) return 'balanced';
        if (diff > -2) return 'slight_disadvantage';
        return 'major_disadvantage';
    }

    /**
     * 生成战斗ID
     * @returns {string} 唯一的战斗ID
     */
    generateBattleId() {
        return `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 获取战斗历史
     * @param {Object} filters - 过滤条件
     * @returns {Array} 过滤后的战斗历史
     */
    getBattleHistory(filters = {}) {
        let history = [...this.battleHistory];

        if (filters.battleType) {
            history = history.filter(battle => battle.stats.battleType === filters.battleType);
        }

        if (filters.winner) {
            history = history.filter(battle => battle.winner === filters.winner);
        }

        if (filters.specialRuleOnly) {
            history = history.filter(battle => battle.stats.isSpecialRule);
        }

        if (filters.limit) {
            history = history.slice(-filters.limit);
        }

        return history;
    }

    /**
     * 获取战斗统计摘要
     * @returns {Object} 统计摘要
     */
    getBattleStats() {
        const total = this.battleHistory.length;
        if (total === 0) {
            return {
                total: 0,
                byOutcome: {},
                byType: {},
                specialRules: 0,
                averageLevelDifference: 0
            };
        }

        const stats = {
            total,
            byOutcome: {},
            byType: {},
            specialRules: 0,
            averageLevelDifference: 0
        };

        let totalLevelDiff = 0;

        this.battleHistory.forEach(battle => {
            // 按结果统计
            stats.byOutcome[battle.winner] = (stats.byOutcome[battle.winner] || 0) + 1;
            
            // 按类型统计
            stats.byType[battle.stats.battleType] = (stats.byType[battle.stats.battleType] || 0) + 1;
            
            // 特殊规则计数
            if (battle.stats.isSpecialRule) {
                stats.specialRules++;
            }
            
            // 等级差异累计
            totalLevelDiff += battle.stats.levelDifference;
        });

        stats.averageLevelDifference = totalLevelDiff / total;

        return stats;
    }

    /**
     * 清除战斗历史
     * @param {Object} options - 清除选项
     */
    clearHistory(options = {}) {
        if (options.olderThan) {
            const cutoffDate = new Date(Date.now() - options.olderThan);
            this.battleHistory = this.battleHistory.filter(
                battle => new Date(battle.timestamp) > cutoffDate
            );
        } else {
            this.battleHistory = [];
        }
    }

    /**
     * 克隆战斗结果
     * @param {Object} battleResult - 原战斗结果
     * @returns {Object} 克隆的战斗结果
     */
    cloneBattleResult(battleResult) {
        return {
            ...battleResult,
            eliminatedCards: [...battleResult.eliminatedCards],
            battleLog: battleResult.battleLog.map(entry => ({ ...entry, details: { ...entry.details } })),
            stats: { ...battleResult.stats }
        };
    }

    /**
     * 导出战斗结果为JSON
     * @param {Object} battleResult - 战斗结果
     * @returns {string} JSON字符串
     */
    exportBattleResult(battleResult) {
        const exportData = {
            ...battleResult,
            attackerCard: battleResult.attackerCard.toJSON(),
            defenderCard: battleResult.defenderCard.toJSON(),
            eliminatedCards: battleResult.eliminatedCards.map(card => card.toJSON())
        };

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * 模拟战斗（不改变实际游戏状态）
     * @param {Card} attackerCard - 攻击方
     * @param {Card} defenderCard - 防守方
     * @returns {Object} 模拟战斗结果
     */
    simulateBattle(attackerCard, defenderCard) {
        // 创建卡牌副本进行模拟
        const attackerClone = attackerCard.clone();
        const defenderClone = defenderCard.clone();
        
        // 执行战斗但不记录到历史
        const result = this.resolveBattle(attackerClone, defenderClone);
        
        // 移除最后一条历史记录（模拟战斗不应该保存）
        this.battleHistory.pop();
        
        return result;
    }
}
