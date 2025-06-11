'use client';

import { useState, useEffect } from 'react';
import { TestRoute } from '@/components/auth/TestRoute';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface AdminData {
  role?: string;
  permissions?: string[];
  createdAt?: any;
  updatedAt?: any;
}

interface AuthDetails {
  uid: string;
  email: string | null;
  displayName: string | null;
  customClaims: any;
  idTokenResult: any;
  firestoreAdminData: AdminData | null;
  isAdminByClaims: boolean;
  isAdminByFirestore: boolean;
  isAdminByHook: boolean;
}

export default function TestAdminStatusPage() {
  const [authDetails, setAuthDetails] = useState<AuthDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const checkAdminStatus = async (user: any) => {
    try {
      setError(null);
      
      // Get ID token result with claims
      const idTokenResult = await user.getIdTokenResult(true);
      
      // Check Firestore admin document
      let firestoreAdminData: AdminData | null = null;
      try {
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        if (adminDoc.exists()) {
          firestoreAdminData = adminDoc.data() as AdminData;
        }
      } catch (firestoreError) {
        console.error('Firestore error:', firestoreError);
      }

      // Check admin status using the hook logic
      const isAdminByHook = idTokenResult.claims.admin === true || 
                            idTokenResult.claims.role === 'admin' ||
                            idTokenResult.claims.role === 'super_admin';

      const details: AuthDetails = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        customClaims: idTokenResult.claims,
        idTokenResult: {
          token: idTokenResult.token.substring(0, 50) + '...',
          claims: idTokenResult.claims,
          authTime: idTokenResult.authTime,
          issuedAtTime: idTokenResult.issuedAtTime,
          expirationTime: idTokenResult.expirationTime,
          signInProvider: idTokenResult.signInProvider,
        },
        firestoreAdminData,
        isAdminByClaims: idTokenResult.claims.admin === true || 
                         idTokenResult.claims.role === 'admin' ||
                         idTokenResult.claims.role === 'super_admin',
        isAdminByFirestore: !!firestoreAdminData,
        isAdminByHook,
      };

      setAuthDetails(details);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await checkAdminStatus(user);
      } else {
        setAuthDetails(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRefreshToken = async () => {
    if (!auth.currentUser) return;
    
    setRefreshing(true);
    try {
      await auth.currentUser.getIdToken(true);
      await checkAdminStatus(auth.currentUser);
    } catch (error) {
      console.error('Error refreshing token:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh token');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading authentication details...</p>
        </div>
      </div>
    );
  }

  if (!authDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Not Authenticated</CardTitle>
            <CardDescription>Please log in to view admin status</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/login')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TestRoute>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Status Debugger</h1>
        <p className="text-muted-foreground">
          Comprehensive view of your authentication and admin status
        </p>
      </div>

      {error && (
        <Card className="mb-6 border-red-500">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* User Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>Basic authentication details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Email:</span>
            <span className="font-mono text-sm">{authDetails.email || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">UID:</span>
            <span className="font-mono text-sm">{authDetails.uid}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Display Name:</span>
            <span className="font-mono text-sm">{authDetails.displayName || 'N/A'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Admin Status Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Admin Status Summary</CardTitle>
          <CardDescription>Quick overview of admin detection methods</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Admin by Custom Claims:</span>
            {authDetails.isAdminByClaims ? (
              <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Yes</Badge>
            ) : (
              <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" /> No</Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Admin by Firestore:</span>
            {authDetails.isAdminByFirestore ? (
              <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Yes</Badge>
            ) : (
              <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" /> No</Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Admin by Hook Logic:</span>
            {authDetails.isAdminByHook ? (
              <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Yes</Badge>
            ) : (
              <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" /> No</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Custom Claims */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Custom Claims</CardTitle>
          <CardDescription>Raw custom claims from ID token</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
            {JSON.stringify(authDetails.customClaims, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* Firestore Admin Data */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Firestore Admin Document</CardTitle>
          <CardDescription>Data from /admins/{authDetails.uid}</CardDescription>
        </CardHeader>
        <CardContent>
          {authDetails.firestoreAdminData ? (
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
              {JSON.stringify(authDetails.firestoreAdminData, null, 2)}
            </pre>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No admin document found in Firestore
            </div>
          )}
        </CardContent>
      </Card>

      {/* ID Token Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>ID Token Details</CardTitle>
          <CardDescription>Additional token information</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
            {JSON.stringify(authDetails.idTokenResult, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Debug and refresh options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleRefreshToken} 
            disabled={refreshing}
            className="w-full"
          >
            {refreshing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Refreshing Token...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Force Refresh ID Token
              </>
            )}
          </Button>
          
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/admin')}
            >
              Go to Admin Dashboard
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/create-admin-doc')}
            >
              Create Admin Doc Tool
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>This page helps diagnose admin authentication issues.</p>
        <p>Check both custom claims and Firestore data to ensure proper admin access.</p>
      </div>
      </div>
    </TestRoute>
  );
}