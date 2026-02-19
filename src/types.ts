import type { WechatAccountConfig, WechatConfig } from './config-schema.js'

// Re-export for convenience
export type { WechatAccountConfig, WechatConfig }

export interface ResolvedWeChatAccount {
  accountId: string
  enabled: boolean
  configured: boolean
  name?: string
  apiKey: string
  proxyUrl: string // 代理服务地址
  wcId?: string
  isLoggedIn: boolean
  nickName?: string
  headUrl?: string
  webhookHost?: string // Webhook 公网地址
  webhookPort: number
  webhookPath: string // Webhook 路径
  config: WechatAccountConfig
}

export type LoginStatus
  = | { status: 'waiting' }
    | { status: 'logged_in', wcId: string, nickName: string, headUrl?: string }

export interface ProxyClientConfig {
  apiKey: string
  baseUrl?: string
}

export interface WechatMessageContext {
  id: string
  type: 'text' | 'image' | 'video' | 'file' | 'voice' | 'unknown'
  sender: {
    id: string
    name: string
  }
  recipient: {
    id: string
  }
  content: string
  timestamp: number
  threadId: string
  group?: {
    id: string
    name: string
  }
  raw: any
}
