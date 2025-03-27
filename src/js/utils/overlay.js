// 加载遮罩层组件模块
export default class Overlay {
    static overlayElement = null;

    // 初始化遮罩层
    static init() {
        if (!this.overlayElement) {
            this.overlayElement = document.getElementById('overlay');
            if (!this.overlayElement) {
                this.overlayElement = document.createElement('div');
                this.overlayElement.id = 'overlay';
                this.overlayElement.className = 'overlay';
                const spinner = document.createElement('div');
                spinner.className = 'spinner';
                this.overlayElement.appendChild(spinner);
                document.body.appendChild(this.overlayElement);
            }
        }
    }

    // 显示遮罩层
    static show() {
        this.init();
        this.overlayElement.style.display = 'flex';
    }

    // 隐藏遮罩层
    static hide() {
        this.init();
        this.overlayElement.style.display = 'none';
    }

    // 检查遮罩层是否可见
    static isVisible() {
        this.init();
        return this.overlayElement.style.display === 'flex';
    }
}