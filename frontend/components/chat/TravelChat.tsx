'use client'

import { useRef, useEffect, useState } from 'react'
import { useVertexAI } from '@/hooks/use-vertex-ai'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Bot, User, Loader2, X, Sparkles } from 'lucide-react'
import { type Trip } from '@/lib/models'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ProviderSelector } from '@/components/ai/ProviderSelector'
import { DEFAULT_PROVIDER } from '@/lib/ai/providers'

interface TravelChatProps {
  tripContext?: Trip | null
  onClose?: () => void
  className?: string
}

export default function TravelChat({ tripContext, onClose, className }: TravelChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [selectedProvider, setSelectedProvider] = useState<string>(() => {
    // Load saved preference or use default
    if (typeof window !== 'undefined') {
      return localStorage.getItem('preferred-ai-provider') || DEFAULT_PROVIDER
    }
    return DEFAULT_PROVIDER
  })

  const tripContextForAI = tripContext ? {
    destination: tripContext.destination,
    destinations: tripContext.destinations,
    duration: Math.ceil((new Date(tripContext.endDate).getTime() - new Date(tripContext.startDate).getTime()) / (1000 * 60 * 60 * 24)),
    startDate: tripContext.startDate,
    budget: tripContext.budget,
    travelers: tripContext.travelers,
    preferences: tripContext.preferences
  } : undefined

  const { messages, handleSubmit, isLoading, input: chatInput, setInput: setChatInput } = useVertexAI({
    tripContext: tripContextForAI,
    fullTrip: tripContext, // Pass full trip for enhanced context
    useCase: 'chat',
    providerId: selectedProvider,
  })

  // Set initial message when component mounts
  useEffect(() => {
    if (messages.length === 0) {
      const initialMessage = tripContext 
        ? `Hi! I'm your NovaTrek AI assistant. I can see you're planning a trip to ${
            tripContext.destinations && tripContext.destinations.length > 0
              ? tripContext.destinations.map(d => d.destination?.name).filter(Boolean).join(' → ')
              : tripContext.destination?.name || 'your destination'
          }. I'm here to help with recommendations, itinerary planning, and any travel questions you have!`
        : `Hi! I'm your NovaTrek AI assistant. I'm here to help you plan amazing trips! Tell me about your travel plans, and I'll provide personalized recommendations.`
      
      // You might need to handle initial messages differently based on your setup
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    
    handleSubmit(e)
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Fixed Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-4">
          <div className="flex flex-row items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">AI Travel Assistant</h2>
              {tripContext && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  • {tripContext.destinations && tripContext.destinations.length > 0
                      ? tripContext.destinations.map(d => d.destination?.name).filter(Boolean).join(' → ')
                      : tripContext.destination?.name || 'Trip'}
                </span>
              )}
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between">
            <ProviderSelector 
              value={selectedProvider}
              onChange={setSelectedProvider}
              showCost={true}
            />
            <p className="text-xs text-muted-foreground">
              Model selection for AI responses
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area with padding at top and bottom */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {/* Top padding for empty space */}
          <div className="h-20" />
          
          <div className="space-y-4 px-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.role === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="ml-2">{children}</li>,
                          h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          code: ({ children }) => <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs">{children}</code>,
                          pre: ({ children }) => <pre className="bg-black/10 dark:bg-white/10 p-2 rounded overflow-x-auto mb-2">{children}</pre>,
                          blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/50 pl-2 italic">{children}</blockquote>,
                          a: ({ href, children }) => (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              {children}
                            </a>
                          ),
                          hr: () => <hr className="my-2 border-t border-border" />,
                          table: ({ children }) => <table className="w-full border-collapse mb-2">{children}</table>,
                          th: ({ children }) => <th className="border border-border px-2 py-1 text-left font-semibold">{children}</th>,
                          td: ({ children }) => <td className="border border-border px-2 py-1">{children}</td>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
          
          {/* Bottom padding to ensure last message is visible above input */}
          <div className="h-24" />
          <div ref={messagesEndRef} />
        </ScrollArea>
      </div>

      {/* Fixed Bottom Input */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <form onSubmit={onSubmit} className="flex gap-2 max-w-4xl mx-auto">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={
              tripContext 
                ? `Ask about ${
                    tripContext.destinations && tripContext.destinations.length > 0
                      ? 'your multi-stop trip'
                      : tripContext.destination?.name || 'your trip'
                  }...`
                : "Ask me anything about travel..."
            }
            className="flex-1 px-4 py-3 border border-input bg-background rounded-lg text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            disabled={isLoading}
          />
          <Button type="submit" size="default" disabled={isLoading || !chatInput.trim()} className="px-4">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}