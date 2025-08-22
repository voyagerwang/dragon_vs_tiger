/**
 * BattleResolver 类测试
 * 验收标准：BattleResolver能正确处理所有战斗情况，包括特殊规则
 */

import { BattleResolver } from '../../scripts/core/BattleResolver.js';
import { Card } from '../../scripts/core/Card.js';

describe('BattleResolver Class Tests', () => {
  
  let battleResolver;

  beforeEach(() => {
    battleResolver = new BattleResolver();
  });

  test('应该正确初始化战斗解析器', () => {
    expect(battleResolver).toBeDefined();
    expect(typeof battleResolver.resolveBattle).toBe('function');
  });

  test('应该正确处理基础等级战斗', () => {
    const dragon5 = new Card('dragon_5', 'dragon', 5);
    const tiger3 = new Card('tiger_3', 'tiger', 3);
    
    const result = battleResolver.resolveBattle(dragon5, tiger3);
    
    expect(result.winner).toBe('attacker');
    expect(result.attackerCard).toBe(dragon5);
    expect(result.defenderCard).toBe(tiger3);
    expect(result.eliminatedCards).toEqual([tiger3]);
    expect(result.reason).toContain('等级优势');
  });

  test('应该正确处理同等级战斗（同归于尽）', () => {
    const dragon5 = new Card('dragon_5', 'dragon', 5);
    const tiger5 = new Card('tiger_5', 'tiger', 5);
    
    const result = battleResolver.resolveBattle(dragon5, tiger5);
    
    expect(result.winner).toBe('draw');
    expect(result.eliminatedCards).toEqual([dragon5, tiger5]);
    expect(result.reason).toContain('同归于尽');
  });

  test('应该正确处理防守方获胜', () => {
    const dragon2 = new Card('dragon_2', 'dragon', 2);
    const tiger6 = new Card('tiger_6', 'tiger', 6);
    
    const result = battleResolver.resolveBattle(dragon2, tiger6);
    
    expect(result.winner).toBe('defender');
    expect(result.eliminatedCards).toEqual([dragon2]);
    expect(result.reason).toContain('等级优势');
  });

  test('应该正确处理特殊规则：小王虎vs龙王', () => {
    const kingTiger = new Card('tiger_8', 'tiger', 8);
    const dragonKing = new Card('dragon_1', 'dragon', 1);
    
    const result = battleResolver.resolveBattle(kingTiger, dragonKing);
    
    expect(result.winner).toBe('attacker');
    expect(result.eliminatedCards).toEqual([dragonKing]);
    expect(result.reason).toContain('特殊规则');
    expect(result.reason).toContain('小王虎');
    expect(result.reason).toContain('龙王');
  });

  test('应该正确处理特殊规则：变形龙vs虎王', () => {
    const transformDragon = new Card('dragon_8', 'dragon', 8);
    const tigerKing = new Card('tiger_1', 'tiger', 1);
    
    const result = battleResolver.resolveBattle(transformDragon, tigerKing);
    
    expect(result.winner).toBe('attacker');
    expect(result.eliminatedCards).toEqual([tigerKing]);
    expect(result.reason).toContain('特殊规则');
    expect(result.reason).toContain('变形龙');
    expect(result.reason).toContain('虎王');
  });

  test('应该正确处理反向特殊规则', () => {
    // 龙王攻击小王虎（不应该触发特殊规则）
    const dragonKing = new Card('dragon_1', 'dragon', 1);
    const kingTiger = new Card('tiger_8', 'tiger', 8);
    
    const result = battleResolver.resolveBattle(dragonKing, kingTiger);
    
    expect(result.winner).toBe('defender');
    expect(result.eliminatedCards).toEqual([dragonKing]);
    expect(result.reason).toContain('等级优势');
  });

  test('应该正确验证战斗参数', () => {
    const dragon1 = new Card('dragon_1', 'dragon', 1);
    const dragon2 = new Card('dragon_2', 'dragon', 2);
    
    // 同阵营不能战斗
    expect(() => {
      battleResolver.resolveBattle(dragon1, dragon2);
    }).toThrow('同阵营卡牌不能战斗');
    
    // 空参数
    expect(() => {
      battleResolver.resolveBattle(null, dragon1);
    }).toThrow('战斗参数无效');
    
    expect(() => {
      battleResolver.resolveBattle(dragon1, null);
    }).toThrow('战斗参数无效');
  });

  test('应该正确处理所有等级组合', () => {
    const testCases = [
      { attacker: 1, defender: 2, expected: 'defender' },
      { attacker: 3, defender: 3, expected: 'draw' },
      { attacker: 7, defender: 4, expected: 'attacker' },
      { attacker: 8, defender: 1, expected: 'attacker' }, // 变形龙vs龙王，非特殊规则
    ];
    
    testCases.forEach(({ attacker, defender, expected }) => {
      const dragonCard = new Card(`dragon_${attacker}`, 'dragon', attacker);
      const tigerCard = new Card(`tiger_${defender}`, 'tiger', defender);
      
      const result = battleResolver.resolveBattle(dragonCard, tigerCard);
      expect(result.winner).toBe(expected);
    });
  });

  test('应该正确生成战斗日志', () => {
    const dragon5 = new Card('dragon_5', 'dragon', 5);
    const tiger3 = new Card('tiger_3', 'tiger', 3);
    
    const result = battleResolver.resolveBattle(dragon5, tiger3);
    
    expect(result.battleLog).toBeDefined();
    expect(Array.isArray(result.battleLog)).toBe(true);
    expect(result.battleLog.length).toBeGreaterThan(0);
    
    const logEntry = result.battleLog[0];
    expect(logEntry.timestamp).toBeDefined();
    expect(logEntry.action).toBeDefined();
    expect(logEntry.details).toBeDefined();
  });

  test('应该正确计算战斗统计', () => {
    const dragon5 = new Card('dragon_5', 'dragon', 5);
    const tiger3 = new Card('tiger_3', 'tiger', 3);
    
    const result = battleResolver.resolveBattle(dragon5, tiger3);
    
    expect(result.stats).toBeDefined();
    expect(result.stats.levelDifference).toBe(2);
    expect(result.stats.battleType).toBe('normal');
    expect(result.stats.isSpecialRule).toBe(false);
  });

  test('应该正确处理特殊规则的统计', () => {
    const kingTiger = new Card('tiger_8', 'tiger', 8);
    const dragonKing = new Card('dragon_1', 'dragon', 1);
    
    const result = battleResolver.resolveBattle(kingTiger, dragonKing);
    
    expect(result.stats.battleType).toBe('special');
    expect(result.stats.isSpecialRule).toBe(true);
    expect(result.stats.specialRuleType).toBe('king_tiger_vs_dragon_king');
  });

  test('应该能正确克隆战斗结果', () => {
    const dragon5 = new Card('dragon_5', 'dragon', 5);
    const tiger3 = new Card('tiger_3', 'tiger', 3);
    
    const result = battleResolver.resolveBattle(dragon5, tiger3);
    const cloned = battleResolver.cloneBattleResult(result);
    
    expect(cloned).not.toBe(result);
    expect(cloned.winner).toBe(result.winner);
    expect(cloned.reason).toBe(result.reason);
    expect(cloned.eliminatedCards).toEqual(result.eliminatedCards);
    expect(cloned.eliminatedCards).not.toBe(result.eliminatedCards); // 深拷贝
  });

  test('应该能正确导出战斗结果为JSON', () => {
    const dragon5 = new Card('dragon_5', 'dragon', 5);
    const tiger3 = new Card('tiger_3', 'tiger', 3);
    
    const result = battleResolver.resolveBattle(dragon5, tiger3);
    const json = battleResolver.exportBattleResult(result);
    
    expect(typeof json).toBe('string');
    const parsed = JSON.parse(json);
    expect(parsed.winner).toBe(result.winner);
    expect(parsed.reason).toBe(result.reason);
  });
});

// 扩展测试运行器
if (typeof window !== 'undefined') {
  window.runBattleResolverTests = async function() {
    console.log('⚔️ Running BattleResolver Tests...');
    // 这里会和其他测试一起运行
  };
}
