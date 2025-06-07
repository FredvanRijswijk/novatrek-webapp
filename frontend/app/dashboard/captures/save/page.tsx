'use client'

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFirebase } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export default function SaveCapturePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useFirebase();
  const [status, setStatus] = useState<'saving' | 'success' | 'error'>('saving');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function saveCapture() {
      if (!isAuthenticated || !user) {
        setError('Not authenticated');
        setStatus('error');
        return;
      }

      try {
        // Get data from URL params
        const captureData = {
          userId: user.uid,
          content: searchParams.get('url') || '',
          contentType: 'link',
          source: 'browser-extension',
          sourceUrl: searchParams.get('url') || '',
          title: searchParams.get('title') || '',
          tags: [],
          isProcessed: false,
          isSorted: false,
          capturedAt: Timestamp.now(),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        // Save to Firestore
        const capturesRef = collection(db, 'captures');
        await addDoc(capturesRef, captureData);

        setStatus('success');
        
        // Redirect to captures page after success
        setTimeout(() => {
          router.push('/dashboard/captures');
        }, 1500);
      } catch (error: any) {
        console.error('Failed to save capture:', error);
        setError(error.message || 'Failed to save');
        setStatus('error');
      }
    }

    saveCapture();
  }, [isAuthenticated, user, searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        {status === 'saving' && (
          <>
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 mx-auto"></div>
            <h1 className="text-2xl font-semibold">Saving...</h1>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold">Saved!</h1>
            <p className="text-muted-foreground">Redirecting to your captures...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold">Error</h1>
            <p className="text-muted-foreground">{error}</p>
            <button 
              onClick={() => window.close()}
              className="text-primary hover:underline"
            >
              Close this tab
            </button>
          </>
        )}
      </div>
    </div>
  );
}