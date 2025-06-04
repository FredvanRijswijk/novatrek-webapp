'use client'

import { useRef, useEffect } from 'react'
import { useChat } from 'ai/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Bot, User, Loader2, X } from 'lucide-react'
import { type Trip } from '@/lib/models'

interface TravelChatProps {
  tripContext?: Trip | null
  onClose?: () => void
  className?: string
}

export default function TravelChat({ tripContext, onClose, className }: TravelChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, handleSubmit, isLoading, input: chatInput, setInput: setChatInput } = useChat({
    api: '/api/chat',
    body: {
      tripContext: tripContext ? {
        destination: tripContext.destination,
        duration: Math.ceil((new Date(tripContext.endDate).getTime() - new Date(tripContext.startDate).getTime()) / (1000 * 60 * 60 * 24)),
        startDate: tripContext.startDate,
        budget: tripContext.budget,
        travelers: tripContext.travelers,
        preferences: tripContext.preferences
      } : null
    },
    initialMessages: [
      {
        id: '1',
        role: 'assistant',
        content: tripContext 
          ? `Hi! I'm your NovaTrek AI assistant. I can see you're planning a trip to ${tripContext.destination.city}, ${tripContext.destination.country}. I'm here to help with recommendations, itinerary planning, and any travel questions you have!`
          : `Hi! I'm your NovaTrek AI assistant. I'm here to help you plan amazing trips! Tell me about your travel plans, and I'll provide personalized recommendations.`
      }
    ]
  })

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
          <Bot className="w-5 h-5" />
          AI Travel Assistant
          {tripContext && (
            <span className="text-sm font-normal text-muted-foreground">
              • {tripContext.destination.city}
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
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
                  ? `Ask about ${tripContext.destination.city}...`
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