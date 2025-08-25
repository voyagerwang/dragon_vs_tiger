/**
 * ChessMasterStrategy - 基于象棋原理的龙虎斗AI策略
 * 核心思想：子力价值、兑子策略、局面控制、信息博弈
 */

export class ChessMasterStrategy {
    constructor(difficulty = 'medium') {
        this.difficulty = difficulty;
        
        // 象棋式子力价值表 (数值越低越珍贵，符合龙虎斗规则)
        this.pieceValues = {
            1: 100,  // 龙王/虎王 = 象棋的"帅/将"
            2: 90,   // 高级将领 = 象棋的"车"  
            3: 85,   // 高级将领
            4: 70,   // 中级将领 = 象棋的"马/炮"
            5: 60,   // 中级将领
            6: 45,   // 低级将领 = 象棋的"士/象"
            7: 30,   // 小兵
            8: 20    // 最小兵 = 象棋的"兵/卒"
        };
        
        // 兑子策略参数
        this.exchangeStrategy = {
            advantageThreshold: 20,    // 优势阈值
            forceExchangeThreshold: -30, // 强制兑换阈值
            avoidExchangeThreshold: 40   // 避免兑换阈值
        };
        
        // 信息价值评估
        this.informationValue = {
            unknownPositions: 0,
            totalPositions: 16,
            informationRatio: 0
        };
        
        this.stats = {
            favorableExchanges: 0,
            unfavorableExchanges: 0,
            materialAdvantage: 0
        };
    }

    /**
     * 核心决策函数 - 象棋大师思维
     */
    makeStrategicDecision(gameState, availableMoves) {
        // 1. 更新局面评估
        const position = this.evaluatePosition(gameState);
        
        // 2. 象棋式决策树
        const decision = this.chessStyleDecisionTree(position, availableMoves, gameState);
        
        console.log(`🏛️ 象棋AI决策: ${decision.type}, 评估分: ${decision.score?.toFixed(1)}, 原因: ${decision.reason}`);
        
        return decision;
    }

    /**
     * 象棋式决策树
     */
    chessStyleDecisionTree(position, availableMoves, gameState) {
        // Phase 1: 强制战术 (象棋中的"将军"、"捉子")
        const forcedMove = this.checkForcedMoves(position, availableMoves);
        if (forcedMove) {
            return { ...forcedMove, reason: '强制战术' };
        }

        // Phase 2: 有利兑子 (象棋核心策略)
        const exchangeMove = this.findFavorableExchange(position, availableMoves);
        if (exchangeMove) {
            return { ...exchangeMove, reason: '有利兑子' };
        }

        // Phase 3: 局面改善 (象棋中的"占据要点")
        const improvementMove = this.findPositionImprovement(position, availableMoves);
        if (improvementMove) {
            return { ...improvementMove, reason: '局面改善' };
        }

        // Phase 4: 信息获取 vs 保守 (翻牌决策)
        return this.informationGatheringDecision(position, availableMoves, gameState);
    }

    /**
     * 局面评估 - 综合多个象棋要素
     */
    evaluatePosition(gameState) {
        const aiCards = gameState.cardsData.filter(card => 
            card.isRevealed && card.owner === 'ai'
        );
        const playerCards = gameState.cardsData.filter(card => 
            card.isRevealed && card.owner === 'player'
        );
        const unknownCards = gameState.cardsData.filter(card => !card.isRevealed);

        // 1. 子力价值计算
        const aiMaterial = this.calculateMaterialValue(aiCards);
        const playerMaterial = this.calculateMaterialValue(playerCards);
        const materialBalance = aiMaterial - playerMaterial;

        // 2. 位置价值 (象棋中的"占据要点")
        const aiPositional = this.calculatePositionalValue(aiCards);
        const playerPositional = this.calculatePositionalValue(playerCards);
        const positionalBalance = aiPositional - playerPositional;

        // 3. 威胁分析 (象棋中的"攻击力")
        const aiThreats = this.calculateThreats(aiCards, playerCards);
        const playerThreats = this.calculateThreats(playerCards, aiCards);

        // 4. 信息优势
        const informationAdvantage = this.calculateInformationAdvantage(gameState);

        return {
            materialBalance,
            positionalBalance,
            threatBalance: aiThreats - playerThreats,
            informationAdvantage,
            totalEvaluation: materialBalance + positionalBalance * 0.3 + (aiThreats - playerThreats) * 0.2,
            aiCards,
            playerCards,
            unknownCards,
            gamePhase: this.determineGamePhase(gameState)
        };
    }

