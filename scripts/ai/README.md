# AI策略增强器使用指南

## 概述

AI策略增强器是一个集成大语言模型的智能系统，可以显著提升龙虎斗游戏中AI的决策能力。通过分析游戏局面，大模型能够提供更智能、更人性化的策略建议。

## 支持的模型提供商

### 1. OpenAI GPT
- **模型**: GPT-3.5-turbo, GPT-4, GPT-4-turbo
- **优势**: 模型能力强，响应稳定，支持复杂推理
- **成本**: 按token计费，约$0.002/1K tokens
- **配置**: 需要OpenAI API密钥

### 2. Anthropic Claude
- **模型**: Claude-3-Sonnet, Claude-3-Opus
- **优势**: 推理能力强，安全性高，响应质量好
- **成本**: 按token计费，约$0.003/1K tokens
- **配置**: 需要Anthropic API密钥

### 3. Ollama (本地部署)
- **模型**: Llama2, Mistral, CodeLlama等
- **优势**: 完全免费，无需网络，隐私安全
- **成本**: 完全免费
- **配置**: 需要本地部署Ollama服务

### 4. 本地模型
- **框架**: TensorFlow.js, ONNX.js
- **优势**: 完全免费，响应极快，隐私安全
- **成本**: 完全免费
- **配置**: 需要训练好的模型文件

## 快速开始

### 1. 基础配置

```javascript
import { AIStrategyEnhancer } from './AIStrategyEnhancer.js';
import { getConfig } from './LLMConfig.js';

// 使用OpenAI
const enhancer = new AIStrategyEnhancer({
    modelProvider: 'openai',
    apiKey: 'your-openai-api-key',
    modelName: 'gpt-3.5-turbo',
    enableLLM: true,
    fallbackToRules: true
});

// 使用Ollama (推荐免费方案)
const enhancer = new AIStrategyEnhancer({
    modelProvider: 'ollama',
    modelName: 'llama2',
    enableLLM: true,
    fallbackToRules: true
});
```

### 2. 集成到AI系统

```javascript
// 在AIPlayer.js中集成
import { AIStrategyEnhancer } from './AIStrategyEnhancer.js';

class AIPlayer {
    constructor(gameEngine, difficulty = 'medium') {
        // ... 现有代码 ...
        
        // 初始化策略增强器
        this.strategyEnhancer = new AIStrategyEnhancer({
            modelProvider: 'ollama', // 使用本地Ollama
            modelName: 'llama2',
            enableLLM: true,
            fallbackToRules: true
        });
    }
    
    async makeDecision() {
        try {
            // 分析游戏状态
            const analysis = this.analyzeGameState();
            
            // 使用大模型生成增强策略
            const enhancedStrategy = await this.strategyEnhancer.generateEnhancedStrategy(
                this.gameEngine.gameState, 
                analysis
            );
            
            // 根据增强策略制定决策
            return this.executeEnhancedStrategy(enhancedStrategy);
            
        } catch (error) {
            console.warn('大模型策略生成失败，回退到规则引擎:', error);
            return this.makeRuleBasedDecision();
        }
    }
    
    executeEnhancedStrategy(strategy) {
        switch (strategy.action) {
            case 'flip':
                return this.makeFlipDecision(strategy.details);
            case 'attack':
                return this.makeAttackDecision(strategy.details);
            case 'move':
                return this.makeMoveDecision(strategy.details);
            case 'defend':
                return this.makeDefendDecision(strategy.details);
            default:
                return this.makeRuleBasedDecision();
        }
    }
}
```

## 详细配置说明

### OpenAI配置

```javascript
const openaiConfig = {
    modelProvider: 'openai',
    apiKey: 'sk-...', // 从OpenAI获取
    modelName: 'gpt-4', // 或 gpt-3.5-turbo
    maxTokens: 1000,
    temperature: 0.3,
    enableCache: true,
    cacheExpiry: 300000 // 5分钟
};
```

### Claude配置

```javascript
const claudeConfig = {
    modelProvider: 'claude',
    apiKey: 'sk-ant-...', // 从Anthropic获取
    modelName: 'claude-3-opus-20240229',
    maxTokens: 1000,
    temperature: 0.2,
    enableCache: true
};
```

### Ollama配置 (推荐)

