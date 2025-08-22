/**
 * ImageLoader类 - 图片资源加载器
 * 负责加载、缓存和管理游戏中的图片资源
 */

export class ImageLoader {
    constructor() {
        this.imageCache = new Map();
        this.loadingPromises = new Map();
        this.defaultImages = {
            cardBack: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgdmlld0JveD0iMCAwIDIwMCAyODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjgwIiByeD0iMTAiIGZpbGw9IiMxYTFhMWEiLz4KPHN2ZyB4PSI1MCIgeT0iNzAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTQwIiBmaWxsPSIjMzMzIj4KPHN2ZyB4PSIyMCIgeT0iMjAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjI1IiBmaWxsPSIjNjY2Ii8+CjwvY2lyY2xlPgo8L3N2Zz4KPHN2ZyB4PSIyMCIgeT0iNjAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjI1IiBmaWxsPSIjNjY2Ii8+Cjx0ZXh0IHg9IjMwIiB5PSIzNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMjAiPuKZoTwvdGV4dD4KPC9zdmc+Cjwvc3ZnPgo8L3N2Zz4=',
            placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgdmlld0JveD0iMCAwIDIwMCAyODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjgwIiByeD0iMTAiIGZpbGw9IiNmNWY1ZjUiIHN0cm9rZT0iI2RkZCIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LXNpemU9IjE2Ij7lm77niYfliqDovb3kuK08L3RleHQ+Cjx0ZXh0IHg9IjEwMCIgeT0iMTYwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LXNpemU9IjEyIj5JbWFnZSBMb2FkaW5nLi4uPC90ZXh0Pgo8L3N2Zz4='
        };
    }

    /**
     * 加载单张图片
     * @param {string} src - 图片URL
     * @param {Object} options - 加载选项
     * @returns {Promise<HTMLImageElement>} 图片元素
     */
    async loadImage(src, options = {}) {
        const { 
            useCache = true, 
            timeout = 10000,
            fallback = this.defaultImages.placeholder 
        } = options;

        // 如果已缓存且使用缓存，直接返回
        if (useCache && this.imageCache.has(src)) {
            return this.imageCache.get(src);
        }

        // 如果正在加载，返回加载Promise
        if (this.loadingPromises.has(src)) {
            return this.loadingPromises.get(src);
        }

        // 创建加载Promise
        const loadPromise = this.createLoadPromise(src, timeout, fallback);
        this.loadingPromises.set(src, loadPromise);

        try {
            const image = await loadPromise;
            
            // 缓存成功加载的图片
            if (useCache) {
                this.imageCache.set(src, image);
            }
            
            return image;
        } finally {
            // 清理加载Promise
            this.loadingPromises.delete(src);
        }
    }

    /**
     * 创建图片加载Promise
     * @param {string} src - 图片URL
     * @param {number} timeout - 超时时间
     * @param {string} fallback - 降级图片
     * @returns {Promise<HTMLImageElement>}
     */
    createLoadPromise(src, timeout, fallback) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            let isLoaded = false;

            // 设置超时
            const timeoutId = setTimeout(() => {
                if (!isLoaded) {
                    console.warn(`图片加载超时: ${src}`);
                    // 尝试加载降级图片
                    this.loadFallbackImage(fallback).then(resolve).catch(reject);
                }
            }, timeout);

            img.onload = () => {
                if (!isLoaded) {
                    isLoaded = true;
                    clearTimeout(timeoutId);
                    resolve(img);
                }
            };

            img.onerror = () => {
                if (!isLoaded) {
                    isLoaded = true;
                    clearTimeout(timeoutId);
                    console.warn(`图片加载失败: ${src}`);
                    // 尝试加载降级图片
                    this.loadFallbackImage(fallback).then(resolve).catch(reject);
                }
            };