    /**
     * 计算子力价值 - 象棋核心概念
     */
    calculateMaterialValue(cards) {
        return cards.reduce((total, card) => {
            return total + this.pieceValues[card.level];
        }, 0);
    }

    /**
     * 计算位置价值 - 象棋中的"占据要点"
     */
    calculatePositionalValue(cards) {
        return cards.reduce((total, card) => {
            let posValue = 0;
            const pos = card.position;
            
            // 中心控制 (象棋中的"占中路")
            if (pos.row >= 1 && pos.row <= 3 && pos.col >= 1 && pos.col <= 2) {
                posValue += 15;
            }
            
            // 前沿位置 (象棋中的"压制对手")
            if (pos.row <= 1 || pos.row >= 3) {
                posValue += 8;
            }
            
            // 根据子力价值调整位置价值
            posValue *= (this.pieceValues[card.level] / 100);
            
            return total + posValue;
        }, 0);
    }

    /**
     * 计算威胁 - 象棋中的"攻击力"
     */
    calculateThreats(attackers, targets) {
        let totalThreats = 0;
        
        attackers.forEach(attacker => {
            targets.forEach(target => {
                if (this.canAttack(attacker, target)) {
                    // 威胁价值 = 目标价值 - 攻击者价值
                    const threatValue = this.pieceValues[target.level] - this.pieceValues[attacker.level];
                    if (threatValue > 0) {
                        totalThreats += threatValue;
                    }
                }
            });
        });
        
        return totalThreats;
    }

    /**
     * 检查强制移动 - 象棋中的"将军"、"捉子"
     */
    checkForcedMoves(position, availableMoves) {
        // 1. 必胜攻击 (象棋中的"将死")
        const winningAttacks = availableMoves.filter(move => {
            if (move.type === 'attack' && move.canWin) {
                const exchangeValue = this.pieceValues[move.targetLevel] - this.pieceValues[move.card.level];
                return exchangeValue >= 50; // 巨大优势
            }
            return false;
        });

        if (winningAttacks.length > 0) {
            const bestAttack = this.selectBestExchange(winningAttacks);
            return { ...bestAttack, score: 1000 };
        }

        // 2. 防御紧急威胁 (象棋中的"应将")
        if (position.threatBalance < -50) {
            const defensiveMoves = availableMoves.filter(move => 
                move.type === 'move' && this.isDefensiveMove(move)
            );
            if (defensiveMoves.length > 0) {
                return { ...defensiveMoves[0], score: 800 };
            }
        }

        return null;
    }

    /**
     * 寻找有利兑子 - 象棋核心策略
     */
    findFavorableExchange(position, availableMoves) {
        const attackMoves = availableMoves.filter(move => 
            move.type === 'attack' && move.canWin
        );

        if (attackMoves.length === 0) return null;

        // 计算每个攻击的兑子价值
        const exchangeValues = attackMoves.map(move => {
            const attackerValue = this.pieceValues[move.card.level];
            const targetValue = this.pieceValues[move.targetLevel];
            const exchangeValue = targetValue - attackerValue;
            
            return {
                move,
                exchangeValue,
                score: this.calculateExchangeScore(exchangeValue, position)
            };
        });

        // 排序并选择最佳兑换
        exchangeValues.sort((a, b) => b.score - a.score);
        
        const bestExchange = exchangeValues[0];
        
        // 象棋兑子策略判断
        if (this.shouldMakeExchange(bestExchange.exchangeValue, position)) {
            return { ...bestExchange.move, score: bestExchange.score };
        }

        return null;
    }

