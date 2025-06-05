'use client'

import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Info, Sparkles, Zap, DollarSign } from 'lucide-react'
import { AI_PROVIDERS, DEFAULT_PROVIDER, getProvider, type AIProvider } from '@/lib/ai/providers'
import { cn } from '@/lib/utils'

interface ProviderSelectorProps {
  value?: string
  onChange?: (providerId: string) => void
  className?: string
  showCost?: boolean
}

export function ProviderSelector({ 
  value = DEFAULT_PROVIDER, 
  onChange, 
  className,
  showCost = true 
}: ProviderSelectorProps) {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | undefined>(
    getProvider(value)
  )
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const provider = getProvider(value)
    setSelectedProvider(provider)
  }, [value])

  const handleChange = (providerId: string) => {
    const provider = getProvider(providerId)
    if (provider && provider.available) {
      setSelectedProvider(provider)
      onChange?.(providerId)
      // Store in localStorage for persistence
      localStorage.setItem('preferred-ai-provider', providerId)
    }
  }

  const getCostIndicator = (cost?: number) => {
    if (!cost) return null
    if (cost < 0.5) return { label: 'Low cost', color: 'text-green-600' }
    if (cost < 3) return { label: 'Medium cost', color: 'text-yellow-600' }
    return { label: 'High cost', color: 'text-red-600' }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span>{selectedProvider?.icon}</span>
              <span className="text-sm">{selectedProvider?.name}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <div className="p-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Sparkles className="w-3 h-3" />
              <span>AI Model Selection</span>
            </div>
          </div>
          
          {AI_PROVIDERS.map((provider) => (
            <SelectItem 
              key={provider.id} 
              value={provider.id}
              disabled={!provider.available}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span>{provider.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{provider.name}</span>
                      {provider.beta && (
                        <Badge variant="secondary" className="text-xs px-1 py-0">
                          Beta
                        </Badge>
                      )}
                      {!provider.available && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          Coming Soon
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {provider.description}
                    </p>
                  </div>
                </div>
                {showCost && provider.costPerMillion && (
                  <div className="flex items-center gap-1 ml-4">
                    <DollarSign className="w-3 h-3 text-muted-foreground" />
                    <span className={cn(
                      "text-xs",
                      getCostIndicator(provider.costPerMillion)?.color
                    )}>
                      ${provider.costPerMillion}/M
                    </span>
                  </div>
                )}
              </div>
            </SelectItem>
          ))}
          
          <div className="p-2 mt-2 border-t">
            <p className="text-xs text-muted-foreground">
              More models coming soon! Costs shown are per million tokens.
            </p>
          </div>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Info className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm mb-1">About AI Models</h4>
              <p className="text-xs text-muted-foreground">
                Different models offer various capabilities and costs. Choose based on your needs:
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-yellow-500 mt-0.5" />
                <div>
                  <p className="text-xs font-medium">Fast Models</p>
                  <p className="text-xs text-muted-foreground">
                    GPT-4o Mini, Gemini Flash - Quick responses, lower cost
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-purple-500 mt-0.5" />
                <div>
                  <p className="text-xs font-medium">Advanced Models</p>
                  <p className="text-xs text-muted-foreground">
                    GPT-4o, Gemini Pro - Better reasoning, higher quality
                  </p>
                </div>
              </div>
            </div>
            
            {showCost && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  <strong>Cost indicator:</strong> Average conversation uses ~2-5k tokens
                </p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}