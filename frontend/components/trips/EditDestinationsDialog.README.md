# EditDestinationsDialog Component

A React component that allows users to manage destinations within their trips, supporting both single and multi-destination trips.

## Features

- **Add new destinations**: Search and add destinations using Google Places integration
- **Edit destination dates**: Modify arrival and departure dates for each destination
- **Remove destinations**: Delete destinations from the trip (minimum one required)
- **Reorder destinations**: Use up/down buttons to change the order of destinations
- **Date validation**: Ensures dates are logical and within trip boundaries
- **Backward compatibility**: Works with both legacy single-destination trips and new multi-destination format

## Usage

```tsx
import { EditDestinationsDialog } from '@/components/trips/EditDestinationsDialog';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [trip, setTrip] = useState<Trip>(/* your trip data */);

  const handleUpdate = (updatedTrip: Trip) => {
    setTrip(updatedTrip);
    // Additional logic after update
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Edit Destinations
      </Button>

      <EditDestinationsDialog
        trip={trip}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onUpdate={handleUpdate}
      />
    </>
  );
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `trip` | `Trip` | The trip object containing current destinations |
| `isOpen` | `boolean` | Controls the dialog visibility |
| `onClose` | `() => void` | Callback when dialog is closed |
| `onUpdate` | `(trip: Trip) => void` | Callback when destinations are saved |

## Data Structure

The component works with the `TripDestination` type:

```typescript
interface TripDestination {
  destination: Destination;
  arrivalDate: Date;
  departureDate: Date;
  order: number;
}
```

## Validation Rules

1. **Date Order**: Arrival date must be before departure date for each destination
2. **Sequential Destinations**: Next destination's arrival must be on or after previous destination's departure
3. **Trip Boundaries**: All destinations must fit within the trip's start and end dates
4. **Minimum Destinations**: At least one destination is required

## Integration with Trip Model

The component automatically updates both the `destinations` array and the legacy `destination` field (for single-destination trips) to maintain backward compatibility.

## Dependencies

- Google Places API (via `useGooglePlaces` hook)
- date-fns for date formatting
- Shadcn UI components
- TripModel for database updates