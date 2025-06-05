import { createVertex } from '@ai-sdk/google-vertex'
import { vertexAIConfig } from './vertex-config'

// Parse service account from environment if available
const getAuthOptions = () => {
  // Check for JSON string in environment (Vercel deployment)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    try {
      return {
        credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
      }
    } catch (error) {
      console.error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON:', error)
    }
  }
  
  // Otherwise, use Application Default Credentials (local development)
  return {}
}

// Initialize Vertex AI provider
export const vertex = createVertex({
  project: process.env.GOOGLE_VERTEX_PROJECT || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || vertexAIConfig.projectId,
  location: process.env.VERTEX_AI_LOCATION || vertexAIConfig.location,
  googleAuthOptions: getAuthOptions(),
})

// Export configured models
export const geminiFlash = vertex('gemini-2.0-flash-exp')
export const geminiPro = vertex('gemini-1.5-pro')

// Helper to select model based on use case
export function getVertexModel(useCase: 'chat' | 'advanced' = 'chat') {
  return useCase === 'advanced' ? geminiPro : geminiFlash
}