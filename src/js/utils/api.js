// API 请求工具模块
import Config from "./config.js";
import Toast from "./toast.js";
import Overlay from "./overlay.js";

export default class Api {
  // 基础请求方法
  static async request(endpoint, options = {}) {
    const baseUrl = Config.baseUrl;
    const url = `http://${baseUrl}/api/${endpoint}`;

    try {
      Overlay.show();
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (response.status === 400) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Bad Request: ${response.status}`);
      } else if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      Toast.error(`请求错误: ${error.message}`);
      throw error;
    } finally {
      Overlay.hide();
    }
  }

  // 获取服务器列表
  static async getServerList(username, password, token) {
    return this.request(
      `servers?username=${encodeURIComponent(
        username
      )}&password=${encodeURIComponent(password)}&token=${encodeURIComponent(
        token
      )}`
    );
  }

  // 用户登录
  static async login(username, password, serverId) {
    return this.request("login", {
      method: "POST",
      body: JSON.stringify({ username, password, serverId }),
    });
  }

  // 启动游戏
  static async startgame(wsAddress, playerId, token) {
    return this.request("start", {
      method: "POST",
      body: JSON.stringify({ wsAddress, playerId, token }),
    });
  }

  // 用户登出
  static async logout(playerId) {
    return this.request("logout", {
      method: "POST",
      body: JSON.stringify({ playerId }),
    });
  }

  // 获取配置
  static async getConfig() {
    return this.request("config");
  }

  // 保存配置
  static async saveConfig(config) {
    return this.request("config", {
      method: "POST",
      body: JSON.stringify(config),
    });
  }
}
