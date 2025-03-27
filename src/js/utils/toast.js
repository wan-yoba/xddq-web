// Toast 通知组件模块
export default class Toast {
    static container = null;

    // 初始化Toast容器
    static init() {
        if (!this.container) {
            this.container = document.getElementById('toast-container');
            if (!this.container) {
                this.container = document.createElement('div');
                this.container.id = 'toast-container';
                document.body.appendChild(this.container);
            }
        }
    }

    // 显示Toast消息
    static show(message, type = 'info') {
        this.init();
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${message}</span>`;
        this.container.appendChild(toast);

        // 添加动画效果
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // 自动关闭
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 2000);
        }, 3000);
    }

    // 成功提示
    static success(message) {
        this.show(message, 'success');
    }

    // 错误提示
    static error(message) {
        this.show(message, 'error');
    }

    // 警告提示
    static warning(message) {
        this.show(message, 'warning');
    }

    // 信息提示
    static info(message) {
        this.show(message, 'info');
    }
}