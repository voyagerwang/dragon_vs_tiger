/**
 * AI策略增强器 - 集成大模型提升AI决策能力
 * 支持多种大模型接口，提供智能策略建议
 */

export class AIStrategyEnhancer {
    constructor(config = {}) {
        this.config = {
            // 大模型配置
            modelProvider: config.modelProvider || 'openai', // 'openai', 'claude', 'ollama', 'local'
            apiKey: config.apiKey || '',
            modelName: config.modelName || 'gpt-3.5-turbo',
            baseUrl: config.baseUrl || '',
            
            // 本地模型配置
            localModelPath: config.localModelPath || '',
            
            // 策略配置
            enableLLM: config.enableLLM !== false, // 是否启用大模型
            fallbackToRules: config.fallbackToRules !== false, // 大模型失败时是否回退到规则
            maxTokens: config.maxTokens || 500,
            temperature: config.temperature || 0.3,
            
            // 缓存配置
            enableCache: config.enableCache !== false,
            cacheExpiry: config.cacheExpiry || 300000, // 5分钟
        };
        
        // 策略缓存
        this.strategyCache = new Map();
        this.cacheTimestamps = new Map();
        
        // 初始化大模型客户端
        this.initializeModelClient();
    }
    
    /**
     * 初始化大模型客户端
     */
    initializeModelClient() {
        try {
            switch (this.config.modelProvider) {
                case 'openai':
                    this.modelClient = this.createOpenAIClient();
                    break;
                case 'claude':
                    this.modelClient = this.createClaudeClient();
                    break;
                case 'ollama':
                    this.modelClient = this.createOllamaClient();
                    break;
                case 'local':
                    this.modelClient = this.createLocalClient();
                    break;
                default:
                    console.warn('未知的大模型提供商:', this.config.modelProvider);
                    this.modelClient = null;
            }
        } catch (error) {
            console.error('初始化大模型客户端失败:', error);
            this.modelClient = null;
        }
    }
    