```bash
# 1. 安装Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# 2. 下载模型
ollama pull llama2
ollama pull mistral
ollama pull codellama

# 3. 启动服务
ollama serve
```

```javascript
const ollamaConfig = {
    modelProvider: 'ollama',
    modelName: 'llama2', // 或 'mistral', 'codellama'
    baseUrl: 'http://localhost:11434',
    maxTokens: 500,
    temperature: 0.3,
    enableCache: true
};
```

## 策略提示词优化

### 基础提示词

```javascript
const basePrompt = `
你是一个龙虎斗游戏的AI策略专家。

游戏规则：
- 等级1-8，数字越小越强
- 特殊规则：8级可以击败1级
- 第三行是战场，控制权很重要
- 边缘位置便于防守和逃跑

请分析当前局面并给出最佳策略建议。
`;
```

### 高级提示词

```javascript
const advancedPrompt = `
你是一个龙虎斗游戏的AI策略专家，具备以下能力：

1. 局面分析：评估材料优势、位置优势、控制权
2. 威胁识别：识别敌方威胁和攻击机会
3. 风险评估：评估各种行动的风险和收益
4. 战略规划：制定短期和长期策略

请提供：
- 动作类型（翻牌/攻击/移动/防守）
- 具体执行方案
- 策略理由和风险评估
- 预期收益和后续建议
`;
```

## 性能优化

### 1. 缓存策略

```javascript
const enhancer = new AIStrategyEnhancer({
    enableCache: true,
    cacheExpiry: 300000, // 5分钟缓存
    maxCacheSize: 1000   // 最大缓存条目
});
```

### 2. 批量请求

```javascript
// 批量生成策略建议
const strategies = await Promise.all([
    enhancer.generateEnhancedStrategy(gameState1, analysis1),
    enhancer.generateEnhancedStrategy(gameState2, analysis2),
    enhancer.generateEnhancedStrategy(gameState3, analysis3)
]);
```

### 3. 异步处理

```javascript
// 异步生成策略，不阻塞游戏
this.strategyEnhancer.generateEnhancedStrategy(gameState, analysis)
    .then(strategy => {
        this.currentStrategy = strategy;
        console.log('策略更新完成:', strategy);
    })
    .catch(error => {
        console.warn('策略生成失败，使用缓存策略:', error);
    });
```

## 故障排除

### 常见问题

1. **API密钥错误**
   - 检查API密钥是否正确
   - 确认账户余额充足
   - 验证API权限

2. **网络连接问题**
   - 检查网络连接
   - 确认防火墙设置
   - 尝试使用代理

3. **Ollama服务问题**
   - 确认Ollama服务正在运行
   - 检查端口11434是否开放
   - 验证模型是否已下载

4. **响应解析失败**
   - 检查模型响应格式
   - 调整temperature参数
   - 优化提示词结构

### 调试模式

```javascript
const enhancer = new AIStrategyEnhancer({
    enableLLM: true,
    debug: true, // 启用调试模式
    logLevel: 'verbose'
});

// 查看详细日志
console.log('增强器配置:', enhancer.getConfig());
console.log('缓存状态:', enhancer.getCacheStatus());
```

## 成本控制

### 1. 使用本地模型
- Ollama完全免费
- 本地模型无需网络
- 响应速度快

### 2. 智能缓存
- 相似局面复用策略
- 减少API调用次数
- 降低响应延迟

### 3. 策略优先级
- 复杂局面使用大模型
- 简单局面使用规则引擎
- 动态切换决策方式

## 最佳实践

### 1. 提示词设计
- 明确游戏规则和约束
- 提供具体的输出格式要求
- 包含示例和上下文信息

### 2. 错误处理
- 实现优雅的降级策略
- 记录详细的错误日志
- 提供用户友好的错误提示

### 3. 性能监控
- 监控API响应时间
- 跟踪策略质量指标
- 优化缓存命中率

### 4. 用户体验
- 显示策略生成进度
- 提供策略解释说明
- 支持手动策略调整

## 总结

AI策略增强器通过集成大语言模型，能够显著提升游戏AI的智能水平。建议从Ollama开始尝试，因为它完全免费且易于部署。随着使用经验的积累，可以逐步尝试其他商业模型以获得更好的性能。

记住：大模型是增强工具，不是替代品。合理的规则引擎配合大模型建议，能够提供最佳的游戏体验。
