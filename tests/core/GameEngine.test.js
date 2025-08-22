/**
 * GameEngine 类测试
 * 验收标准：GameEngine能正确实现翻牌、移动、战斗机制和完整游戏流程
 */

import { GameEngine } from '../../scripts/core/GameEngine.js';

describe('GameEngine Class Tests', () => {
  
  let gameEngine;

  beforeEach(() => {
    gameEngine = new GameEngine();
  });

  test('应该正确初始化游戏引擎', () => {
    expect(gameEngine.gameState).toBeDefined();
    expect(gameEngine.gameState.phase).toBe('setup');
    expect(gameEngine.gameState.cardsData.length).toBe(16);
  });

  test('应该能正确开始新游戏', () => {
    const result = gameEngine.startNewGame();
    
    expect(result.success).toBe(true);
    expect(gameEngine.gameState.phase).toBe('rps');
    expect(gameEngine.gameState.currentPlayer).toBe(null);
    expect(gameEngine.gameState.startTime).toBeDefined();
  });

  test('应该能正确执行猜拳操作', () => {
    gameEngine.startNewGame();
    
    const result = gameEngine.playRockPaperScissors('rock');
    
    expect(result.success).toBe(true);
    expect(result.data.playerChoice).toBe('rock');
    expect(result.data.aiChoice).toBeDefined();
    expect(['player', 'ai', 'draw']).toContain(result.data.winner);
    expect(gameEngine.gameState.phase).toBe('playing');
    expect(gameEngine.gameState.currentPlayer).toBeDefined();
  });

  test('应该能正确初始化并洗牌放置卡牌', () => {
    gameEngine.startNewGame();
    gameEngine.playRockPaperScissors('rock');
    
    // 初始化棋盘
    gameEngine.initializeBoard();
    
    let placedCards = 0;
    for (let row = 0; row < 5; row++) {
      if (row === 2) continue; // 跳过空行
      for (let col = 0; col < 4; col++) {
        const card = gameEngine.gameState.getCardAt(row, col);
        if (card) {
          placedCards++;
          expect(card.isRevealed).toBe(false);
          expect(card.position.row).toBe(row);
          expect(card.position.col).toBe(col);
        }
      }
    }
    
    expect(placedCards).toBe(16);
  });

  test('应该能正确执行翻牌操作', () => {
    gameEngine.startNewGame();
    gameEngine.playRockPaperScissors('rock');
    gameEngine.initializeBoard();
    
    // 找到第一个有卡牌的位置
    let targetRow = -1, targetCol = -1;
    for (let row = 0; row < 5; row++) {
      if (row === 2) continue;
      for (let col = 0; col < 4; col++) {
        if (gameEngine.gameState.getCardAt(row, col)) {
          targetRow = row;
          targetCol = col;
          break;
        }
      }
      if (targetRow >= 0) break;
    }
    
    const result = gameEngine.flipCard(targetRow, targetCol);
    
    expect(result.success).toBe(true);
    expect(result.data.flippedCard).toBeDefined();
    expect(result.data.flippedCard.isRevealed).toBe(true);
    expect(result.data.factionAssigned).toBe(true);
    expect(gameEngine.gameState.playerFaction).toBeDefined();
    expect(gameEngine.gameState.aiFaction).toBeDefined();
  });

  test('应该能正确验证移动操作', () => {
    gameEngine.startNewGame();
    gameEngine.playRockPaperScissors('rock');
    gameEngine.initializeBoard();
    
    // 手动翻开一张卡牌并设置阵营
    const card = gameEngine.gameState.cardsData[0];
    card.reveal('player');
    gameEngine.gameState.setPlayerFaction(card.faction);
    gameEngine.gameState.placeCard(card, 0, 0);
    
    // 测试有效移动
    const validMoves = gameEngine.getValidMoves(0, 0);
    expect(Array.isArray(validMoves)).toBe(true);
    
    // 测试移动验证
    if (validMoves.length > 0) {
      const move = validMoves[0];
      const isValid = gameEngine.isValidMove(0, 0, move.row, move.col);
      expect(isValid).toBe(true);
    }
  });

  test('应该能正确执行移动操作', () => {
    gameEngine.startNewGame();
    gameEngine.playRockPaperScissors('rock');
    gameEngine.initializeBoard();
    
    // 设置测试场景：翻开一张玩家卡牌
    const playerCard = gameEngine.gameState.cardsData.find(card => card.faction === 'dragon');
    playerCard.reveal('player');
    gameEngine.gameState.setPlayerFaction('dragon');
    gameEngine.gameState.placeCard(playerCard, 0, 0);
    gameEngine.gameState.currentPlayer = 'player';
    
    // 找到一个可移动的位置（空位置）
    let targetRow = 1, targetCol = 0;
    if (gameEngine.gameState.getCardAt(targetRow, targetCol)) {
      targetRow = 1; targetCol = 1;
    }
    
    const result = gameEngine.moveCard(0, 0, targetRow, targetCol);
    
    expect(result.success).toBe(true);
    expect(result.data.moveType).toBeDefined();
    expect(gameEngine.gameState.getCardAt(targetRow, targetCol)).toBe(playerCard);
    expect(playerCard.position.row).toBe(targetRow);
    expect(playerCard.position.col).toBe(targetCol);
  });

  test('应该能正确处理战斗', () => {
    gameEngine.startNewGame();
    gameEngine.playRockPaperScissors('rock');
    gameEngine.initializeBoard();
    
    // 设置战斗场景
    const attackerCard = new Card('dragon_5', 'dragon', 5);
    const defenderCard = new Card('tiger_3', 'tiger', 3);
    
    attackerCard.reveal('player');
    defenderCard.reveal('ai');
    
    gameEngine.gameState.setPlayerFaction('dragon');
    gameEngine.gameState.placeCard(attackerCard, 0, 0);
    gameEngine.gameState.placeCard(defenderCard, 0, 1);
    gameEngine.gameState.currentPlayer = 'player';
    
    const result = gameEngine.moveCard(0, 0, 0, 1);
    
    expect(result.success).toBe(true);
    expect(result.data.moveType).toBe('battle');
    expect(result.data.battleResult).toBeDefined();
    expect(result.data.battleResult.winner).toBe('attacker');
    expect(result.data.battleResult.eliminatedCards).toContain('tiger_3');
  });

  test('应该能正确处理特殊战斗规则', () => {
    gameEngine.startNewGame();
    
    // 测试小王虎vs龙王的特殊规则
    const kingTiger = new Card('tiger_8', 'tiger', 8);
    const dragonKing = new Card('dragon_1', 'dragon', 1);
    
    const battleResult = gameEngine.battleResolver.resolveBattle(kingTiger, dragonKing);
    
    expect(battleResult.winner).toBe('attacker');
    expect(battleResult.reason).toContain('特殊规则');
    
    // 测试变形龙vs虎王的特殊规则
    const transformDragon = new Card('dragon_8', 'dragon', 8);
    const tigerKing = new Card('tiger_1', 'tiger', 1);
    
    const battleResult2 = gameEngine.battleResolver.resolveBattle(transformDragon, tigerKing);
    
    expect(battleResult2.winner).toBe('attacker');
    expect(battleResult2.reason).toContain('特殊规则');
  });

  test('应该能正确检查胜负条件', () => {
    gameEngine.startNewGame();
    gameEngine.playRockPaperScissors('rock');
    gameEngine.initializeBoard();
    
    // 模拟游戏结束场景：AI卡牌全部被消灭
    gameEngine.gameState.setPlayerFaction('dragon');
    
    // 清空所有AI阵营的卡牌
    gameEngine.gameState.cardsData.forEach(card => {
      if (card.faction === gameEngine.gameState.aiFaction) {
        card.position = { row: -1, col: -1 };
      }
    });
    
    // 放置一张玩家卡牌
    const playerCard = gameEngine.gameState.cardsData.find(card => card.faction === 'dragon');
    playerCard.reveal('player');
    gameEngine.gameState.placeCard(playerCard, 0, 0);
    
    const winCheck = gameEngine.checkWinCondition();
    
    expect(winCheck.isGameOver).toBe(true);
    expect(winCheck.winner).toBe('player');
  });

  test('应该能正确处理错误情况', () => {
    gameEngine.startNewGame();
    
    // 测试在错误阶段翻牌
    const result1 = gameEngine.flipCard(0, 0);
    expect(result1.success).toBe(false);
    expect(result1.error.code).toBe('INVALID_GAME_PHASE');
    
    // 测试翻牌无效位置
    gameEngine.playRockPaperScissors('rock');
    gameEngine.initializeBoard();
    
    const result2 = gameEngine.flipCard(-1, 0);
    expect(result2.success).toBe(false);
    expect(result2.error.code).toBe('INVALID_POSITION');
    
    // 测试非当前玩家回合操作
    gameEngine.gameState.currentPlayer = 'ai';
    const result3 = gameEngine.flipCard(0, 0);
    expect(result3.success).toBe(false);
    expect(result3.error.code).toBe('NOT_YOUR_TURN');
  });

  test('应该能正确保存和加载游戏状态', () => {
    gameEngine.startNewGame();
    gameEngine.playRockPaperScissors('rock');
    gameEngine.initializeBoard();
    
    // 保存游戏状态
    const saved = gameEngine.saveGameState();
    expect(saved).toBe(true);
    
    // 修改当前状态
    gameEngine.gameState.phase = 'ended';
    
    // 加载游戏状态
    const loaded = gameEngine.loadGameState();
    expect(loaded).toBe(true);
    expect(gameEngine.gameState.phase).toBe('playing');
  });
});

// 扩展测试框架以支持beforeEach
if (typeof window !== 'undefined') {
  const originalFramework = window.testFramework || {};
  window.beforeEach = function(fn) {
    originalFramework._beforeEach = fn;
  };
  
  window.runGameEngineTests = async function() {
    console.log('🎮 Running GameEngine Tests...');
    // 这里会和其他测试一起运行
  };
}
