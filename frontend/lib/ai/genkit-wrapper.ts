// Wrapper for Genkit to handle build-time issues

// Use lazy loading to prevent build-time errors
let genkitModule: any = null
let loadAttempted = false

async function loadGenkit() {
  if (loadAttempted) return genkitModule
  loadAttempted = true
  
  try {
    // Dynamic import to avoid build-time issues
    genkitModule = await import('./genkit-setup')
    return genkitModule
  } catch (error) {
    console.warn('Genkit setup not available:', error)
    return null
  }
}

// Mock implementations for when genkit is not available
const mockImplementations = {
  ai: {
    defineFlow: () => () => Promise.resolve({}),
    run: () => Promise.resolve({}),
  },
  travelChatFlow: () => Promise.resolve({ response: 'Service temporarily unavailable' }),
  groupCompromiseFlow: () => Promise.resolve({ compromises: [] }),
  itineraryOptimizationFlow: () => Promise.resolve({ optimizedItinerary: [] }),
  optimizeItineraryFlow: () => Promise.resolve({ optimizedItinerary: [] }),
  packingSuggestionsFlow: () => Promise.resolve({ suggestions: [] }),
}

// Export async functions that load genkit on demand
export const ai = {
  defineFlow: async (...args: any[]) => {
    const genkit = await loadGenkit()
    return genkit?.ai?.defineFlow?.(...args) || mockImplementations.ai.defineFlow(...args)
  },
  run: async (...args: any[]) => {
    const genkit = await loadGenkit()
    return genkit?.ai?.run?.(...args) || mockImplementations.ai.run(...args)
  }
}

export const travelChatFlow = async (...args: any[]) => {
  const genkit = await loadGenkit()
  return genkit?.travelChatFlow?.(...args) || mockImplementations.travelChatFlow(...args)
}

export const groupCompromiseFlow = async (...args: any[]) => {
  const genkit = await loadGenkit()
  return genkit?.groupCompromiseFlow?.(...args) || mockImplementations.groupCompromiseFlow(...args)
}

export const itineraryOptimizationFlow = async (...args: any[]) => {
  const genkit = await loadGenkit()
  return genkit?.itineraryOptimizationFlow?.(...args) || mockImplementations.itineraryOptimizationFlow(...args)
}

export const optimizeItineraryFlow = async (...args: any[]) => {
  const genkit = await loadGenkit()
  const flow = genkit?.optimizeItineraryFlow || genkit?.itineraryOptimizationFlow
  return flow?.(...args) || mockImplementations.optimizeItineraryFlow(...args)
}

export const packingSuggestionsFlow = async (...args: any[]) => {
  const genkit = await loadGenkit()
  return genkit?.packingSuggestionsFlow?.(...args) || mockImplementations.packingSuggestionsFlow(...args)
}