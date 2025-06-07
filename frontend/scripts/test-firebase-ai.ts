#!/usr/bin/env node
// Test script for Firebase AI SDK implementation
// Run with: npx tsx scripts/test-firebase-ai.ts

import { generateText, generateGroupCompromise, optimizeItinerary } from '../lib/ai/vertex-firebase'

async function testBasicGeneration() {
  console.log('Testing basic text generation...')
  try {
    const result = await generateText('Tell me a short joke about travel')
    console.log('✅ Basic generation:', result)
  } catch (error) {
    console.error('❌ Basic generation failed:', error)
  }
}

async function testGroupCompromise() {
  console.log('\nTesting group compromise with structured output...')
  try {
    const result = await generateGroupCompromise({
      groupPreferences: [
        {
          memberId: 'user1',
          budget: { min: 100, max: 200 },
          mustHaves: ['wifi', 'breakfast'],
          dealBreakers: ['hostel'],
          travelStyle: 'comfort'
        },
        {
          memberId: 'user2',
          budget: { min: 50, max: 150 },
          mustHaves: ['central location'],
          dealBreakers: ['shared bathroom'],
          travelStyle: 'budget'
        }
      ],
      destination: 'Paris',
      duration: 3
    })
    console.log('✅ Group compromise:', JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('❌ Group compromise failed:', error)
  }
}

async function testItineraryOptimization() {
  console.log('\nTesting itinerary optimization with structured output...')
  try {
    const result = await optimizeItinerary({
      activities: [
        { name: 'Eiffel Tower', location: 'Champ de Mars', duration: 2, category: 'sightseeing', mustDo: true },
        { name: 'Louvre Museum', location: 'Rue de Rivoli', duration: 3, category: 'museum' },
        { name: 'Notre Dame', location: 'Île de la Cité', duration: 1, category: 'sightseeing' }
      ],
      constraints: {
        startTime: '09:00',
        endTime: '18:00',
        pace: 'moderate',
        includeMeals: true
      },
      destination: 'Paris'
    })
    console.log('✅ Itinerary optimization:', JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('❌ Itinerary optimization failed:', error)
  }
}

async function runTests() {
  console.log('🧪 Testing Firebase AI SDK implementation...\n')
  
  await testBasicGeneration()
  await testGroupCompromise()
  await testItineraryOptimization()
  
  console.log('\n✨ Tests complete!')
}

runTests().catch(console.error)