export type Segment = {
  name: string
  tokens: number
  color: string
  kind: 'used' | 'free' | 'buffer'
}

export type Limit = {
  label: string
  percent: number
  resetsAt?: number
}

export type Snapshot = {
  segments: Segment[]
  limits: Limit[]
  takenAt: number
  maxTokens: number
  totalTokens: number
  percent: number
}

declare module 'claude-code' {
  interface PluginState {
    'context-bar': { snapshot: Snapshot | null; isVisible: boolean }
  }
}