    /**
     * 创建OpenAI客户端
     */
    createOpenAIClient() {
        if (!this.config.apiKey) {
            throw new Error('OpenAI API密钥未配置');
        }
        
        return {
            async generateStrategy(gameState, analysis) {
                const prompt = this.buildStrategyPrompt(gameState, analysis);
                
                try {
                    const response = await fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${this.config.apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            model: this.config.modelName,
                            messages: [
                                {
                                    role: 'system',
                                    content: '你是一个龙虎斗游戏的AI策略专家。请分析游戏局面并给出最佳策略建议。'
                                },
                                {
                                    role: 'user',
                                    content: prompt
                                }
                            ],
                            max_tokens: this.config.maxTokens,
                            temperature: this.config.temperature
                        })
                    });
                    
                    if (!response.ok) {
                        throw new Error(`OpenAI API请求失败: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    return this.parseStrategyResponse(data.choices[0].message.content);
                } catch (error) {
                    console.error('OpenAI API调用失败:', error);
                    throw error;
                }
            }
        };
    }
    
    /**
     * 创建Claude客户端
     */
    createClaudeClient() {
        if (!this.config.apiKey) {
            throw new Error('Claude API密钥未配置');
        }
        
        return {
            async generateStrategy(gameState, analysis) {
                const prompt = this.buildStrategyPrompt(gameState, analysis);
                
                try {
                    const response = await fetch('https://api.anthropic.com/v1/messages', {
                        method: 'POST',
                        headers: {
                            'x-api-key': this.config.apiKey,
                            'Content-Type': 'application/json',
                            'anthropic-version': '2023-06-01'
                        },
                        body: JSON.stringify({
                            model: 'claude-3-sonnet-20240229',
                            max_tokens: this.config.maxTokens,
                            messages: [
                                {
                                    role: 'user',
                                    content: prompt
                                }
                            ]
                        })
                    });
                    
                    if (!response.ok) {
                        throw new Error(`Claude API请求失败: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    return this.parseStrategyResponse(data.content[0].text);
                } catch (error) {
                    console.error('Claude API调用失败:', error);
                    throw error;
                }
            }
        };
    }
    
    /**
     * 创建Ollama客户端
     */
    createOllamaClient() {
        return {
            async generateStrategy(gameState, analysis) {
                const prompt = this.buildStrategyPrompt(gameState, analysis);
                
                try {
                    const response = await fetch('http://localhost:11434/api/generate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            model: this.config.modelName || 'llama2',
                            prompt: prompt,
                            stream: false,
                            options: {
                                temperature: this.config.temperature,
                                num_predict: this.config.maxTokens
                            }
                        })
                    });
                    
                    if (!response.ok) {
                        throw new Error(`Ollama API请求失败: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    return this.parseStrategyResponse(data.response);
                } catch (error) {
                    console.error('Ollama API调用失败:', error);
                    throw error;
                }
            }
        };
    }
    
    /**
     * 创建本地模型客户端
     */
    createLocalClient() {
        // 这里可以集成TensorFlow.js、ONNX.js等本地推理框架
        return {
            async generateStrategy(gameState, analysis) {
                // 本地模型推理逻辑
                return this.generateLocalStrategy(gameState, analysis);
            }
        };
    }
    
    /**
     * 构建策略提示词
     */
    buildStrategyPrompt(gameState, analysis) {
        const prompt = `
龙虎斗游戏策略分析请求：

游戏状态：
- 当前回合：${gameState.currentPlayer}
- AI阵营：${gameState.aiFaction || '未确定'}
- 玩家阵营：${gameState.playerFaction || '未确定'}
- 游戏阶段：${gameState.phase}

局面分析：
- AI已翻开卡牌：${analysis.aiCards.length}张
- 玩家已翻开卡牌：${analysis.playerCards.length}张
- 未翻开卡牌：${analysis.revealedCards.filter(card => !card.owner).length}张
- 材料优势：${(analysis.materialAdvantage * 100).toFixed(1)}%
- 位置优势：${(analysis.positionAdvantage * 100).toFixed(1)}%
- 第三行控制：AI ${analysis.controlAnalysis.row2Control.ai} vs 玩家 ${analysis.controlAnalysis.row2Control.player}

AI卡牌详情：
${analysis.aiCards.map(card => `- ${card.name}(${card.level}级) 位置(${card.position.row},${card.position.col})`).join('\n')}

玩家卡牌详情：
${analysis.playerCards.map(card => `- ${card.name}(${card.level}级) 位置(${card.position.row},${card.position.col})`).join('\n')}

请分析当前局面并给出最佳策略建议，包括：
1. 推荐动作类型（翻牌/攻击/移动/防守）
2. 具体执行方案
3. 策略理由
4. 风险评估
5. 预期收益

请用JSON格式回复，包含以下字段：
{
    "action": "flip|attack|move|defend",
    "confidence": 0.0-1.0,
    "reasoning": "策略理由",
    "details": {
        "from": {"row": 0, "col": 0},
        "to": {"row": 0, "col": 0}
    },
    "risk": "low|medium|high",
    "expectedGain": "预期收益描述"
}
        `;
        
        return prompt.trim();
    }
    
    /**
     * 解析策略响应
     */
    parseStrategyResponse(response) {
        try {
            // 尝试提取JSON
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const strategy = JSON.parse(jsonMatch[0]);
                return this.validateStrategy(strategy);
            }
            
            // 如果无法解析JSON，尝试智能解析
            return this.parseTextResponse(response);
        } catch (error) {
            console.error('解析策略响应失败:', error);
            return this.generateFallbackStrategy();
        }
    }
    
    /**
     * 验证策略格式
     */
    validateStrategy(strategy) {
        const required = ['action', 'confidence', 'reasoning'];
        const valid = required.every(field => strategy.hasOwnProperty(field));
        
        if (!valid) {
            throw new Error('策略格式不完整');
        }
        
        // 验证动作类型
        const validActions = ['flip', 'attack', 'move', 'defend'];
        if (!validActions.includes(strategy.action)) {
            strategy.action = 'flip';
        }
        
        // 验证置信度
        strategy.confidence = Math.max(0, Math.min(1, strategy.confidence || 0.5));
        
        return strategy;
    }
    
    /**
     * 解析文本响应
     */
    parseTextResponse(response) {
        // 智能解析文本响应
        const actionMatch = response.match(/(翻牌|攻击|移动|防守|flip|attack|move|defend)/i);
        const action = actionMatch ? this.mapAction(actionMatch[0]) : 'flip';
        
        const confidenceMatch = response.match(/(\d+(?:\.\d+)?)%?/);
        const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) / 100 : 0.7;
        
        return {
            action: action,
            confidence: Math.max(0.1, Math.min(1, confidence)),
            reasoning: response.substring(0, 200),
            details: {},
            risk: 'medium',
            expectedGain: '基于大模型分析的策略建议'
        };
    }
    
    /**
     * 映射动作类型
     */
    mapAction(actionText) {
        const actionMap = {
            '翻牌': 'flip',
            '攻击': 'attack',
            '移动': 'move',
            '防守': 'defend',
            'flip': 'flip',
            'attack': 'attack',
            'move': 'move',
            'defend': 'defend'
        };
        return actionMap[actionText] || 'flip';
    }
    
    /**
     * 生成回退策略
     */
    generateFallbackStrategy() {
        return {
            action: 'flip',
            confidence: 0.5,
            reasoning: '大模型分析失败，使用基础翻牌策略',
            details: {},
            risk: 'medium',
            expectedGain: '基础策略保证'
        };
    }
    
    /**
     * 生成增强策略
     */
    async generateEnhancedStrategy(gameState, analysis) {
        // 检查缓存
        const cacheKey = this.generateCacheKey(gameState, analysis);
        if (this.config.enableCache && this.strategyCache.has(cacheKey)) {
            const cached = this.strategyCache.get(cacheKey);
            if (Date.now() - this.cacheTimestamps.get(cacheKey) < this.config.cacheExpiry) {
                console.log('使用缓存的策略建议');
                return cached;
            }
        }
        
        // 如果大模型可用，尝试获取策略建议
        if (this.config.enableLLM && this.modelClient) {
            try {
                console.log('正在使用大模型生成策略...');
                const strategy = await this.modelClient.generateStrategy(gameState, analysis);
                
                // 缓存策略
                if (this.config.enableCache) {
                    this.strategyCache.set(cacheKey, strategy);
                    this.cacheTimestamps.set(cacheKey, Date.now());
                }
                
                return strategy;
            } catch (error) {
                console.warn('大模型策略生成失败，回退到规则引擎:', error);
                if (this.config.fallbackToRules) {
                    return this.generateRuleBasedStrategy(gameState, analysis);
                }
            }
        }
        
        // 回退到规则引擎
        return this.generateRuleBasedStrategy(gameState, analysis);
    }
    
    /**
     * 生成基于规则的策略
     */
    generateRuleBasedStrategy(gameState, analysis) {
        // 这里可以集成现有的规则引擎逻辑
        return {
            action: 'flip',
            confidence: 0.8,
            reasoning: '使用规则引擎生成的基础策略',
            details: {},
            risk: 'low',
            expectedGain: '稳定可靠的策略建议'
        };
    }
    
    /**
     * 生成缓存键
     */
    generateCacheKey(gameState, analysis) {
        const keyData = {
            phase: gameState.phase,
            currentPlayer: gameState.currentPlayer,
            aiCards: analysis.aiCards.length,
            playerCards: analysis.playerCards.length,
            materialAdvantage: Math.round(analysis.materialAdvantage * 10),
            positionAdvantage: Math.round(analysis.positionAdvantage * 10)
        };
        return JSON.stringify(keyData);
    }
    
    /**
     * 清理过期缓存
     */
    cleanupCache() {
        const now = Date.now();
        for (const [key, timestamp] of this.cacheTimestamps.entries()) {
            if (now - timestamp > this.config.cacheExpiry) {
                this.strategyCache.delete(key);
                this.cacheTimestamps.delete(key);
            }
        }
    }
    
    /**
     * 获取配置信息
     */
    getConfig() {
        return {
            ...this.config,
            modelClient: this.modelClient ? '已初始化' : '未初始化',
            cacheSize: this.strategyCache.size
        };
    }
    
    /**
     * 更新配置
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.initializeModelClient();
    }
}