            img.src = src;
        });
    }

    /**
     * 加载降级图片
     * @param {string} fallbackSrc - 降级图片URL
     * @returns {Promise<HTMLImageElement>}
     */
    async loadFallbackImage(fallbackSrc) {
        const img = new Image();
        return new Promise((resolve, reject) => {
            img.onload = () => resolve(img);
            img.onerror = () => {
                // 如果降级图片也失败，创建一个纯色矩形
                const canvas = document.createElement('canvas');
                canvas.width = 200;
                canvas.height = 280;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#f5f5f5';
                ctx.fillRect(0, 0, 200, 280);
                ctx.strokeStyle = '#ddd';
                ctx.strokeRect(1, 1, 198, 278);
                
                const fallbackImg = new Image();
                fallbackImg.src = canvas.toDataURL();
                resolve(fallbackImg);
            };
            img.src = fallbackSrc;
        });
    }

    /**
     * 批量预加载图片
     * @param {Array<string>} imageUrls - 图片URL数组
     * @param {Function} onProgress - 进度回调
     * @param {Object} options - 加载选项
     * @returns {Promise<Array<HTMLImageElement>>} 图片数组
     */
    async preloadImages(imageUrls, onProgress = null, options = {}) {
        const { concurrency = 3 } = options;
        const results = [];
        let loaded = 0;

        // 分批加载，控制并发数
        for (let i = 0; i < imageUrls.length; i += concurrency) {
            const batch = imageUrls.slice(i, i + concurrency);
            const batchPromises = batch.map(async (url) => {
                try {
                    const image = await this.loadImage(url, options);
                    loaded++;
                    if (onProgress) {
                        onProgress(loaded, imageUrls.length);
                    }
                    return { url, image, success: true };
                } catch (error) {
                    loaded++;
                    if (onProgress) {
                        onProgress(loaded, imageUrls.length);
                    }
                    console.warn(`预加载失败: ${url}`, error);
                    return { url, image: null, success: false, error };
                }
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }

        return results;
    }

    /**
     * 获取卡牌图片
     * @param {string} cardId - 卡牌ID
     * @returns {Promise<HTMLImageElement>}
     */
    async getCardImage(cardId) {
        const imagePath = `assets/cards/${cardId}.png`;
        return this.loadImage(imagePath, {
            fallback: this.defaultImages.placeholder
        });
    }

    /**
     * 获取卡牌背面图片
     * @returns {Promise<HTMLImageElement>}
     */
    async getCardBackImage() {
        return this.loadImage('assets/cards/card_back.png', {
            fallback: this.defaultImages.cardBack
        });
    }

    /**
     * 预加载所有卡牌图片
     * @param {Function} onProgress - 进度回调
     * @returns {Promise<Object>} 加载结果统计
     */
    async preloadAllCardImages(onProgress = null) {
        const cardIds = [];
        
        // 龙阵营卡牌
        for (let i = 1; i <= 8; i++) {
            cardIds.push(`dragon_${i}`);
        }
        
        // 虎阵营卡牌
        for (let i = 1; i <= 8; i++) {
            cardIds.push(`tiger_${i}`);
        }

        // 添加卡牌背面
        const imageUrls = [
            'assets/cards/card_back.png',
            ...cardIds.map(id => `assets/cards/${id}.png`)
        ];

        const results = await this.preloadImages(imageUrls, onProgress);
        
        const stats = {
            total: results.length,
            success: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            failedUrls: results.filter(r => !r.success).map(r => r.url)
        };

        console.log(`卡牌图片预加载完成: ${stats.success}/${stats.total} 成功`);
        if (stats.failed > 0) {
            console.warn('预加载失败的图片:', stats.failedUrls);
        }

        return stats;
    }

    /**
     * 清理缓存
     * @param {Array<string>} urls - 要清理的URL数组，不传则清理全部
     */
    clearCache(urls = null) {
        if (urls) {
            urls.forEach(url => {
                this.imageCache.delete(url);
                this.loadingPromises.delete(url);
            });
        } else {
            this.imageCache.clear();
            this.loadingPromises.clear();
        }
    }

    /**
     * 获取缓存统计信息
     * @returns {Object} 缓存统计
     */
    getCacheStats() {
        return {
            cached: this.imageCache.size,
            loading: this.loadingPromises.size,
            memoryUsage: this.estimateMemoryUsage()
        };
    }

    /**
     * 估算内存使用量（字节）
     * @returns {number} 估算的内存使用量
     */
    estimateMemoryUsage() {
        let totalBytes = 0;
        
        this.imageCache.forEach((image) => {
            if (image.naturalWidth && image.naturalHeight) {
                // 估算：width * height * 4 (RGBA)
                totalBytes += image.naturalWidth * image.naturalHeight * 4;
            }
        });
        
        return totalBytes;
    }

    /**
     * 格式化内存使用量为可读字符串
     * @param {number} bytes - 字节数
     * @returns {string} 格式化字符串
     */
    formatMemoryUsage(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }

    /**
     * 检查图片是否已加载到缓存
     * @param {string} src - 图片URL
     * @returns {boolean} 是否已缓存
     */
    isImageCached(src) {
        return this.imageCache.has(src);
    }

    /**
     * 获取默认图片
     * @param {string} type - 默认图片类型
     * @returns {string} 默认图片的DataURL
     */
    getDefaultImage(type = 'placeholder') {
        return this.defaultImages[type] || this.defaultImages.placeholder;
    }
}
