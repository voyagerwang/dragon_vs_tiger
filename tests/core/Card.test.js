/**
 * Card 类测试
 * 验收标准：Card类能正确创建、命名和获取图片路径
 */

import { Card } from '../../scripts/core/Card.js';

// 测试套件：Card类基础功能
describe('Card Class Tests', () => {
  
  test('应该正确创建龙阵营卡牌', () => {
    const card = new Card('dragon_3', 'dragon', 3);
    
    expect(card.id).toBe('dragon_3');
    expect(card.faction).toBe('dragon');
    expect(card.level).toBe(3);
    expect(card.name).toBe('金龙');
    expect(card.isRevealed).toBe(false);
    expect(card.owner).toBe(null);
    expect(card.position.row).toBe(-1);
    expect(card.position.col).toBe(-1);
  });

  test('应该正确创建虎阵营卡牌', () => {
    const card = new Card('tiger_5', 'tiger', 5);
    
    expect(card.id).toBe('tiger_5');
    expect(card.faction).toBe('tiger');
    expect(card.level).toBe(5);
    expect(card.name).toBe('壕虎');
    expect(card.isRevealed).toBe(false);
    expect(card.owner).toBe(null);
  });

  test('应该正确获取所有龙阵营卡牌名称', () => {
    const expectedNames = ['龙王', '神龙', '金龙', '青龙', '赤龙', '白龙', '风雨龙', '变形龙'];
    
    for (let i = 1; i <= 8; i++) {
      const card = new Card(`dragon_${i}`, 'dragon', i);
      expect(card.name).toBe(expectedNames[i - 1]);
    }
  });

  test('应该正确获取所有虎阵营卡牌名称', () => {
    const expectedNames = ['虎王', '东北虎', '大头虎', '下山虎', '壕虎', '妖虎', '白虎', '小王虎'];
    
    for (let i = 1; i <= 8; i++) {
      const card = new Card(`tiger_${i}`, 'tiger', i);
      expect(card.name).toBe(expectedNames[i - 1]);
    }
  });

  test('应该正确生成图片路径', () => {
    const dragonCard = new Card('dragon_1', 'dragon', 1);
    const tigerCard = new Card('tiger_8', 'tiger', 8);
    
    expect(dragonCard.getImagePath()).toBe('assets/cards/dragon_1.png');
    expect(tigerCard.getImagePath()).toBe('assets/cards/tiger_8.png');
  });

  test('应该能正确设置和更新卡牌属性', () => {
    const card = new Card('dragon_5', 'dragon', 5);
    
    // 更新位置
    card.position = { row: 1, col: 2 };
    expect(card.position.row).toBe(1);
    expect(card.position.col).toBe(2);
    
    // 翻开卡牌
    card.isRevealed = true;
    expect(card.isRevealed).toBe(true);
    
    // 设置归属
    card.owner = 'player';
    expect(card.owner).toBe('player');
  });

  test('应该抛出错误当输入无效参数', () => {
    expect(() => {
      new Card('invalid_id', 'dragon', 3);
    }).toThrow('Invalid card ID format');
    
    expect(() => {
      new Card('dragon_3', 'invalid_faction', 3);
    }).toThrow('Invalid faction');
    
    expect(() => {
      new Card('dragon_3', 'dragon', 0);
    }).toThrow('Invalid level');
    
    expect(() => {
      new Card('dragon_3', 'dragon', 9);
    }).toThrow('Invalid level');
  });
});

// 简化的测试运行器（用于浏览器环境）
class SimpleTestRunner {
  constructor() {
    this.tests = [];
    this.describes = [];
  }
  
  test(name, fn) {
    this.tests.push({ name, fn, describe: this.currentDescribe });
  }
  
  describe(name, fn) {
    this.currentDescribe = name;
    this.describes.push(name);
    fn();
  }
  
  expect(actual) {
    return {
      toBe: (expected) => {
        if (actual !== expected) {
          throw new Error(`Expected ${expected}, but got ${actual}`);
        }
      },
      toThrow: (expectedError) => {
        try {
          actual();
          throw new Error(`Expected function to throw "${expectedError}"`);
        } catch (error) {
          if (!error.message.includes(expectedError)) {
            throw new Error(`Expected error "${expectedError}", but got "${error.message}"`);
          }
        }
      }
    };
  }
  
  async runAll() {
    console.log('🧪 Running Card Tests...');
    let passed = 0;
    let failed = 0;
    
    for (const test of this.tests) {
      try {
        await test.fn();
        console.log(`✅ ${test.describe} - ${test.name}`);
        passed++;
      } catch (error) {
        console.error(`❌ ${test.describe} - ${test.name}: ${error.message}`);
        failed++;
      }
    }
    
    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
    return { passed, failed, total: passed + failed };
  }
}

// 导出测试运行器
export { SimpleTestRunner };

// 全局测试函数（用于浏览器环境）
if (typeof window !== 'undefined') {
  const testRunner = new SimpleTestRunner();
  window.test = testRunner.test.bind(testRunner);
  window.describe = testRunner.describe.bind(testRunner);
  window.expect = testRunner.expect.bind(testRunner);
  window.runCardTests = testRunner.runAll.bind(testRunner);
}
