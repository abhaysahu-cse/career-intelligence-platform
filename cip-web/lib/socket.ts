'use client'
import { io, Socket } from 'socket.io-client'
import type { LiveMetrics } from '@/types'

type MetricsCallback = (metrics: LiveMetrics) => void
type ScoreCallback = (score: number) => void

class SocketService {
  private socket: Socket | null = null
  private pollTimer: NodeJS.Timeout | null = null
  private isConnected = false

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001'

      this.socket = io(WS_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      })

      this.socket.on('connect', () => {
        this.isConnected = true
        console.log('[WS] Connected:', this.socket?.id)
        resolve()
      })

      this.socket.on('disconnect', (reason) => {
        this.isConnected = false
        console.warn('[WS] Disconnected:', reason)
      })

      this.socket.on('connect_error', (err) => {
        console.error('[WS] Connection error:', err.message)
        reject(err)
      })
    })
  }

  joinInterviewSession(sessionId: string) {
    this.socket?.emit('interview:join', { sessionId })
  }

  onMetrics(cb: MetricsCallback) {
    this.socket?.on('interview:metrics', cb)
  }

  offMetrics() {
    this.socket?.off('interview:metrics')
  }

  submitAnswer(sessionId: string, answer: string) {
    this.socket?.emit('interview:answer', { sessionId, answer })
  }

  onScoreUpdate(cb: ScoreCallback) {
    this.socket?.on('score:update', (data) => {
      const score = typeof data === 'number'
        ? data
        : data.readiness_score ?? data.readiness ?? data.resume_score ?? data.interview_score
      if (score !== undefined) cb(score)
    })
  }

  offScoreUpdate() {
    this.socket?.off('score:update')
  }

  startPolling(cb: MetricsCallback, intervalMs = 5000) {
    const offlineMetrics: LiveMetrics = {
      confidence: 0,
      accuracy: 0,
      fluency: 0,
      hint: 'Real-time metrics are unavailable until the WebSocket service is connected.',
    }

    cb(offlineMetrics)
    this.pollTimer = setInterval(() => cb(offlineMetrics), intervalMs)
  }

  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
  }

  disconnect() {
    this.stopPolling()
    this.socket?.disconnect()
    this.socket = null
    this.isConnected = false
  }

  get connected() { return this.isConnected }
}

export const socketService = new SocketService()
export default socketService
