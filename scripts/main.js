/**
 * 龙虎斗游戏主入口
 * 负责初始化游戏引擎、UI管理器和整体应用流程
 */

import { GameEngine } from './core/GameEngine.js';
import { UIManager } from './ui/UIManager.js';
import { ImageLoader } from './utils/ImageLoader.js';
import { Logger } from './utils/Logger.js';

/**
 * 游戏应用主类
 */
class DragonTigerGame {
    constructor() {
        this.gameEngine = null;
        this.uiManager = null;
        this.logger = new Logger('[DragonTigerGame]');
        this.isInitialized = false;
        this.loadingProgress = 0;
        
        // 性能监控
        this.performanceData = {
            startTime: performance.now(),
            loadTime: 0,
            frameCount: 0,
            lastFrameTime: 0,
            fps: 0
        };
        
        // 错误处理
        this.setupErrorHandling();
    }

    /**
     * 启动应用
     */
    async init() {
        try {
            this.logger.log('🎮 启动龙虎斗游戏...');
            this.updateLoadingProgress(10, '初始化中...');

            // 初始化基础系统
            await this.initializeSystems();
            this.updateLoadingProgress(30, '加载资源...');

            // 预加载资源
            await this.preloadAssets();
            this.updateLoadingProgress(60, '初始化游戏引擎...');
            
            // 初始化游戏引擎
            this.gameEngine = new GameEngine();
            this.updateLoadingProgress(80, '初始化用户界面...');
            
            // 初始化UI管理器
            this.uiManager = new UIManager(this.gameEngine);
            this.uiManager.init();
            this.updateLoadingProgress(90, '完成初始化...');
            
            // 绑定事件监听器
            this.bindEvents();
            this.updateLoadingProgress(95, '准备就绪...');
            
            // 启动性能监控
            this.startPerformanceMonitoring();
            
            // 隐藏加载屏幕，显示游戏界面
            await this.showGame();
            this.updateLoadingProgress(100, '游戏已就绪！');
            
            this.isInitialized = true;
            this.performanceData.loadTime = performance.now() - this.performanceData.startTime;
            
            this.logger.log(`✅ 游戏初始化完成，耗时 ${this.performanceData.loadTime.toFixed(2)}ms`);
            
            // 暴露调试接口
            this.exposeDebugInterface();
            
        } catch (error) {
            this.logger.error('❌ 游戏初始化失败:', error);
            this.showError('游戏初始化失败，请刷新页面重试。');
        }
    }

    /**
     * 初始化基础系统
     */
    async initializeSystems() {
        // 检查浏览器兼容性
        this.checkBrowserCompatibility();
        
        // 设置全局配置
        this.setupGlobalConfig();
        
        // Service Worker 暂时禁用
        // if ('serviceWorker' in navigator) {
        //     try {
        //         await navigator.serviceWorker.register('sw.js');
        //         this.logger.log('Service Worker 注册成功');
        //     } catch (error) {
        //         this.logger.warn('Service Worker 注册失败:', error);
        //     }
        // }
    }

    /**
     * 检查浏览器兼容性
     */
    checkBrowserCompatibility() {
        const requiredFeatures = [
            'Promise',
            'fetch',
            'localStorage',
            'addEventListener'
        ];

        const unsupportedFeatures = requiredFeatures.filter(feature => {
            return !(feature in window);
        });

        if (unsupportedFeatures.length > 0) {
            throw new Error(`浏览器不支持以下特性: ${unsupportedFeatures.join(', ')}`);
        }

        // 检查ES6模块支持
        if (!window.ES6ModuleSupport) {
            const script = document.createElement('script');
            script.type = 'module';
            script.textContent = 'window.ES6ModuleSupport = true;';
            document.head.appendChild(script);
            
            setTimeout(() => {
                if (!window.ES6ModuleSupport) {
                    this.showError('您的浏览器不支持ES6模块，请使用现代浏览器。');
                }
            }, 100);
        }
    }

