/**
 * GameState类 - 龙虎斗游戏状态管理
 * 负责管理完整的游戏状态，包括棋盘、卡牌、回合等
 */

import { Card } from './Card.js';

export class GameState {
  /**
   * 构造函数 - 初始化游戏状态
   */
  constructor() {
    this.phase = 'setup';              // 游戏阶段：setup | rps | playing | ended
    this.currentPlayer = null;         // 当前回合：player | ai
    this.playerFaction = null;         // 玩家阵营：dragon | tiger | null
    this.aiFaction = null;             // AI阵营：dragon | tiger | null
    this.board = this.initBoard();     // 4x5二维数组棋盘
    this.selectedPosition = null;      // 当前选中位置：{row, col} | null
    this.gameLog = [];                 // 游戏日志数组
    this.winner = null;                // 游戏胜者：player | ai | draw | null
    this.cardsData = this.initCards(); // 16张卡牌数据
    this.startTime = new Date().toISOString();
    this.endTime = null;
  }

  /**
   * 初始化4x5棋盘
   * @returns {Array} 二维数组棋盘
   */
  initBoard() {
    // 创建5行4列的棋盘
    // 第3行(index=2)为空行，其他行为可放置区域
    return Array(5).fill(null).map((_, row) => 
      row === 2 ? Array(4).fill(null) : Array(4).fill(undefined)
    );
  }

  /**
   * 初始化16张卡牌并洗牌
   * @returns {Array} 洗牌后的卡牌数组
   */
  initCards() {
    const cards = [];
    
    // 创建龙阵营8张牌
    for (let i = 1; i <= 8; i++) {
      cards.push(new Card(`dragon_${i}`, 'dragon', i));
    }
    
    // 创建虎阵营8张牌
    for (let i = 1; i <= 8; i++) {
      cards.push(new Card(`tiger_${i}`, 'tiger', i));
    }
    
    return this.shuffleCards(cards);
  }

  /**
   * Fisher-Yates洗牌算法
   * @param {Array} cards - 要洗牌的卡牌数组
   * @returns {Array} 洗牌后的数组
   */
  shuffleCards(cards) {
    const shuffled = [...cards]; // 创建副本避免修改原数组
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }

  /**
   * 获取指定位置的卡牌
   * @param {number} row - 行坐标
   * @param {number} col - 列坐标
   * @returns {Card|null|undefined} 卡牌实例、null（空行）或undefined（空位）
   */
  getCardAt(row, col) {
    if (!this.isValidPosition(row, col)) {
      return undefined;
    }
    return this.board[row][col];
  }

  /**
   * 检查位置是否在棋盘范围内
   * @param {number} row - 行坐标
   * @param {number} col - 列坐标
   * @returns {boolean} 是否有效
   */
  isValidPosition(row, col) {
    return row >= 0 && row < 5 && col >= 0 && col < 4;
  }

  /**
   * 在指定位置放置卡牌
   * @param {Card} card - 要放置的卡牌
   * @param {number} row - 行坐标
   * @param {number} col - 列坐标
   */
  placeCard(card, row, col) {
    if (!this.isValidPosition(row, col)) {
      throw new Error('Invalid position');
    }
    
    card.setPosition(row, col);
    this.board[row][col] = card;
  }

  /**
   * 移除指定位置的卡牌
   * @param {number} row - 行坐标
   * @param {number} col - 列坐标
   * @returns {Card|null} 被移除的卡牌
   */
  removeCardAt(row, col) {
    if (!this.isValidPosition(row, col)) {
      return null;
    }
    
    const card = this.board[row][col];
    if (card && card instanceof Card) {
      // 统一设置为null，避免undefined和null混用导致状态不一致
      this.board[row][col] = null;
      card.setPosition(-1, -1);
      return card;
    }
    
    return null;
  }

