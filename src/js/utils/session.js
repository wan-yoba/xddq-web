// 用户会话管理模块
export default class Session {
    // 检查用户是否已登录
    static checkLogin() {
        const userSession = localStorage.getItem('userSession');
        if (!userSession) {
            window.location.href = '/login.html';
            return false;
        }
        return JSON.parse(userSession);
    }

    // 获取用户会话信息
    static getUserSession() {
        return JSON.parse(localStorage.getItem('userSession') || '{}');
    }

    // 获取用户信息
    static getUserInfo() {
        return JSON.parse(localStorage.getItem('userInfo') || '{}');
    }

    // 设置用户会话信息
    static setUserSession(sessionData) {
        localStorage.setItem('userSession', JSON.stringify(sessionData));
    }

    // 设置用户信息
    static setUserInfo(userInfo) {
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
    }

    // 清除用户会话
    static clearSession() {
        localStorage.removeItem('userSession');
        localStorage.removeItem('userInfo');
    }

    // 更新会话最后活动时间
    static updateLastActive() {
        const session = this.getUserSession();
        if (session) {
            session.lastActive = Date.now();
            this.setUserSession(session);
        }
    }

    // 检查会话是否过期
    static isSessionExpired(maxAge = 24 * 60 * 60 * 1000) { // 默认24小时
        const session = this.getUserSession();
        if (!session || !session.lastActive) return true;
        return Date.now() - session.lastActive > maxAge;
    }
}