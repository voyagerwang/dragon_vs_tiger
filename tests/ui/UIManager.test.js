/**
 * UIManager 类测试
 * 验收标准：UIManager能正确渲染界面、处理用户交互和响应游戏事件
 */

import { UIManager } from '../../scripts/ui/UIManager.js';
import { GameEngine } from '../../scripts/core/GameEngine.js';

describe('UIManager Class Tests', () => {
  
  let uiManager;
  let gameEngine;
  let mockDocument;

  beforeEach(() => {
    // 创建模拟的DOM环境
    mockDocument = createMockDOM();
    gameEngine = new GameEngine();
    uiManager = new UIManager(gameEngine, mockDocument);
  });

  test('应该正确初始化UI管理器', () => {
    expect(uiManager).toBeDefined();
    expect(uiManager.gameEngine).toBe(gameEngine);
    expect(uiManager.isInitialized).toBe(false);
  });

  test('应该能正确初始化界面元素', () => {
    uiManager.init();
    
    expect(uiManager.isInitialized).toBe(true);
    expect(uiManager.elements.gameBoard).toBeDefined();
    expect(uiManager.elements.gameStatus).toBeDefined();
    expect(uiManager.elements.playerInfo).toBeDefined();
  });

  test('应该能正确渲染游戏棋盘', () => {
    uiManager.init();
    gameEngine.startNewGame();
    gameEngine.playRockPaperScissors('rock');
    gameEngine.initializeBoard();
    
    uiManager.renderBoard();
    
    const boardElement = uiManager.elements.gameBoard;
    expect(boardElement.children.length).toBe(20); // 4x5=20个格子
    
    // 检查第3行（空行）的格子
    const emptyRowCells = Array.from(boardElement.children).slice(8, 12);
    emptyRowCells.forEach(cell => {
      expect(cell.classList.contains('empty-row')).toBe(true);
    });
  });

  test('应该能正确处理卡牌点击事件', () => {
    uiManager.init();
    gameEngine.startNewGame();
    gameEngine.playRockPaperScissors('rock');
    gameEngine.initializeBoard();
    
    let clickHandled = false;
    uiManager.on('cardClicked', () => { clickHandled = true; });
    
    // 模拟点击第一个卡牌
    const firstCell = uiManager.elements.gameBoard.children[0];
    firstCell.click();
    
    expect(clickHandled).toBe(true);
  });

  test('应该能正确显示游戏状态', () => {
    uiManager.init();
    gameEngine.startNewGame();
    
    uiManager.updateGameStatus('测试状态', 'setup');
    
    expect(uiManager.elements.gameStatus.textContent).toContain('测试状态');
    expect(uiManager.elements.gamePhase.textContent).toBe('setup');
  });

  test('应该能正确更新玩家信息', () => {
    uiManager.init();
    
    uiManager.updatePlayerInfo('dragon', 'tiger');
    
    expect(uiManager.elements.playerFaction.textContent).toContain('龙');
    expect(uiManager.elements.aiFaction.textContent).toContain('虎');
  });

  test('应该能正确显示可移动位置', () => {
    uiManager.init();
    gameEngine.startNewGame();
    gameEngine.playRockPaperScissors('rock');
    gameEngine.initializeBoard();
    
    const validMoves = [
      { row: 0, col: 1, type: 'move' },
      { row: 1, col: 0, type: 'battle' }
    ];
    
    uiManager.showValidMoves(validMoves);
    
    const hints = uiManager.elements.moveHints.children;
    expect(hints.length).toBe(2);
    expect(hints[0].classList.contains('move-hint')).toBe(true);
  });

  test('应该能正确处理屏幕尺寸变化', () => {
    uiManager.init();
    
    const originalWidth = 800;
    const newWidth = 400;
    
    // 模拟屏幕尺寸变化
    global.innerWidth = newWidth;
    uiManager.handleResize();
    
    // 验证响应式调整已执行
    expect(uiManager.lastWindowWidth).toBe(newWidth);
  });

  test('应该能正确显示游戏日志', () => {
    uiManager.init();
    
    const logEntry = {
      type: 'flip',
      player: 'player',
      action: '翻开卡牌',
      timestamp: new Date().toISOString()
    };
    
    uiManager.addLogEntry(logEntry);
    
    const logContainer = uiManager.elements.gameLog;
    expect(logContainer.children.length).toBe(1);
    expect(logContainer.children[0].textContent).toContain('翻开卡牌');
  });

  test('应该能正确播放翻牌动画', async () => {
    uiManager.init();
    
    const cell = uiManager.elements.gameBoard.children[0];
    const card = { id: 'dragon_3', name: '金龙', imagePath: 'assets/cards/dragon_3.png' };
    
    const animationPromise = uiManager.playFlipAnimation(cell, card);
    
    expect(cell.classList.contains('flipping')).toBe(true);
    
    // 等待动画完成
    await animationPromise;
    
    expect(cell.classList.contains('revealed')).toBe(true);
    expect(cell.classList.contains('flipping')).toBe(false);
  });

  test('应该能正确响应游戏引擎事件', () => {
    uiManager.init();
    
    let eventReceived = false;
    uiManager.on('gameStateChanged', () => { eventReceived = true; });
    
    // 触发游戏引擎事件
    gameEngine.emit('gameStarted', { gameState: gameEngine.gameState });
    
    expect(eventReceived).toBe(true);
  });

  // 辅助函数：创建模拟DOM环境
  function createMockDOM() {
    const mockElements = {
      getElementById: (id) => {
        const element = {
          id,
          children: [],
          classList: {
            add: jest.fn(),
            remove: jest.fn(),
            contains: jest.fn(() => false),
            toggle: jest.fn()
          },
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          appendChild: jest.fn(),
          removeChild: jest.fn(),
          textContent: '',
          innerHTML: '',
          style: {},
          click: jest.fn()
        };
        
        // 为特定元素添加子元素
        if (id === 'game-board') {
          for (let i = 0; i < 20; i++) {
            element.children.push(createMockCell(i));
          }
        }
        
        return element;
      },
      createElement: (tag) => ({
        tagName: tag,
        classList: {
          add: jest.fn(),
          remove: jest.fn(),
          contains: jest.fn(() => false)
        },
        addEventListener: jest.fn(),
        appendChild: jest.fn(),
        textContent: '',
        innerHTML: '',
        style: {}
      })
    };
    
    return mockElements;
  }
  
  function createMockCell(index) {
    const row = Math.floor(index / 4);
    const col = index % 4;
    
    return {
      dataset: { row: row.toString(), col: col.toString() },
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn(() => row === 2), // 第3行为空行
        toggle: jest.fn()
      },
      addEventListener: jest.fn(),
      click: jest.fn(),
      textContent: '',
      innerHTML: '',
      style: {}
    };
  }
});

// 扩展测试运行器
if (typeof window !== 'undefined') {
  window.runUIManagerTests = async function() {
    console.log('🎨 Running UIManager Tests...');
    // 这里会和其他测试一起运行
  };
}
