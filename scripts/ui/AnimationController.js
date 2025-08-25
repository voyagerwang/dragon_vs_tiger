/**
 * AnimationController类 - 动画控制器
 * 负责管理游戏中的各种动画效果
 */

export class AnimationController {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.activeAnimations = new Set();
        this.animationQueue = [];
        this.isProcessingQueue = false;
        
        // 动画配置
        this.config = {
            flipDuration: 600,
            moveDuration: 400,
            battleDuration: 1000,
            highlightDuration: 300,
            easingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        };
    }

    /**
     * 播放翻牌动画
     * @param {Element} cell - 格子元素
     * @param {Card} card - 卡牌对象
     * @returns {Promise} 动画完成Promise
     */
    async playFlipAnimation(cell, card) {
        const animationId = `flip_${Date.now()}`;
        this.activeAnimations.add(animationId);

        try {
            this.uiManager.setAnimating(true);
            
            const cardContainer = cell.querySelector('.card-container');
            if (!cardContainer) return;

            // 创建翻牌动画
            await this.createFlipAnimation(cardContainer, card);
            
            // 更新卡牌外观
            this.uiManager.boardRenderer.updateCardAppearance(cell, card);
            
        } finally {
            this.activeAnimations.delete(animationId);
            if (this.activeAnimations.size === 0) {
                this.uiManager.setAnimating(false);
            }
        }
    }

    /**
     * 创建翻牌动画
     * @param {Element} container - 卡牌容器
     * @param {Card} card - 卡牌对象
     * @returns {Promise} 动画完成Promise
     */
    createFlipAnimation(container, card) {
        return new Promise(resolve => {
            // 创建3D翻转效果
            const cardElement = container.querySelector('.game-card') || this.createTempCard();
            
            // 设置初始状态
            cardElement.style.transformStyle = 'preserve-3d';
            cardElement.style.transition = `transform ${this.config.flipDuration}ms ${this.config.easingFunction}`;
            
            // 第一阶段：翻转到90度（显示侧面）
            cardElement.style.transform = 'rotateY(90deg)';
            
            setTimeout(() => {
                // 更换卡牌内容
                this.updateCardContent(cardElement, card);
                
                // 第二阶段：完成翻转
                cardElement.style.transform = 'rotateY(0deg)';
                
                setTimeout(() => {
                    // 清理动画样式
                    cardElement.style.transition = '';
                    cardElement.style.transformStyle = '';
                    cardElement.classList.add('flip-complete');
                    
                    // 添加发光效果
                    this.addGlowEffect(cardElement, card.faction);
                    
                    resolve();
                }, this.config.flipDuration / 2);
                
            }, this.config.flipDuration / 2);
        });
    }

    /**
     * 更新卡牌内容
     * @param {Element} cardElement - 卡牌元素
     * @param {Card} card - 卡牌对象
     */
    updateCardContent(cardElement, card) {
        cardElement.innerHTML = '';
        cardElement.className = `game-card revealed ${card.faction}`;
        cardElement.dataset.cardId = card.id;

        // 创建卡牌图片
        const cardImage = this.uiManager.document.createElement('img');
        cardImage.src = card.getImagePath();
        cardImage.alt = card.name;
        cardImage.className = 'card-image';
        cardImage.loading = 'eager';
        
        // 图片加载失败降级
        cardImage.onerror = () => {
            cardImage.style.display = 'none';
            const textFallback = this.createTextFallback(card);
            cardElement.appendChild(textFallback);
        };
        
        cardElement.appendChild(cardImage);

        // 添加信息覆盖层
        const infoOverlay = this.createInfoOverlay(card);
        cardElement.appendChild(infoOverlay);
    }

    /**
     * 创建文字降级显示
     * @param {Card} card - 卡牌对象
     * @returns {Element} 文字元素
     */
    createTextFallback(card) {
        const textFallback = this.uiManager.document.createElement('div');
        textFallback.className = `card-text-fallback ${card.faction}`;
        textFallback.innerHTML = `
            <div class="card-name">${card.name}</div>
            <div class="card-level">Lv.${card.level}</div>
            <div class="card-faction-icon">${card.faction === 'dragon' ? '🐲' : '🐯'}</div>
        `;
        return textFallback;
    }

    /**
     * 创建信息覆盖层
     * @param {Card} card - 卡牌对象
     * @returns {Element} 覆盖层元素
     */
    createInfoOverlay(card) {
        const overlay = this.uiManager.document.createElement('div');
        overlay.className = 'card-info-overlay';
        overlay.innerHTML = `
            <div class="card-name">${card.name}</div>
            <div class="card-level">Lv.${card.level}</div>
        `;
        return overlay;
    }

    /**
     * 播放移动动画
     * @param {Element} fromCell - 起始格子
     * @param {Element} toCell - 目标格子
     * @param {Card} card - 移动的卡牌
     * @returns {Promise} 动画完成Promise
     */
    async playMoveAnimation(fromCell, toCell, card) {
        const animationId = `move_${Date.now()}`;
        this.activeAnimations.add(animationId);

        try {
            this.uiManager.setAnimating(true);
            
            const cardElement = fromCell.querySelector('.game-card');
            if (!cardElement) return;

            // 计算移动路径
            const path = this.calculateMovePath(fromCell, toCell);
            
            // 执行移动动画
            await this.executeMove(cardElement, path);
            
            // 移动DOM元素
            const toContainer = toCell.querySelector('.card-container');
            if (toContainer) {
                toContainer.appendChild(cardElement);
            }
            
        } finally {
            this.activeAnimations.delete(animationId);
            if (this.activeAnimations.size === 0) {
                this.uiManager.setAnimating(false);
            }
        }
    }

    /**
     * 计算移动路径
     * @param {Element} fromCell - 起始格子
     * @param {Element} toCell - 目标格子
     * @returns {Object} 路径信息
     */
    calculateMovePath(fromCell, toCell) {
        const fromRect = fromCell.getBoundingClientRect();
        const toRect = toCell.getBoundingClientRect();
        
        return {
            startX: fromRect.left + fromRect.width / 2,
            startY: fromRect.top + fromRect.height / 2,
            endX: toRect.left + toRect.width / 2,
            endY: toRect.top + toRect.height / 2,
            deltaX: toRect.left - fromRect.left,
            deltaY: toRect.top - fromRect.top,
            distance: Math.sqrt(
                Math.pow(toRect.left - fromRect.left, 2) + 
                Math.pow(toRect.top - fromRect.top, 2)
            )
        };
    }

    /**
     * 执行移动动画
     * @param {Element} cardElement - 卡牌元素
     * @param {Object} path - 移动路径
     * @returns {Promise} 动画完成Promise
     */
    executeMove(cardElement, path) {
        return new Promise(resolve => {
            // 设置动画样式
            cardElement.style.position = 'relative';
            cardElement.style.zIndex = '1000';
            cardElement.style.transition = `transform ${this.config.moveDuration}ms ${this.config.easingFunction}`;
            
            // 添加移动中的视觉效果
            cardElement.classList.add('moving');
            
            // 执行移动
            requestAnimationFrame(() => {
                cardElement.style.transform = `translate(${path.deltaX}px, ${path.deltaY}px) scale(1.1)`;
                
                setTimeout(() => {
                    // 恢复样式
                    cardElement.style.transform = 'scale(1)';
                    
                    setTimeout(() => {
                        cardElement.style.position = '';
                        cardElement.style.zIndex = '';
                        cardElement.style.transition = '';
                        cardElement.style.transform = '';
                        cardElement.classList.remove('moving');
                        
                        resolve();
                    }, 100);
                }, this.config.moveDuration);
            });
        });
    }

    /**
     * 播放战斗动画
     * @param {Object} battleResult - 战斗结果
     * @returns {Promise} 动画完成Promise
     */
    async playBattleAnimation(battleResult) {
        const animationId = `battle_${Date.now()}`;
        this.activeAnimations.add(animationId);

        try {
            this.uiManager.setAnimating(true);
            
            const { attackerCard, defenderCard, winner, eliminatedCards } = battleResult;
            
            // 获取战斗双方的DOM元素
            const attackerCell = this.getCellByCard(attackerCard);
            const defenderCell = this.getCellByCard(defenderCard);
            
            if (!attackerCell || !defenderCell) return;
            
            // 播放战斗冲突动画
            await this.playBattleClash(attackerCell, defenderCell);
            
            // 播放结果动画
            await this.playBattleResult(attackerCell, defenderCell, winner, eliminatedCards);
            
        } finally {
            this.activeAnimations.delete(animationId);
            if (this.activeAnimations.size === 0) {
                this.uiManager.setAnimating(false);
            }
        }
    }

    /**
     * 播放战斗冲突动画
     * @param {Element} attackerCell - 攻击方格子
     * @param {Element} defenderCell - 防守方格子
     * @returns {Promise} 动画完成Promise
     */
    playBattleClash(attackerCell, defenderCell) {
        return new Promise(resolve => {
            // 添加战斗效果
            attackerCell.classList.add('battle-attacker');
            defenderCell.classList.add('battle-defender');
            
            // 震动效果
            this.addShakeEffect(attackerCell);
            this.addShakeEffect(defenderCell);
            
            // 闪光效果
            setTimeout(() => {
                this.addFlashEffect(defenderCell);
                
                setTimeout(() => {
                    attackerCell.classList.remove('battle-attacker');
                    defenderCell.classList.remove('battle-defender');
                    resolve();
                }, 300);
            }, 200);
        });
    }

    /**
     * 播放战斗结果动画
     * @param {Element} attackerCell - 攻击方格子
     * @param {Element} defenderCell - 防守方格子
     * @param {string} winner - 胜者
     * @param {Array} eliminatedCards - 被消灭的卡牌
     * @returns {Promise} 动画完成Promise
     */
    playBattleResult(attackerCell, defenderCell, winner, eliminatedCards) {
        return new Promise(resolve => {
            // 为被消灭的卡牌播放消失动画
            const eliminationPromises = eliminatedCards.map(card => {
                const cell = this.getCellByCard(card);
                return cell ? this.playEliminationAnimation(cell) : Promise.resolve();
            });
            
            Promise.all(eliminationPromises).then(() => {
                // 为获胜方播放胜利动画
                if (winner === 'attacker') {
                    this.addVictoryEffect(attackerCell);
                } else if (winner === 'defender') {
                    this.addVictoryEffect(defenderCell);
                }
                
                resolve();
            });
        });
    }

    /**
     * 播放卡牌消失动画
     * @param {Element} cell - 格子元素
     * @returns {Promise} 动画完成Promise
     */
    playEliminationAnimation(cell) {
        return new Promise(resolve => {
            const cardElement = cell.querySelector('.game-card');
            if (!cardElement) {
                resolve();
                return;
            }
            
            // 消失动画
            cardElement.style.transition = 'transform 0.5s ease-out, opacity 0.5s ease-out';
            cardElement.style.transform = 'scale(0) rotate(180deg)';
            cardElement.style.opacity = '0';
            
            // 添加消失特效
            this.addDisappearEffect(cell);
            
            setTimeout(() => {
                cardElement.remove();
                resolve();
            }, 500);
        });
    }

    /**
     * 添加发光效果
     * @param {Element} element - 目标元素
     * @param {string} color - 发光颜色
     */
    addGlowEffect(element, color) {
        const glowClass = `glow-${color}`;
        element.classList.add(glowClass);
        
        setTimeout(() => {
            element.classList.remove(glowClass);
        }, 1000);
    }

    /**
     * 添加震动效果
     * @param {Element} element - 目标元素
     */
    addShakeEffect(element) {
        element.classList.add('shake');
        
        setTimeout(() => {
            element.classList.remove('shake');
        }, 500);
    }

    /**
     * 添加闪光效果
     * @param {Element} element - 目标元素
     */
    addFlashEffect(element) {
        element.classList.add('flash');
        
        setTimeout(() => {
            element.classList.remove('flash');
        }, 200);
    }

    /**
     * 添加胜利效果
     * @param {Element} element - 目标元素
     */
    addVictoryEffect(element) {
        element.classList.add('victory');
        
        // 创建粒子效果
        this.createParticleEffect(element);
        
        setTimeout(() => {
            element.classList.remove('victory');
        }, 1500);
    }

    /**
     * 添加消失效果
     * @param {Element} element - 目标元素
     */
    addDisappearEffect(element) {
        // 创建消失粒子
        this.createDisappearParticles(element);
        
        element.classList.add('disappearing');
        
        setTimeout(() => {
            element.classList.remove('disappearing');
        }, 500);
    }

    /**
     * 创建粒子效果
     * @param {Element} element - 目标元素
     */
    createParticleEffect(element) {
        const rect = element.getBoundingClientRect();
        const particleCount = 8;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.uiManager.document.createElement('div');
            particle.className = 'victory-particle';
            particle.style.position = 'fixed';
            particle.style.left = `${rect.left + rect.width / 2}px`;
            particle.style.top = `${rect.top + rect.height / 2}px`;
            particle.style.width = '4px';
            particle.style.height = '4px';
            particle.style.background = '#ffd700';
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '9999';
            
            this.uiManager.document.body.appendChild(particle);
            
            // 随机方向和距离
            const angle = (i / particleCount) * 2 * Math.PI;
            const distance = 50 + Math.random() * 30;
            const endX = Math.cos(angle) * distance;
            const endY = Math.sin(angle) * distance;
            
            // 动画
            particle.style.transition = 'transform 1s ease-out, opacity 1s ease-out';
            requestAnimationFrame(() => {
                particle.style.transform = `translate(${endX}px, ${endY}px)`;
                particle.style.opacity = '0';
            });
            
            // 清理
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1000);
        }
    }

    /**
     * 创建消失粒子
     * @param {Element} element - 目标元素
     */
    createDisappearParticles(element) {
        const rect = element.getBoundingClientRect();
        const particleCount = 12;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.uiManager.document.createElement('div');
            particle.className = 'disappear-particle';
            particle.style.position = 'fixed';
            particle.style.left = `${rect.left + Math.random() * rect.width}px`;
            particle.style.top = `${rect.top + Math.random() * rect.height}px`;
            particle.style.width = '2px';
            particle.style.height = '2px';
            particle.style.background = '#666';
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '9999';
            
            this.uiManager.document.body.appendChild(particle);
            
            // 向上漂浮消失
            particle.style.transition = 'transform 0.8s ease-out, opacity 0.8s ease-out';
            requestAnimationFrame(() => {
                particle.style.transform = 'translateY(-30px)';
                particle.style.opacity = '0';
            });
            
            // 清理
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 800);
        }
    }

    /**
     * 播放高亮动画
     * @param {Element} element - 目标元素
     * @param {string} type - 高亮类型
     * @returns {Promise} 动画完成Promise
     */
    async playHighlightAnimation(element, type = 'highlight') {
        return new Promise(resolve => {
            element.classList.add(type);
            
            setTimeout(() => {
                element.classList.remove(type);
                resolve();
            }, this.config.highlightDuration);
        });
    }

    /**
     * 根据卡牌获取对应的格子元素
     * @param {Card} card - 卡牌对象
     * @returns {Element} 格子元素
     */
    getCellByCard(card) {
        return this.uiManager.boardRenderer.getCellByPosition(
            card.position.row, 
            card.position.col
        );
    }

    /**
     * 创建临时卡牌元素
     * @returns {Element} 临时卡牌元素
     */
    createTempCard() {
        const tempCard = this.uiManager.document.createElement('div');
        tempCard.className = 'game-card temp';
        return tempCard;
    }

    /**
     * 停止所有动画
     */
    stopAllAnimations() {
        // 清除所有动画类
        const animatedElements = this.uiManager.document.querySelectorAll(
            '.flipping, .moving, .battle-attacker, .battle-defender, .shake, .flash, .victory, .disappearing'
        );
        
        animatedElements.forEach(element => {
            element.className = element.className.replace(
                /\b(flipping|moving|battle-attacker|battle-defender|shake|flash|victory|disappearing)\b/g, 
                ''
            ).trim();
            element.style.transition = '';
            element.style.transform = '';
        });
        
        // 清空动画队列
        this.activeAnimations.clear();
        this.animationQueue = [];
        this.isProcessingQueue = false;
        
        this.uiManager.setAnimating(false);
    }

    /**
     * 添加动画到队列
     * @param {Function} animationFunction - 动画函数
     * @returns {Promise} 队列处理Promise
     */
    queueAnimation(animationFunction) {
        return new Promise(resolve => {
            this.animationQueue.push({ function: animationFunction, resolve });
            this.processQueue();
        });
    }

    /**
     * 处理动画队列
     */
    async processQueue() {
        if (this.isProcessingQueue || this.animationQueue.length === 0) {
            return;
        }
        
        this.isProcessingQueue = true;
        
        while (this.animationQueue.length > 0) {
            const { function: animationFunction, resolve } = this.animationQueue.shift();
            
            try {
                await animationFunction();
                resolve();
            } catch (error) {
                console.error('动画执行错误:', error);
                resolve();
            }
        }
        
        this.isProcessingQueue = false;
    }

    /**
     * 检查是否有动画正在进行
     * @returns {boolean} 是否有动画进行中
     */
    isAnimating() {
        return this.activeAnimations.size > 0 || this.isProcessingQueue;
    }

    /**
     * 销毁动画控制器
     */
    destroy() {
        this.stopAllAnimations();
        
        // 清理粒子元素
        const particles = this.uiManager.document.querySelectorAll('.victory-particle, .disappear-particle');
        particles.forEach(particle => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        });
    }
}
