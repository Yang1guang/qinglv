/**
 * effects.js - 全局特效与高可用音频管理模块
 * 修复目标：彻底解决 VIP 版权风控导致的 404 与 NotSupportedError 崩溃问题
 */

class BGMManager {
    constructor() {
        this.audio = new Audio();
        
        // 构建高可用多级音源策略：主节点 -> CDN 节点 -> 本地节点
        this.sources = [
            // 节点1：原有的第三方解析接口 (极易被风控)
            'https://vip521.pages.dev/api/love/music-stream?hash=2598A3BB5CA87E39958D77BF465CD062&album_id=0',
            // 节点2：可靠的公共 CDN 兜底链接 (可自行更换为无版权音乐直链)
            'https://music.163.com/song/media/outer/url?id=1910243451.mp3',
            // 节点3：最稳妥的本地同源兜底 (建议在网站根目录的 assets 文件夹中上传该 MP3)
            './assets/music/fallback.mp3'
        ];
        this.currentSourceIndex = 0;
        this.init();
    }

    init() {
        this.audio.loop = true;
        this.audio.preload = 'auto';
        this.loadSource();

        // 精准修复 86 行：拦截资源加载受阻，直接触发静默降级切换
        this.audio.addEventListener('error', (e) => {
            console.warn(`[效果模块 - 行 86 修正] 音源 ${this.currentSourceIndex} 加载受阻，触发降级保护机制...`);
            this.switchToNextSource();
        });
    }

    loadSource() {
        if (this.currentSourceIndex < this.sources.length) {
            this.audio.src = this.sources[this.currentSourceIndex];
            this.audio.load();
        } else {
            console.error('[效果模块] 警告：所有备用音源均已失效，请检查本地服务器是否存放了兜底音乐文件。');
        }
    }

    switchToNextSource() {
        this.currentSourceIndex++;
        if (this.currentSourceIndex < this.sources.length) {
            console.log(`[效果模块] 正在降级，切换至备用音源: ${this.sources[this.currentSourceIndex]}`);
            this.loadSource();
            this.play(); 
        }
    }

    play() {
        if (!this.audio.src) return;

        // 精准修复 97 行：使用 Promise 链捕获 NotSupportedError 并执行隔离
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('[效果模块] 背景音乐播放正常');
            }).catch(error => {
                console.error(`[效果模块 - 行 97 修正] 播放受阻 (${error.name}): ${error.message}`);
                
                // 如果是资源缺失或 DOM 策略限制，延迟 500ms 尝试降级，避免死循环请求风暴
                if (error.name === 'NotSupportedError' || error.name === 'NotAllowedError') {
                    setTimeout(() => {
                        this.switchToNextSource();
                    }, 500);
                }
            });
        }
    }
}

// ==========================================
// 全局动效及初始化挂载区域
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // 实例化高可用音频控制器
    window.bgmController = new BGMManager();
    
    // 应对现代浏览器严格的 Autoplay 自动播放策略
    // 必须绑定到用户的首次全局物理交互中触发
    const unlockAudio = () => {
        if (window.bgmController.audio.paused) {
            window.bgmController.play();
        }
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
});
