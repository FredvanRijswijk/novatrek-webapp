# Cal.com Integration Implementation Example

## Quick Start for Consultation Scheduling

### 1. Expert Onboarding Flow
```typescript
// In expert onboarding
const connectCalcom = async (expertId: string) => {
  // OAuth flow
  const calcomAuth = await authenticateWithCalcom({
    clientId: process.env.CALCOM_CLIENT_ID,
    redirectUri: '/dashboard/expert/integrations/calcom/callback'
  });
  
  // Store connection
  await updateExpert(expertId, {
    integrations: {
      calcom: {
        connected: true,
        accessToken: calcomAuth.accessToken,
        calendarId: calcomAuth.defaultCalendarId,
        bookingUrl: calcomAuth.bookingUrl
      }
    }
  });
};
```

### 2. After Purchase Flow
```typescript
// In /api/marketplace/checkout/success
const scheduleConsultation = async (transaction: MarketplaceTransaction) => {
  const expert = await getExpert(transaction.sellerId);
  const buyer = await getUser(transaction.buyerId);
  const product = await getProduct(transaction.productId);
  
  if (product.type === 'consultation' && expert.integrations?.calcom?.connected) {
    // Create booking link
    const bookingData = {
      eventTypeId: expert.calcom.consultationEventId,
      name: buyer.displayName,
      email: buyer.email,
      metadata: {
        novatrekTransactionId: transaction.id,
        productName: product.title,
        notes: product.consultationNotes
      },
      duration: product.consultationDuration, // in minutes
    };
    
    // Send email with Cal.com booking link
    await sendEmail({
      to: buyer.email,
      template: 'consultation-scheduling',
      data: {
        expertName: expert.businessName,
        bookingUrl: `${expert.calcom.bookingUrl}?prefill=${encodeURIComponent(JSON.stringify(bookingData))}`,
        productName: product.title
      }
    });
  }
};
```

### 3. Expert Dashboard Integration
```typescript
// Component: ExpertCalendarIntegration.tsx
export function ExpertCalendarIntegration() {
  const { expert } = useExpert();
  const [upcomingConsultations, setUpcomingConsultations] = useState([]);
  
  useEffect(() => {
    if (expert?.integrations?.calcom?.connected) {
      fetchUpcomingBookings();
    }
  }, [expert]);
  
  const fetchUpcomingBookings = async () => {
    const bookings = await fetch('/api/integrations/calcom/bookings').then(r => r.json());
    setUpcomingConsultations(bookings);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Consultations</CardTitle>
      </CardHeader>
      <CardContent>
        {!expert?.integrations?.calcom?.connected ? (
          <div>
            <p>Connect Cal.com to automatically schedule consultations</p>
            <Button onClick={connectCalcom}>
              Connect Cal.com
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingConsultations.map(consultation => (
              <div key={consultation.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{consultation.attendeeName}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(consultation.startTime), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <a href={consultation.meetingUrl} target="_blank">
                    Join Call
                  </a>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### 4. Webhook Integration
```typescript
// /api/webhooks/calcom/route.ts
export async function POST(request: Request) {
  const payload = await request.json();
  const signature = request.headers.get('cal-signature');
  
  // Verify webhook signature
  if (!verifyCalcomWebhook(payload, signature)) {
    return new Response('Invalid signature', { status: 401 });
  }
  
  switch (payload.triggerEvent) {
    case 'BOOKING_CREATED':
      // Update transaction status
      await updateTransaction(payload.metadata.novatrekTransactionId, {
        consultationScheduled: true,
        consultationDate: payload.startTime,
        meetingUrl: payload.meetingUrl
      });
      
      // Notify expert and buyer
      await sendBookingConfirmations(payload);
      break;
      
    case 'BOOKING_CANCELLED':
      // Handle cancellation
      await handleConsultationCancellation(payload);
      break;
      
    case 'BOOKING_RESCHEDULED':
      // Update new time
      await updateConsultationTime(payload);
      break;
  }
  
  return new Response('OK', { status: 200 });
}
```

### 5. User Experience Flow

1. **Purchase Consultation** → Success page shows "Schedule your consultation"
2. **Click Schedule** → Redirected to expert's Cal.com with pre-filled info
3. **Select Time** → Books directly in expert's calendar
4. **Confirmation** → Both parties receive email with meeting link
5. **Reminders** → Automatic reminders before consultation
6. **Join Call** → One-click to join video call

### Benefits
- No manual scheduling emails
- Automatic timezone handling
- Reduces no-shows with reminders
- Professional booking experience
- Integrated video calls
- Easy rescheduling

### Environment Variables
```env
CALCOM_CLIENT_ID=your_client_id
CALCOM_CLIENT_SECRET=your_client_secret
CALCOM_WEBHOOK_SECRET=your_webhook_secret
CALCOM_API_URL=https://api.cal.com/v1
```