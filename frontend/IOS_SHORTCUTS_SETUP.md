# iOS Shortcuts Integration for NovaTrek

This guide explains how to set up iOS Shortcuts to save travel content to NovaTrek.

## Prerequisites

1. iOS device with Shortcuts app installed
2. NovaTrek account
3. API key (get from Settings in the app)

## Available Shortcuts

### 1. Save URL to NovaTrek

Save any URL from Safari or other apps to your NovaTrek inbox.

**Setup Steps:**
1. Open Shortcuts app
2. Tap "+" to create new shortcut
3. Add actions:
   - **Get URL from Input** (or Get Current URL from Safari)
   - **Get Contents of URL** (to extract page title)
   - **Get My Shortcuts** → Add "Text" action with your API key
   - **Get Contents of URL** with these settings:
     - URL: `https://novatrek.app/api/shortcuts/capture`
     - Method: POST
     - Headers: 
       - `x-api-key`: [Your API Key]
       - `Content-Type`: application/json
     - Request Body (JSON):
       ```json
       {
         "url": "[URL from input]",
         "title": "[Name from Web Page]",
         "userId": "[Your User ID]"
       }
       ```
4. Add to Share Sheet for easy access

### 2. Save Text/Note to NovaTrek

Quickly save travel ideas or notes.

**Setup Steps:**
1. Create new shortcut
2. Add actions:
   - **Text** action for input
   - **Get My Shortcuts** → Add "Text" action with your API key
   - **Get Contents of URL**:
     - URL: `https://novatrek.app/api/shortcuts/capture`
     - Method: POST
     - Headers: Same as above
     - Request Body:
       ```json
       {
         "text": "[Text from input]",
         "title": "Quick Note",
         "tags": ["note", "idea"],
         "userId": "[Your User ID]"
       }
       ```

### 3. Save Location to NovaTrek

Save current location or a specific place.

**Setup Steps:**
1. Create new shortcut
2. Add actions:
   - **Get Current Location** (or Get Location from Input)
   - **Get Maps URL** from location
   - **Get Contents of URL** (same API setup)
   - Request Body:
     ```json
     {
       "url": "[Maps URL]",
       "title": "[Location Name]",
       "notes": "Saved from current location",
       "tags": ["location"],
       "userId": "[Your User ID]"
     }
     ```

### 4. Save Photo with Location

Save a photo with its location data.

**Setup Steps:**
1. Create new shortcut
2. Add actions:
   - **Select Photos** (or Take Photo)
   - **Get Details of Images** → Location
   - **Get Maps URL** from location
   - Upload photo to cloud service (optional)
   - **Get Contents of URL** (API call)

## Advanced Shortcuts

### Voice-Activated Save
"Hey Siri, save this to NovaTrek"

1. Create shortcut with name "Save to NovaTrek"
2. Add **Get Clipboard** action
3. Check if URL or Text
4. Call appropriate API endpoint
5. Add to Siri

### Multi-Step Travel Planning
Create a shortcut that:
1. Asks for destination
2. Asks for dates
3. Asks for type (restaurant/hotel/activity)
4. Saves with proper tags

## Shortcut Examples (JSON)

You can import these directly:

### Basic URL Saver
```json
{
  "name": "Save to NovaTrek",
  "actions": [
    {
      "action": "geturl",
      "parameters": {
        "source": "sharesheet"
      }
    },
    {
      "action": "getcontentsofurl",
      "parameters": {
        "url": "https://novatrek.app/api/shortcuts/capture",
        "method": "POST",
        "headers": {
          "x-api-key": "YOUR_API_KEY",
          "Content-Type": "application/json"
        },
        "requestBody": {
          "url": "{{URL}}",
          "title": "{{Webpage Title}}"
        }
      }
    },
    {
      "action": "showresult",
      "parameters": {
        "text": "Saved to NovaTrek! ✈️"
      }
    }
  ]
}
```

## Troubleshooting

### Common Issues

1. **"Invalid API Key" Error**
   - Check your API key in Settings
   - Make sure there are no extra spaces

2. **"Failed to Save" Error**
   - Check internet connection
   - Verify the URL is accessible
   - Check if you're logged in

3. **Shortcut Not Appearing in Share Sheet**
   - Go to shortcut settings
   - Enable "Show in Share Sheet"
   - Select appropriate share sheet types

## Security Notes

- API keys are personal - don't share them
- Each key is tied to your account
- Revoke keys if compromised
- Use separate keys for different devices

## Future Enhancements

Coming soon:
- Natural language processing ("Save restaurant in Paris for next week")
- Offline queue support
- Direct trip assignment
- Batch operations
- Widget support