'use client'

import { useRef, useEffect } from 'react'
import { useVertexAI } from '@/hooks/use-vertex-ai'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Bot, User, Loader2, X, Sparkles } from 'lucide-react'
import { type Trip } from '@/lib/models'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface TravelChatProps {
  tripContext?: Trip | null
  onClose?: () => void
  className?: string
}

export default function TravelChat({ tripContext, onClose, className }: TravelChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
    useCase: 'chat',
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
    <Card className={`flex flex-col h-[600px] ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Travel Assistant
          {tripContext && (
            <span className="text-sm font-normal text-muted-foreground ml-2">
              • {tripContext.destinations && tripContext.destinations.length > 0
                  ? tripContext.destinations.map(d => d.destination?.name).filter(Boolean).join(' → ')
                  : tripContext.destination?.name || 'Trip'}
            </span>
          )}
        </CardTitle>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="flex flex-col flex-1 p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
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
          <div ref={messagesEndRef} />
        </ScrollArea>

        <div className="border-t p-4">
          <form onSubmit={onSubmit} className="flex gap-2">
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
              className="flex-1 px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              disabled={isLoading}
            />
            <Button type="submit" size="sm" disabled={isLoading || !chatInput.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}