// 登录页面功能
import { config, toast, overlay, api, session } from "./common.js";

// 缓存DOM元素
const DOM = {
  username: document.getElementById("username"),
  password: document.getElementById("password"),
  token: document.getElementById("token"),
  servers: document.getElementById("servers"),
  serverId: document.getElementById("serverId"),
  fetchServersBtn: document.getElementById("fetchServersBtn"),
  loginBtn: document.getElementById("loginBtn"),
  loginForm: document.getElementById("loginForm"),
};

// 登录管理器
const loginManager = {
  // 验证必填字段
  validateRequiredFields(fields) {
    return fields.every((field) => field?.value?.trim());
  },

  // 获取服务器列表
  async fetchServerList() {
    const fields = [DOM.username, DOM.password, DOM.token];
    if (!this.validateRequiredFields(fields)) {
      toast.warning("🔐 请输入用户名、密码和令牌");
      return;
    }

    try {
      overlay.show();
      const data = await api.getServerList(
        DOM.username.value.trim(),
        DOM.password.value.trim(),
        DOM.token.value.trim()
      );

      this.updateServerList(data);
    } catch (error) {
      toast.error(`❌ 错误: ${error.message}`);
    } finally {
      overlay.hide();
    }
  },

  // 更新服务器列表
  updateServerList(data) {
    DOM.servers.innerHTML = '<option value="">-- 选择服务器 --</option>';

    if (data.servers?.length) {
      data.servers.forEach((server) => {
        const option = new Option(server.serverName, server.serverId);
        DOM.servers.add(option);
      });
      DOM.servers.disabled = false;
      DOM.fetchServersBtn.disabled = false;
      toast.info("🌍 服务器列表已更新");
    } else {
      toast.error(data.error ? `⚠️ ${data.error}` : "⚠️ 没有可用的服务器");
    }
  },

  // 更新服务器ID
  updateServerId() {
    DOM.serverId.value = DOM.servers.value;
  },

  // 创建用户会话
  createUserSession(data, username, serverId) {
    return {
      baseUrl: config.baseUrl,
      playerId: data.playerId,
      wsAddress: data.wsAddress,
      token: data.token,
      username: username,
      serverId: serverId,
      serverStart: false,
      lastActive: Date.now(),
    };
  },

  // 登录
  async login() {
    if (!config.baseUrl) {
      toast.error("🚨 请配置基础请求地址！");
      return;
    }

    const fields = [DOM.username, DOM.password, DOM.serverId];
    if (!this.validateRequiredFields(fields)) {
      toast.warning("🚨 请完整填写所有字段");
      return;
    }

    try {
      overlay.show();
      const data = await api.login(
        DOM.username.value.trim(),
        DOM.password.value.trim(),
        DOM.serverId.value.trim()
      );

      if (data.playerId && data.token) {
        const userSession = this.createUserSession(
          data,
          DOM.username.value.trim(),
          DOM.serverId.value.trim()
        );
        session.setUserSession(userSession);
        toast.success("🎉 登录成功！");
        toast.warning("本次会话最多维系24小时，超过24小时将自动断开连接！");
        window.location.href = "loader/index.html";
      } else {
        toast.error("⚠️ 无效的凭据");
      }
    } catch (error) {
      toast.error(`❌ 连接错误: ${error.message}`);
    } finally {
      overlay.hide();
    }
  },

  // 初始化事件
  initEvents() {
    DOM.fetchServersBtn?.addEventListener("click", () =>
      this.fetchServerList()
    );
    DOM.servers?.addEventListener("change", () => this.updateServerId());
    DOM.loginForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.login();
    });
  },
};

// 初始化登录页面
document.addEventListener("DOMContentLoaded", () => {
  loginManager.initEvents();
  overlay.hide();
});

export default loginManager;
