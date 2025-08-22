/**
 * Logger类 - 日志记录器
 * 提供统一的日志记录和调试功能
 */

export class Logger {
    constructor(options = {}) {
        this.name = options.name || 'DragonTigerGame';
        this.level = options.level || 'info';
        this.enableConsole = options.enableConsole !== false;
        this.enableStorage = options.enableStorage !== false;
        this.maxStorageEntries = options.maxStorageEntries || 1000;
        this.storageKey = options.storageKey || 'dragon_tiger_logs';
        
        this.levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };
        
        this.logs = [];
        this.loadStoredLogs();
    }

    /**
     * 从localStorage加载历史日志
     */
    loadStoredLogs() {
        if (!this.enableStorage || typeof localStorage === 'undefined') {
            return;
        }
        
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.logs = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('加载历史日志失败:', error);
        }
    }

    /**
     * 保存日志到localStorage
     */
    saveLogsToStorage() {
        if (!this.enableStorage || typeof localStorage === 'undefined') {
            return;
        }
        
        try {
            // 限制存储的日志数量
            const logsToStore = this.logs.slice(-this.maxStorageEntries);
            localStorage.setItem(this.storageKey, JSON.stringify(logsToStore));
        } catch (error) {
            console.warn('保存日志失败:', error);
        }
    }

    /**
     * 检查日志级别是否应该输出
     * @param {string} level - 日志级别
     * @returns {boolean} 是否应该输出
     */
    shouldLog(level) {
        return this.levels[level] >= this.levels[this.level];
    }

    /**
     * 创建日志条目
     * @param {string} level - 日志级别
     * @param {Array} args - 日志参数
     * @returns {Object} 日志条目
     */
    createLogEntry(level, args) {
        return {
            timestamp: new Date().toISOString(),
            level,
            logger: this.name,
            message: this.formatMessage(args),
            args: args.map(arg => this.serializeArg(arg)),
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
    }

    /**
     * 格式化日志消息
     * @param {Array} args - 参数数组
     * @returns {string} 格式化后的消息
     */
    formatMessage(args) {
        return args.map(arg => {
            if (typeof arg === 'string') {
                return arg;
            } else if (arg instanceof Error) {
                return `${arg.name}: ${arg.message}`;
            } else {
                try {
                    return JSON.stringify(arg);
                } catch {
                    return String(arg);
                }
            }
        }).join(' ');
    }

    /**
     * 序列化参数（用于存储）
     * @param {any} arg - 参数
     * @returns {any} 序列化后的参数
     */
    serializeArg(arg) {
        if (arg === null || arg === undefined) {
            return arg;
        } else if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') {
            return arg;
        } else if (arg instanceof Error) {
            return {
                type: 'Error',
                name: arg.name,
                message: arg.message,
                stack: arg.stack
            };
        } else if (arg instanceof Date) {
            return {
                type: 'Date',
                value: arg.toISOString()
            };
        } else {
            try {
                return JSON.parse(JSON.stringify(arg));
            } catch {
                return {
                    type: 'Unknown',
                    value: String(arg)
                };
            }
        }
    }

    /**
     * 记录日志
     * @param {string} level - 日志级别
     * @param {...any} args - 日志参数
     */
    log(level, ...args) {
        if (!this.shouldLog(level)) {
            return;
        }

        const logEntry = this.createLogEntry(level, args);
        this.logs.push(logEntry);

        // 输出到控制台
        if (this.enableConsole) {
            const timestamp = new Date().toLocaleTimeString();
            const prefix = `[${timestamp}] ${this.name}`;
            
            switch (level) {
                case 'debug':
                    console.debug(prefix, ...args);
                    break;
                case 'info':
                    console.info(prefix, ...args);
                    break;
                case 'warn':
                    console.warn(prefix, ...args);
                    break;
                case 'error':
                    console.error(prefix, ...args);
                    break;
            }
        }

        // 保存到存储
        this.saveLogsToStorage();

        // 清理旧日志
        if (this.logs.length > this.maxStorageEntries) {
            this.logs = this.logs.slice(-this.maxStorageEntries);
        }
    }

    /**
     * Debug级别日志
     * @param {...any} args - 日志参数
     */
    debug(...args) {
        this.log('debug', ...args);
    }

    /**
     * Info级别日志
     * @param {...any} args - 日志参数
     */
    info(...args) {
        this.log('info', ...args);
    }

    /**
     * Warn级别日志
     * @param {...any} args - 日志参数
     */
    warn(...args) {
        this.log('warn', ...args);
    }

    /**
     * Error级别日志
     * @param {...any} args - 日志参数
     */
    error(...args) {
        this.log('error', ...args);
    }

    /**
     * 获取日志
     * @param {Object} filters - 过滤条件
     * @returns {Array} 过滤后的日志数组
     */
    getLogs(filters = {}) {
        let filteredLogs = [...this.logs];

        // 按级别过滤
        if (filters.level) {
            filteredLogs = filteredLogs.filter(log => log.level === filters.level);
        }

        // 按时间范围过滤
        if (filters.startTime) {
            const startTime = new Date(filters.startTime);
            filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= startTime);
        }

        if (filters.endTime) {
            const endTime = new Date(filters.endTime);
            filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= endTime);
        }

        // 按关键词过滤
        if (filters.keyword) {
            const keyword = filters.keyword.toLowerCase();
            filteredLogs = filteredLogs.filter(log => 
                log.message.toLowerCase().includes(keyword)
            );
        }

        // 限制数量
        if (filters.limit) {
            filteredLogs = filteredLogs.slice(-filters.limit);
        }

        return filteredLogs;
    }

    /**
     * 清除日志
     * @param {Object} options - 清除选项
     */
    clearLogs(options = {}) {
        if (options.olderThan) {
            const cutoffDate = new Date(Date.now() - options.olderThan);
            this.logs = this.logs.filter(log => new Date(log.timestamp) > cutoffDate);
        } else {
            this.logs = [];
        }

        this.saveLogsToStorage();
        this.info('日志已清除');
    }

    /**
     * 导出日志
     * @param {Object} options - 导出选项
     * @returns {string} 导出的日志字符串
     */
    exportLogs(options = {}) {
        const { format = 'json', filters = {} } = options;
        const logs = this.getLogs(filters);

        switch (format) {
            case 'json':
                return JSON.stringify(logs, null, 2);
            
            case 'csv':
                const headers = ['时间', '级别', '消息'];
                const rows = logs.map(log => [
                    log.timestamp,
                    log.level,
                    log.message.replace(/"/g, '""')
                ]);
                return [headers, ...rows].map(row => 
                    row.map(field => `"${field}"`).join(',')
                ).join('\n');
            
            case 'text':
                return logs.map(log => 
                    `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`
                ).join('\n');
            
            default:
                throw new Error(`不支持的导出格式: ${format}`);
        }
    }

    /**
     * 获取日志统计信息
     * @returns {Object} 统计信息
     */
    getStats() {
        const stats = {
            total: this.logs.length,
            byLevel: {},
            recentErrors: [],
            memoryUsage: JSON.stringify(this.logs).length
        };

        // 按级别统计
        Object.keys(this.levels).forEach(level => {
            stats.byLevel[level] = this.logs.filter(log => log.level === level).length;
        });

        // 最近的错误
        stats.recentErrors = this.logs
            .filter(log => log.level === 'error')
            .slice(-5)
            .map(log => ({
                timestamp: log.timestamp,
                message: log.message
            }));

        return stats;
    }

    /**
     * 性能计时开始
     * @param {string} label - 计时标签
     */
    time(label) {
        if (this.enableConsole) {
            console.time(`${this.name}:${label}`);
        }
        this.debug(`开始计时: ${label}`);
    }

    /**
     * 性能计时结束
     * @param {string} label - 计时标签
     */
    timeEnd(label) {
        if (this.enableConsole) {
            console.timeEnd(`${this.name}:${label}`);
        }
        this.debug(`结束计时: ${label}`);
    }

    /**
     * 记录性能标记
     * @param {string} label - 标记标签
     */
    mark(label) {
        if (this.enableConsole && performance.mark) {
            performance.mark(`${this.name}:${label}`);
        }
        this.debug(`性能标记: ${label}`);
    }

    /**
     * 设置日志级别
     * @param {string} level - 新的日志级别
     */
    setLevel(level) {
        if (this.levels.hasOwnProperty(level)) {
            this.level = level;
            this.info(`日志级别已设置为: ${level}`);
        } else {
            this.warn(`无效的日志级别: ${level}`);
        }
    }

    /**
     * 创建子Logger
     * @param {string} name - 子Logger名称
     * @param {Object} options - 选项
     * @returns {Logger} 子Logger实例
     */
    createChild(name, options = {}) {
        return new Logger({
            ...options,
            name: `${this.name}:${name}`,
            level: options.level || this.level,
            enableConsole: options.enableConsole !== undefined ? options.enableConsole : this.enableConsole,
            enableStorage: false // 子Logger不独立存储
        });
    }
}
