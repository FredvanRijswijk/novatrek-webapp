'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function TestSlackPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [testData, setTestData] = useState({
    email: 'test@example.com',
    name: 'Test User',
    userId: 'test-user-123',
  });

  const testNotification = async (type: string) => {
    setIsLoading(true);
    try {
      // Set environment variable temporarily
      if (typeof window !== 'undefined') {
        (window as any).SLACK_NOTIFICATIONS_ENABLED = 'true';
      }

      const response = await fetch('/api/notifications/slack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          data: {
            ...testData,
            metadata: type === 'subscription_upgrade' ? {
              plan: 'Premium',
              amount: 19.99,
            } : type === 'trip_created' ? {
              destination: 'Paris, France',
              duration: 7,
              tripId: 'test-trip-123',
            } : type === 'waitlist_signup' ? {
              position: 42,
              interests: ['Beach', 'Culture', 'Food'],
              referralSource: 'Google',
            } : undefined,
          },
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        toast.success(`${type} notification sent successfully!`);
      } else {
        toast.error(`Failed to send notification: ${result.error}`);
      }
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/notifications/slack');
      const status = await response.json();
      toast.info(`Slack Status: ${status.enabled ? 'Enabled' : 'Disabled'}, Configured: ${status.configured ? 'Yes' : 'No'}`);
    } catch (error) {
      toast.error('Failed to check status');
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Test Slack Notifications</CardTitle>
          <CardDescription>
            Test different types of Slack notifications to ensure they're working correctly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={testData.email}
                onChange={(e) => setTestData({ ...testData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={testData.name}
                onChange={(e) => setTestData({ ...testData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                value={testData.userId}
                onChange={(e) => setTestData({ ...testData, userId: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => testNotification('user_signup')}
              disabled={isLoading}
              variant="outline"
            >
              Test User Signup
            </Button>
            <Button
              onClick={() => testNotification('subscription_upgrade')}
              disabled={isLoading}
              variant="outline"
            >
              Test Subscription Upgrade
            </Button>
            <Button
              onClick={() => testNotification('trip_created')}
              disabled={isLoading}
              variant="outline"
            >
              Test Trip Created
            </Button>
            <Button
              onClick={() => testNotification('waitlist_signup')}
              disabled={isLoading}
              variant="outline"
            >
              Test Waitlist Signup
            </Button>
          </div>

          <div className="pt-4 border-t">
            <Button onClick={checkStatus} variant="secondary">
              Check Slack Status
            </Button>
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-2">Notes:</h3>
            <div className="bg-muted p-4 rounded-lg text-sm">
              <p className="mb-2">• Slack notifications are configured on the server side</p>
              <p className="mb-2">• To enable in development: Set SLACK_NOTIFICATIONS_ENABLED=true in .env.local</p>
              <p>• Check the server console for notification logs</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}