    /**
     * 设置全局配置
     */
    setupGlobalConfig() {
        // 设置全局游戏配置
        window.DRAGON_TIGER_CONFIG = {
            version: '1.0.0',
            debug: localStorage.getItem('dragon_tiger_debug') === 'true',
            performance: localStorage.getItem('dragon_tiger_performance') === 'true',
            sound: localStorage.getItem('dragon_tiger_sound') !== 'false'
        };

        // 防止文本选择
        document.addEventListener('selectstart', e => e.preventDefault());
        
        // 防止右键菜单
        document.addEventListener('contextmenu', e => e.preventDefault());
        
        // 防止拖拽
        document.addEventListener('dragstart', e => e.preventDefault());
    }

    /**
     * 预加载游戏资源
     */
    async preloadAssets() {
        const criticalImages = [
            'assets/cards/card_back.png',
            'assets/images/dragon_icon.png',
            'assets/images/tiger_icon.png'
        ];

        const allCardImages = [];
        for (let i = 1; i <= 8; i++) {
            allCardImages.push(`assets/cards/dragon_${i}.png`);
            allCardImages.push(`assets/cards/tiger_${i}.png`);
        }

        try {
            // 预加载关键图片
            await ImageLoader.preloadImages(criticalImages);
            this.updateLoadingProgress(45, '加载卡牌图片...');
            
            // 预加载卡牌图片（允许部分失败）
            const cardResults = await Promise.allSettled(
                allCardImages.map(path => ImageLoader.loadImage(path))
            );
            
            const failedCards = cardResults.filter(result => result.status === 'rejected').length;
            if (failedCards > 0) {
                this.logger.warn(`${failedCards} 张卡牌图片加载失败，将使用文字替代`);
            }
            
            this.logger.log(`✅ 资源预加载完成，成功加载 ${cardResults.length - failedCards}/${cardResults.length} 张图片`);
            
        } catch (error) {
            this.logger.warn('资源预加载部分失败:', error);
        }
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 开始游戏按钮
        const startBtn = document.getElementById('start-game-btn');
        if (startBtn) {
            startBtn.addEventListener('click', this.startGame.bind(this));
        }

        // 帮助按钮
        const helpBtn = document.getElementById('help-btn');
        if (helpBtn) {
            helpBtn.addEventListener('click', this.showHelp.bind(this));
        }

        // 窗口大小变化
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // 页面可见性变化
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        // 键盘快捷键
        document.addEventListener('keydown', this.handleKeyDown.bind(this));

        // 游戏引擎事件
        if (this.gameEngine) {
            this.gameEngine.on('gameStarted', this.onGameStarted.bind(this));
            this.gameEngine.on('gameEnded', this.onGameEnded.bind(this));
            this.gameEngine.on('aiTurnCompleted', this.onAITurnCompleted.bind(this));
        }

        // 性能警告
        this.setupPerformanceWarnings();
    }

    /**
     * 启动游戏
     */
    async startGame() {
        if (!this.isInitialized) {
            this.showError('游戏尚未初始化完成，请稍候。');
            return;
        }

        try {
            this.logger.log('🎯 开始新游戏');
            
            // 隐藏开始屏幕
            const startScreen = document.getElementById('start-screen');
            if (startScreen) {
                startScreen.style.display = 'none';
            }

            // 显示游戏界面
            const gameContainer = document.getElementById('game-container');
            if (gameContainer) {
                gameContainer.classList.remove('hidden');
            }

            // 启动游戏引擎
            const result = this.gameEngine.startNewGame();
            if (!result.success) {
                throw new Error(result.error?.message || '游戏启动失败');
            }

            this.logger.log('✅ 游戏启动成功');
            
            // 确保UI管理器正确处理游戏状态
            if (this.uiManager) {
                // 触发游戏开始的UI更新
                this.uiManager.onGameStarted?.(result.data);
            }
            
        } catch (error) {
            this.logger.error('❌ 游戏启动失败:', error);
            this.showError('游戏启动失败，请重试。' + error.message);
        }
    }

    /**
     * 显示帮助
     */
    showHelp() {
        const helpModal = document.getElementById('help-modal');
        if (helpModal) {
            helpModal.classList.remove('hidden');
        }
    }

