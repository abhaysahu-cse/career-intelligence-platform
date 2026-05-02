/**
 * CIP WebSocket Client SDK
 * Use this in your frontend (React, Vue, vanilla JS)
 *
 * Install: npm install socket.io-client
 *
 * Usage:
 *   import { CIPSocketClient } from "./cipSocketClient";
 *   const client = new CIPSocketClient({ token: "your-jwt-token" });
 *   client.connect();
 *   client.onScoreUpdate((data) => console.log("Score:", data));
 */

import { io } from "socket.io-client";

export class CIPSocketClient {
  constructor({ token, serverUrl = "http://localhost:3001", debug = false }) {
    this.token = token;
    this.serverUrl = serverUrl;
    this.debug = debug;
    this.socket = null;
    this._handlers = {};
  }

  connect() {
    this.socket = io(this.serverUrl, {
      auth: { token: this.token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 15000,
    });

    this.socket.on("connect", () => {
      if (this.debug) console.log("[CIP WS] Connected:", this.socket.id);
      this._emit("connected", { socketId: this.socket.id });
    });

    this.socket.on("disconnect", (reason) => {
      if (this.debug) console.log("[CIP WS] Disconnected:", reason);
      this._emit("disconnected", { reason });
    });

    this.socket.on("connect_error", (err) => {
      if (this.debug) console.error("[CIP WS] Connection error:", err.message);
      this._emit("error", { message: err.message });
    });

    // ── CIP Events ─────────────────────────────────────────
    this.socket.on("score:update",        (data) => this._emit("score:update", data));
    this.socket.on("interview:feedback",  (data) => this._emit("interview:feedback", data));
    this.socket.on("interview:started",   (data) => this._emit("interview:started", data));
    this.socket.on("interview:completed", (data) => this._emit("interview:completed", data));
    this.socket.on("job:new",             (data) => this._emit("job:new", data));
    this.socket.on("job:update",          (data) => this._emit("job:update", data));
    this.socket.on("notification",        (data) => this._emit("notification", data));

    return this;
  }

  disconnect() {
    if (this.socket) this.socket.disconnect();
  }

  // ── Subscribe to specific job updates ─────────────────────
  subscribeToJob(jobId) {
    this.socket?.emit("subscribe:job", jobId);
    return this;
  }

  unsubscribeFromJob(jobId) {
    this.socket?.emit("unsubscribe:job", jobId);
    return this;
  }

  // ── Event listener API ─────────────────────────────────────
  on(event, handler) {
    if (!this._handlers[event]) this._handlers[event] = [];
    this._handlers[event].push(handler);
    return this;
  }

  off(event, handler) {
    if (!this._handlers[event]) return;
    this._handlers[event] = this._handlers[event].filter((h) => h !== handler);
    return this;
  }

  // ── Convenience methods ────────────────────────────────────
  onScoreUpdate(handler)          { return this.on("score:update", handler); }
  onInterviewFeedback(handler)    { return this.on("interview:feedback", handler); }
  onInterviewStarted(handler)     { return this.on("interview:started", handler); }
  onInterviewCompleted(handler)   { return this.on("interview:completed", handler); }
  onNewJob(handler)               { return this.on("job:new", handler); }
  onJobUpdate(handler)            { return this.on("job:update", handler); }
  onNotification(handler)         { return this.on("notification", handler); }
  onConnected(handler)            { return this.on("connected", handler); }
  onDisconnected(handler)         { return this.on("disconnected", handler); }

  isConnected() {
    return this.socket?.connected ?? false;
  }

  _emit(event, data) {
    const handlers = this._handlers[event] || [];
    handlers.forEach((h) => {
      try { h(data); } catch (e) { console.error(`[CIP WS] Handler error for ${event}:`, e); }
    });
  }
}

// ── React Hook (optional) ─────────────────────────────────────
export function useCIPSocket({ token, serverUrl }) {
  const { useEffect, useRef, useState } = require("react");

  const clientRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const client = new CIPSocketClient({ token, serverUrl });
    clientRef.current = client;

    client
      .onConnected(() => setConnected(true))
      .onDisconnected(() => setConnected(false))
      .connect();

    return () => client.disconnect();
  }, [token, serverUrl]);

  return { client: clientRef.current, connected };
}
