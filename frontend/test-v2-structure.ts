#!/usr/bin/env ts-node

/**
 * Test script for V2 data structure
 * Run with: npx ts-node test-v2-structure.ts
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { TripServiceV2 } from './lib/services/trip-service-v2';
import { TripModelV2 } from './lib/models/v2/trip-model-v2';
import { DayModelV2 } from './lib/models/v2/day-model-v2';
import { ActivityModelV2 } from './lib/models/v2/activity-model-v2';
import { add_activity_v2 } from './lib/ai/tools/planning/add-activity-v2';
import { create_trip_days } from './lib/ai/tools/planning/create-trip-days';
import { view_itinerary } from './lib/ai/tools/planning/view-itinerary';
import { ToolContext } from './lib/ai/tools/types';

// Firebase config (update with your config)
const firebaseConfig = {
  // Add your Firebase config here
};

async function runTests() {
  console.log('🚀 Starting V2 Structure Tests...\n');

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  // Sign in (update with test user credentials)
  console.log('📝 Signing in...');
  const userCredential = await signInWithEmailAndPassword(
    auth, 
    'test@example.com', // Update with test email
    'password123' // Update with test password
  );
  const userId = userCredential.user.uid;
  console.log('✅ Signed in as:', userCredential.user.email);

  // Initialize services
  const tripService = new TripServiceV2();
  const tripModel = new TripModelV2();
  const dayModel = new DayModelV2();
  const activityModel = new ActivityModelV2();

  try {
    // Test 1: Create a new trip
    console.log('\n📋 Test 1: Creating new trip with V2 structure...');
    const newTrip = await tripModel.create({
      userId,
      title: 'V2 Test Trip to Paris',
      name: 'V2 Test Trip to Paris',
      destinationName: 'Paris',
      destinationCoordinates: { lat: 48.8566, lng: 2.3522 },
      startDate: '2024-06-01',
      endDate: '2024-06-05',
      travelers: [{ name: 'Test User', email: userCredential.user.email || '' }],
      budget: { total: 2000, currency: 'EUR' }
    });
    console.log('✅ Trip created:', newTrip.id);

    // Test 2: Create trip days using AI tool
    console.log('\n📋 Test 2: Creating trip days using AI tool...');
    const context: ToolContext = {
      userId,
      user: { id: userId, email: userCredential.user.email || '', displayName: 'Test User' } as any,
      trip: newTrip,
      tripDays: [],
      preferences: {} as any
    };

    const daysResult = await create_trip_days.execute(
      { tripId: newTrip.id },
      context
    );
    console.log('✅ Days created:', daysResult.success ? 'Success' : 'Failed');
    console.log('   Created days:', daysResult.data?.daysCreated);

    // Test 3: Load full trip data
    console.log('\n📋 Test 3: Loading full trip data...');
    const fullTrip = await tripService.getFullTrip(newTrip.id);
    console.log('✅ Full trip loaded:');
    console.log('   Days count:', fullTrip?.days.length);
    console.log('   Days:', fullTrip?.days.map(d => ({
      dayNumber: d.dayNumber,
      date: d.date,
      activities: d.activities.length
    })));

    // Test 4: Add activity using AI tool
    console.log('\n📋 Test 4: Adding activity using V2 AI tool...');
    const updatedContext: ToolContext = {
      ...context,
      trip: fullTrip!.trip,
      tripDays: fullTrip!.days
    };

    const activityResult = await add_activity_v2.execute({
      dayNumber: 1,
      activity: {
        name: 'Visit Eiffel Tower',
        type: 'sightseeing',
        location: {
          address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris',
          lat: 48.8584,
          lng: 2.2945
        },
        startTime: '10:00',
        duration: 120,
        cost: {
          amount: 25,
          currency: 'EUR',
          perPerson: true
        },
        description: 'Iconic iron lattice tower and symbol of Paris'
      }
    }, updatedContext);
    
    console.log('✅ Activity added:', activityResult.success ? 'Success' : 'Failed');
    if (activityResult.error) {
      console.log('   Error:', activityResult.error);
    }

    // Test 5: View itinerary
    console.log('\n📋 Test 5: Viewing itinerary...');
    const reloadedTrip = await tripService.getFullTrip(newTrip.id);
    const viewContext: ToolContext = {
      ...context,
      trip: reloadedTrip!.trip,
      tripDays: reloadedTrip!.days
    };

    const itineraryResult = await view_itinerary.execute({}, viewContext);
    console.log('✅ Itinerary view:', itineraryResult.success ? 'Success' : 'Failed');
    console.log(itineraryResult.data);

    // Test 6: Test performance
    console.log('\n📋 Test 6: Testing performance of adding multiple activities...');
    const startTime = Date.now();
    
    for (let i = 2; i <= 5; i++) {
      await add_activity_v2.execute({
        dayNumber: Math.ceil(i / 2), // Distribute across days
        activity: {
          name: `Test Activity ${i}`,
          type: 'activity',
          location: {
            address: `Test Location ${i}`,
            lat: 48.8566 + (Math.random() - 0.5) * 0.1,
            lng: 2.3522 + (Math.random() - 0.5) * 0.1
          },
          startTime: `${10 + i}:00`,
          duration: 60
        }
      }, viewContext);
    }
    
    const endTime = Date.now();
    console.log(`✅ Added 4 activities in ${endTime - startTime}ms`);
    console.log(`   Average time per activity: ${(endTime - startTime) / 4}ms`);

    // Test 7: Cleanup - Delete test trip
    console.log('\n📋 Test 7: Cleaning up test data...');
    await tripService.deleteTrip(newTrip.id, userId);
    console.log('✅ Test trip deleted');

    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    // Sign out
    await auth.signOut();
    console.log('\n👋 Signed out');
  }
}

// Run tests
runTests().catch(console.error);