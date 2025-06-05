export interface AIProvider {
  id: string
  name: string
  description: string
  model: string
  icon: string
  available: boolean
  beta?: boolean
  costPerMillion?: number // Cost per million tokens
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'openai-gpt4o-mini',
    name: 'GPT-4o Mini',
    description: 'Fast and efficient for most tasks',
    model: 'gpt-4o-mini',
    icon: '🤖',
    available: true,
    costPerMillion: 0.15
  },
  {
    id: 'openai-gpt4o',
    name: 'GPT-4o',
    description: 'Most capable model for complex planning',
    model: 'gpt-4o',
    icon: '🧠',
    available: true,
    costPerMillion: 5.00
  },
  {
    id: 'vertex-gemini-flash',
    name: 'Gemini Flash',
    description: 'Google\'s fast AI model',
    model: 'gemini-2.0-flash-exp',
    icon: '⚡',
    available: false,
    beta: true,
    costPerMillion: 0.075
  },
  {
    id: 'vertex-gemini-pro',
    name: 'Gemini Pro',
    description: 'Google\'s advanced AI model',
    model: 'gemini-1.5-pro',
    icon: '💎',
    available: false,
    beta: true,
    costPerMillion: 3.50
  },
  {
    id: 'anthropic-claude-haiku',
    name: 'Claude 3 Haiku',
    description: 'Fast and concise responses',
    model: 'claude-3-haiku',
    icon: '📝',
    available: false,
    beta: true,
    costPerMillion: 0.25
  },
  {
    id: 'anthropic-claude-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Balanced performance and quality',
    model: 'claude-3-5-sonnet',
    icon: '🎭',
    available: false,
    beta: true,
    costPerMillion: 3.00
  }
]

export const DEFAULT_PROVIDER = 'openai-gpt4o-mini'

export function getProvider(id: string): AIProvider | undefined {
  return AI_PROVIDERS.find(p => p.id === id)
}

export function getAvailableProviders(): AIProvider[] {
  return AI_PROVIDERS.filter(p => p.available)
}