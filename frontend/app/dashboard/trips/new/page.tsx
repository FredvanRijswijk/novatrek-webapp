'use client';

import { TripCreationWizard } from '@/components/trips/TripCreationWizard';

export default function NewTripPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Plan Your Next Adventure
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Let's create an amazing trip tailored just for you
            </p>
          </div>
          
          <TripCreationWizard />
        </div>
      </div>
    </div>
  );
}