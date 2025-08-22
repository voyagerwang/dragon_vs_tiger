/**
 * GameState 类测试  
 * 验收标准：GameState能正确初始化棋盘、管理卡牌和洗牌
 */

import { GameState } from '../../scripts/core/GameState.js';

describe('GameState Class Tests', () => {
  
  test('应该正确初始化游戏状态', () => {
    const gameState = new GameState();
    
    expect(gameState.phase).toBe('setup');
    expect(gameState.currentPlayer).toBe(null);
    expect(gameState.playerFaction).toBe(null);
    expect(gameState.aiFaction).toBe(null);
    expect(gameState.selectedPosition).toBe(null);
    expect(gameState.winner).toBe(null);
    expect(Array.isArray(gameState.gameLog)).toBe(true);
    expect(gameState.gameLog.length).toBe(0);
  });

  test('应该正确初始化4x5棋盘', () => {
    const gameState = new GameState();
    const board = gameState.board;
    
    // 检查棋盘尺寸
    expect(board.length).toBe(5); // 5行
    expect(board[0].length).toBe(4); // 4列
    
    // 检查第3行（index=2）为空行
    for (let col = 0; col < 4; col++) {
      expect(board[2][col]).toBe(null);
    }
    
    // 检查其他行为可放置区域（undefined表示可放置）
    [0, 1, 3, 4].forEach(row => {
      for (let col = 0; col < 4; col++) {
        expect(board[row][col]).toBe(undefined);
      }
    });
  });

  test('应该正确创建16张卡牌', () => {
    const gameState = new GameState();
    const cards = gameState.cardsData;
    
    expect(cards.length).toBe(16);
    
    // 统计龙虎阵营卡牌数量
    const dragonCards = cards.filter(card => card.faction === 'dragon');
    const tigerCards = cards.filter(card => card.faction === 'tiger');
    
    expect(dragonCards.length).toBe(8);
    expect(tigerCards.length).toBe(8);
    
    // 检查龙阵营等级1-8
    const dragonLevels = dragonCards.map(card => card.level).sort();
    expect(dragonLevels).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    
    // 检查虎阵营等级1-8  
    const tigerLevels = tigerCards.map(card => card.level).sort();
    expect(tigerLevels).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  test('洗牌功能应该正确工作', () => {
    const gameState = new GameState();
    
    // 创建原始顺序的卡牌
    const originalCards = [];
    for (let i = 1; i <= 8; i++) {
      originalCards.push({ id: `dragon_${i}`, level: i });
      originalCards.push({ id: `tiger_${i}`, level: i });
    }
    
    // 多次洗牌，应该产生不同的顺序
    const shuffled1 = gameState.shuffleCards([...originalCards]);
    const shuffled2 = gameState.shuffleCards([...originalCards]);
    
    // 洗牌后长度不变
    expect(shuffled1.length).toBe(16);
    expect(shuffled2.length).toBe(16);
    
    // 洗牌应该大概率产生不同的顺序
    const isDifferent = JSON.stringify(shuffled1) !== JSON.stringify(shuffled2);
    expect(isDifferent).toBe(true);
    
    // 洗牌后包含所有原始元素
    const shuffled1Ids = shuffled1.map(card => card.id).sort();
    const originalIds = originalCards.map(card => card.id).sort();
    expect(shuffled1Ids).toEqual(originalIds);
  });

  test('应该能正确获取指定位置的卡牌', () => {
    const gameState = new GameState();
    
    // 模拟在棋盘上放置卡牌
    const testCard = gameState.cardsData[0];
    testCard.position = { row: 0, col: 1 };
    gameState.board[0][1] = testCard;
    
    const foundCard = gameState.getCardAt(0, 1);
    expect(foundCard).toBe(testCard);
    expect(foundCard.position.row).toBe(0);
    expect(foundCard.position.col).toBe(1);
    
    // 测试空位置
    const emptyCard = gameState.getCardAt(0, 0);
    expect(emptyCard).toBe(undefined);
    
    // 测试空行
    const spaceCard = gameState.getCardAt(2, 1);
    expect(spaceCard).toBe(null);
  });

  test('应该能正确检查位置是否有效', () => {
    const gameState = new GameState();
    
    // 有效位置
    expect(gameState.isValidPosition(0, 0)).toBe(true);
    expect(gameState.isValidPosition(1, 3)).toBe(true);
    expect(gameState.isValidPosition(3, 2)).toBe(true);
    expect(gameState.isValidPosition(4, 1)).toBe(true);
    
    // 空行（第3行）
    expect(gameState.isValidPosition(2, 0)).toBe(true); // 空行也是有效位置
    
    // 无效位置（超出边界）
    expect(gameState.isValidPosition(-1, 0)).toBe(false);
    expect(gameState.isValidPosition(0, -1)).toBe(false);
    expect(gameState.isValidPosition(5, 0)).toBe(false);
    expect(gameState.isValidPosition(0, 4)).toBe(false);
  });

  test('应该能正确添加游戏日志', () => {
    const gameState = new GameState();
    
    // 添加日志条目
    gameState.addLogEntry('flip', 'player', '翻开卡牌', { 
      cardId: 'dragon_3', 
      position: { row: 0, col: 1 } 
    });
    
    expect(gameState.gameLog.length).toBe(1);
    
    const logEntry = gameState.gameLog[0];
    expect(logEntry.type).toBe('flip');
    expect(logEntry.player).toBe('player');
    expect(logEntry.action).toBe('翻开卡牌');
    expect(logEntry.details.cardId).toBe('dragon_3');
    expect(logEntry.timestamp).toBeDefined();
    expect(logEntry.id).toBeDefined();
  });

  test('应该能正确克隆游戏状态', () => {
    const gameState = new GameState();
    gameState.phase = 'playing';
    gameState.currentPlayer = 'player';
    gameState.playerFaction = 'dragon';
    
    const cloned = gameState.clone();
    
    expect(cloned.phase).toBe('playing');
    expect(cloned.currentPlayer).toBe('player');
    expect(cloned.playerFaction).toBe('dragon');
    expect(cloned).not.toBe(gameState); // 应该是不同的对象
    expect(cloned.cardsData).not.toBe(gameState.cardsData); // 深拷贝
  });
});

// 扩展测试运行器
if (typeof window !== 'undefined') {
  window.runGameStateTests = async function() {
    console.log('🧪 Running GameState Tests...');
    // 这里会和Card测试一起运行
  };
}
