/**
 * AIPlayer 类测试
 * 验收标准：AIPlayer能正确分析局面、制定策略和执行合理的游戏操作
 */

import { AIPlayer } from '../../scripts/ai/AIPlayer.js';
import { GameEngine } from '../../scripts/core/GameEngine.js';
import { GameState } from '../../scripts/core/GameState.js';
import { Card } from '../../scripts/core/Card.js';

describe('AIPlayer Class Tests', () => {
  
  let aiPlayer;
  let gameEngine;
  let gameState;

  beforeEach(() => {
    gameEngine = new GameEngine();
    gameState = gameEngine.gameState;
    aiPlayer = new AIPlayer(gameEngine);
  });

  test('应该正确初始化AI玩家', () => {
    expect(aiPlayer).toBeDefined();
    expect(aiPlayer.gameEngine).toBe(gameEngine);
    expect(aiPlayer.difficulty).toBe('medium');
    expect(aiPlayer.strategy).toBeDefined();
  });

  test('应该能正确分析游戏局面', () => {
    // 设置测试场景
    gameEngine.startNewGame();
    gameEngine.playRockPaperScissors('rock');
    gameEngine.initializeBoard();
    
    const analysis = aiPlayer.analyzeGameState();
    
    expect(analysis).toBeDefined();
    expect(analysis.phase).toBe('playing');
    expect(analysis.unrevealedCards).toBe(16);
    expect(analysis.playerCards).toBe(0);
    expect(analysis.aiCards).toBe(0);
    expect(analysis.canFlip).toBe(true);
    expect(analysis.canMove).toBe(false);
  });

  test('应该能正确选择翻牌位置', () => {
    gameEngine.startNewGame();
    gameEngine.playRockPaperScissors('rock');
    gameEngine.initializeBoard();
    gameState.currentPlayer = 'ai';
    
    const flipChoice = aiPlayer.chooseFlipPosition();
    
    expect(flipChoice).toBeDefined();
    expect(flipChoice.row).toBeGreaterThanOrEqual(0);
    expect(flipChoice.row).toBeLessThan(5);
    expect(flipChoice.row).not.toBe(2); // 不应该选择空行
    expect(flipChoice.col).toBeGreaterThanOrEqual(0);
    expect(flipChoice.col).toBeLessThan(4);
  });

  test('应该能正确评估移动选项', () => {
    gameEngine.startNewGame();
    gameEngine.playRockPaperScissors('rock');
    gameEngine.initializeBoard();
    
    // 设置AI阵营并放置一张AI卡牌
    gameState.setPlayerFaction('dragon');
    const aiCard = gameState.cardsData.find(card => card.faction === 'tiger');
    aiCard.reveal('ai');
    gameState.placeCard(aiCard, 0, 0);
    gameState.currentPlayer = 'ai';
    
    const moveOptions = aiPlayer.evaluateMoveOptions();
    
    expect(Array.isArray(moveOptions)).toBe(true);
    if (moveOptions.length > 0) {
      const move = moveOptions[0];
      expect(move.from).toBeDefined();
      expect(move.to).toBeDefined();
      expect(move.score).toBeDefined();
      expect(move.type).toBeDefined();
    }
  });

  test('应该能正确制定AI策略', () => {
    gameEngine.startNewGame();
    gameEngine.playRockPaperScissors('rock');
    gameEngine.initializeBoard();
    gameState.currentPlayer = 'ai';
    
    const decision = aiPlayer.makeDecision();
    
    expect(decision).toBeDefined();
    expect(['flip', 'move', 'wait']).toContain(decision.action);
    
    if (decision.action === 'flip') {
      expect(decision.position).toBeDefined();
      expect(decision.position.row).toBeGreaterThanOrEqual(0);
      expect(decision.position.col).toBeGreaterThanOrEqual(0);
    }
    
    if (decision.action === 'move') {
      expect(decision.from).toBeDefined();
      expect(decision.to).toBeDefined();
    }
  });

  test('应该能正确执行AI回合', async () => {
    gameEngine.startNewGame();
    gameEngine.playRockPaperScissors('rock');
    gameEngine.initializeBoard();
    gameState.currentPlayer = 'ai';
    
    const result = await aiPlayer.executeTurn();
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.action).toBeDefined();
    expect(['flip', 'move']).toContain(result.action);
  });

  test('应该优先攻击能战胜的敌方卡牌', () => {
    gameEngine.startNewGame();
    gameState.setPlayerFaction('dragon');
    
    // 设置战斗场景：AI的5级虎卡攻击玩家的3级龙卡
    const aiCard = new Card('tiger_5', 'tiger', 5);
    const playerCard = new Card('dragon_3', 'dragon', 3);
    
    aiCard.reveal('ai');
    playerCard.reveal('player');
    
    gameState.placeCard(aiCard, 0, 0);
    gameState.placeCard(playerCard, 0, 1);
    gameState.currentPlayer = 'ai';
    
    const attackMoves = aiPlayer.findWinningAttacks();
    
    expect(attackMoves.length).toBeGreaterThan(0);
    const attack = attackMoves[0];
    expect(attack.from.row).toBe(0);
    expect(attack.from.col).toBe(0);
    expect(attack.to.row).toBe(0);
    expect(attack.to.col).toBe(1);
    expect(attack.type).toBe('battle');
    expect(attack.canWin).toBe(true);
  });

  test('应该避免无法获胜的攻击', () => {
    gameEngine.startNewGame();
    gameState.setPlayerFaction('dragon');
    
    // 设置场景：AI的3级虎卡面对玩家的5级龙卡
    const aiCard = new Card('tiger_3', 'tiger', 3);
    const playerCard = new Card('dragon_5', 'dragon', 5);
    
    aiCard.reveal('ai');
    playerCard.reveal('player');
    
    gameState.placeCard(aiCard, 0, 0);
    gameState.placeCard(playerCard, 0, 1);
    gameState.currentPlayer = 'ai';
    
    const safeMoves = aiPlayer.findSafeMoves();
    
    // AI应该选择安全的移动而不是必败的攻击
    const hasAttackMove = safeMoves.some(move => 
      move.from.row === 0 && move.from.col === 0 && 
      move.to.row === 0 && move.to.col === 1
    );
    
    expect(hasAttackMove).toBe(false);
  });

  test('应该正确识别特殊规则机会', () => {
    gameEngine.startNewGame();
    gameState.setPlayerFaction('dragon');
    
    // 设置特殊规则场景：小王虎vs龙王
    const kingTiger = new Card('tiger_8', 'tiger', 8);
    const dragonKing = new Card('dragon_1', 'dragon', 1);
    
    kingTiger.reveal('ai');
    dragonKing.reveal('player');
    
    gameState.placeCard(kingTiger, 0, 0);
    gameState.placeCard(dragonKing, 0, 1);
    gameState.currentPlayer = 'ai';
    
    const specialMoves = aiPlayer.findSpecialRuleOpportunities();
    
    expect(specialMoves.length).toBeGreaterThan(0);
    const specialMove = specialMoves[0];
    expect(specialMove.isSpecialRule).toBe(true);
    expect(specialMove.ruleType).toBe('king_tiger_vs_dragon_king');
  });

  test('应该能调整不同难度的策略', () => {
    const easyAI = new AIPlayer(gameEngine, 'easy');
    const hardAI = new AIPlayer(gameEngine, 'hard');
    
    expect(easyAI.strategy.exploration).toBeGreaterThan(hardAI.strategy.exploration);
    expect(hardAI.strategy.calculation_depth).toBeGreaterThan(easyAI.strategy.calculation_depth);
    expect(hardAI.strategy.risk_assessment).toBeGreaterThan(easyAI.strategy.risk_assessment);
  });

  test('应该能正确计算位置价值', () => {
    gameEngine.startNewGame();
    gameEngine.playRockPaperScissors('rock');
    gameEngine.initializeBoard();
    
    const cornerValue = aiPlayer.calculatePositionValue(0, 0);
    const centerValue = aiPlayer.calculatePositionValue(1, 1);
    const edgeValue = aiPlayer.calculatePositionValue(0, 1);
    
    // 中心位置应该比角落位置价值更高
    expect(centerValue).toBeGreaterThanOrEqual(cornerValue);
    
    // 所有值都应该是数字
    expect(typeof cornerValue).toBe('number');
    expect(typeof centerValue).toBe('number');
    expect(typeof edgeValue).toBe('number');
  });

  test('应该能处理无可用操作的情况', () => {
    gameEngine.startNewGame();
    gameState.phase = 'ended';
    gameState.currentPlayer = 'ai';
    
    const decision = aiPlayer.makeDecision();
    
    expect(decision.action).toBe('wait');
    expect(decision.reason).toContain('无可用操作');
  });

  test('应该能正确模拟移动结果', () => {
    gameEngine.startNewGame();
    gameState.setPlayerFaction('dragon');
    
    const aiCard = new Card('tiger_5', 'tiger', 5);
    const playerCard = new Card('dragon_3', 'dragon', 3);
    
    aiCard.reveal('ai');
    playerCard.reveal('player');
    
    gameState.placeCard(aiCard, 0, 0);
    gameState.placeCard(playerCard, 0, 1);
    
    const simulation = aiPlayer.simulateMove(
      { row: 0, col: 0 }, 
      { row: 0, col: 1 }
    );
    
    expect(simulation).toBeDefined();
    expect(simulation.isValid).toBe(true);
    expect(simulation.moveType).toBe('battle');
    expect(simulation.outcome).toBe('win');
    expect(simulation.score).toBeGreaterThan(0);
  });

  test('应该能生成思考日志', () => {
    gameEngine.startNewGame();
    gameEngine.playRockPaperScissors('rock');
    gameEngine.initializeBoard();
    gameState.currentPlayer = 'ai';
    
    // 启用思考日志
    aiPlayer.enableThinkingLog = true;
    
    const decision = aiPlayer.makeDecision();
    const thinkingLog = aiPlayer.getThinkingLog();
    
    expect(Array.isArray(thinkingLog)).toBe(true);
    expect(thinkingLog.length).toBeGreaterThan(0);
    
    const logEntry = thinkingLog[0];
    expect(logEntry.timestamp).toBeDefined();
    expect(logEntry.step).toBeDefined();
    expect(logEntry.analysis).toBeDefined();
  });

  test('应该能正确评估局面优势', () => {
    gameEngine.startNewGame();
    gameState.setPlayerFaction('dragon');
    
    // 设置AI优势场景
    const aiCard1 = new Card('tiger_7', 'tiger', 7);
    const aiCard2 = new Card('tiger_6', 'tiger', 6);
    const playerCard = new Card('dragon_3', 'dragon', 3);
    
    [aiCard1, aiCard2, playerCard].forEach(card => card.reveal());
    aiCard1.owner = 'ai';
    aiCard2.owner = 'ai';
    playerCard.owner = 'player';
    
    gameState.placeCard(aiCard1, 0, 0);
    gameState.placeCard(aiCard2, 0, 1);
    gameState.placeCard(playerCard, 1, 0);
    
    const advantage = aiPlayer.evaluatePositionAdvantage();
    
    expect(advantage).toBeGreaterThan(0); // AI应该有优势
    expect(typeof advantage).toBe('number');
  });
});

// 扩展测试运行器
if (typeof window !== 'undefined') {
  window.runAIPlayerTests = async function() {
    console.log('🤖 Running AIPlayer Tests...');
    // 这里会和其他测试一起运行
  };
}
