# Travel Capture System - Universal Travel Inbox

## Problem Statement
Travelers constantly discover tips across different channels (Instagram, WhatsApp, YouTube, Reddit) but have no good way to capture and organize them for future trips. Content gets lost in message threads, saved posts, and bookmarks across multiple apps.

## Core Concept: Universal Travel Inbox
A system that allows users to save travel inspiration from anywhere, automatically organize it, and surface it when planning relevant trips.

## 🎯 Capture Methods

### 1. Email Forwarding System
```
- save@novatrek.app → General inbox
- save+paris@novatrek.app → Tagged for Paris
- save+trip123@novatrek.app → Add to specific trip
- save+food@novatrek.app → Tagged as food/restaurant
```

### 2. Messaging Integration
- **WhatsApp Bot**: Share to +1-XXX-NOVA-TREK
- **Telegram Bot**: @NovaTrekBot
- **iMessage** (via Shortcuts)

### 3. Browser Extension
- "Save to NovaTrek" right-click option
- Auto-detect travel content
- One-click save from YouTube, Instagram, blogs

### 4. Mobile Integration
- iOS Share Sheet Extension
- Android Intent Filters
- iOS Shortcuts: "Hey Siri, save this to NovaTrek"

### 5. Smart Capture
- **Screenshot OCR**: Upload screenshots → AI extracts info
- **Link Parser**: Auto-extract content from social media
- **Voice Notes**: Quick audio captures
- **Quick Add Widget**: Home screen instant capture

## 📊 Data Structure

```typescript
interface TravelCapture {
  id: string;
  userId: string;
  content: string;
  contentType: 'text' | 'link' | 'image' | 'video' | 'audio';
  source: 'email' | 'whatsapp' | 'instagram' | 'youtube' | 'manual' | 'browser';
  sourceUrl?: string;
  
  // Metadata
  sharedBy?: string; // "Mom", "Sarah from work"
  sharedAt: Date;
  originalDate?: Date; // When the content was created
  
  // Extracted Information
  extractedData: {
    title?: string;
    location?: {
      name: string;
      coordinates?: { lat: number; lng: number };
      country?: string;
      city?: string;
    };
    activity?: string;
    price?: {
      amount: number;
      currency: string;
    };
    suggestedDates?: string[];
    openingHours?: string;
    website?: string;
    phoneNumber?: string;
    rating?: number;
  };
  
  // Organization
  assignedTo?: string; // tripId or "someday"
  tags: string[]; // ['restaurant', 'must-see', 'budget-friendly']
  category?: 'food' | 'accommodation' | 'activity' | 'transport' | 'tip';
  priority?: 'must-do' | 'nice-to-have' | 'maybe';
  
  // AI Enhancement
  aiSummary?: string;
  aiTags?: string[];
  relatedCaptures?: string[]; // IDs of similar saves
}
```

## 🧠 Intelligence Features

### 1. The "Someday" Board
- Default destination for captures without a trip
- Smart categorization by destination
- Surface relevant saves when creating new trips
- "You have 15 saved items for Paris!"

### 2. Social Travel Memory
- Track who shared what: "Sarah's Tokyo Recommendations"
- Send thank you notes with trip photos
- Build personal travel advisor network

### 3. AI Enhancement
- Extract key information from any format
- Suggest related captures
- Auto-categorize and tag
- Translate foreign language content

### 4. Smart Notifications
- "You're planning Paris - you have 8 saved restaurants"
- "3 items expiring soon" (limited time offers)
- "New saves from friends for your upcoming trip"

## 💻 Technical Implementation

### Email Forwarding System Options

#### Option 1: Resend Inbound Parse (Recommended)
```typescript
// Webhook endpoint for Resend inbound emails
app.post('/api/webhooks/resend/inbound', async (req) => {
  const { from, to, subject, text, html, attachments } = req.body;
  
  // Extract user and tags from email
  const parsed = parseInboundEmail(to); // save+paris+food@novatrek.app
  
  // Process and save capture
  await createTravelCapture({
    userId: await getUserIdByEmail(from),
    tags: parsed.tags,
    content: text || html,
    source: 'email'
  });
});
```