    /**
     * 兑子策略判断 - 基于象棋原理
     */
    shouldMakeExchange(exchangeValue, position) {
        const materialBalance = position.materialBalance;

        // 1. 明显有利兑换：永远执行
        if (exchangeValue >= 30) return true;

        // 2. 优势时：避免兑换，保持压力
        if (materialBalance > this.exchangeStrategy.avoidExchangeThreshold) {
            return exchangeValue >= 50; // 只做巨大优势兑换
        }

        // 3. 劣势时：积极兑换，减少对手优势
        if (materialBalance < this.exchangeStrategy.forceExchangeThreshold) {
            return exchangeValue >= 10; // 稍有优势就兑换
        }

        // 4. 均势时：适度兑换
        return exchangeValue >= 20;
    }

    /**
     * 计算兑换分数
     */
    calculateExchangeScore(exchangeValue, position) {
        let score = exchangeValue;
        
        // 根据局面调整
        if (position.materialBalance < 0) {
            score *= 1.2; // 劣势时更看重兑换
        } else if (position.materialBalance > 30) {
            score *= 0.8; // 优势时谨慎兑换
        }
        
        return score;
    }

    /**
     * 寻找位置改善 - 象棋中的"占据要点"
     */
    findPositionImprovement(position, availableMoves) {
        const moveMoves = availableMoves.filter(move => move.type === 'move');
        
        if (moveMoves.length === 0) return null;

        const improvedMoves = moveMoves.map(move => {
            const currentValue = this.evaluatePosition(move.from);
            const newValue = this.evaluatePosition(move.to);
            const improvement = newValue - currentValue;
            
            return {
                move,
                improvement,
                score: improvement + this.pieceValues[move.card.level] * 0.1
            };
        });

        improvedMoves.sort((a, b) => b.score - a.score);
        
        const bestImprovement = improvedMoves[0];
        if (bestImprovement.improvement > 5) {
            return { ...bestImprovement.move, score: bestImprovement.score };
        }

        return null;
    }

    /**
     * 信息获取决策 - 翻牌的智慧
     */
    informationGatheringDecision(position, availableMoves, gameState) {
        const flipMoves = availableMoves.filter(move => move.type === 'flip');
        const actionMoves = availableMoves.filter(move => move.type !== 'flip');

        // 计算信息价值
        const informationNeed = this.calculateInformationNeed(position, gameState);
        
        // 如果信息需求高，优先翻牌
        if (informationNeed > 0.7 && flipMoves.length > 0) {
            const bestFlip = this.selectBestInformationGain(flipMoves, position);
            return { ...bestFlip, score: informationNeed * 100, reason: '信息获取' };
        }

        // 否则执行最佳行动
        if (actionMoves.length > 0) {
            const bestAction = actionMoves[0];
            return { ...bestAction, score: 50, reason: '局面发展' };
        }

        // 最后选择翻牌
        if (flipMoves.length > 0) {
            const bestFlip = this.selectBestInformationGain(flipMoves, position);
            return { ...bestFlip, score: 30, reason: '被动信息获取' };
        }

        // 确保总是返回一个有效的移动
        return availableMoves.length > 0 ? availableMoves[0] : null;
    }

    /**
     * 计算信息需求
     */
    calculateInformationNeed(position, gameState) {
        let need = 0;

        // 1. 如果AI卡牌太少，需要信息
        if (position.aiCards.length <= 2) {
            need += 0.4;
        }

        // 2. 如果不知道对手实力，需要信息
        if (position.playerCards.length <= 1) {
            need += 0.3;
        }

        // 3. 如果局面不明朗，需要信息
        if (Math.abs(position.materialBalance) < 20) {
            need += 0.2;
        }

        // 4. 游戏早期，信息更重要
        const gameProgress = (16 - position.unknownCards.length) / 16;
        if (gameProgress < 0.4) {
            need += 0.3;
        }

        return Math.min(1.0, need);
    }