  /**
   * 添加游戏日志条目
   * @param {string} type - 日志类型
   * @param {string} player - 执行玩家
   * @param {string} action - 行动描述
   * @param {Object} details - 详细信息
   */
  addLogEntry(type, player, action, details = {}) {
    const logEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type,
      player,
      action,
      details
    };
    
    this.gameLog.push(logEntry);
  }

  /**
   * 设置玩家阵营
   * @param {string} playerFaction - 玩家阵营
   */
  setPlayerFaction(playerFaction) {
    this.playerFaction = playerFaction;
    this.aiFaction = playerFaction === 'dragon' ? 'tiger' : 'dragon';
    
    this.addLogEntry('faction_assigned', 'system', '阵营分配', {
      playerFaction: this.playerFaction,
      aiFaction: this.aiFaction
    });
  }

  /**
   * 设置AI阵营
   * @param {string} aiFaction - AI阵营
   */
  setAIFaction(aiFaction) {
    this.aiFaction = aiFaction;
    this.playerFaction = aiFaction === 'dragon' ? 'tiger' : 'dragon';
    
    this.addLogEntry('faction_assigned', 'system', '阵营分配', {
      playerFaction: this.playerFaction,
      aiFaction: this.aiFaction
    });
  }


  /**
   * 获取指定玩家的已翻开卡牌
   * @param {string} player - 玩家类型：player 或 ai
   * @returns {Array} 已翻开的卡牌数组
   */
  getRevealedCards(player) {
    const playerFaction = player === 'player' ? this.playerFaction : this.aiFaction;
    if (!playerFaction) return [];
    
    return this.cardsData.filter(card => 
      card.isRevealed && card.faction === playerFaction
    );
  }

  /**
   * 获取所有未翻开的卡牌位置
   * @returns {Array} 未翻开卡牌的位置数组
   */
  getUnrevealedPositions() {
    const positions = [];
    
    for (let row = 0; row < 5; row++) {
      if (row === 2) continue; // 跳过空行
      
      for (let col = 0; col < 4; col++) {
        const card = this.board[row][col];
        if (card instanceof Card && !card.isRevealed) {
          positions.push({ row, col });
        }
      }
    }
    
    return positions;
  }

  /**
   * 检查游戏是否结束
   * @returns {Object} 胜负检查结果
   */
  checkWinCondition() {
    // 如果阵营还未确定，游戏继续
    if (!this.playerFaction || !this.aiFaction) {
      return { isGameOver: false, winner: null, reason: '游戏继续' };
    }
    
    // 获取所有存活的卡牌（在棋盘上且未被消灭的）
    const allPlayerCards = this.cardsData.filter(card => 
      card.position.row >= 0 && card.position.col >= 0 && 
      (card.faction === this.playerFaction)
    );
    const allAICards = this.cardsData.filter(card => 
      card.position.row >= 0 && card.position.col >= 0 && 
      (card.faction === this.aiFaction)
    );
    
    // 获取已翻开的卡牌
    const revealedPlayerCards = this.getRevealedCards('player');
    const revealedAICards = this.getRevealedCards('ai');
    const unrevealedPositions = this.getUnrevealedPositions();
    
    // 一方全部卡牌被消灭（基于存活卡牌数量，而不是已翻开的卡牌）
    if (allPlayerCards.length === 0 && allAICards.length === 0) {
      return { isGameOver: true, winner: 'draw', reason: '双方同归于尽' };
    } else if (allPlayerCards.length === 0) {
      return { isGameOver: true, winner: 'ai', reason: '玩家卡牌全部被消灭' };
    } else if (allAICards.length === 0) {
      return { isGameOver: true, winner: 'player', reason: 'AI卡牌全部被消灭' };
    }
    
    // 最终对决：各剩一张已翻开的牌，且没有未翻开的牌
    if (revealedPlayerCards.length === 1 && revealedAICards.length === 1 && unrevealedPositions.length === 0) {
      return { isGameOver: true, winner: null, reason: '最终对决阶段' };
    }
    
    // 游戏继续
    return { isGameOver: false, winner: null, reason: '游戏继续' };
  }

  /**
   * 克隆游戏状态（深拷贝）
   * @returns {GameState} 克隆的游戏状态
   */
  clone() {
    const cloned = new GameState();
    
    // 基础属性
    cloned.phase = this.phase;
    cloned.currentPlayer = this.currentPlayer;
    cloned.playerFaction = this.playerFaction;
    cloned.aiFaction = this.aiFaction;
    cloned.selectedPosition = this.selectedPosition ? { ...this.selectedPosition } : null;
    cloned.winner = this.winner;
    cloned.startTime = this.startTime;
    cloned.endTime = this.endTime;
    
    // 深拷贝卡牌数据
    cloned.cardsData = this.cardsData.map(card => card.clone());
    
    // 重建棋盘引用
    cloned.board = this.initBoard();
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 4; col++) {
        const originalCard = this.board[row][col];
        if (originalCard instanceof Card) {
          const clonedCard = cloned.cardsData.find(card => card.id === originalCard.id);
          cloned.board[row][col] = clonedCard;
        }
      }
    }
    
    // 深拷贝游戏日志
    cloned.gameLog = this.gameLog.map(entry => ({ ...entry, details: { ...entry.details } }));
    
    return cloned;
  }

  /**
   * 转换为JSON对象（用于保存）
   * @returns {Object} JSON表示
   */
  toJSON() {
    return {
      phase: this.phase,
      currentPlayer: this.currentPlayer,
      playerFaction: this.playerFaction,
      aiFaction: this.aiFaction,
      selectedPosition: this.selectedPosition,
      winner: this.winner,
      startTime: this.startTime,
      endTime: this.endTime,
      cardsData: this.cardsData.map(card => card.toJSON()),
      gameLog: this.gameLog
    };
  }

  /**
   * 从JSON对象恢复游戏状态
   * @param {Object} json - JSON对象
   * @returns {GameState} 恢复的游戏状态
   */
  static fromJSON(json) {
    const gameState = new GameState();
    
    // 恢复基础属性
    gameState.phase = json.phase;
    gameState.currentPlayer = json.currentPlayer;
    gameState.playerFaction = json.playerFaction;
    gameState.aiFaction = json.aiFaction;
    gameState.selectedPosition = json.selectedPosition;
    gameState.winner = json.winner;
    gameState.startTime = json.startTime;
    gameState.endTime = json.endTime;
    gameState.gameLog = json.gameLog;
    
    // 恢复卡牌数据
    gameState.cardsData = json.cardsData.map(cardData => Card.fromJSON(cardData));
    
    // 重建棋盘
    gameState.board = gameState.initBoard();
    gameState.cardsData.forEach(card => {
      if (card.position.row >= 0 && card.position.col >= 0) {
        gameState.board[card.position.row][card.position.col] = card;
      }
    });
    
    return gameState;
  }

  /**
   * 获取棋盘上的所有卡牌
   * @returns {Array} 卡牌数组
   */
  getCardsOnBoard() {
    return this.cardsData.filter(card => 
      card.position.row >= 0 && card.position.col >= 0
    );
  }

  /**
   * 获取指定玩家的已翻开卡牌
   * @param {string} player - 玩家类型 ('player' 或 'ai')
   * @returns {Array} 卡牌数组
   */
  getRevealedCards(player) {
    const faction = player === 'player' ? this.playerFaction : this.aiFaction;
    if (!faction) return [];
    
    return this.getCardsOnBoard().filter(card => 
      card.isRevealed && card.faction === faction
    );
  }



  /**
   * 切换当前玩家
   */
  switchPlayer() {
    this.currentPlayer = this.currentPlayer === 'player' ? 'ai' : 'player';
    this.addLogEntry('turn_change', 'system', `轮到${this.currentPlayer === 'player' ? '玩家' : 'AI'}`, {
      newPlayer: this.currentPlayer
    });
  }
}
