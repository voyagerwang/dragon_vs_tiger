/**
 * Card类 - 龙虎斗卡牌核心类
 * 负责管理单张卡牌的属性和行为
 */

export class Card {
  /**
   * 构造函数
   * @param {string} id - 卡牌ID，格式：dragon_1 或 tiger_1
   * @param {string} faction - 阵营：dragon 或 tiger
   * @param {number} level - 等级：1-8
   */
  constructor(id, faction, level) {
    // 输入验证
    this.validateInput(id, faction, level);
    
    this.id = id;
    this.faction = faction;
    this.level = level;
    this.name = this.getCardName();
    this.isRevealed = false;
    this.position = { row: -1, col: -1 };
    this.owner = null; // "player" | "ai" | null
  }

  /**
   * 验证输入参数
   * @param {string} id - 卡牌ID
   * @param {string} faction - 阵营
   * @param {number} level - 等级
   */
  validateInput(id, faction, level) {
    // 验证ID格式
    const idPattern = /^(dragon|tiger)_[1-8]$/;
    if (!idPattern.test(id)) {
      throw new Error('Invalid card ID format');
    }

    // 验证阵营
    if (!['dragon', 'tiger'].includes(faction)) {
      throw new Error('Invalid faction');
    }

    // 验证等级
    if (typeof level !== 'number' || level < 1 || level > 8) {
      throw new Error('Invalid level');
    }
  }

  /**
   * 获取卡牌中文名称
   * @returns {string} 卡牌中文名
   */
  getCardName() {
    const names = {
      dragon: ['龙王', '神龙', '金龙', '青龙', '赤龙', '白龙', '风雨龙', '变形龙'],
      tiger: ['虎王', '东北虎', '大头虎', '下山虎', '壕虎', '妖虎', '白虎', '小王虎']
    };
    
    return names[this.faction][this.level - 1];
  }

  /**
   * 获取卡牌图片路径
   * @returns {string} 图片路径
   */
  getImagePath() {
    return `assets/cards/${this.faction}_${this.level}.png`;
  }

  /**
   * 获取卡牌背面图片路径
   * @returns {string} 背面图片路径
   */
  static getBackImagePath() {
    return 'assets/cards/card_back.png';
  }

  /**
   * 设置卡牌位置
   * @param {number} row - 行坐标
   * @param {number} col - 列坐标
   */
  setPosition(row, col) {
    this.position = { row, col };
  }

  /**
   * 翻开卡牌
   * @param {string} owner - 归属者：player 或 ai
   */
  reveal(owner = null) {
    this.isRevealed = true;
    if (owner) {
      this.owner = owner;
    }
  }

  /**
   * 检查是否能战胜另一张卡牌
   * @param {Card} otherCard - 对方卡牌
   * @returns {string} 战斗结果：'win' | 'lose' | 'draw'
   */
  battleWith(otherCard) {
    if (!otherCard || this.faction === otherCard.faction) {
      return 'invalid';
    }

    // 特殊规则：小王虎（8级）可击败龙王（1级）
    if (this.id === 'tiger_8' && otherCard.id === 'dragon_1') {
      return 'win';
    }

    // 特殊规则：变形龙（8级）可击败虎王（1级）
    if (this.id === 'dragon_8' && otherCard.id === 'tiger_1') {
      return 'win';
    }

    // 基础规则：1>2>3>4>5>6>7>8，但1不能吃8（8可以吃1在特殊规则中处理）
    if (this.level === 1 && otherCard.level === 8) {
      // 1级不能吃8级
      return 'lose';
    } else if (this.level === 8 && otherCard.level === 1) {
      // 8级不能通过基础规则吃1级
      return 'lose';
    } else if (this.level < otherCard.level) {
      // 等级越低越强
      return 'win';
    } else if (this.level > otherCard.level) {
      return 'lose';
    } else {
      return 'draw'; // 同归于尽
    }
  }

  /**
   * 克隆卡牌
   * @returns {Card} 克隆的卡牌实例
   */
  clone() {
    const cloned = new Card(this.id, this.faction, this.level);
    cloned.isRevealed = this.isRevealed;
    cloned.position = { ...this.position };
    cloned.owner = this.owner;
    return cloned;
  }

  /**
   * 转换为JSON对象
   * @returns {Object} JSON表示
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      faction: this.faction,
      level: this.level,
      isRevealed: this.isRevealed,
      position: this.position,
      owner: this.owner,
      imagePath: this.getImagePath()
    };
  }

  /**
   * 从JSON对象创建Card实例
   * @param {Object} json - JSON对象
   * @returns {Card} Card实例
   */
  static fromJSON(json) {
    const card = new Card(json.id, json.faction, json.level);
    card.isRevealed = json.isRevealed;
    card.position = json.position;
    card.owner = json.owner;
    return card;
  }
}