    /**
     * 更新加载进度
     */
    updateLoadingProgress(progress, text) {
        this.loadingProgress = Math.min(100, Math.max(0, progress));
        
        const progressFill = document.getElementById('loading-progress-fill');
        const progressText = document.getElementById('loading-progress-text');
        
        if (progressFill) {
            progressFill.style.width = `${this.loadingProgress}%`;
        }
        
        if (progressText) {
            progressText.textContent = text;
        }
    }

    /**
     * 显示游戏界面
     */
    async showGame() {
        return new Promise(resolve => {
            setTimeout(() => {
                const loadingScreen = document.getElementById('loading-screen');
                const startScreen = document.getElementById('start-screen');
                
                if (loadingScreen) {
                    loadingScreen.style.opacity = '0';
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                        if (startScreen) {
                            startScreen.style.display = 'flex';
                            startScreen.classList.remove('hidden');
                        }
                        resolve();
                    }, 500);
                } else {
                    if (startScreen) {
                        startScreen.style.display = 'flex';
                        startScreen.classList.remove('hidden');
                    }
                    resolve();
                }
            }, 800);
        });
    }

    /**
     * 显示错误信息
     */
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #e74c3c;
            color: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 10001;
            font-family: Arial, sans-serif;
            text-align: center;
            max-width: 300px;
        `;
        errorDiv.innerHTML = `
            <h3>错误</h3>
            <p>${message}</p>
            <button onclick="this.parentElement.remove()" style="
                background: white;
                color: #e74c3c;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                margin-top: 10px;
                cursor: pointer;
            ">确定</button>
        `;
        
        document.body.appendChild(errorDiv);
    }

    /**
     * 处理窗口大小变化
     */
    handleResize() {
        if (this.uiManager) {
            this.uiManager.handleResize();
        }
    }

    /**
     * 处理页面可见性变化
     */
    handleVisibilityChange() {
        if (document.visibilityState === 'hidden') {
            // 页面隐藏时暂停动画和计时器
            this.pauseGame();
        } else {
            // 页面显示时恢复
            this.resumeGame();
        }
    }

    /**
     * 暂停游戏
     */
    pauseGame() {
        if (this.uiManager?.animationController) {
            this.uiManager.animationController.stopAllAnimations();
        }
        this.logger.log('⏸️ 游戏已暂停');
    }

    /**
     * 恢复游戏
     */
    resumeGame() {
        this.logger.log('▶️ 游戏已恢复');
    }

    /**
     * 处理键盘事件
     */
    handleKeyDown(event) {
        // 调试快捷键
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 'd':
                    event.preventDefault();
                    this.toggleDebugMode();
                    break;
                case 'p':
                    event.preventDefault();
                    this.togglePerformanceMode();
                    break;
                case 'r':
                    event.preventDefault();
                    if (this.gameEngine) {
                        this.gameEngine.restartGame();
                    }
                    break;
            }
        }

        // ESC键关闭模态框
        if (event.key === 'Escape') {
            const modals = document.querySelectorAll('.modal:not(.hidden)');
            modals.forEach(modal => modal.classList.add('hidden'));
        }
    }

    /**
     * 游戏开始事件处理
     */
    onGameStarted(data) {
        this.logger.log('🎮 游戏已开始', data);
    }

    /**
     * 游戏结束事件处理
     */
    onGameEnded(data) {
        this.logger.log('🏁 游戏结束', data);
    }

    /**
     * AI回合完成事件处理
     */
    async onAITurnCompleted(data) {
        this.logger.log('🤖 AI回合完成', data);
        
        // 如果游戏还在进行且轮到AI，继续执行AI回合
        if (!data.isGameOver && this.gameEngine.gameState.currentPlayer === 'ai') {
            setTimeout(async () => {
                await this.gameEngine.executeAITurn();
            }, 1000); // 给玩家一点时间观察
        }
    }

    /**
     * 启动性能监控
     */
    startPerformanceMonitoring() {
        if (!window.DRAGON_TIGER_CONFIG?.performance) return;

        let lastTime = performance.now();
        
        const updatePerformance = (currentTime) => {
            this.performanceData.frameCount++;
            
            if (currentTime - this.performanceData.lastFrameTime >= 1000) {
                this.performanceData.fps = this.performanceData.frameCount;
                this.performanceData.frameCount = 0;
                this.performanceData.lastFrameTime = currentTime;
                
                // 在控制台显示性能信息
                if (window.DRAGON_TIGER_CONFIG.debug) {
                    console.log(`FPS: ${this.performanceData.fps}, Memory: ${this.getMemoryUsage()}`);
                }
            }
            
            requestAnimationFrame(updatePerformance);
        };
        
        requestAnimationFrame(updatePerformance);
    }

    /**
     * 获取内存使用情况
     */
    getMemoryUsage() {
        if (performance.memory) {
            const used = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
            const total = Math.round(performance.memory.totalJSHeapSize / 1024 / 1024);
            return `${used}MB / ${total}MB`;
        }
        return 'N/A';
    }

    /**
     * 设置性能警告
     */
    setupPerformanceWarnings() {
        // 检测低性能设备
        if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
            this.logger.warn('⚠️ 检测到低性能设备，可能影响游戏体验');
        }

        // 内存警告
        if (performance.memory && performance.memory.totalJSHeapSize < 50 * 1024 * 1024) {
            this.logger.warn('⚠️ 可用内存较少，建议关闭其他网页');
        }
    }

    /**
     * 切换调试模式
     */
    toggleDebugMode() {
        const current = window.DRAGON_TIGER_CONFIG.debug;
        window.DRAGON_TIGER_CONFIG.debug = !current;
        localStorage.setItem('dragon_tiger_debug', !current);
        this.logger.log(`🔧 调试模式: ${!current ? '开启' : '关闭'}`);
    }

    /**
     * 切换性能模式
     */
    togglePerformanceMode() {
        const current = window.DRAGON_TIGER_CONFIG.performance;
        window.DRAGON_TIGER_CONFIG.performance = !current;
        localStorage.setItem('dragon_tiger_performance', !current);
        this.logger.log(`📊 性能监控: ${!current ? '开启' : '关闭'}`);
    }

    /**
     * 设置错误处理
     */
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            this.logger.error('❌ 全局错误:', event.error);
            
            if (window.DRAGON_TIGER_CONFIG?.debug) {
                this.showError(`错误: ${event.error?.message || '未知错误'}`);
            }
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.logger.error('❌ 未处理的Promise拒绝:', event.reason);
            
            if (window.DRAGON_TIGER_CONFIG?.debug) {
                this.showError(`Promise错误: ${event.reason?.message || '未知错误'}`);
            }
        });
    }

    /**
     * 暴露调试接口
     */
    exposeDebugInterface() {
        if (window.DRAGON_TIGER_CONFIG?.debug) {
            window.DragonTigerDebug = {
                game: this,
                gameEngine: this.gameEngine,
                uiManager: this.uiManager,
                logger: this.logger,
                performance: this.performanceData,
                
                // 调试函数
                restart: () => this.gameEngine?.restartGame(),
                toggleAI: (difficulty) => {
                    if (this.gameEngine?.aiPlayer) {
                        this.gameEngine.aiPlayer.difficulty = difficulty || 'medium';
                        this.logger.log(`AI难度设置为: ${difficulty || 'medium'}`);
                    }
                },
                getGameState: () => this.gameEngine?.gameState?.toJSON(),
                enableThinking: () => {
                    if (this.gameEngine?.aiPlayer) {
                        this.gameEngine.aiPlayer.enableThinkingLog = true;
                        this.logger.log('AI思考日志已启用');
                    }
                }
            };
            
            this.logger.log('🔧 调试接口已暴露至 window.DragonTigerDebug');
        }
    }

    /**
     * 获取游戏统计信息
     */
    getGameStats() {
        return {
            performance: this.performanceData,
            gameEngine: this.gameEngine?.getGameStats(),
            uiManager: this.uiManager?.getStats?.(),
            browser: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                hardwareConcurrency: navigator.hardwareConcurrency,
                deviceMemory: navigator.deviceMemory
            }
        };
    }
}

// 应用入口点
document.addEventListener('DOMContentLoaded', async () => {
    const game = new DragonTigerGame();
    await game.init();
    
    // 暴露到全局作用域用于调试
    window.dragonTigerGame = game;
});