**Requirements:**
- Verify domain with Resend
- Set up MX records
- Configure inbound parse webhook

#### Option 2: Gmail API Integration
```typescript
// Users connect their Gmail
// Poll for emails to save@novatrek.app
// More complex but works with existing email
```

#### Option 3: Custom Email Server
```typescript
// Using Haraka or similar
// Full control but high complexity
// Not recommended for MVP
```

### Browser Extension Architecture
```javascript
// Chrome Extension manifest.json
{
  "permissions": ["contextMenus", "activeTab"],
  "background": {
    "service_worker": "background.js"
  }
}

// Right-click save
chrome.contextMenus.create({
  id: "saveToNovaTrek",
  title: "Save to NovaTrek",
  contexts: ["selection", "link", "image", "page"]
});
```

### Mobile Share Sheet (iOS)
```swift
// Share Extension in Swift
class ShareViewController: SLComposeServiceViewController {
    override func didSelectPost() {
        // Extract shared content
        // Send to NovaTrek API
    }
}
```

## 🚀 Implementation Phases

### Phase 1: Email Forwarding (Week 1-2)
- [ ] Set up Resend inbound parse
- [ ] Create webhook endpoint
- [ ] Basic email parsing
- [ ] Save to Firestore
- [ ] Display in app

### Phase 2: Smart Parsing (Week 3-4)
- [ ] Link preview extraction
- [ ] AI content analysis
- [ ] Auto-categorization
- [ ] Location detection

### Phase 3: Browser Extension (Week 5-6)
- [ ] Chrome extension
- [ ] Context menu integration
- [ ] Page content detection
- [ ] Quick save popup

### Phase 4: Mobile Integration (Week 7-8)
- [ ] iOS Share Extension
- [ ] Android Intent Filter
- [ ] iOS Shortcuts
- [ ] Home screen widget

### Phase 5: Social Features (Week 9-10)
- [ ] WhatsApp Bot
- [ ] Friend recommendations
- [ ] Thank you notes
- [ ] Shared boards

## 🎨 UI/UX Concepts

### Capture Inbox View
```
┌─────────────────────────────────┐
│ 📥 Travel Inbox (23 unsorted)   │
├─────────────────────────────────┤
│ 🇯🇵 Tokyo Ramen Shop            │
│ Via: WhatsApp from Sarah        │
│ [Auto-assign to Tokyo Trip →]   │
├─────────────────────────────────┤
│ 🏖️ Hidden Beach in Bali         │
│ Via: Instagram @travel          │
│ [Save to Someday →]             │
└─────────────────────────────────┘
```

### Quick Capture Widget
```
┌─────────────────┐
│ 📌 Quick Save   │
│ ┌─────────────┐ │
│ │ What...     │ │
│ └─────────────┘ │
│ 📍 Where: Auto  │
│ [Save] [Photo]  │
└─────────────────┘
```

## 🔐 Privacy & Security

- End-to-end encryption for sensitive captures
- Private by default, explicit sharing
- GDPR compliant data handling
- Option to auto-delete old captures

## 📈 Success Metrics

1. **Capture Rate**: Items saved per user per month
2. **Activation**: % of captures used in actual trips
3. **Source Diversity**: Distribution across capture methods
4. **Time to Capture**: How quickly users can save
5. **Retrieval Success**: Finding relevant saves when planning

## 🤔 Open Questions

1. How to handle duplicate captures?
2. Storage limits per user?
3. Offline capture capability?
4. Integration with existing bookmark managers?
5. Business model: Free tier limits?

## 🎯 MVP Focus

Start with email forwarding because:
1. Lowest technical barrier
2. Works on all devices immediately  
3. Familiar UX pattern
4. No app installation required
5. Can forward existing emails

Next priority: Browser extension for desktop users
Then: Mobile share sheets for on-the-go capture