'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function MigrateTripPage() {
  const [tripId, setTripId] = useState('jsicCxDjQW8whQeBOReK');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeTrip = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/debug/trip-details?tripId=${tripId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze trip');
      }
      
      setResult({ type: 'analysis', data });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze trip');
    } finally {
      setLoading(false);
    }
  };

  const migrateTrip = async (dryRun: boolean) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/trips/migrate-v2?tripId=${tripId}&dryRun=${dryRun}`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to migrate trip');
      }
      
      setResult({ type: 'migration', data });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to migrate trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Trip V2 Migration Tool</CardTitle>
          <CardDescription>
            Analyze and migrate trips to V2 structure with proper destination fields
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="tripId">Trip ID</Label>
            <Input
              id="tripId"
              value={tripId}
              onChange={(e) => setTripId(e.target.value)}
              placeholder="Enter trip ID"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={analyzeTrip} 
              disabled={loading || !tripId}
              variant="outline"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Analyze Trip
            </Button>
            <Button 
              onClick={() => migrateTrip(true)} 
              disabled={loading || !tripId}
              variant="secondary"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Dry Run Migration
            </Button>
            <Button 
              onClick={() => migrateTrip(false)} 
              disabled={loading || !tripId}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Migrate Trip
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="mt-6 space-y-4">
              {result.type === 'analysis' && (
                <>
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Trip Analysis</h3>
                    <pre className="text-sm overflow-x-auto">
                      {JSON.stringify(result.data.analysis, null, 2)}
                    </pre>
                  </div>

                  {result.data.extractedDestination && (
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Extracted Destination</h3>
                      <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(result.data.extractedDestination, null, 2)}
                      </pre>
                    </div>
                  )}

                  {result.data.migrationNeeded && (
                    <Alert>
                      <AlertDescription>
                        Migration needed! Missing fields: {result.data.analysis.missingFields.join(', ')}
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}

              {result.type === 'migration' && (
                <>
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">
                      Migration Result {result.data.dryRun && '(Dry Run)'}
                    </h3>
                    <div className="space-y-2">
                      {result.data.migrationLog.map((log: string, i: number) => (
                        <p key={i} className="text-sm">
                          {log}
                        </p>
                      ))}
                    </div>
                  </div>

                  {Object.keys(result.data.updates).length > 0 && (
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Updates Applied</h3>
                      <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(result.data.updates, null, 2)}
                      </pre>
                    </div>
                  )}

                  {!result.data.dryRun && result.data.success && (
                    <Alert className="bg-green-50 border-green-200">
                      <AlertDescription className="text-green-800">
                        Trip migrated successfully! The AI assistant should now be able to find restaurants without asking for location.
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}