// WebSocket 连接管理模块
import Config from "./config.js";
import Toast from "./toast.js";
import Session from "./session.js";
import API from "./api.js";

export default class WebSocketManager {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.heartbeatInterval = null;
    this.messageHandlers = new Map();
    this.maxLogItems = 50;
    this.currentInterval = Config.reconnectInterval;
  }

  // 连接WebSocket
  connect(url) {
    this.url = url;
    this.cleanup();
    this.updateConnectionStatus("connecting");

    this.ws = new WebSocket(url);
    this.bindEvents();
  }

  bindEvents() {
    this.ws.onopen = () => {
      this.handleOpen();
      this.scheduleHeartbeat();
    };

    this.ws.onmessage = (e) => this.handleMessage(e);
    this.ws.onclose = (e) => this.handleClose(e);
    this.ws.onerror = (e) => this.handleError(e);
  }

  handleOpen() {
    this.reconnectAttempts = 0;
    this.currentInterval = Config.reconnectInterval;
    this.updateConnectionStatus("connected");
    Toast.success("WebSocket连接成功");
    this.startSessionCheck();
  }

  startSessionCheck() {
    this.sessionCheckInterval = setInterval(() => {
      const session = Session.getUserSession();
      if (
        !session ||
        !session.lastActive ||
        Date.now() - session.lastActive > 24 * 60 * 60 * 1000
      ) {
        this.handleSessionExpired();
      }
    }, 60000); // 每分钟检查一次
  }

  async handleSessionExpired() {
    const userSession = Session.getUserSession();
    if (userSession.playerId) {
      if (userSession.playerId) {
        const response = await API.logout(userSession.playerId);
        if (response?.logout) {
          clearInterval(this.sessionCheckInterval);
          Session.clearSession();
          this.close();
          Toast.warning("会话已过期，请重新登录");
        }
      }
    }
  }

  cleanup() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stopHeartbeat();
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
    clearTimeout(this.retryTimer);
  }

  handleClose(event) {
    const reason = event.reason || "WebSocket连接断开";
    if (reason !== "logout") {
      this.appendLog("error", `连接关闭: ${reason}`);
      this.updateConnectionStatus("reconnecting");
      this.scheduleReconnect();
    } else {
      this.cleanup();
    }
  }

  handleError(error) {
    this.appendLog("error", `连接错误: ${error.message}`);
    this.updateConnectionStatus("error");
    this.ws?.close();
  }

  scheduleReconnect() {
    if (this.reconnectAttempts < Config.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.currentInterval *= 2;

      this.retryTimer = setTimeout(() => {
        this.appendLog("info", `尝试第${this.reconnectAttempts}次重连...`);
        this.connect(this.url);
      }, this.currentInterval);
    } else {
      this.updateConnectionStatus("disconnected");
      this.appendLog("error", "达到最大重连次数，请重新登录");
      Toast.error("达到最大重连次数，请重新登录");
      this.cleanup();
    }
  }

  manualReconnect() {
    clearTimeout(this.retryTimer);
    this.reconnectAttempts = 0;
    this.connect(this.url);
  }

  scheduleHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        const heartbeat = { type: "heartbeat" };
        this.ws.send(JSON.stringify(heartbeat));
        this.appendLog("info", "心跳维护检查");
      }
    }, 30000);
  }

  // 停止心跳检测
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // 处理接收到的消息
  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      this.appendLog(
        data.level?.replace(/\x1B\[[0-9;]*m/g, "") || "info",
        data.message,
        data.timestamp
      );

      if (data.message?.indexOf("wxHeadUrl") !== -1) {
        this.updateUserInfo(JSON.parse(data.message));
      }

      this.emit("message", data);
    } catch (error) {
      console.error("消息解析失败:", error);
      this.appendLog("error", `消息解析失败: ${error.message}`);
    }
  }

  // 发送消息
  send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = typeof data === "string" ? data : JSON.stringify(data);
      this.ws.send(message);
      return true;
    } else {
      Toast.warning("WebSocket未连接，无法发送消息");
      return false;
    }
  }

  // 关闭连接
  close() {
    if (this.ws) {
      this.ws.close();
      this.stopHeartbeat();
      this.updateConnectionStatus("disconnected");
    }
  }

  // 更新连接状态UI
  updateConnectionStatus(state) {
    const statusMap = {
      connected: "已连接",
      connecting: "连接中...",
      reconnecting: `重连中 (${this.reconnectAttempts}/${Config.maxReconnectAttempts})`,
      disconnected: "已断开",
      error: "连接错误",
    };

    const stateElement = document.getElementById("connectionState");
    const statusElement = document.querySelector(".connection-status");
    const reconnectBtn = document.getElementById("manualReconnect");

    if (stateElement) stateElement.textContent = statusMap[state];
    if (statusElement) statusElement.dataset.status = state;
    if (reconnectBtn) {
      reconnectBtn.style.display = state === "reconnecting" ? "block" : "none";
    }
  }

  // 更新用户信息
  updateUserInfo(userInfo) {
    Session.setUserInfo(userInfo);
    const updateElement = (selector, value) => {
      const el = document.querySelector(selector);
      if (el) el.textContent = value;
    };

    const img = document.querySelector("#userInfo img");
    if (img) img.src = userInfo.wxHeadUrl;

    updateElement("#userName", userInfo.nickName);
    updateElement("#playerBelong", `📍 ${userInfo.playerBelong}`);
    updateElement("#playerId", `${userInfo.playerId}`);
  }

  // 添加日志
  appendLog(level, message, timestamp = this.getCurrentDetailedTime()) {
    const logOutput = document.getElementById("logOutput");
    if (!logOutput) return;

    const logItem = document.createElement("div");
    logItem.className = "log";

    const colorMap = {
      info: "#3498db",
      warning: "#f39c12",
      error: "#e74c3c",
      default: "#34495e",
    };

    const logLevel = level.toLowerCase();
    const color = colorMap[logLevel] || colorMap.default;

    logItem.innerHTML = `
            <span style="color: ${color}; font-weight: 600;">[${logLevel.toUpperCase()}]</span>
            <span style="color: #95a5a6;">[${timestamp}]</span>
            - ${message}
        `;

    logOutput.prepend(logItem);

    if (logOutput.children.length > this.maxLogItems) {
      logOutput.lastElementChild?.remove();
    }
  }

  // 获取当前详细时间
  getCurrentDetailedTime() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(
      now.getSeconds()
    )}.${String(now.getMilliseconds()).padStart(3, "0")}`;
  }

  // 清理资源
  cleanup() {
    clearInterval(this.heartbeatInterval);
    clearTimeout(this.retryTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // 事件处理机制
  on(event, handler) {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, new Set());
    }
    this.messageHandlers.get(event).add(handler);
  }

  off(event, handler) {
    const handlers = this.messageHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  emit(event, data) {
    const handlers = this.messageHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }
}