    /**
     * 选择最佳信息获取位置
     */
    selectBestInformationGain(flipMoves, position) {
        if (!flipMoves || flipMoves.length === 0) {
            return null;
        }
        
        return flipMoves.reduce((best, current) => {
            if (!current) return best;
            
            const currentValue = this.evaluateFlipValue(current.position, position);
            const bestValue = best ? this.evaluateFlipValue(best.position, position) : 0;
            
            return currentValue > bestValue ? current : (best || current);
        }, flipMoves[0]); // 确保有初始值
    }

    /**
     * 评估翻牌位置价值
     */
    evaluateFlipValue(position, gamePosition) {
        let value = 10; // 基础信息价值
        
        // 位置价值
        if (this.isCenterPosition(position)) value += 15;
        if (this.isStrategicPosition(position)) value += 10;
        
        // 战术价值
        if (this.canThreatenOpponent(position, gamePosition)) value += 20;
        
        return value;
    }

    // ========== 辅助方法 ==========

    canAttack(attacker, target) {
        if (!this.areAdjacent(attacker.position, target.position)) return false;
        
        // 正常规则
        if (attacker.level < target.level) return true;
        
        // 特殊规则
        if (attacker.level === 8 && target.level === 1) {
            return (attacker.faction === 'tiger' && target.faction === 'dragon') ||
                   (attacker.faction === 'dragon' && target.faction === 'tiger');
        }
        
        return false;
    }

    areAdjacent(pos1, pos2) {
        const rowDiff = Math.abs(pos1.row - pos2.row);
        const colDiff = Math.abs(pos1.col - pos2.col);
        return (rowDiff + colDiff) === 1;
    }

    isDefensiveMove(move) {
        // 简化：移动到边缘位置算防御
        return this.isEdgePosition(move.to);
    }

    isCenterPosition(position) {
        return position.row >= 1 && position.row <= 3 && 
               position.col >= 1 && position.col <= 2;
    }

    isEdgePosition(position) {
        return position.row === 0 || position.row === 4 || 
               position.col === 0 || position.col === 3;
    }

    isStrategicPosition(position) {
        // 关键位置：能控制多个方向的位置
        return this.isCenterPosition(position) || 
               (position.row === 2 && (position.col === 0 || position.col === 3));
    }

    canThreatenOpponent(position, gamePosition) {
        // 检查翻牌后是否能威胁到对手
        const adjacentPositions = this.getAdjacentPositions(position);
        return adjacentPositions.some(pos => {
            return gamePosition.playerCards.some(card => 
                card.position.row === pos.row && card.position.col === pos.col
            );
        });
    }

    getAdjacentPositions(position) {
        const positions = [];
        const directions = [
            { dr: -1, dc: 0 }, { dr: 1, dc: 0 },
            { dr: 0, dc: -1 }, { dr: 0, dc: 1 }
        ];
        
        directions.forEach(({ dr, dc }) => {
            const newPos = { row: position.row + dr, col: position.col + dc };
            if (newPos.row >= 0 && newPos.row < 5 && newPos.col >= 0 && newPos.col < 4) {
                positions.push(newPos);
            }
        });
        
        return positions;
    }

    selectBestExchange(exchanges) {
        return exchanges.reduce((best, current) => {
            const currentValue = this.pieceValues[current.targetLevel] - this.pieceValues[current.card.level];
            const bestValue = this.pieceValues[best.targetLevel] - this.pieceValues[best.card.level];
            
            return currentValue > bestValue ? current : best;
        });
    }

    calculateInformationAdvantage(gameState) {
        const totalCards = 16;
        const revealedCards = gameState.cardsData.filter(card => card.isRevealed).length;
        return revealedCards / totalCards;
    }

    determineGamePhase(gameState) {
        const revealedCount = gameState.cardsData.filter(card => card.isRevealed).length;
        
        if (revealedCount <= 4) return 'opening';
        if (revealedCount <= 12) return 'midgame';
        return 'endgame';
    }

    /**
     * 获取策略描述
     */
    getStrategyDescription() {
        return {
            name: '象棋大师AI',
            principles: [
                '子力价值最大化',
                '有利兑子策略',
                '局面控制',
                '信息博弈'
            ],
            philosophy: '保存己方实力，最大程度消耗对手，创造持续优势'
        };
    }
}