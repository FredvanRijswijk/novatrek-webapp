# Group Travel MVP Implementation Guide

## 🚀 2-Week MVP Sprint Plan

### Week 1: Core Group Functionality

#### Day 1-2: Database & Models
```typescript
// 1. Create types/group-travel.ts
export interface GroupTrip {
  id: string;
  name: string;
  inviteCode: string;
  organizerId: string;
  memberIds: string[];
  destination?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  status: 'planning' | 'booked';
  createdAt: Date;
}

export interface GroupMember {
  userId: string;
  role: 'organizer' | 'member';
  budgetRange?: {
    min: number;
    max: number;
    isPrivate: boolean;
  };
  hasSubmittedPreferences: boolean;
  joinedAt: Date;
}
```

#### Day 3-4: Group Creation Flow
```typescript
// 2. Create components/groups/CreateGroupTripModal.tsx
export function CreateGroupTripModal() {
  const [step, setStep] = useState(1);
  const [groupData, setGroupData] = useState({
    name: '',
    destination: '',
    dateRange: null,
  });

  const createGroup = async () => {
    const inviteCode = generateInviteCode();
    const { data } = await createGroupTrip({
      ...groupData,
      inviteCode,
      organizerId: user.uid,
    });
    
    // Show share modal with invite link
    showInviteModal(data.inviteCode);
  };

  return (
    <Dialog>
      {step === 1 && <BasicInfoStep />}
      {step === 2 && <DateSelectionStep />}
      {step === 3 && <InvitePreviewStep />}
    </Dialog>
  );
}
```

#### Day 5: Join Group Flow
```typescript
// 3. Create app/join/[code]/page.tsx
export default function JoinGroupPage({ params }: { params: { code: string } }) {
  const { user } = useFirebase();
  const router = useRouter();

  const handleJoin = async () => {
    if (!user) {
      // Save code and redirect to login
      localStorage.setItem('pendingGroupCode', params.code);
      router.push('/login');
      return;
    }

    try {
      await joinGroupByCode(params.code, user.uid);
      router.push('/dashboard/group-trips');
    } catch (error) {
      toast.error('Invalid or expired invite code');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>You're invited to plan a group trip!</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Show group preview */}
          <GroupPreview code={params.code} />
        </CardContent>
        <CardFooter>
          <Button onClick={handleJoin} className="w-full">
            Join Trip Planning
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
```

### Week 2: Preferences & Decision Making

#### Day 6-7: Anonymous Budget Input
```typescript
// 4. Create components/groups/BudgetPreferenceForm.tsx
export function BudgetPreferenceForm({ groupId }: { groupId: string }) {
  const [budget, setBudget] = useState({ min: 0, max: 0 });
  const [isPrivate, setIsPrivate] = useState(true);

  const saveBudget = async () => {
    await updateMemberPreferences(groupId, user.uid, {
      budgetRange: {
        ...budget,
        isPrivate,
      },
    });
    
    toast.success('Budget saved! Only you can see the exact amounts.');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set Your Budget</CardTitle>
        <CardDescription>
          This helps us find options everyone can afford
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <BudgetRangeSlider
            min={budget.min}
            max={budget.max}
            onChange={setBudget}
          />
          
          <Label className="flex items-center gap-2">
            <Checkbox
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
            Keep my exact budget private (recommended)
          </Label>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={saveBudget}>Save Budget</Button>
      </CardFooter>
    </Card>
  );
}
```

#### Day 8-9: Group Dashboard
```typescript
// 5. Create app/dashboard/group-trips/[id]/page.tsx
export default function GroupTripPage({ params }: { params: { id: string } }) {
  const { trip, members, preferences } = useGroupTrip(params.id);
  
  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <GroupHeader trip={trip} />
          
          {/* Budget Overview - Anonymous */}
          <Card>
            <CardHeader>
              <CardTitle>Group Budget Range</CardTitle>
            </CardHeader>
            <CardContent>
              <BudgetVisualization members={members} />
              <p className="text-sm text-muted-foreground mt-2">
                Safe budget range: ${calculateSafeRange(members)}
              </p>
            </CardContent>
          </Card>
          
          {/* Quick Decisions */}
          <QuickDecisions groupId={params.id} />
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          <MembersList members={members} />
          <InviteMoreCard inviteCode={trip.inviteCode} />
          <PreferencesProgress members={members} />
        </div>
      </div>
    </div>
  );
}
```

#### Day 10: Simple Voting System
```typescript
// 6. Create components/groups/QuickVote.tsx
export function QuickVote({ 
  question, 
  options, 
  groupId 
}: { 
  question: string;
  options: string[];
  groupId: string;
}) {
  const [hasVoted, setHasVoted] = useState(false);
  const [results, setResults] = useState<Record<string, number>>({});

  const vote = async (option: string) => {
    await castVote(groupId, question, option);
    setHasVoted(true);
    
    // Listen for results
    subscribeToVoteResults(groupId, question, (results) => {
      setResults(results);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{question}</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasVoted ? (
          <div className="space-y-2">
            {options.map((option) => (
              <Button
                key={option}
                variant="outline"
                className="w-full"
                onClick={() => vote(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        ) : (
          <VoteResults results={results} />
        )}
      </CardContent>
    </Card>
  );
}
```

## 🔥 MVP Features Checklist

### Must Have (Week 1)
- [x] Create group with invite code
- [x] Join group via link
- [x] See who's in the group
- [x] Set budget privately
- [x] View anonymous budget range

### Should Have (Week 2)  
- [x] Simple voting on options
- [x] Basic preference input
- [x] Group chat
- [ ] Destination suggestions
- [ ] Calendar coordination

### Nice to Have (Post-MVP)
- [ ] AI compromise suggestions
- [ ] Fairness scoring
- [ ] Payment splitting
- [ ] Booking integration
- [ ] Mobile app

## 📊 Success Metrics for MVP

1. **Group Creation Rate**: Can users create groups easily?
2. **Join Success Rate**: Do invite links work smoothly?
3. **Budget Submission Rate**: Do members feel safe sharing budgets?
4. **Decision Time**: How long to reach first group decision?
5. **User Feedback**: What's the #1 requested feature?

## 🚢 Deployment Strategy

### Phase 1: Friends & Family (Week 3)
- Deploy to 10 test groups
- Daily feedback sessions
- Rapid iteration on pain points

### Phase 2: Beta Launch (Week 4-6)
- Open to 100 groups
- A/B test key features
- Measure completion rates

### Phase 3: Public Launch (Week 8)
- Full marketing push
- Influencer partnerships
- Press coverage of "solving group travel"

## 💡 Quick Implementation Wins

1. **Magic Link Invites**: No account needed to preview
2. **Anonymous by Default**: Build trust immediately  
3. **Visual Budget Ranges**: See compatibility at a glance
4. **One-Click Votes**: Reduce decision fatigue
5. **Smart Defaults**: AI suggests based on preferences

## 🎯 MVP Success Criteria

✅ 5 groups successfully plan trips  
✅ 80% of members submit preferences  
✅ Average decision time < 24 hours  
✅ No "I felt ignored" feedback  
✅ At least 1 group books a trip

---

**Remember**: The MVP isn't about perfect AI or complex features. It's about proving that anonymous preferences and structured decision-making reduce group travel friction.