/**
 * 大模型配置文件
 * 集中管理各种大模型的配置参数
 */

export const LLMConfig = {
    // OpenAI配置
    openai: {
        provider: 'openai',
        apiKey: '', // 需要用户配置
        modelName: 'gpt-3.5-turbo',
        baseUrl: 'https://api.openai.com/v1',
        maxTokens: 500,
        temperature: 0.3,
        systemPrompt: '你是一个龙虎斗游戏的AI策略专家。请分析游戏局面并给出最佳策略建议。'
    },
    
    // Claude配置
    claude: {
        provider: 'claude',
        apiKey: '', // 需要用户配置
        modelName: 'claude-3-sonnet-20240229',
        baseUrl: 'https://api.anthropic.com/v1',
        maxTokens: 500,
        temperature: 0.3,
        systemPrompt: '你是一个龙虎斗游戏的AI策略专家。请分析游戏局面并给出最佳策略建议。'
    },
    
    // Ollama配置（本地部署）
    ollama: {
        provider: 'ollama',
        apiKey: '', // 本地部署无需API密钥
        modelName: 'llama2',
        baseUrl: 'http://localhost:11434',
        maxTokens: 500,
        temperature: 0.3,
        systemPrompt: '你是一个龙虎斗游戏的AI策略专家。请分析游戏局面并给出最佳策略建议。'
    },
    
    // 本地模型配置
    local: {
        provider: 'local',
        apiKey: '',
        modelName: 'tensorflow-js',
        baseUrl: '',
        maxTokens: 500,
        temperature: 0.3,
        systemPrompt: '基于本地模型的策略分析'
    },
    
    // 默认配置
    default: {
        enableLLM: true,
        fallbackToRules: true,
        enableCache: true,
        cacheExpiry: 300000, // 5分钟
        maxRetries: 3,
        timeout: 10000 // 10秒
    }
};

/**
 * 获取配置
 * @param {string} provider - 提供商名称
 * @returns {Object} 配置对象
 */
export function getConfig(provider = 'default') {
    if (provider === 'default') {
        return LLMConfig.default;
    }
    
    const config = LLMConfig[provider];
    if (!config) {
        console.warn(`未知的提供商: ${provider}`);
        return LLMConfig.default;
    }
    
    return { ...LLMConfig.default, ...config };
}

/**
 * 验证配置
 * @param {Object} config - 配置对象
 * @returns {Object} 验证结果
 */
export function validateConfig(config) {
    const errors = [];
    const warnings = [];
    
    // 检查必需的配置
    if (config.provider === 'openai' && !config.apiKey) {
        errors.push('OpenAI需要配置API密钥');
    }
    
    if (config.provider === 'claude' && !config.apiKey) {
        errors.push('Claude需要配置API密钥');
    }
    
    if (config.provider === 'ollama') {
        // 检查Ollama服务是否可用
        warnings.push('请确保Ollama服务在localhost:11434运行');
    }
    
    // 检查模型名称
    if (!config.modelName) {
        errors.push('模型名称不能为空');
    }
    
    // 检查数值范围
    if (config.temperature < 0 || config.temperature > 1) {
        errors.push('温度值必须在0-1之间');
    }
    
    if (config.maxTokens < 1 || config.maxTokens > 4000) {
        errors.push('最大令牌数必须在1-4000之间');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * 创建配置示例
 * @param {string} provider - 提供商名称
 * @returns {Object} 配置示例
 */
export function createConfigExample(provider) {
    const baseConfig = getConfig(provider);
    
    switch (provider) {
        case 'openai':
            return {
                ...baseConfig,
                apiKey: 'sk-...', // 替换为实际的API密钥
                instructions: '1. 获取OpenAI API密钥 2. 替换apiKey字段 3. 可选择其他模型如gpt-4'
            };
            
        case 'claude':
            return {
                ...baseConfig,
                apiKey: 'sk-ant-...', // 替换为实际的API密钥
                instructions: '1. 获取Anthropic API密钥 2. 替换apiKey字段 3. 可选择其他模型如claude-3-opus'
            };
            
        case 'ollama':
            return {
                ...baseConfig,
                instructions: '1. 安装Ollama 2. 下载模型: ollama pull llama2 3. 启动服务: ollama serve'
            };
            
        case 'local':
            return {
                ...baseConfig,
                instructions: '1. 集成TensorFlow.js或ONNX.js 2. 准备训练好的模型文件 3. 实现本地推理逻辑'
            };
            
        default:
            return baseConfig;
    }
}

/**
 * 获取所有可用的提供商
 * @returns {Array} 提供商列表
 */
export function getAvailableProviders() {
    return Object.keys(LLMConfig).filter(key => key !== 'default');
}

/**
 * 获取提供商信息
 * @param {string} provider - 提供商名称
 * @returns {Object} 提供商信息
 */
export function getProviderInfo(provider) {
    const info = {
        openai: {
            name: 'OpenAI GPT',
            description: '强大的语言模型，支持复杂的策略分析',
            pros: ['模型能力强', '响应稳定', '支持多种模型'],
            cons: ['需要API密钥', '有调用成本', '网络依赖'],
            pricing: '按token计费，约$0.002/1K tokens'
        },
        claude: {
            name: 'Anthropic Claude',
            description: '注重安全和推理能力的AI模型',
            pros: ['推理能力强', '安全性高', '响应质量好'],
            cons: ['需要API密钥', '有调用成本', '网络依赖'],
            pricing: '按token计费，约$0.003/1K tokens'
        },
        ollama: {
            name: 'Ollama (本地)',
            description: '本地部署的开源大模型',
            pros: ['完全免费', '无需网络', '隐私安全', '可自定义'],
            cons: ['需要本地部署', '模型性能有限', '资源消耗大'],
            pricing: '完全免费'
        },
        local: {
            name: '本地模型',
            description: '基于TensorFlow.js等框架的本地推理',
            pros: ['完全免费', '无需网络', '隐私安全', '响应极快'],
            cons: ['模型能力有限', '需要训练', '实现复杂'],
            pricing: '完全免费'
        }
    };
    
    return info[provider] || null;
}
