// API 请求工具模块
import Config from "./config.js";
import Toast from "./toast.js";
import Overlay from "./overlay.js";
import Session from "./session.js";

export default class Api {
  // 基础请求方法
  static async request(endpoint, options = {}) {
    const baseUrl = Config.baseUrl;
    const url = `http://${baseUrl}/api/${endpoint}`;
    const isAuthRequired =
      !endpoint.startsWith("servers") && !endpoint.startsWith("login");

    try {
      Overlay.show();
      const headers = {
        "Content-Type": "application/json",
        ...options.headers,
      };

      if (isAuthRequired) {
        const userSession = Session.getUserSession();
        if (userSession?.jwtToken) {
          headers.Authorization = `Bearer ${userSession.jwtToken}`;
        }
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      switch (response.status) {
        case 401:
          Session.clearSession();
          //window.location.href = '/login.html';
          throw new Error("登录已过期，请重新登录");
        case 400:
          const errorData = await response.json();
          throw new Error(
            errorData.error || `请求参数错误: ${response.status}`
          );
        case 200:
        case 201:
          break;
        default:
          throw new Error(`请求失败: ${response.status}`);
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
