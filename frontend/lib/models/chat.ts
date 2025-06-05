import { 
  createDocument, 
  getCollection, 
  subscribeToCollection,
  where,
  orderBy,
  limit
} from '@/lib/firebase'
import { ChatMessage, AIRecommendation } from '@/types/travel'

export class ChatModel {
  static readonly COLLECTION = 'chat_messages'

  // Create a new chat message
  static async create(messageData: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<string> {
    const docRef = await createDocument(this.COLLECTION, {
      ...messageData,
      timestamp: new Date(),
    })
    return docRef.id
  }

  // Get chat history for a trip
  static async getTripChatHistory(tripId: string, limitCount = 50): Promise<ChatMessage[]> {
    return await getCollection<ChatMessage>(
      this.COLLECTION,
      where('tripId', '==', tripId),
      orderBy('timestamp', 'asc'),
      limit(limitCount)
    )
  }

  // Get general chat history for a user (no specific trip)
  static async getUserChatHistory(userId: string, limitCount = 50): Promise<ChatMessage[]> {
    return await getCollection<ChatMessage>(
      this.COLLECTION,
      where('userId', '==', userId),
      where('tripId', '==', null),
      orderBy('timestamp', 'asc'),
      limit(limitCount)
    )
  }

  // Subscribe to chat messages for a trip
  static subscribeToTripChat(tripId: string, callback: (messages: ChatMessage[]) => void) {
    return subscribeToCollection<ChatMessage>(
      this.COLLECTION,
      callback,
      where('tripId', '==', tripId),
      orderBy('timestamp', 'asc')
    )
  }

  // Subscribe to general user chat
  static subscribeToUserChat(userId: string, callback: (messages: ChatMessage[]) => void) {
    return subscribeToCollection<ChatMessage>(
      this.COLLECTION,
      callback,
      where('userId', '==', userId),
      where('tripId', '==', null),
      orderBy('timestamp', 'asc')
    )
  }

  // Send a user message
  static async sendUserMessage(content: string, userId: string, tripId?: string): Promise<string> {
    return await this.create({
      role: 'user',
      content,
      userId,
      tripId,
    })
  }

  // Send an AI response
  static async sendAIResponse(
    content: string, 
    userId: string, 
    tripId?: string, 
    recommendations?: AIRecommendation[]
  ): Promise<string> {
    return await this.create({
      role: 'assistant',
      content,
      userId,
      tripId,
      metadata: {
        recommendations,
        context: { generatedAt: new Date() }
      }
    })
  }

  // Extract and format context for AI
  static formatChatContext(messages: ChatMessage[], maxMessages = 10): string {
    const recentMessages = messages.slice(-maxMessages)
    
    return recentMessages
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n')
  }

  // Get conversation summary for AI context
  static getSummary(messages: ChatMessage[]): string {
    const userMessages = messages.filter(msg => msg.role === 'user')
    const topics = userMessages
      .map(msg => msg.content.toLowerCase())
      .join(' ')

    // Simple keyword extraction for context
    const keywords = [
      'destination', 'budget', 'activities', 'hotel', 'restaurant', 
      'weather', 'transportation', 'flight', 'culture', 'adventure'
    ].filter(keyword => topics.includes(keyword))

    return `Conversation topics: ${keywords.join(', ')}`
  }
}